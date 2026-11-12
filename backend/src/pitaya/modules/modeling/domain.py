from dataclasses import dataclass
from enum import StrEnum


class ModelKind(StrEnum):
    DUMMY = "dummy"
    LOGISTIC_REGRESSION = "logistic_regression"
    KNN = "knn"
    RANDOM_FOREST = "random_forest"
    ADABOOST = "adaboost"


class FeatureScenario(StrEnum):
    PRELAUNCH = "prelaunch"
    INFLIGHT = "inflight"


@dataclass(frozen=True)
class TrainedModelRecord:
    kind: ModelKind
    scenario: FeatureScenario
    artifact_name: str
    metrics: dict[str, float | None]
