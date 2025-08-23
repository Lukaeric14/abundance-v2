from __future__ import annotations

import time
from typing import Dict, Any


class RunRegistry:
    """In-memory run tracking for Phase 1.1.

    Stores basic metadata and status for each run.
    """

    def __init__(self) -> None:
        self._runs: Dict[str, Dict[str, Any]] = {}

    def create(self, run_id: str, project_id: str | None, seed: Dict[str, Any], flags: Dict[str, Any], controls: Any) -> None:
        self._runs[run_id] = {
            "run_id": run_id,
            "project_id": project_id,
            "seed": seed,
            "flags": flags,
            "controls": getattr(controls, "model_dump", lambda: controls)(),
            "status": "queued",
            "started_at": None,
            "completed_at": None,
            "error": None,
        }

    def mark_started(self, run_id: str) -> None:
        if run_id in self._runs:
            self._runs[run_id]["status"] = "running"
            self._runs[run_id]["started_at"] = time.time()

    def mark_completed(self, run_id: str) -> None:
        if run_id in self._runs:
            self._runs[run_id]["status"] = "complete"
            self._runs[run_id]["completed_at"] = time.time()

    def mark_error(self, run_id: str, message: str) -> None:
        if run_id in self._runs:
            self._runs[run_id]["status"] = "error"
            self._runs[run_id]["error"] = message
            self._runs[run_id]["completed_at"] = time.time()

    def get(self, run_id: str) -> Dict[str, Any] | None:
        return self._runs.get(run_id)


