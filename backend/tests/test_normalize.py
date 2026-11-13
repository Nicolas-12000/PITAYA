import pandas as pd

from pitaya.modules.catalog.domain import validate_schema
from pitaya.modules.catalog.normalize import normalize_facebook_ads_dataframe


def test_normalize_kaggle_header_names() -> None:
    raw = pd.DataFrame(
        {
            "ad_id": [1],
            "campaign_id": [916],
            "fb_campaign_id": [100],
            "age": ["30-34"],
            "gender": ["M"],
            "interest1": [15],
            "interest2": [17],
            "interest3": [17],
            "impressions": [100],
            "clicks": [2],
            "spent": [1.5],
            "total_conversion": [2],
            "approved_conversion": [1],
        }
    )
    out = normalize_facebook_ads_dataframe(raw)
    validate_schema(out)
    assert out["xyz_campaign_id"].iloc[0] == 916
    assert out["gender"].iloc[0] == "male"
    assert out["interest"].iloc[0] == 15
