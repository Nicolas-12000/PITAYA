/**
 * Tipos de respuesta de la API PITAYA.
 *
 * Los tipos de petición y los esquemas con `response_model` vienen de
 * `schema.ts` (generado con `pnpm gen:api`). Varias rutas del backend
 * devuelven `dict[str, object]` sin modelo Pydantic, por lo que el OpenAPI
 * las publica como objetos genéricos: aquí se estrechan esas formas tal como
 * las producen los workflows de `backend/src/pitaya/orchestration/`.
 * Cuando el backend agregue `response_model`, sustituir por los generados.
 */
import type { components } from "./schema";

type Schemas = components["schemas"];

export type PredictRequest = Schemas["PredictRequest"];
export type RecommendRequest = Schemas["RecommendRequest"];
export type AbTestRequest = Schemas["AbTestRequest"];
export type HealthResponse = Schemas["HealthResponse"];

export type StatusResponse = Schemas["StatusResponse"] & {
  storage_mode: string;
  persistence: { database_configured: boolean; durable_writes: boolean };
  snapshot: {
    loaded: boolean;
    dataset_hash: string | null;
    manifest_present: boolean;
    sklearn_version_mismatch: string | null;
  };
  cache: { entries: number; ttl_seconds: number; max_items: number };
};

export type GroupKpis = {
  impressions: number;
  clicks: number;
  spent: number;
  approved_conversions: number;
  estimated_revenue: number;
  ctr: number;
  cvr: number;
  cpc: number;
  cpa: number;
  roas: number;
};

export type GlobalKpis = Omit<GroupKpis, "cpa"> & { value_per_approved_conversion: number };

export type KpisResponse = Schemas["KpisResponse"] & { kpis: GlobalKpis; row_count: number };

export type Segment = {
  xyz_campaign_id: number;
  age: string;
  gender: string;
  interest: number;
  kpis: GroupKpis;
  row_count: number;
};

export type SegmentsResponse = { dimensions: string[]; segments: Segment[] };

export type CampaignRow = { xyz_campaign_id: number; kpis: GroupKpis; row_count: number };

export type ChannelsResponse = {
  channel: string;
  disclaimer: string;
  campaigns: CampaignRow[];
};

export type RoiScenario = {
  multiplier: number;
  value_per_approved_conversion: number;
  estimated_revenue: number;
  roi: number;
  roas: number;
};

export type RoiResponse = {
  disclaimer: string;
  spent: number;
  approved_conversions: number;
  base_value_per_conversion: number;
  break_even_value_per_conversion: number | null;
  scenarios: RoiScenario[];
};

export type MetricKey =
  | "cv_roc_auc" | "cv_pr_auc" | "cv_f1" | "cv_precision" | "cv_recall" | "cv_brier"
  | "test_roc_auc" | "test_pr_auc" | "test_f1" | "test_precision" | "test_recall" | "test_brier";

export type ModelMetrics = Record<MetricKey, number | null>;

export type ModelEntry = { kind: string; artifact: string; metrics: ModelMetrics };

export type ModelManifest = {
  stage: string;
  created_at: string;
  dataset_hash: string;
  random_seed: number;
  feature_scenario: string;
  sklearn_version: string;
  models: ModelEntry[];
  cv_fold_roc_auc: Record<string, number[]>;
  model_comparison: {
    random_forest_vs_adaboost_wilcoxon?: { statistic: number; p_value: number };
  };
  notes: Record<string, string>;
};

export type ModelsResponse =
  | { status: "ok"; manifest: ModelManifest }
  | { status: "missing"; message: string };

export type AttributionShapley = {
  level: "A";
  data_source: "real";
  factors: string[];
  shapley_values: Record<string, number>;
  shapley_shares: Record<string, number>;
  grand_total_approved: number;
  coalition_check_grand_value: number;
};

export type AttributionSynthetic = {
  level: "B";
  data_source: "simulated";
  disclaimer: string;
  model: string;
  attribution_credits: Record<string, number>;
  journeys: number;
  random_seed: number;
  markov_transition_matrix?: number[][];
};

export type PredictResponse = Schemas["PredictResponse"];

export type CampaignSummary = {
  campaign_id: number;
  ctr: number;
  cvr: number;
  cpa: number;
  spent: number;
  approved_conversions: number;
};

export type FrequentistComparison = {
  campaign_a: number;
  campaign_b: number;
  metric: "ctr" | "cvr";
  rate_a: number;
  rate_b: number;
  z_statistic: number;
  p_value: number;
  significant_at_005: boolean;
  holm_significant: boolean;
};

export type BayesianPosterior = {
  campaign_id: number;
  successes: number;
  trials: number;
  posterior_mean: number;
  credible_interval_95: [number, number];
};

export type AbTestResponse = {
  analysis_type: string;
  disclaimer: string;
  campaign_summaries: CampaignSummary[];
  frequentist_comparisons: FrequentistComparison[];
  bayesian_posteriors: BayesianPosterior[];
  bayesian_pairwise: { campaign_a: number; campaign_b: number; probability_b_beats_a: number }[];
  bootstrap_cpa: Record<string, { cpa_mean: number; cpa_ci_low: number; cpa_ci_high: number }>;
  sample_size_simulator: {
    n_per_group: number;
    estimated_days: number;
    baseline_rate: number;
    target_rate: number;
    assumption_alpha: number;
    assumption_power: number;
  };
};

export type Allocation = {
  segment_key: string;
  campaign: number;
  age: string;
  gender: string;
  interest: number;
  recommended_spend: number;
  share_of_budget: number;
  shrunk_cvr: number;
  expected_conversions: number;
  expected_revenue: number;
};

export type BudgetPlan = {
  disclaimer: string;
  total_budget: number;
  expected_conversions: number;
  expected_revenue: number;
  uncertainty_note: string;
  allocations: Allocation[];
};

export type RecommendResponse = { plan: BudgetPlan; saved_in_memory: boolean; persisted: boolean };

export type RecommendationItem = { idempotency_key: string; payload: BudgetPlan; persisted: boolean };

export type RecommendationsList = { items: RecommendationItem[] };

export type SyncResponse = {
  status: string;
  flushed: number;
  items: Record<string, unknown>[];
  note: string;
};
