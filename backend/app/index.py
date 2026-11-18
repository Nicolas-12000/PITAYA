"""ASGI entrypoint for uvicorn and Vercel."""

import sys
from pathlib import Path

# Vercel installs the dependencies but not the `pitaya` package itself (src layout),
# so make backend/src importable when it is not already installed.
_SRC = Path(__file__).resolve().parents[1] / "src"
if _SRC.is_dir() and str(_SRC) not in sys.path:
    sys.path.insert(0, str(_SRC))

from pitaya.platform.web.app import create_app  # noqa: E402

app = create_app()
