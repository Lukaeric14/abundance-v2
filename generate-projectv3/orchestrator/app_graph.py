from __future__ import annotations

from typing import Any, Dict

from .models import OrchestratorControls

try:
    from langgraph.graph import StateGraph, END
    from langgraph.checkpoint.memory import MemorySaver
except Exception:  # pragma: no cover
    StateGraph = None  # type: ignore
    END = "END"  # type: ignore
    MemorySaver = None  # type: ignore


def build_orchestrator_app(event_bus) -> Any:
    """Create a LangGraph app with MemorySaver when available.

    Emits narrative artifact and supports future steps/data nodes.
    """

    def on_enter(run_state: Dict[str, Any]) -> Dict[str, Any]:
        event_bus.publish(run_state["run_id"], "thought", {"text": "Starting generation…"})
        event_bus.publish(run_state["run_id"], "phase_transition", {"phase": "Narrative"})
        return run_state

    def narrative_node(run_state: Dict[str, Any]) -> Dict[str, Any]:
        run_id = run_state["run_id"]
        seed = run_state.get("seed") or {}
        event_bus.publish(run_id, "thought", {"text": "Drafting scenario and roles…"})

        artifact = {
            "world": {
                "title": seed.get("title") or seed.get("topic") or "Untitled Project",
                "summary": "",
                "constraints": {"durationMin": seed.get("duration_min") or 30},
            },
            "teacherObjective": {"text": "Review and refine the objective for clarity."},
            "roles": [
                {"id": "teacher", "title": "Teacher", "objective": "Guide students"},
                {"id": "seat_1", "title": "Student 1", "objective": "Contribute analysis"},
                {"id": "seat_2", "title": "Student 2", "objective": "Contribute analysis"},
            ],
        }

        run_state.setdefault("bundle", {})["narrative"] = artifact
        event_bus.publish(run_id, "artifact_narrative", artifact)
        return run_state

    def maybe_steps_node(run_state: Dict[str, Any]) -> Dict[str, Any]:
        return run_state

    def maybe_data_node(run_state: Dict[str, Any]) -> Dict[str, Any]:
        return run_state

    if StateGraph is None:
        class _Fallback:
            def invoke(self, state):
                state = on_enter(state)
                state = narrative_node(state)
                state = maybe_steps_node(state)
                state = maybe_data_node(state)
                return state

        return _Fallback()

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

    checkpointer = MemorySaver() if MemorySaver is not None else None
    return graph.compile(checkpointer=checkpointer) if checkpointer else graph.compile()


