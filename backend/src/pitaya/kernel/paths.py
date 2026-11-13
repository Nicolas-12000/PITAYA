from pathlib import Path

KAGGLE_DATASET_SLUG = "madislemsalu/facebook-ad-campaign"
RAW_CSV_NAME = "facebook-ad-campaign.csv"


def repository_root() -> Path:
    """Monorepo root (parent of backend/)."""
    return Path(__file__).resolve().parents[4]


def raw_dataset_path() -> Path:
    return repository_root() / "data" / "raw" / RAW_CSV_NAME
