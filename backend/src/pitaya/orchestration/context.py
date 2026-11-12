from dataclasses import dataclass

from pitaya.platform.cache.memory import TtlCache
from pitaya.platform.storage.memory import MemoryStore


@dataclass
class AppContext:
    memory_store: MemoryStore
    cache: TtlCache
