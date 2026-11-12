import hashlib
from pathlib import Path

import numpy as np
import pandas as pd


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path, chunk_size: int = 1 << 20) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(chunk_size):
            digest.update(chunk)
    return digest.hexdigest()


def stable_test_mask(ad_ids: pd.Series) -> np.ndarray:
    """Boolean mask: True = test partition (stable hash of ad_id)."""
    from pitaya.kernel.config import TEST_FOLD_MODULO, TEST_FOLD_MODULO_THRESHOLD

    hashed = ad_ids.astype(str).map(lambda x: int(hashlib.sha256(x.encode()).hexdigest(), 16))
    return (hashed % TEST_FOLD_MODULO < TEST_FOLD_MODULO_THRESHOLD).to_numpy()
