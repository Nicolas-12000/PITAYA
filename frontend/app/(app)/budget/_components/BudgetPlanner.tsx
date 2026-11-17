"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calculator } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { StackedBar } from "@/components/charts/BarList";
import { PitayaMark } from "@/components/illustrations/PitayaMark";
import { Notice } from "@/components/notices/notices";
import { EmptyState } from "@/components/states/states";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/controls";
import { Badge, Panel, PanelHeader, Stat } from "@/components/ui/primitives";
import { apiFetch, apiPost, toFieldErrors, toUserMessage } from "@/lib/api/client";
import type { CampaignRow, RecommendationsList, RecommendRequest, RecommendResponse } from "@/lib/api/types";
import { formatCurrency, formatDecimal, formatInteger, formatPercent } from "@/lib/format";
import { genderLabel } from "@/lib/labels";
import { CAMPAIGN_IDS, campaignColor } from "@/lib/palette";
import { cn } from "@/lib/utils";

const CELEBRATED = "pitaya:celebrated";
const PAGE_SIZE = 12;

function requestKey(req: RecommendRequest): string {
  return `budget:${req.total_budget}:${req.min_share ?? 0}:${req.max_share ?? 1}`;
}

function sharePercent(share: number | undefined, fallback: string): string {
  if (typeof share !== "number" || Number.isNaN(share)) return fallback;
  return String(Math.round(share * 1000) / 10);
}

const UNCERTAINTY_NOTE: Record<string, string> = {
  point_estimate_from_shrunk_cvr_and_concave_spend_curve:
    "Punto estimado a partir del CVR suavizado y una curva de respuesta cóncava al gasto.",
  insufficient_segment_observations: "No hay segmentos con observaciones suficientes (mínimo 5 anuncios).",
};

