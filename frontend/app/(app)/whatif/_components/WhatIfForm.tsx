"use client";

import { useMutation } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { useState } from "react";

import { PitayaMark } from "@/components/illustrations/PitayaMark";
import { Notice } from "@/components/notices/notices";
import { EmptyState } from "@/components/states/states";
import { Skeleton } from "@/components/states/Skeleton";
import { Button } from "@/components/ui/button";
import { Field, Input, Segmented, Select } from "@/components/ui/controls";
import { Panel, PanelHeader } from "@/components/ui/primitives";
import { apiPost, toFieldErrors, toUserMessage } from "@/lib/api/client";
import type { PredictRequest, PredictResponse } from "@/lib/api/types";
import { formatPercent } from "@/lib/format";
import { genderLabel, MODEL_LABEL } from "@/lib/labels";
import { campaignColor } from "@/lib/palette";
import { cn } from "@/lib/utils";

type Scenario = "inflight" | "prelaunch";
type Outcome = { kind: string; ok: true; p: number } | { kind: string; ok: false; message: string };

export function WhatIfForm({
  options,
  models,
  trainedScenario,
}: {
  options: { campaign: number[]; age: string[]; gender: string[]; interest: number[] };
  models: string[];
  trainedScenario: string | null;
}) {
  const [scenario, setScenario] = useState<Scenario>(trainedScenario === "prelaunch" ? "prelaunch" : "inflight");
  const [campaign, setCampaign] = useState(String(options.campaign.includes(1178) ? 1178 : options.campaign[0]));
  const [age, setAge] = useState(options.age[0] ?? "30-34");
  const [gender, setGender] = useState(options.gender[0] ?? "male");
  const [interest, setInterest] = useState(String(options.interest[0] ?? 10));
  const [impressions, setImpressions] = useState("50000");
  const [clicks, setClicks] = useState("12");
  const [spent, setSpent] = useState("18.5");

  const inflight = scenario === "inflight";
  const errors: Record<string, string> = {};
  if (inflight) {
    if (!(Number(impressions) >= 0) || impressions === "") errors.Impressions = "Ingresa un número ≥ 0.";
    if (!(Number(clicks) >= 0) || clicks === "") errors.Clicks = "Ingresa un número ≥ 0.";
    if (!(Number(spent) >= 0) || spent === "") errors.Spent = "Ingresa un monto ≥ 0.";
    if (!errors.Clicks && !errors.Impressions && Number(clicks) > Number(impressions)) errors.Clicks = "No puede haber más clics que impresiones.";
  }
  const valid = Object.keys(errors).length === 0;

  const run = useMutation({
    mutationFn: async (): Promise<Outcome[]> => {
      const record: Record<string, string | number> = {
        xyz_campaign_id: Number(campaign),
        age,
        gender,
        interest: Number(interest),
        ...(inflight ? { Impressions: Number(impressions), Clicks: Number(clicks), Spent: Number(spent) } : {}),
      };
      return Promise.all(
        models.map(async (kind): Promise<Outcome> => {
          const body: PredictRequest = { scenario, model_kind: kind, records: [record] };
          try {
            const res = await apiPost<PredictResponse>("v1/predict", body);
            const p = res.predictions?.[0];
            return typeof p === "number" ? { kind, ok: true, p } : { kind, ok: false, message: res.message ?? "Sin predicción" };
          } catch (err) {
            const fields = toFieldErrors(err);
            return { kind, ok: false, message: Object.values(fields)[0] ?? toUserMessage(err) };
          }
        }),
      );
    },
  });

  const results = run.data;
  const okResults = results?.filter((r): r is Extract<Outcome, { ok: true }> => r.ok) ?? [];
  const main = okResults.find((r) => r.kind === "random_forest") ?? okResults[0];
  const mood = !main ? "thinking" : main.p >= 0.5 ? "happy" : "thinking";

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Panel className="h-fit p-5 lg:sticky lg:top-16">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) run.mutate();
          }}
          className="space-y-5"
        >
          <Segmented
            label="Escenario"
            value={scenario}
            onChange={setScenario}
            className="w-full"
            options={[
              { value: "prelaunch", label: "Pre-lanzamiento", title: "Solo atributos de audiencia" },
              { value: "inflight", label: "En vuelo", title: "Incluye impresiones, clics y gasto" },
            ]}
          />
          {trainedScenario && trainedScenario !== scenario ? (
            <p className="text-[12px] text-warning-ink">
              El snapshot solo tiene modelos «{trainedScenario === "inflight" ? "en vuelo" : "pre-lanzamiento"}»; este escenario
              devolverá error.
            </p>
          ) : null}
          <Field htmlFor="wi-campaign" label="Campaña">
            <Select id="wi-campaign" value={campaign} onChange={(e) => setCampaign(e.target.value)}>
              {options.campaign.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field htmlFor="wi-age" label="Edad">
              <Select id="wi-age" value={age} onChange={(e) => setAge(e.target.value)}>
                {options.age.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </Select>
            </Field>
            <Field htmlFor="wi-gender" label="Género">
              <Select id="wi-gender" value={gender} onChange={(e) => setGender(e.target.value)}>
                {options.gender.map((g) => (
                  <option key={g} value={g}>
                    {genderLabel(g)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field htmlFor="wi-interest" label="Interés (código de Facebook)">
            <Select id="wi-interest" value={interest} onChange={(e) => setInterest(e.target.value)}>
              {options.interest.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </Select>
          </Field>
          {inflight ? (
            <div className="space-y-4 border-t border-hairline pt-4">
              <Field htmlFor="wi-imp" label="Impresiones" error={errors.Impressions}>
                <Input id="wi-imp" inputMode="numeric" value={impressions} onChange={(e) => setImpressions(e.target.value)} aria-invalid={!!errors.Impressions} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field htmlFor="wi-clicks" label="Clics" error={errors.Clicks}>
                  <Input id="wi-clicks" inputMode="numeric" value={clicks} onChange={(e) => setClicks(e.target.value)} aria-invalid={!!errors.Clicks} />
                </Field>
                <Field htmlFor="wi-spent" label="Gasto (USD)" error={errors.Spent}>
                  <Input id="wi-spent" inputMode="decimal" value={spent} onChange={(e) => setSpent(e.target.value)} aria-invalid={!!errors.Spent} />
                </Field>
              </div>
            </div>
          ) : null}
          <Button type="submit" variant="primary" className="w-full" disabled={!valid || run.isPending}>
            <Sparkles strokeWidth={1.5} />
            {run.isPending ? "Estimando…" : "Estimar probabilidad"}
          </Button>
        </form>
      </Panel>

      <div className="min-w-0 space-y-6" aria-live="polite">
        {run.isPending ? (
          <Panel className="rounded-xl p-5" aria-busy="true">
            <span className="sr-only">Cargando…</span>
            <Skeleton className="h-4 w-60" />
            <Skeleton className="mt-6 h-12 w-40" />
            <div className="mt-8 space-y-4">
              {models.map((m) => (
                <Skeleton key={m} className="h-7 w-full" />
              ))}
            </div>
          </Panel>
        ) : !results ? (
          <Panel className="rounded-xl">
            <EmptyState title="Describe un anuncio y estima" mood="thinking">
              Compararemos la probabilidad que asigna cada modelo entrenado. Random Forest y AdaBoost están calibrados con
              regresión isotónica.
            </EmptyState>
          </Panel>
        ) : (
          <>
            <Panel className="rounded-xl">
              <PanelHeader
                eyebrow={<p className="label-mono text-ink-tertiary">Resultado</p>}
                title={
                  main
                    ? `${MODEL_LABEL[main.kind] ?? main.kind} estima ${formatPercent(main.p, 0)} de probabilidad de convertir`
                    : "Ningún modelo pudo estimar este anuncio"
                }
                subtitle={`Campaña ${campaign} · ${age} · ${genderLabel(gender)} · interés ${interest}${inflight ? ` · ${impressions} impresiones, ${clicks} clics, $${spent}` : ""}`}
              />
              {main ? (
                <div className="flex items-center gap-5 px-5 pt-5 pb-2">
                  <PitayaMark mood={mood} size={64} decorative />
                  <div className="min-w-0 flex-1">
                    <p className="type-kpi text-ink">{formatPercent(main.p, 1)}</p>
                    <div className="relative mt-3 h-3 rounded-full bg-surface-2">
                      <div className="bar-grow absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${main.p * 100}%` }} />
                      <div className="absolute top-[-4px] bottom-[-4px] w-px bg-ink-subtle" style={{ left: "50%" }} title="Umbral 0,5" />
                    </div>
                    <div className="mt-1 flex justify-between font-mono text-[11px] text-ink-tertiary tabular">
                      <span>0 %</span>
                      <span>umbral 50 %</span>
                      <span>100 %</span>
                    </div>
                    <p className="mt-2 text-[12px] text-ink-subtle">Intervalo — · el endpoint devuelve solo la probabilidad puntual.</p>
                  </div>
                </div>
              ) : null}
              <div className="px-5 pt-4 pb-5">
                <h3 className="label-mono mb-3 text-ink-tertiary">Comparación entre modelos</h3>
                <ul className="space-y-3">
                  {results.map((r) => (
                    <li key={r.kind} className="grid grid-cols-[120px_1fr_64px] items-center gap-3 text-[13px]">
                      <span className={cn("truncate", r.kind === main?.kind ? "text-ink" : "text-ink-muted")}>
                        {MODEL_LABEL[r.kind] ?? r.kind}
                      </span>
                      {r.ok ? (
                        <>
                          <span className="relative h-5 rounded-sm bg-surface-2">
                            <span
                              className="bar-grow absolute inset-y-0 left-0 rounded-sm"
                              style={{
                                width: `${r.p * 100}%`,
                                background: r.kind === main?.kind ? "var(--primary)" : "var(--hairline-tertiary)",
                              }}
                            />
                            <span className="absolute inset-y-0 w-px bg-ink-subtle" style={{ left: "50%" }} />
                          </span>
                          <span className="text-right font-mono text-ink tabular">{formatPercent(r.p, 1)}</span>
                        </>
                      ) : (
                        <span className="col-span-2 text-[12px] text-danger-ink">{r.message}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </Panel>
            <Notice>
              Shapley local (los 3 factores que más empujan la probabilidad) y la comparación con el promedio del segmento aún
              no están expuestos en <code className="font-mono">/v1/predict</code>.
            </Notice>
          </>
        )}
        <div className="flex items-center gap-2 text-[12px] text-ink-tertiary">
          <span aria-hidden className="size-2 rounded-full" style={{ background: campaignColor(campaign) }} />
          Variables del escenario «{inflight ? "en vuelo" : "pre-lanzamiento"}»: campaña, edad, género, interés
          {inflight ? ", impresiones, clics y gasto" : ""}. Total_Conversion nunca se usa.
        </div>
      </div>
    </div>
  );
}
