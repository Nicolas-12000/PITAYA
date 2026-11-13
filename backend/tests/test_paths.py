from pitaya.kernel.paths import raw_dataset_path, repository_root


def test_repository_root_contains_backend() -> None:
    root = repository_root()
    assert (root / "backend").is_dir()
    assert raw_dataset_path().parent.name == "raw"
