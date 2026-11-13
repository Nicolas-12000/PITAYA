"""Marginal budget allocation with Beta-Binomial shrinkage."""

from dataclasses import dataclass
from typing import Any

import pandas as pd

from pitaya.kernel.stats import beta_binomial_mean

MIN_OBSERVATIONS = 5


@dataclass(frozen=True)
class SegmentPrior:
    key: str
    campaign: object
    age: str
    gender: str
    interest: object
    clicks: float
    approved: float
    spent: float
    shrunk_cvr: float


def build_segment_priors(df: pd.DataFrame) -> list[SegmentPrior]:
    group_cols = ["xyz_campaign_id", "age", "gender", "interest"]
    priors: list[SegmentPrior] = []
    for keys, group in df.groupby(group_cols, dropna=False):
        if len(group) < MIN_OBSERVATIONS:
            continue
        if not isinstance(keys, tuple):
            keys = (keys,)
        clicks = float(group["Clicks"].sum())
        approved = float(group["Approved_Conversion"].sum())
        spent = float(group["Spent"].sum())
        shrunk = beta_binomial_mean(approved, clicks)
        key = "|".join(str(k) for k in keys)
        priors.append(
            SegmentPrior(
                key=key,
                campaign=keys[0],
                age=str(keys[1]),
                gender=str(keys[2]),
                interest=keys[3],
                clicks=clicks,
                approved=approved,
                spent=spent,
                shrunk_cvr=shrunk,
            )
        )
    return priors


def marginal_response(spend: float, scale: float, elasticity: float) -> float:
    """Concave response: conversions = scale * spend^elasticity, elasticity < 1."""
    return float(scale * (max(spend, 0.0) ** elasticity))


def allocate_budget(
    segments: list[SegmentPrior],
    total_budget: float,
    value_per_conversion: float,
    min_share: float = 0.0,
    max_share: float = 1.0,
    steps: int = 200,
) -> dict[str, Any]:
    if not segments or total_budget <= 0:
        return {
            "disclaimer": "observational_recommendation",
            "total_budget": total_budget,
            "expected_conversions": 0.0,
            "expected_revenue": 0.0,
            "uncertainty_note": "insufficient_segment_observations",
            "allocations": [],
        }

    elasticity = 0.65
    current = {s.key: total_budget / len(segments) for s in segments}
    min_budget = total_budget * min_share
    max_budget = total_budget * max_share

    for _ in range(steps):
        best_key = None
        best_delta = 0.0
        step = total_budget / steps
        for seg in segments:
            scale = max(seg.shrunk_cvr, 1e-6) * 10
            current_spend = current[seg.key]
            if current_spend - step < min_budget:
                continue
            marginal = marginal_response(
                current_spend + step, scale, elasticity
            ) - marginal_response(current_spend, scale, elasticity)
            roi_delta = marginal * value_per_conversion - step
            if roi_delta > best_delta:
                best_delta = roi_delta
                best_key = seg.key
        if best_key is None or best_delta <= 0:
            break
        donor = max(current.keys(), key=lambda k: current[k])
        if current[donor] - step >= min_budget:
            current[donor] -= step
            current[best_key] = min(current[best_key] + step, max_budget)

    allocations: list[dict[str, Any]] = []
    total_conv = 0.0
    for seg in segments:
        scale = max(seg.shrunk_cvr, 1e-6) * 10
        spend = current[seg.key]
        expected_conv = marginal_response(spend, scale, elasticity)
        total_conv += expected_conv
        allocations.append(
            {
                "segment_key": seg.key,
                "campaign": seg.campaign,
                "age": seg.age,
                "gender": seg.gender,
                "interest": seg.interest,
                "recommended_spend": spend,
                "share_of_budget": spend / total_budget,
                "shrunk_cvr": seg.shrunk_cvr,
                "expected_conversions": expected_conv,
                "expected_revenue": expected_conv * value_per_conversion,
            }
        )
    return {
        "disclaimer": "observational_recommendation",
        "total_budget": total_budget,
        "expected_conversions": total_conv,
        "expected_revenue": total_conv * value_per_conversion,
        "uncertainty_note": "point_estimate_from_shrunk_cvr_and_concave_spend_curve",
        "allocations": sorted(allocations, key=lambda x: x["recommended_spend"], reverse=True),
    }
