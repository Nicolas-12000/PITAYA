import pandas as pd

from pitaya.modules.catalog.domain import add_conversion_target


def test_conversion_target() -> None:
    df = pd.DataFrame({"Approved_Conversion": [0, 2, 0]})
    out = add_conversion_target(df)
    assert out["converted"].tolist() == [0, 1, 0]


def test_leakage_columns_not_in_prelaunch_features() -> None:
    from pitaya.kernel.config import PRELAUNCH_FEATURE_COLUMNS

    assert "Total_Conversion" not in PRELAUNCH_FEATURE_COLUMNS
