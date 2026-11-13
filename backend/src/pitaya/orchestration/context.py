from dataclasses import dataclass, field

from pitaya.platform.cache.memory import TtlCache
from pitaya.platform.persistence.recommendations import RecommendationRepository
from pitaya.platform.storage.memory import MemoryStore
from pitaya.platform.sync.outbox import Outbox


@dataclass
class AppContext:
    memory_store: MemoryStore
    cache: TtlCache
    recommendations: RecommendationRepository = field(default_factory=RecommendationRepository)
    outbox: Outbox = field(default_factory=Outbox)
