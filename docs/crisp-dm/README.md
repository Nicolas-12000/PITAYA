# CRISP-DM en PITAYA

Mapa de la metodología **Cross-Industry Standard Process for Data Mining** a artefactos y comandos del repositorio.

| Fase CRISP-DM | Objetivo en PITAYA | Artefactos | Comando / ubicación |
|---------------|-------------------|------------|---------------------|
| 1. Business Understanding | ROI, presupuesto, conversión, A/B observacional | `PITAYA.MD` §1, §10 | — |
| 2. Data Understanding | Esquema Kaggle, missing, balance de clases | `notebooks/01_eda.ipynb` | `make ingest` |
| 3. Data Preparation | Normalización, reglas de calidad, target `converted` | `catalog/normalize.py`, `catalog/quality.py`, `snapshot/quality_report.json` | `make ingest` |
| 4. Modeling | Baselines, logística lineal, KNN, RF, AdaBoost | `modules/modeling/`, `snapshot/models/` | `make train` |
| 5. Evaluation | ROC/PR-AUC, CV, calibración, comparación pareada | `snapshot/manifest.json`, tests | `make test`, `make verify-idempotent` |
| 6. Deployment | API memory + snapshot, sin entrenar en request | `platform/web/`, Vercel | `make backend-dev` |

## Principios de datos (industria / curso)

1. **Partición estable**: test por `hash(ad_id) % 10 < 2` (configurable en `kernel/config.py`).
2. **Preprocesamiento en Pipeline**: fit solo en train; `ColumnTransformer` sklearn.
3. **Semilla fija**: `PITAYA_RANDOM_SEED` para split, CV y modelos.
4. **Huellas**: SHA-256 de dataset y config en `manifest.json`.
5. **Sin leakage**: excluir `Total_Conversion` al predecir aprobaciones.

## Entregables por fase

- **Fase 2–3**: `backend/snapshot/ads.csv.gz`, validación en log de `ingest`.
- **Fase 4–5**: `*.joblib`, métricas en `manifest.json`.
- **Fase 6**: endpoints `/v1/*`, `/status` con modo de almacenamiento y hash de snapshot.

## Limpieza aplicada en `ingest` (fase 3)

- Campañas válidas: `916`, `936`, `1178` (descarta filas desalineadas del CSV Kaggle).
- Género: `male` / `female`; edad con patrón `NN-NN`.
- Sin `Approved_Conversion`; duplicados por `ad_id`; reglas lógicas CTR/conversiones.
- Artefacto: `backend/snapshot/quality_report.json` con conteos por motivo.

**Pendiente industria/curso:** EDA formal en notebook, outliers de `Spent` (IQR/winsor), calibración RF vs AdaBoost, Holm/Bayes en A/B, Shapley, presupuesto.

## Próximos pasos del equipo

1. Notebook `01_eda.ipynb` (fase 2 — entendimiento + gráficos).
2. Atribución, recomendador e idempotencia persistente.
3. Cobertura ≥80 % y mypy limpio en CI.
