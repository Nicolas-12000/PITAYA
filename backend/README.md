# PITAYA backend

Python API (FastAPI). Ver documentación del monorepo en [../README.md](../README.md).

## Entorno (solo venv del proyecto)

**No uses `pip install` en el Python del sistema.** Todas las dependencias viven en `backend/.venv`:

```bash
cd backend
uv sync
uv run uvicorn app.index:app --reload --port 8000
```

`uv` crea y usa `.venv` automáticamente; `make install` en la raíz hace lo mismo.
