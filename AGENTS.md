# Reglas del proyecto PITAYA

## Stack
- Backend únicamente: Python 3.12, FastAPI, Pydantic y uv.
- **Python solo en venv:** `backend/.venv` vía `uv sync` / `uv run`. Prohibido `pip install` en el intérprete del sistema o `--user`.
- No crear ni scaffoldear frontend en este repositorio salvo petición explícita del equipo.
- Comunicación mediante API JSON documentada con OpenAPI.
- No introducir servicios externos obligatorios.

## Arquitectura
- Monolito modular: `modules/` (dominio), `orchestration/` (workflows),
  `platform/` (infraestructura) y `kernel/` (compartido).
- `modules/*` pueden importar pandas, numpy, scipy y sklearn,
  pero NO FastAPI, SQLAlchemy ni `platform/`.
- Entre módulos solo se importa `api.py`.
- Las rutas FastAPI validan y delegan; no contienen lógica de negocio.
- El frontend no replica cálculos del backend.

## Persistencia
- La aplicación debe funcionar en `STORAGE_MODE=memory`.
- SQLite se usa para desarrollo local.
- PostgreSQL es opcional y se activa mediante `DATABASE_URL`.
- La memoria y la caché son temporales; no afirmar que son persistentes.
- En Vercel no depender de workers, hilos o timers para sincronización.
- Si hay DB, intentar persistir en la misma petición.
- Mostrar al usuario si un dato está solo en memoria o persistido.

## Datos y modelos (CRISP-DM)
- Seguir fases CRISP-DM documentadas en `docs/crisp-dm/`.
- Dataset y modelos de demo se cargan desde `backend/snapshot/`.
- Entrenamiento offline (`make train`); no entrenar durante requests.
- Prohibido usar `Total_Conversion` como feature para predecir
  `Approved_Conversion`.
- Preprocesamiento dentro de `Pipeline` de scikit-learn.
- Modelos: baselines, regresión logística (lineal), KNN, Random Forest y AdaBoost.
- Todo dato simulado debe identificarse como simulado.

## Calidad
- Type hints en Python; ruff + mypy + pytest.
- Ruff, mypy, y pruebas automatizadas en backend.
- Código y nombres técnicos en inglés; textos de UI en español.
- Preferir soluciones simples y comprensibles para el equipo.
