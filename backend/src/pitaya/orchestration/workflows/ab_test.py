from pitaya.modules.experiments import api as experiments_api
from pitaya.orchestration.workflows.dataset import load_prepared_dataset


def ab_test_workflow(campaign_ids: list[int] | None = None) -> dict[str, object]:
    df = load_prepared_dataset()
    ids = tuple(campaign_ids) if campaign_ids else experiments_api.DEFAULT_CAMPAIGNS
    return experiments_api.run_pairwise_ab_analysis(df, campaign_ids=ids)
