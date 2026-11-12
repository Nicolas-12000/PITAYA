# PITAYA

**P**redictive **I**nvestment, **T**esting & **A**ttribution for **Y**ield **A**nalytics — analítica de punta a punta sobre campañas de Facebook Ads.

- Guía maestra: [PITAYA.MD](./PITAYA.MD)
- Reglas para agentes/IA: [AGENTS.md](./AGENTS.md)
- Metodología de datos: [docs/crisp-dm/README.md](./docs/crisp-dm/README.md)

## Alcance

**Desarrollo activo: backend** (API FastAPI + pipeline CRISP-DM offline). `frontend/` contiene solo documentación guía para la UI futura.

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
frontend/           # guía UI (README + ROUTES; sin app Next.js)
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

## Licencia

Proyecto académico — Minería de Datos.
