# generate-project v3 (Phase 1 foundation)

Minimal FastAPI + LangGraph microservice implementing Phase 1.1 from `generate-projectv3/phase1.md`:
- Orchestrator scaffold with Narrative node and stubs for Steps/Data
- SSE event streaming with simple event types
- In-memory run registry and event bus

## Endpoints
- `POST /start` → starts a run; body may include `project_id`, `seed{}`, `flags{steps_enabled,data_enabled}`, `start_from`, `stop_after`.
- `GET /events/stream?run_id=...` → server-sent events stream.
- `GET /status/<run_id>` → run metadata/status.
- `GET /health` → health check.

## Run locally
```bash
cd generate-projectv3
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# Dev server (reload)
uvicorn app:app --host 0.0.0.0 --port 8080 --reload
```

Then:
```bash
curl -X POST http://localhost:8080/start \
  -H 'Content-Type: application/json' \
  -d '{"project_id":"proj_1","seed":{"title":"Water Duct"}}'
```
Stream events in another terminal:
```bash
curl -N http://localhost:8080/events/stream?run_id=<RUN_ID>
```
