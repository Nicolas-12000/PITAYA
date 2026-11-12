.PHONY: help install sync lint format typecheck test backend-dev train ingest verify-idempotent crisp-dm check-python-clean

BACKEND := backend
UV := cd $(BACKEND) && uv

help:
	@echo "PITAYA — comandos oficiales"
	@echo ""
	@echo "  make install          Instalar dependencias backend (uv sync)"
	@echo "  make sync             Alias de install"
	@echo "  make lint               ruff check"
	@echo "  make format             ruff format"
	@echo "  make typecheck          mypy src"
	@echo "  make test               pytest"
	@echo "  make backend-dev        uvicorn con reload (puerto 8000)"
	@echo ""
	@echo "  CRISP-DM / datos:"
	@echo "  make ingest             Descargar/validar dataset → snapshot"
	@echo "  make train              Entrenar modelos offline → snapshot/models"
	@echo "  make verify-idempotent  Verificar pipeline idempotente"
	@echo ""
	@echo "  make crisp-dm           Mostrar mapa de fases CRISP-DM del repo"

install sync:
	$(UV) sync

lint:
	$(UV) run ruff check .

format:
	$(UV) run ruff format .

typecheck:
	$(UV) run mypy src

test:
	$(UV) run pytest

backend-dev:
	cd $(BACKEND) && uv run uvicorn app.index:app --reload --port 8000

check-python-clean:
	@! python3 -c "import fastapi" 2>/dev/null && echo "[check-python-clean] OK: fastapi no está en el Python del sistema" || (echo "[check-python-clean] FAIL: fastapi importable fuera del venv" >&2; exit 1)
	@cd $(BACKEND) && uv run python -c "import fastapi; print('[check-python-clean] OK: fastapi en', fastapi.__file__)"

ingest:
	$(UV) run python -m pitaya.cli ingest

train:
	$(UV) run python -m pitaya.cli train

verify-idempotent:
	$(UV) run python -m pitaya.cli verify_idempotent

crisp-dm:
	@cat docs/crisp-dm/README.md | head -n 40
