# CRISP-DM en PITAYA

Mapa de la metodología **Cross-Industry Standard Process for Data Mining** a artefactos y comandos del repositorio.

| Fase CRISP-DM | Objetivo en PITAYA | Artefactos | Comando / ubicación |
|---------------|-------------------|------------|---------------------|
| 1. Business Understanding | ROI, presupuesto, conversión, A/B observacional | `PITAYA.MD` §1, §10 | — |
| 2. Data Understanding | Esquema Kaggle, missing, balance de clases | `notebooks/01_eda.ipynb` | `make ingest` |
| 3. Data Preparation | Target `converted`, features sin leakage, encoding | `modules/catalog/`, snapshot | `make ingest` |
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

## Próximos pasos del equipo

1. Completar EDA en notebook y fijar lista final de columnas.
2. Ejecutar `make train` con dataset real de Kaggle.
3. Implementar workflows de `performance`, `experiments`, `budget` (dominio).
