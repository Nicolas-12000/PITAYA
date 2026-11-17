import { StackedBar } from "@/components/charts/BarList";
import type { CampaignRow } from "@/lib/api/types";
import { formatInteger, formatPercent } from "@/lib/format";
import { CAMPAIGN_IDS, campaignColor } from "@/lib/palette";

function segments(campaigns: CampaignRow[], pick: (row: CampaignRow) => number) {
  const total = campaigns.reduce((acc, row) => acc + pick(row), 0);
  return CAMPAIGN_IDS.map((id) => {
    const row = campaigns.find((item) => item.xyz_campaign_id === id);
    const value = row ? pick(row) : 0;
    const share = total ? value / total : 0;
    return {
      key: String(id),
      value: share,
      color: campaignColor(id),
      label: `Campaña ${id}`,
      display: formatPercent(share, 0),
    };
  });
}

export function CampaignSplit({ campaigns }: { campaigns: CampaignRow[] }) {
  const approved = campaigns.reduce((acc, row) => acc + row.kpis.approved_conversions, 0);
  return (
    <div className="space-y-5 px-5 pt-4 pb-5">
      <p className="text-[15px] leading-relaxed text-ink-muted text-pretty">
        De {formatInteger(approved)} conversiones aprobadas, cada tramo es una campaña. El rosa es la 916, el violeta la
        936 y el cian la 1178. El tramo más largo es la que más aporta, y las tres barras repiten esos mismos colores
        para clics y gasto.
      </p>
      <StackedBar size="lg" label="Conversiones aprobadas" segments={segments(campaigns, (row) => row.kpis.approved_conversions)} />
      <StackedBar size="lg" label="Clics" segments={segments(campaigns, (row) => row.kpis.clicks)} />
      <StackedBar size="lg" label="Gasto" segments={segments(campaigns, (row) => row.kpis.spent)} />
    </div>
  );
}
