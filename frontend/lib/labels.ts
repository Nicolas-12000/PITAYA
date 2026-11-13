/** Textos de UI para identificadores técnicos del backend. */
export const MODEL_LABEL: Record<string, string> = {
  dummy: "Baseline (dummy)",
  logistic_regression: "Regresión logística",
  knn: "KNN (k=15)",
  random_forest: "Random Forest",
  adaboost: "AdaBoost",
};

export const MODEL_SHORT: Record<string, string> = {
  dummy: "Dummy",
  logistic_regression: "Logística",
  knn: "KNN",
  random_forest: "RF",
  adaboost: "AdaBoost",
};

export const ATTRIBUTION_MODELS = [
  { id: "first_touch", label: "First touch", help: "Todo el crédito al primer contacto del recorrido." },
  { id: "last_touch", label: "Last touch", help: "Todo el crédito al último contacto antes de convertir." },
  { id: "linear", label: "Lineal", help: "Reparte el crédito por igual entre todos los contactos." },
  { id: "time_decay", label: "Time decay", help: "Más crédito a los contactos cercanos a la conversión (vida media de 1 paso)." },
  { id: "position_based", label: "Por posición", help: "20 % al primero, 20 % al último y el resto entre los intermedios." },
  { id: "markov", label: "Markov", help: "Crédito según visitas en una cadena de transición simulada entre campañas." },
] as const;

export const FACTOR_LABEL: Record<string, string> = {
  xyz_campaign_id: "Campaña",
  age: "Edad",
  gender: "Género",
  interest: "Interés",
};

export const GENDER_LABEL: Record<string, string> = {
  male: "Hombre",
  female: "Mujer",
  M: "Hombre",
  F: "Mujer",
};

export const STORAGE_LABEL: Record<string, string> = {
  memory: "Memoria",
  sqlite: "SQLite",
  postgres: "PostgreSQL",
};

export function genderLabel(value: string): string {
  return GENDER_LABEL[value] ?? value;
}
