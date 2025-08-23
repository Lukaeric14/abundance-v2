from __future__ import annotations

import json
import threading
import time
from typing import Dict, Any, Generator, Tuple

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

from event_bus import EventBus
from run_registry import RunRegistry
from orchestrator import build_orchestrator_app, OrchestratorControls, OrchestratorState
from run_repository import RunsRepository


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Singleton in-memory infra for Phase 1
event_bus = EventBus()
run_registry = RunRegistry()
# Idempotency map to mirror v2 semantics: (project_id, chat_id) -> run_id
KEY_TO_RUN: Dict[Tuple[str, str], str] = {}
db_runs = RunsRepository()


def _sse_format(event_type: str, payload: Dict[str, Any]) -> str:
    return f"event: {event_type}\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"


@app.get("/health")
def health() -> Dict[str, Any]:
    return {"ok": True, "service": "generate-projectv3", "time": time.time()}


@app.post("/start")
async def start_generation(request: Request) -> JSONResponse:
    body: Dict[str, Any] = (await request.json()) if request.headers.get("content-type", "").startswith("application/json") else {}

    # Align request with v2 frontend payload: expects project_id, chat_id, topic,
    # optional life_skill, group_size, duration_min, owner_email
    project_id = str(body.get("project_id") or "").strip()
    chat_id = str(body.get("chat_id") or "").strip()
    if not project_id or not chat_id:
        raise HTTPException(status_code=400, detail="Missing project_id or chat_id")

    key = (project_id, chat_id)
    if key in KEY_TO_RUN:
        return JSONResponse({"run_id": KEY_TO_RUN[key]})

    seed = {
        "title": body.get("title"),
        "topic": body.get("topic"),
        "life_skill": body.get("life_skill"),
        "group_size": body.get("group_size"),
        "duration_min": body.get("duration_min"),
        "owner_email": body.get("owner_email"),
    }

    flags = body.get("flags") or {
        "steps_enabled": bool(body.get("steps_enabled", False)),
        "data_enabled": bool(body.get("data_enabled", False)),
    }

    controls = OrchestratorControls(
        start_from=str(body.get("start_from")) if body.get("start_from") else None,
        stop_after=str(body.get("stop_after")) if body.get("stop_after") else None,
    )

    suggested = body.get("run_id")
    run_id = str(suggested or f"run_{project_id}_{chat_id}")
    KEY_TO_RUN[key] = run_id
    run_registry.create(run_id=run_id, project_id=project_id, seed=seed, flags=flags, controls=controls)
    db_runs.create(run_id, project_id)
    event_bus.create_stream(run_id)

    # Build the orchestrator (LangGraph app) and run in background
    orchestrator_app = build_orchestrator_app(event_bus)

    def _runner():
        try:
            run_registry.mark_started(run_id)
            db_runs.mark_started(run_id)

            state = OrchestratorState(
                run_id=run_id,
                project_id=project_id,
                chat_id=chat_id,
                seed=seed,
                bundle={},
                thoughts=[],
                flags=flags,
                controls=controls.model_dump(),
            )
            orchestrator_app.invoke(state.to_dict(), {"configurable": {"thread_id": run_id}})
            run_registry.mark_completed(run_id)
            db_runs.mark_completed(run_id)
        except Exception as e:
            event_bus.publish(run_id, "error", {"message": str(e)})
            run_registry.mark_error(run_id, str(e))
            db_runs.mark_error(run_id, str(e))

        # Close the stream with a completion event
        event_bus.publish(run_id, "run_completed", {"run_id": run_id})

    threading.Thread(target=_runner, name=f"orchestrator-{run_id}", daemon=True).start()

    # Emit a run_started event immediately
    event_bus.publish(run_id, "run_started", {"run_id": run_id, "project_id": project_id})

    return JSONResponse({"run_id": run_id}, status_code=202)


@app.get("/events/stream")
def stream_events(run_id: str) -> StreamingResponse:
    if not run_id:
        raise HTTPException(status_code=400, detail="Missing run_id")

    q = event_bus.create_stream(run_id)

    def _gen() -> Generator[bytes, None, None]:
        # Immediately send a ping to open the stream on the client
        yield _sse_format("ping", {"ts": time.time()}).encode("utf-8")
        while True:
            event = q.get()
            yield _sse_format(event["type"], event["data"]).encode("utf-8")

    return StreamingResponse(
        _gen(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/status/{run_id}")
def status(run_id: str) -> JSONResponse:
    info = run_registry.get(run_id)
    if not info:
        raise HTTPException(status_code=404, detail="unknown_run")
    return JSONResponse(info)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8080, reload=True)

