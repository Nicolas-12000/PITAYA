# Mapa de rutas UI (guía)

Proyecto creado con `pnpm create next-app@latest`. **No implementar analítica aquí**; consumir la API FastAPI.

| Página (App Router) | Endpoint FastAPI | Notas |
|---------------------|------------------|-------|
| `/` | `GET /v1/kpis` | KPIs globales |
| `/campaigns` | `GET /v1/segments` | Campaña, edad, género, interés |
| `/models` | `GET /v1/status` + manifest | `backend/snapshot/manifest.json` |
| `/roi` | `GET /v1/kpis` | `value_per_approved_conversion` |
| `/experiments` | `POST /v1/ab-test` | **Observacional** |
| `/attribution` | `GET /v1/attribution` | Shapley nivel A (pendiente) |
| `/budget` | `POST /v1/recommendations` | Idempotency-Key |
| `/status` | `GET /v1/status` | memory / snapshot |
| What-if | `POST /v1/predict` | `scenario`: prelaunch \| inflight |

```bash
cp .env.example .env.local
pnpm dev
```

OpenAPI: `http://localhost:8000/docs` (con `make backend-dev`).
