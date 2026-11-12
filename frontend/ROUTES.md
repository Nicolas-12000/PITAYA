# Mapa de rutas UI (guía)

| Página (App Router) | Endpoint FastAPI | Notas |
|---------------------|------------------|-------|
| `/` | `GET /v1/kpis` | KPIs globales |
| `/campaigns` | `GET /v1/segments` | Por campaña, edad, género, interés |
| `/models` | `GET /v1/status` + manifest | Métricas en `snapshot/manifest.json` |
| `/roi` | `GET /v1/kpis` | `value_per_approved_conversion` configurable |
| `/experiments` | `POST /v1/ab-test` | Análisis **observacional** |
| `/attribution` | `GET /v1/attribution` | Shapley nivel A |
| `/budget` | `POST /v1/recommendations` | Idempotency-Key |
| `/status` | `GET /v1/status` | memory / snapshot / caché |
| What-if | `POST /v1/predict` | `scenario`: prelaunch \| inflight |

Textos de interfaz en **español**; tipos OpenAPI generados desde `/docs`.
