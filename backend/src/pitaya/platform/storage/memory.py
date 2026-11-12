from dataclasses import dataclass, field
from typing import Any


@dataclass
class MemoryStore:
    """Process-local key-value store (non-durable)."""

    _data: dict[str, Any] = field(default_factory=dict)

    def get(self, key: str) -> Any | None:
        return self._data.get(key)

    def put(self, key: str, value: Any) -> None:
        self._data[key] = value

    def delete(self, key: str) -> None:
        self._data.pop(key, None)

    @property
    def size(self) -> int:
        return len(self._data)
