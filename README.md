# PITAYA

**P**redictive **I**nvestment, **T**esting & **A**ttribution for **Y**ield **A**nalytics — analítica de punta a punta sobre campañas de Facebook Ads.

- Guía maestra: [PITAYA.MD](./PITAYA.MD)
- Reglas para agentes/IA: [AGENTS.md](./AGENTS.md)
- Metodología de datos: [docs/crisp-dm/README.md](./docs/crisp-dm/README.md)

## Estado

| Área | Estado |
|------|--------|
| Backend: API `/v1`, dominio, snapshot, `make ingest` / `train`, CI (ruff, mypy, pytest ≥80 %) | **Listo** |
| Frontend: dashboard y pantallas analíticas | **Pendiente** — guía [frontend/FRONTEND.md](./frontend/FRONTEND.md); hoy solo scaffold `create-next-app` |

Lo demás (deploy Vercel, PostgreSQL en producción, EDA en notebook) es opcional y no bloquea desarrollo local.

| Capa | Tecnología |
|------|------------|
| API | FastAPI, Pydantic, OpenAPI |
| Datos / ML | pandas, scikit-learn, scipy |
| Entorno | Python 3.12, [uv](https://docs.astral.sh/uv/) |

## Inicio rápido

No instales paquetes Python en el intérprete global: usa siempre el venv de `backend/` (`uv` lo gestiona).

```bash
# Repositorio
git clone <url>
cd PITAYA

# Backend (entorno aislado en backend/.venv)
make install
make backend-dev
# → http://localhost:8000/v1/health
# → http://localhost:8000/docs

# Frontend (base Next, opcional)
make frontend-install
make frontend-dev
# → http://localhost:3000
```

Variables opcionales (copiar desde `.env.example`):

```bash
STORAGE_MODE=memory
SNAPSHOT_DIR=snapshot
```

## Pipeline CRISP-DM (comandos)

```bash
make ingest              # Fase 2–3: validación y snapshot
make train               # Fase 4–5: entrenamiento offline
make verify-idempotent   # Reproducibilidad e idempotencia
```

## Estructura

```
backend/src/pitaya/
  kernel/           # tipos, hashing, métricas compartidas
  modules/          # dominio (catalog, modeling, performance, …)
  orchestration/    # workflows
  platform/         # web, storage, cache
docs/crisp-dm/      # fases y entregables
frontend/           # Next.js (create-next-app) + FRONTEND.md
notebooks/          # EDA (fuera del runtime de serving)
```

## Modelado

Target: `converted = Approved_Conversion > 0`.

Modelos previstos en el pipeline offline (ver `make train`):

- `DummyClassifier` (baseline)
- `LogisticRegression` (modelo lineal para clasificación)
- `KNeighborsClassifier` (KNN)
- `RandomForestClassifier` y `AdaBoostClassifier` (requerimiento del curso)

No se usa `Total_Conversion` como feature (evitar data leakage).

API REST documentada en OpenAPI: `http://localhost:8000/docs` (prefijo `/v1`).

## Calidad (backend)

Misma barra en local y en GitHub Actions (`.github/workflows/backend.yml`):

```bash
make install    # uv sync --all-extras
make lint && make format && make typecheck && make test
```

- **ruff** (check + format), **mypy** en `src`, **pytest** con cobertura **≥ 80 %** en el paquete `pitaya` (`backend/pyproject.toml`).

Artefactos de datos (CRISP fases 2–5): CSV en `data/raw/`, informe `backend/snapshot/quality_report.json`, snapshot `ads.csv.gz`, modelos en `backend/snapshot/models/` y `manifest.json` — detalle en [docs/crisp-dm/README.md](./docs/crisp-dm/README.md). Tests usan extracto real en `backend/tests/fixtures/` (ver su README).

## Licencia

Proyecto académico — Minería de Datos.
