from __future__ import annotations

import queue
from typing import Dict, Any, Tuple


class EventBus:
    """Very small in-memory pub/sub per run_id suitable for Phase 1.

    Each run_id gets a Queue of structured events: {type, data}.
    """

    def __init__(self) -> None:
        self._streams: Dict[str, queue.Queue[Dict[str, Any]]] = {}

    def create_stream(self, run_id: str):
        if run_id not in self._streams:
            self._streams[run_id] = queue.Queue()
        return self._streams[run_id]

    def publish(self, run_id: str, event_type: str, data: Dict[str, Any]) -> None:
        q = self.create_stream(run_id)
        q.put({"type": event_type, "data": data})


