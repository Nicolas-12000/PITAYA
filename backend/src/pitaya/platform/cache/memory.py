import time
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any, cast


@dataclass
class TtlCache:
    ttl_seconds: int
    max_items: int
    _store: dict[str, tuple[float, Any]] = field(default_factory=dict)

    def get(self, key: str) -> Any | None:
        entry = self._store.get(key)
        if entry is None:
            return None
        expires_at, value = entry
        if time.monotonic() > expires_at:
            del self._store[key]
            return None
        return value

    def set(self, key: str, value: Any) -> None:
        if len(self._store) >= self.max_items:
            oldest = min(self._store, key=lambda k: self._store[k][0])
            del self._store[oldest]
        self._store[key] = (time.monotonic() + self.ttl_seconds, value)

    @property
    def size(self) -> int:
        return len(self._store)


def remember[T](cache: TtlCache, key: str, build: Callable[[], T]) -> T:
    """Return a cached value or store the result of build()."""
    hit = cache.get(key)
    if hit is not None:
        return cast(T, hit)
    value = build()
    cache.set(key, value)
    return value
