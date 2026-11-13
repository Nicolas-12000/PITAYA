import json

from pitaya.platform.storage.snapshot import manifest_path


def models_manifest_workflow() -> dict[str, object]:
    mp = manifest_path()
    if not mp.exists():
        return {"status": "missing", "message": "Run make train"}
    manifest = json.loads(mp.read_text(encoding="utf-8"))
    return {"status": "ok", "manifest": manifest}
