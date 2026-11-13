"""Download Kaggle dataset into data/raw/ via kagglehub + pandas."""

import sys
from pathlib import Path

from pitaya.kernel.paths import KAGGLE_DATASET_SLUG, raw_dataset_path
from pitaya.modules.catalog.normalize import KAGGLE_HUB_FILE_PATH, normalize_facebook_ads_dataframe


def load_kaggle_dataframe_pandas():
    try:
        import kagglehub
        from kagglehub import KaggleDatasetAdapter
    except ImportError as exc:
        raise RuntimeError("Install: cd backend && uv sync --extra data") from exc

    return kagglehub.load_dataset(
        KaggleDatasetAdapter.PANDAS,
        KAGGLE_DATASET_SLUG,
        KAGGLE_HUB_FILE_PATH,
    )


def download_facebook_ads_csv(dest: Path | None = None) -> Path:
    target = dest or raw_dataset_path()
    target.parent.mkdir(parents=True, exist_ok=True)

    df = load_kaggle_dataframe_pandas()
    df = normalize_facebook_ads_dataframe(df)
    df.to_csv(target, index=False)
    return target


def print_download_help() -> None:
    print(
        "Kaggle (recomendado): kagglehub + pandas, file data.csv\n"
        "  make download\n\n"
        "Alternativa:\n"
        "  kaggle datasets download -d madislemsalu/facebook-ad-campaign "
        "-p data/raw --unzip\n",
        file=sys.stderr,
    )
