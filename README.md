# PITAYA

**P**redictive **I**nvestment, **T**esting & **A**ttribution for **Y**ield **A**nalytics — analítica de punta a punta sobre campañas de Facebook Ads.

- Guía maestra: [PITAYA.MD](./PITAYA.MD)
- Reglas para agentes/IA: [AGENTS.md](./AGENTS.md)
- Metodología de datos: [docs/crisp-dm/README.md](./docs/crisp-dm/README.md)

## Alcance

**Desarrollo activo: backend**. `frontend/` es el scaffold oficial de Next.js (`create-next-app`) más guía en `ROUTES.md` — sin UI de dashboard aún.

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
frontend/           # Next.js (create-next-app) + ROUTES.md guía
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

## Backend — checklist (API `/v1`)

| Endpoint | Estado |
|----------|--------|
| health, status, kpis, segments, channels/compare, predict | ✅ |
| roi, models (manifest), ab-test (Holm + bayesiano + bootstrap) | ✅ |
| attribution Shapley A + modelos sintéticos B | ✅ |
| recommendations + Idempotency-Key + GET list | ✅ (memoria + SQLite opcional) |
| admin/sync (outbox best-effort) | ✅ |
| CRISP: download → quality → ingest → train | ✅ |

Calidad: cobertura ≥80 %, ruff, mypy en CI — ver [docs/QUALITY.md](docs/QUALITY.md). Pendiente: deploy Vercel, PostgreSQL productivo, cliente OpenAPI en frontend.

## Licencia

Proyecto académico — Minería de Datos.
