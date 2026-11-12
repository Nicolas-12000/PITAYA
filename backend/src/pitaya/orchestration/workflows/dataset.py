import pandas as pd

from pitaya.modules.catalog.domain import add_conversion_target, validate_schema
from pitaya.platform.storage.snapshot import load_snapshot_dataframe


def load_prepared_dataset() -> pd.DataFrame:
    raw = load_snapshot_dataframe()
    validate_schema(raw)
    return add_conversion_target(raw)
