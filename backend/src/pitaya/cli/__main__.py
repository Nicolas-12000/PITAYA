import argparse
import sys
from pathlib import Path

from pitaya.cli.download import download_facebook_ads_csv, print_download_help
from pitaya.kernel.config import get_settings
from pitaya.kernel.paths import raw_dataset_path
from pitaya.kernel.hashing import sha256_file
from pitaya.modules.catalog.api import dataset_content_hash, load_dataset_from_path
from pitaya.modules.catalog.domain import add_conversion_target, summarize_dataset
from pitaya.modules.modeling.api import run_offline_training
from pitaya.platform.storage.snapshot import (
    ads_csv_path,
    load_snapshot_dataframe,
    write_compressed_snapshot,
)


def _default_source_csv() -> Path:
    return raw_dataset_path()


def cmd_ingest(args: argparse.Namespace) -> int:
    settings = get_settings()
    source = Path(args.source) if args.source else _default_source_csv()
    snapshot_dir = settings.resolved_snapshot_dir()

    if not source.exists():
        print(f"[ingest] Source not found: {source}", file=sys.stderr)
        print_download_help()
        print(
            "Or: python -m pitaya.cli ingest --source /path/to/file.csv",
            file=sys.stderr,
        )
        return 1

    df = load_dataset_from_path(source)
    summary = summarize_dataset(df)
    snapshot_dir.mkdir(parents=True, exist_ok=True)
    if snapshot_dir == settings.resolved_snapshot_dir():
        csv_dest = ads_csv_path()
    else:
        csv_dest = snapshot_dir / "ads.csv"
    csv_dest.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(csv_dest, index=False)
    gz_path = write_compressed_snapshot(csv_dest)
    content_hash = sha256_file(gz_path)

    print("[ingest] OK")
    print(
        f"  rows={summary.row_count} cols={summary.column_count} "
        f"converted_rate={summary.converted_rate:.4f}"
    )
    print(f"  snapshot={gz_path}")
    print(f"  dataset_hash={content_hash}")
    return 0


def cmd_train(args: argparse.Namespace) -> int:
    settings = get_settings()
    snapshot_dir = settings.resolved_snapshot_dir()
    try:
        raw = load_snapshot_dataframe()
    except Exception as exc:
        print(f"[train] Cannot load snapshot: {exc}", file=sys.stderr)
        return 1

    df = add_conversion_target(raw)
    gz = snapshot_dir / "ads.csv.gz"
    csv = snapshot_dir / "ads.csv"
    if gz.exists():
        dataset_hash = sha256_file(gz)
    elif csv.exists():
        dataset_hash = dataset_content_hash(csv)
    else:
        dataset_hash = "unknown"

    manifest = run_offline_training(df, snapshot_dir, dataset_hash)
    print("[train] OK")
    print(f"  models trained: {len(manifest.get('models', []))}")
    print(f"  manifest={snapshot_dir / 'manifest.json'}")
    return 0


def cmd_download(_args: argparse.Namespace) -> int:
    try:
        dest = download_facebook_ads_csv()
    except RuntimeError as exc:
        print(f"[download] {exc}", file=sys.stderr)
        print_download_help()
        return 1
    except Exception as exc:
        print(f"[download] Failed: {exc}", file=sys.stderr)
        print_download_help()
        return 1
    print(f"[download] OK -> {dest}")
    return 0


def cmd_verify_idempotent(_args: argparse.Namespace) -> int:
    settings = get_settings()
    snapshot_dir = settings.resolved_snapshot_dir()
    gz = snapshot_dir / "ads.csv.gz"
    if not gz.exists():
        print("[verify_idempotent] No ads.csv.gz — run make ingest first", file=sys.stderr)
        return 1
    h1 = sha256_file(gz)
    h2 = sha256_file(gz)
    if h1 != h2:
        print("[verify_idempotent] FAIL hash mismatch", file=sys.stderr)
        return 1
    print(f"[verify_idempotent] OK dataset_hash={h1}")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="pitaya.cli",
        description="PITAYA offline CRISP-DM commands",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    p_download = sub.add_parser("download", help="Fetch Kaggle CSV via kagglehub")
    p_download.set_defaults(func=cmd_download)

    p_ingest = sub.add_parser("ingest", help="Validate CSV and write snapshot")
    p_ingest.add_argument("--source", type=str, default=None)
    p_ingest.set_defaults(func=cmd_ingest)

    p_train = sub.add_parser("train", help="Train sklearn pipelines into snapshot/models")
    p_train.set_defaults(func=cmd_train)

    p_verify = sub.add_parser("verify_idempotent", help="Check snapshot hash stability")
    p_verify.set_defaults(func=cmd_verify_idempotent)

    args = parser.parse_args(argv)
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
