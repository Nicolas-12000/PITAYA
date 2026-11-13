from pathlib import Path

from pitaya.kernel.paths import repository_root


def resolve_sqlite_path(database_url: str) -> Path | None:
    url = database_url.strip()
    if not url.startswith("sqlite:///"):
        return None
    rel = url.removeprefix("sqlite:///")
    path = Path(rel)
    if not path.is_absolute():
        path = (repository_root() / rel).resolve()
    return path