export function BudgetPlanner({
  campaigns,
  initialHistory,
  storageMode,
}: {
  campaigns: CampaignRow[];
  initialHistory: RecommendationsList;
  storageMode: string | null;
}) {
  const qc = useQueryClient();
  const [budget, setBudget] = useState("1000");
  const [minShare, setMinShare] = useState("0");
  const [maxShare, setMaxShare] = useState("100");
  const [page, setPage] = useState(0);
  const [celebrate, setCelebrate] = useState(false);
  const [opened, setOpened] = useState<{ key: string; plan: RecommendResponse["plan"]; req: RecommendRequest } | null>(
    null,
  );

  const body: RecommendRequest = {
    total_budget: Number(budget),
    min_share: Number(minShare) / 100,
    max_share: Number(maxShare) / 100,
  };

  const localErrors: Record<string, string> = {};
  if (!(body.total_budget > 0)) localErrors.total_budget = "Ingresa un presupuesto mayor que 0.";
  if (!(body.min_share! >= 0 && body.min_share! <= 1)) localErrors.min_share = "Debe estar entre 0 % y 100 %.";
  if (!(body.max_share! >= 0 && body.max_share! <= 1)) localErrors.max_share = "Debe estar entre 0 % y 100 %.";
  if (!localErrors.min_share && !localErrors.max_share && body.min_share! > body.max_share!) {
    localErrors.max_share = "El máximo no puede ser menor que el mínimo.";
  }
  const valid = Object.keys(localErrors).length === 0;

  const calc = useMutation({
    mutationFn: (req: RecommendRequest) => apiPost<RecommendResponse>("v1/recommendations", req, requestKey(req)),
    onSuccess: (res, req) => {
      setOpened({ key: requestKey(req), plan: res.plan, req });
      setPage(0);
      toast.success(
        res.created === false
          ? "Mismos parámetros: quedó como la más reciente."
          : res.persisted
            ? "Quedó en el historial."
            : "Quedó en el historial de esta sesión.",
      );
      try {
        if (sessionStorage.getItem(CELEBRATED) !== "1") {
          sessionStorage.setItem(CELEBRATED, "1");
          setCelebrate(true);
        }
      } catch {
        /* sin almacenamiento */
      }
      qc.invalidateQueries({ queryKey: ["recommendations"] });
    },
    onError: (err) => toast.error(toUserMessage(err)),
  });
  const history = useQuery({
    queryKey: ["recommendations"],
    queryFn: () => apiFetch<RecommendationsList>("v1/recommendations"),
    initialData: initialHistory,
  });

  const serverErrors = toFieldErrors(calc.error);
  const plan = opened?.plan;
  const dirty = opened !== null && JSON.stringify(opened.req) !== JSON.stringify(body);

  function openHistory(item: RecommendationsList["items"][number]) {
    const min = item.payload.min_share ?? 0;
    const max = item.payload.max_share ?? 1;
    const req: RecommendRequest = { total_budget: item.payload.total_budget, min_share: min, max_share: max };
    setBudget(String(item.payload.total_budget));
    setMinShare(sharePercent(item.payload.min_share, "0"));
    setMaxShare(sharePercent(item.payload.max_share, "100"));
    setOpened({ key: item.idempotency_key, plan: item.payload, req });
    setPage(0);
  }
  const suspicious = plan?.allocations.filter((a) => a.shrunk_cvr > 1).length ?? 0;

  const totalSpent = campaigns.reduce((a, c) => a + c.kpis.spent, 0);
  const current = CAMPAIGN_IDS.map((id) => {
    const c = campaigns.find((x) => x.xyz_campaign_id === id);
    const share = c && totalSpent ? c.kpis.spent / totalSpent : 0;
    return { key: String(id), value: share, color: campaignColor(id), label: String(id), display: formatPercent(share, 0) };
  });
  const recommended = plan
    ? CAMPAIGN_IDS.map((id) => {
        const share = plan.allocations.filter((a) => a.campaign === id).reduce((acc, a) => acc + a.share_of_budget, 0);
        return { key: String(id), value: share, color: campaignColor(id), label: String(id), display: formatPercent(share, 0) };
      })
    : null;

  const pending = history.data.items.filter((i) => !i.persisted).length;
  const pageCount = plan ? Math.max(1, Math.ceil(plan.allocations.length / PAGE_SIZE)) : 1;
  const currentPage = Math.min(page, pageCount - 1);
  const allocations = plan
    ? plan.allocations.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)
    : [];
  const peakShare = plan ? Math.max(...plan.allocations.map((a) => a.share_of_budget)) : 1;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[440px_1fr]">
        <Panel className="h-fit p-5 lg:sticky lg:top-16">
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (valid) calc.mutate(body);
            }}
            className="space-y-5"
          >
            <Field
              htmlFor="total_budget"
              label="Presupuesto total (USD)"
              error={localErrors.total_budget ?? serverErrors.total_budget}
              hint="Monto a repartir entre segmentos con al menos 5 anuncios."
            >
              <Input
                id="total_budget"
                inputMode="decimal"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                aria-invalid={!!(localErrors.total_budget ?? serverErrors.total_budget)}
                className="h-12 text-base"
              />
            </Field>
            <Field htmlFor="min_share" label="Mínimo por segmento (%)" error={localErrors.min_share ?? serverErrors.min_share}>
              <Input
                id="min_share"
                inputMode="decimal"
                value={minShare}
                onChange={(e) => setMinShare(e.target.value)}
                aria-invalid={!!(localErrors.min_share ?? serverErrors.min_share)}
                className="h-12 text-base"
              />
            </Field>
            <Field htmlFor="max_share" label="Máximo por segmento (%)" error={localErrors.max_share ?? serverErrors.max_share}>
              <Input
                id="max_share"
                inputMode="decimal"
                value={maxShare}
                onChange={(e) => setMaxShare(e.target.value)}
                aria-invalid={!!(localErrors.max_share ?? serverErrors.max_share)}
                className="h-12 text-base"
              />
            </Field>
            <div className="flex flex-col gap-2">
              <Button type="submit" variant="primary" disabled={!valid || calc.isPending}>
                <Calculator strokeWidth={1.5} />
                {calc.isPending ? "Calculando…" : "Calcular"}
              </Button>
              {plan && dirty ? (
                <p className="text-xs text-warning-ink">Cambiaste el presupuesto. Calcula de nuevo para actualizar el historial.</p>
              ) : null}
            </div>
          </form>
          {calc.isError && !Object.keys(serverErrors).length ? (
            <p role="alert" className="mt-4 text-[13px] text-danger-ink">
              No pudimos calcular el reparto. {toUserMessage(calc.error)}
            </p>
          ) : null}
        </Panel>

        <div className="min-w-0 space-y-6" aria-live="polite">
          {!plan ? (
            <Panel className="rounded-xl">
              <EmptyState title="Define un presupuesto y calcula" mood="thinking">
                Verás el reparto actual frente al recomendado, las conversiones esperadas y el detalle por segmento.
              </EmptyState>
              <div className="border-t border-hairline px-5 py-5">
                <StackedBar label="Reparto actual del gasto por campaña" segments={current} />
              </div>
            </Panel>
          ) : (
            <>
              {celebrate ? (
                <Panel className="fade-in flex items-center gap-4 p-4">
                  <PitayaMark mood="celebrate" size={56} decorative />
                  <p className="text-sm text-ink">
                    Primera recomendación guardada de la sesión.{" "}
                    <span className="text-ink-muted">
                      {calc.data?.persisted ? "Quedó guardada." : "Quedó solo en esta sesión."}
                    </span>
                  </p>
                </Panel>
              ) : null}
              <Panel className="rounded-xl">
                <PanelHeader
                  eyebrow={<p className="label-mono text-ink-tertiary">Reparto actual vs recomendado</p>}
                  title={`${formatInteger(plan.allocations.length)} segmentos reciben ${formatCurrency(plan.total_budget, 0)}`}
                  subtitle="Participación por campaña. El reparto actual es el gasto histórico del snapshot."
                />
                <div className="space-y-6 px-5 pt-5 pb-5">
                  <StackedBar label="Actual (histórico)" segments={current} />
                  {recommended ? <StackedBar label="Recomendado" segments={recommended} /> : null}
                </div>
                <dl className="grid grid-cols-2 gap-4 border-t border-hairline px-5 py-4 md:grid-cols-4">
                  <Stat label="Conversiones esperadas" value={formatDecimal(plan.expected_conversions, 1)} hint="Intervalo —" />
                  <Stat label="Ingreso esperado" value={formatCurrency(plan.expected_revenue, 0)} hint="Intervalo —" />
                  <Stat label="Presupuesto" value={formatCurrency(plan.total_budget, 0)} />
                  <Stat label="Segmentos" value={formatInteger(plan.allocations.length)} />
                </dl>
              </Panel>

              {suspicious ? (
                <Notice tone="warning" title="Revisa estas cifras.">
                  {formatInteger(suspicious)} segmento{suspicious > 1 ? "s tienen" : " tiene"} un CVR suavizado mayor que 100 %
                  (más conversiones aprobadas que clics en el histórico). Las conversiones esperadas pueden estar
                  sobreestimadas.
                </Notice>
              ) : null}
              <Notice>
                {UNCERTAINTY_NOTE[plan.uncertainty_note] ?? "Punto estimado."} Es una orientación a partir del histórico, no una
                garantía.
              </Notice>

              <Panel className="overflow-hidden">
                <PanelHeader title="Detalle por segmento" subtitle="Ordenado por gasto recomendado." />
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full table-fixed text-[13px]">
                    <colgroup>
                      <col className="w-[30%]" />
                      <col className="w-[14%]" />
                      <col />
                      <col className="w-[12%]" />
                      <col className="w-[16%]" />
                    </colgroup>
                    <thead>
                      <tr className="border-y border-hairline text-ink-subtle">
                        <th scope="col" className="px-5 py-2.5 text-left font-medium">Segmento</th>
                        <th scope="col" className="px-3 py-2.5 text-right font-medium">Gasto</th>
                        <th scope="col" className="px-3 py-2.5 text-left font-medium">Participación</th>
                        <th scope="col" className="px-3 py-2.5 text-right font-medium">CVR suav.</th>
                        <th scope="col" className="px-5 py-2.5 text-right font-medium">Conv. esperadas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allocations.map((a) => (
                        <tr key={a.segment_key} className="h-10 border-b border-hairline last:border-0">
                          <th scope="row" className="px-5 text-left font-normal whitespace-nowrap">
                            <span className="inline-flex items-center gap-2 text-ink">
                              <span aria-hidden className="size-2 rounded-full" style={{ background: campaignColor(a.campaign) }} />
                              <span className="font-mono">{a.campaign}</span>
                              <span className="text-ink-muted">{a.age}</span>
                              <span className="text-ink-muted">{genderLabel(a.gender)}</span>
                              <span className="font-mono text-ink-subtle">#{a.interest}</span>
                            </span>
                          </th>
                          <td className="px-3 text-right font-mono text-ink tabular">{formatCurrency(a.recommended_spend)}</td>
                          <td className="px-3">
                            <span className="flex w-full items-center gap-2">
                              <span className="h-1.5 min-w-0 flex-1 rounded-full bg-surface-2">
                                <span
                                  className="bar-grow block h-full rounded-full"
                                  style={{
                                    width: `${(a.share_of_budget / peakShare) * 100}%`,
                                    background: campaignColor(a.campaign),
                                  }}
                                />
                              </span>
                              <span className="font-mono text-ink-muted tabular">{formatPercent(a.share_of_budget, 1)}</span>
                            </span>
                          </td>
                          <td className={`px-3 text-right font-mono tabular ${a.shrunk_cvr > 1 ? "text-warning-ink" : "text-ink"}`}>
                            {formatPercent(a.shrunk_cvr, 1)}
                          </td>
                          <td className="px-5 text-right font-mono text-ink tabular">{formatDecimal(a.expected_conversions, 1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {plan.allocations.length > PAGE_SIZE ? (
                  <div className="flex items-center justify-between gap-3 border-t border-hairline px-5 py-3 text-[13px]">
                    <p className="text-ink-subtle">
                      <span className="font-mono text-ink tabular">{formatInteger(currentPage * PAGE_SIZE + 1)}</span>
                      –
                      <span className="font-mono text-ink tabular">
                        {formatInteger(Math.min(plan.allocations.length, (currentPage + 1) * PAGE_SIZE))}
                      </span>
                      {" de "}
                      <span className="font-mono tabular">{formatInteger(plan.allocations.length)}</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>
                        Anterior
                      </Button>
                      <span className="font-mono text-ink-subtle tabular">
                        {currentPage + 1} / {pageCount}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={currentPage >= pageCount - 1}
                        onClick={() => setPage(currentPage + 1)}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                ) : null}
              </Panel>
            </>
          )}
        </div>
      </div>

      <Panel>
        <PanelHeader
          title="Historial"
          subtitle={
            storageMode === "memory"
              ? "Cada cálculo queda aquí mientras esta sesión siga abierta."
              : "Cada cálculo queda guardado. Si repites el mismo presupuesto, no se duplica."
          }
          actions={
            pending ? (
              <Badge tone="warning" dot>
                {formatInteger(pending)} por confirmar
              </Badge>
            ) : history.data.items.length ? (
              <Badge tone="success" dot>
                {formatInteger(history.data.items.length)} guardada{history.data.items.length === 1 ? "" : "s"}
              </Badge>
            ) : null
          }
        />
        {history.data.items.length === 0 ? (
          <EmptyState title="Todavía no hay recomendaciones" mood="thinking">
            Calcula un presupuesto y aparecerá aquí, con el monto y las conversiones esperadas.
          </EmptyState>
        ) : (
          <ul className="mt-3 max-h-80 divide-y divide-hairline overflow-y-auto border-t border-hairline">
            {history.data.items.map((item, index) => {
              const active = item.idempotency_key === opened?.key;
              return (
                <li key={item.idempotency_key}>
                  <button
                    type="button"
                    onClick={() => openHistory(item)}
                    className={cn(
                      "flex w-full flex-wrap items-center gap-x-6 gap-y-1 px-5 py-4 text-left text-sm transition-colors duration-120 hover:bg-surface-2",
                      active && "bg-surface-2",
                    )}
                  >
                    <span className="w-6 font-mono text-xs text-ink-tertiary tabular">{index + 1}</span>
                    <span className="font-mono text-ink tabular">{formatCurrency(item.payload.total_budget, 0)}</span>
                    <span className="text-ink-muted">
                      {formatInteger(item.payload.allocations.length)} segmentos ·{" "}
                      <span className="font-mono tabular">{formatDecimal(item.payload.expected_conversions, 1)}</span> conversiones
                      esperadas
                    </span>
                    <span className="ml-auto">
                      {item.persisted ? (
                        <Badge tone="success" dot>
                          Guardada
                        </Badge>
                      ) : (
                        <Badge tone="warning" dot>
                          Solo en esta sesión
                        </Badge>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
