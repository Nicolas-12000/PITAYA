"""sklearn Pipelines — fit only on training data in the training CLI."""

from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import AdaBoostClassifier, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from pitaya.kernel.config import INFLIGHT_FEATURE_COLUMNS, PRELAUNCH_FEATURE_COLUMNS
from pitaya.modules.catalog.domain import drop_leakage_features
from pitaya.modules.modeling.domain import FeatureScenario, ModelKind

CATEGORICAL = ("xyz_campaign_id", "age", "gender", "interest")
NUMERIC_INFLIGHT = ("Impressions", "Clicks", "Spent")


def feature_columns_for_scenario(scenario: FeatureScenario) -> tuple[str, ...]:
    if scenario == FeatureScenario.PRELAUNCH:
        return PRELAUNCH_FEATURE_COLUMNS
    return INFLIGHT_FEATURE_COLUMNS


def build_preprocessor(feature_columns: tuple[str, ...]) -> ColumnTransformer:
    cat = [c for c in CATEGORICAL if c in feature_columns]
    num = [c for c in NUMERIC_INFLIGHT if c in feature_columns]

    transformers = []
    if cat:
        transformers.append(
            (
                "cat",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("onehot", OneHotEncoder(handle_unknown="ignore")),
                    ]
                ),
                cat,
            )
        )
    if num:
        transformers.append(
            (
                "num",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="median")),
                        ("scale", StandardScaler()),
                    ]
                ),
                num,
            )
        )
    return ColumnTransformer(transformers=transformers)


def build_estimator(kind: ModelKind, random_seed: int) -> object:
    if kind == ModelKind.DUMMY:
        return DummyClassifier(strategy="stratified", random_state=random_seed)
    if kind == ModelKind.LOGISTIC_REGRESSION:
        # Linear model (logistic) — industry baseline for binary conversion
        return LogisticRegression(
            max_iter=2000,
            random_state=random_seed,
            class_weight="balanced",
        )
    if kind == ModelKind.KNN:
        return KNeighborsClassifier(n_neighbors=15, weights="distance")
    if kind == ModelKind.RANDOM_FOREST:
        return RandomForestClassifier(
            n_estimators=100,
            max_depth=8,
            random_state=random_seed,
            class_weight="balanced_subsample",
            n_jobs=-1,
        )
    if kind == ModelKind.ADABOOST:
        return AdaBoostClassifier(n_estimators=100, random_state=random_seed)
    raise ValueError(f"Unknown model kind: {kind}")


def build_training_pipeline(
    kind: ModelKind,
    scenario: FeatureScenario,
    random_seed: int,
) -> Pipeline:
    features = drop_leakage_features(list(feature_columns_for_scenario(scenario)))
    preprocessor = build_preprocessor(tuple(features))
    estimator = build_estimator(kind, random_seed)
    return Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", estimator),
        ]
    )
