from pitaya.modules.attribution import api as attribution_api
from pitaya.orchestration.workflows.dataset import load_prepared_dataset


def attribution_workflow(model: str) -> dict[str, object]:
    return attribution_api.compute_attribution(load_prepared_dataset(), model=model)
