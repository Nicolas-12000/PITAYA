# Calidad del backend PITAYA

## CI (GitHub Actions)

- `uv sync --all-extras`
- `ruff check` + `ruff format --check`
- `mypy src`
- `pytest` con cobertura **≥ 80 %** (`pitaya`)

## CRISP-DM entregables de datos

| Artefacto | Ruta |
|-----------|------|
| CSV crudo | `data/raw/facebook-ad-campaign.csv` |
| Informe de limpieza | `backend/snapshot/quality_report.json` |
| Snapshot servido | `backend/snapshot/ads.csv.gz` |
| Modelos + evaluación | `backend/snapshot/models/`, `manifest.json` |
| EDA | `notebooks/01_eda.ipynb` |

## Comandos locales (misma barra que CI)

```bash
make install
make test
cd backend && uv run mypy src && uv run ruff check .
```

## Persistencia

- **Memory-first**: recomendaciones e idempotencia en proceso.
- **SQLite** (opcional): `STORAGE_MODE=sqlite` + `DATABASE_URL=sqlite:///./data/pitaya.db`
- Cobertura de tests: `tests/test_persistence.py`

## Atribución nivel B

Trayectorias **simuladas** con etiqueta explícita. Markov usa matriz de transición en `markov_journey_attribution`.
