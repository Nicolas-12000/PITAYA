# PITAYA

**P**redictive **I**nvestment, **T**esting & **A**ttribution for **Y**ield **A**nalytics. Analítica de campañas de Facebook Ads: qué convierte, cuánto retorna, qué diferencia es relevante y cómo repartir el siguiente presupuesto.

**Demo en vivo:** https://pitaya-nine.vercel.app · API: [`/v1/health`](https://pitaya-nine.vercel.app/v1/health) · Estado: [`/status`](https://pitaya-nine.vercel.app/status)

El navegador no recalcula nada. Next.js presenta; FastAPI responde en `/v1`. El dataset y los modelos viajan con el repositorio. El entrenamiento es offline (`make train`) y no ocurre durante una petición.

## Stack

| Capa | Tecnología |
|------|------------|
| Interfaz | Next.js 16, React 19, Tailwind CSS v4, Recharts |
| API | FastAPI, Pydantic, OpenAPI |
| Datos y modelos | pandas, scikit-learn, scipy |
| Entorno | Python 3.12 con [uv](https://docs.astral.sh/uv/), pnpm en `frontend/` |

Reglas del repo: [AGENTS.md](./AGENTS.md). Metodología: [docs/crisp-dm/README.md](./docs/crisp-dm/README.md). Pantallas: [frontend/README.md](./frontend/README.md).

## Inicio rápido

Python solo dentro de `backend/.venv`. No uses `pip install` en el intérprete del sistema.

```bash
make install
make env              # .env con SQLite en data/pitaya.db
make backend-dev      # http://localhost:8000/docs

cp frontend/.env.example frontend/.env.local
make frontend-install
make frontend-dev     # http://localhost:3000
```

El snapshot ya está en el repo (`backend/snapshot/ads.csv` y `backend/snapshot/models/`). `make ingest` y `make train` solo hacen falta para regenerarlo.

## Persistencia

Las lecturas salen del snapshot. La base solo guarda recomendaciones.

| Modo | Cuándo | Qué dura |
|------|--------|----------|
| `sqlite` | Local. Es el `.env` que crea `make env` | El historial queda en `data/pitaya.db` |
| `memory` | Vercel, plan Hobby | El historial vive mientras la instancia sigue en pie |
| `postgres` | Opcional: `make db-up` y `uv sync --extra postgres` | Historial compartido |

En Vercel el disco de la función no conserva un archivo SQLite. Por eso `vercel.json` fija `STORAGE_MODE=memory`.

## Despliegue

Producción: **https://pitaya-nine.vercel.app** (proyecto `pitaya` en Vercel, plan Hobby, modo `memory`).

Un solo proyecto de Vercel. `vercel.json` declara dos servicios: Next en `frontend/` y FastAPI en `backend/` (`app.index:app`). `/v1` llega al API y el resto a la interfaz. Un *binding* de servicio inyecta `BACKEND_URL` en Next, así las llamadas del servidor al API son internas y no pasan por la protección de despliegues.

Despliegue manual desde la raíz del repo (con sesión en la cuenta dueña del proyecto):

```bash
npx vercel login
npx vercel deploy --prod
```

Despliegue automático en cada push a `main`: ver [docs/deploy/vercel-github.md](./docs/deploy/vercel-github.md).

## Datos y modelos

Dataset de Kaggle (`madislemsalu/facebook-ad-campaign`), validado con `make ingest`. Target: `converted = Approved_Conversion > 0`.

Dos escenarios, ambos entrenados: pre-lanzamiento (campaña, edad, género, interés) y en vuelo (impresiones, clics, gasto y tasas disponibles en ese momento). Modelos: baseline, regresión logística, KNN, Random Forest y AdaBoost. `Total_Conversion` no entra como variable: ya incluye las conversiones aprobadas.

El ROI usa un valor por conversión aprobada que el usuario puede cambiar. La comparación entre campañas es observacional: el dataset no es un experimento aleatorizado ni trae ingresos reales.

## Estructura

```
backend/src/pitaya/
  kernel/          tipos, métricas, configuración
  modules/         catalog, modeling, performance, experiments, attribution, budget
  orchestration/   workflows
  platform/        API, storage, caché, recomendaciones
backend/snapshot/  ads.csv, manifest y modelos
frontend/          App Router
docs/crisp-dm/     fases y entregables
```

## Calidad

```bash
make lint && make format && make typecheck && make test
```

ruff, mypy y pytest con cobertura de al menos 80 % sobre el paquete `pitaya`. La misma barra corre en GitHub Actions.

## Licencia

Proyecto académico — Minería de Datos.
