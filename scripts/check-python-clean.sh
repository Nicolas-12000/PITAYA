#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BLOCKED=(fastapi uvicorn pydantic_settings pitaya)
failed=0
for pkg in "${BLOCKED[@]}"; do
  if python3 -c "import ${pkg}" 2>/dev/null; then
    echo "[FAIL] El Python del sistema importa: ${pkg}"
    failed=1
  fi
done
if [[ "$failed" -eq 0 ]]; then
  echo "[OK] Python del sistema sin imports de PITAYA"
fi
cd "$ROOT/backend"
uv run python -c "import fastapi; print('[OK] fastapi en venv:', fastapi.__file__)"
exit "$failed"
