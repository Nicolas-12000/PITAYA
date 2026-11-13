/** Colores de campaña fijos en todas las pantallas (FRONTEND.md §4.3). */
export const CAMPAIGN_IDS = [916, 936, 1178] as const;
export type CampaignId = (typeof CAMPAIGN_IDS)[number];

const CAMPAIGN_VAR: Record<string, string> = {
  "916": "var(--s1)",
  "936": "var(--s2)",
  "1178": "var(--s5)",
};

const CAMPAIGN_BG: Record<string, string> = {
  "916": "bg-series-1",
  "936": "bg-series-2",
  "1178": "bg-series-5",
};

const CAMPAIGN_TEXT: Record<string, string> = {
  "916": "text-series-1",
  "936": "text-series-2",
  "1178": "text-series-5",
};

/** Forma por campaña para que el color no sea la única pista. */
export const CAMPAIGN_SHAPE: Record<string, "circle" | "square" | "diamond"> = {
  "916": "circle",
  "936": "square",
  "1178": "diamond",
};

export function campaignColor(id: string | number): string {
  return CAMPAIGN_VAR[String(id)] ?? "var(--ink-subtle)";
}
export function campaignBg(id: string | number): string {
  return CAMPAIGN_BG[String(id)] ?? "bg-ink-subtle";
}
export function campaignText(id: string | number): string {
  return CAMPAIGN_TEXT[String(id)] ?? "text-ink-subtle";
}

/** Extrae el id de campaña de claves como "facebook_campaign_916". */
export function campaignFromChannelKey(key: string): string {
  const match = key.match(/(\d+)$/);
  return match ? match[1] : key;
}
