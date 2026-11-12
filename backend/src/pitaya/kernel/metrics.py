"""Classification metrics helpers for offline evaluation."""

from dataclasses import dataclass

import numpy as np
from sklearn.metrics import (
    average_precision_score,
    brier_score_loss,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)


@dataclass(frozen=True)
class BinaryClassificationMetrics:
    roc_auc: float | None
    pr_auc: float | None
    f1: float
    precision: float
    recall: float
    brier: float | None


def compute_binary_metrics(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    threshold: float = 0.5,
) -> BinaryClassificationMetrics:
    y_pred = (y_prob >= threshold).astype(int)
    unique = np.unique(y_true)
    roc = roc_auc_score(y_true, y_prob) if len(unique) > 1 else None
    pr = average_precision_score(y_true, y_prob) if len(unique) > 1 else None
    brier = brier_score_loss(y_true, y_prob) if len(unique) > 1 else None
    return BinaryClassificationMetrics(
        roc_auc=roc,
        pr_auc=pr,
        f1=float(f1_score(y_true, y_pred, zero_division=0)),
        precision=float(precision_score(y_true, y_pred, zero_division=0)),
        recall=float(recall_score(y_true, y_pred, zero_division=0)),
        brier=brier,
    )
