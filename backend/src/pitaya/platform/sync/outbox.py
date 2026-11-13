from dataclasses import dataclass, field
from typing import Any


@dataclass
class Outbox:
    pending: list[dict[str, Any]] = field(default_factory=list)

    def add(self, item: dict[str, Any]) -> None:
        self.pending.append(item)

    def flush(self) -> list[dict[str, Any]]:
        flushed = list(self.pending)
        self.pending.clear()
        return flushed
