import pandas as pd

from pitaya.modules.catalog.quality import clean_facebook_ads_dataframe


def test_drops_misaligned_kaggle_row() -> None:
    row_ok = {
        "ad_id": 1,
        "xyz_campaign_id": 916,
        "fb_campaign_id": 1,
        "age": "30-34",
        "gender": "male",
        "interest": 15,
        "Impressions": 100,
        "Clicks": 5,
        "Spent": 2.0,
        "Total_Conversion": 2,
        "Approved_Conversion": 1,
    }
    row_bad = {
        "ad_id": 2,
        "xyz_campaign_id": "45-49",
        "fb_campaign_id": 1,
        "age": "10",
        "gender": "14",
        "interest": 15,
        "Impressions": 100,
        "Clicks": 5,
        "Spent": 2.0,
        "Total_Conversion": float("nan"),
        "Approved_Conversion": float("nan"),
    }
    df = pd.DataFrame([row_ok, row_bad])
    cleaned, report = clean_facebook_ads_dataframe(df)
    assert len(cleaned) == 1
    assert report.drop_reasons.get("invalid_campaign_id", 0) >= 1
