from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Any, Dict, Callable

try:
    from langgraph.graph import StateGraph, END
except Exception:  # pragma: no cover - allow running without langgraph installed
    StateGraph = None  # type: ignore
    END = "END"  # type: ignore


@dataclass
class OrchestratorControls:
    start_from: str | None = None
    stop_after: str | None = None

    def model_dump(self) -> Dict[str, Any]:
        return asdict(self)


def build_orchestrator_app(event_bus) -> Any:
    """Create a minimal LangGraph app for Phase 1 foundation.

    Nodes are stubs that only emit "thought" status messages and a placeholder
    artifact for the Narrative phase. Steps/Data nodes are no-ops until flags
    are enabled in later phases.
    """

    def on_enter(run_state: Dict[str, Any]) -> Dict[str, Any]:
        # Emit quick thought to satisfy UX requirement: first thought within ~2s
        event_bus.publish(run_state["run_id"], "thought", {"text": "Starting generation…"})
        event_bus.publish(run_state["run_id"], "phase_transition", {"phase": "Narrative"})
        return run_state

    def narrative_node(run_state: Dict[str, Any]) -> Dict[str, Any]:
        run_id = run_state["run_id"]
        seed = run_state.get("seed") or {}
        event_bus.publish(run_id, "thought", {"text": "Drafting scenario and roles…"})

        # Placeholder artifact (schema kept intentionally simple for Phase 1.1)
        artifact = {
            "world": {
                "title": seed.get("title") or seed.get("topic") or "Untitled Project",
                "duration_min": seed.get("duration_min") or 30,
            },
            "teacher_objective": "Review and refine the objective for clarity.",
            "roles": [
                {"id": "teacher", "name": "Teacher", "objective": "Guide students"},
                {"id": "seat_1", "name": "Student 1", "objective": "Contribute analysis"},
                {"id": "seat_2", "name": "Student 2", "objective": "Contribute analysis"},
            ],
        }

        run_state.setdefault("bundle", {})["narrative"] = artifact
        event_bus.publish(run_id, "artifact_narrative", artifact)
        return run_state

    def maybe_steps_node(run_state: Dict[str, Any]) -> Dict[str, Any]:
        # Intentionally a no-op in Phase 1.1; reserved for Phase 1 Steps flag
        return run_state

    def maybe_data_node(run_state: Dict[str, Any]) -> Dict[str, Any]:
        # Intentionally a no-op in Phase 1.1; reserved for Phase 1 Data flag
        return run_state

    if StateGraph is None:
        # Fallback orchestrator with a simple call protocol
        class _Fallback:
            def invoke(self, state):
                state = on_enter(state)
                state = narrative_node(state)
                state = maybe_steps_node(state)
                state = maybe_data_node(state)
                return state

        return _Fallback()
    else:
        graph = StateGraph(dict)
        graph.add_node("enter", on_enter)
        graph.add_node("narrative", narrative_node)
        graph.add_node("steps", maybe_steps_node)
        graph.add_node("data", maybe_data_node)

        graph.set_entry_point("enter")
        graph.add_edge("enter", "narrative")
        graph.add_edge("narrative", "steps")
        graph.add_edge("steps", "data")
        graph.add_edge("data", END)

        return graph.compile()


