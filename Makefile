.PHONY: help env install sync lint format typecheck test backend-dev frontend-install frontend-dev download train ingest verify-idempotent export-test-fixture db-up db-down crisp-dm

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
	@echo "  make env                Crear .env desde .env.example si no existe (SQLite local)"
	@echo "  make backend-dev        uvicorn con reload (puerto 8000; crea .env si falta)"
	@echo "  make frontend-install   pnpm install en frontend/"
	@echo "  make frontend-dev       next dev (puerto 3000)"
	@echo ""
	@echo "  CRISP-DM / datos:"
	@echo "  make download           Kaggle CSV → data/raw/ (kagglehub)"
	@echo "  make ingest             Validar dataset → snapshot"
	@echo "  make train              Entrenar modelos offline → snapshot/models"
	@echo "  make verify-idempotent  Verificar pipeline idempotente"
	@echo "  make export-test-fixture  Regenerar tests/fixtures desde snapshot (tras ingest)"
	@echo "  make db-up              docker compose up -d postgres (opcional)"
	@echo "  make db-down            docker compose down"
	@echo ""
	@echo "  make crisp-dm           Mostrar mapa de fases CRISP-DM del repo"

install sync:
	$(UV) sync --all-extras

lint:
	$(UV) run ruff check .

format:
	$(UV) run ruff format .

typecheck:
	$(UV) run mypy src

test:
	$(UV) run pytest

env:
	@test -f .env || (cp .env.example .env && echo "[env] .env creado desde .env.example (STORAGE_MODE=sqlite)")

backend-dev: env
	cd $(BACKEND) && uv run uvicorn app.index:app --reload --port 8000

frontend-install:
	cd frontend && pnpm install --frozen-lockfile

frontend-dev:
	cd frontend && pnpm dev

download:
	$(UV) run python -m pitaya.cli download

ingest:
	$(UV) run python -m pitaya.cli ingest

train:
	$(UV) run python -m pitaya.cli train

verify-idempotent:
	$(UV) run python -m pitaya.cli verify_idempotent

export-test-fixture:
	$(UV) run python -m pitaya.cli export_test_fixture --rows 80

db-up:
	docker compose up -d postgres

db-down:
	docker compose down

crisp-dm:
	@cat docs/crisp-dm/README.md | head -n 40
