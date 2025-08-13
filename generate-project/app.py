import json, queue, threading
from flask import Flask, request, Response, stream_with_context, abort
from flask_cors import CORS
from config import PORT, OPENROUTER_MODEL
from db import fetch_project_spec, upsert_spec
from chain import generate_project
from persist import merge_meta, persist_sections
from logging_utils import write_artifact, append_csv

app = Flask(__name__)
CORS(app)

# run_id -> Queue of SSE events
EVENTS = {}
# (project_id, chat_id) -> run_id
RUNS = {}

def sse_event(event_type, data):
    return f"event: {event_type}\n" + "data: " + json.dumps(data) + "\n\n"

def background_worker(project_id, payload):
    project_id = payload["project_id"]
    chat_id = payload["chat_id"]
    topic = payload["topic"]
    life_skill = payload["life_skill"]
    group_size = int(payload["group_size"])
    duration_min = int(payload["duration_min"])
    owner_email = payload.get("owner_email")

    q = EVENTS[RUNS[(project_id, chat_id)]]
    q.put(("run_started", {"project_id": project_id}))

    run_id, generated, elapsed = generate_project(
        topic, life_skill, "6-8", group_size, duration_min, owner_email, chat_id
    )

    # Save artifacts & CSV
    prompt_path = write_artifact(run_id, "prompt", {"topic": topic, "life_skill": life_skill})
    out_path = write_artifact(run_id, "output", generated)
    append_csv(run_id, {
        "stage":"llm_generate","model":OPENROUTER_MODEL,"temperature":0.6,
        "prompt_tokens": None,"completion_tokens": None,"cost_est": None,
        "decision_summary": f"Generated project in {elapsed:.2f}s",
        "input_path": prompt_path,"output_path": out_path,"warning":""
    })

    if "error" in generated:
        q.put(("error", {"message": generated["error"]["message"]}))
        return

    try:
        spec = fetch_project_spec(project_id)
        merged = merge_meta(spec, generated)
        upsert_spec(project_id, merged)
        # stream/persist per section
        def emit(evt, data): q.put((evt, data))
        persist_sections(project_id, merged, generated, emit)
        q.put(("run_completed", {"project_id": project_id, "run_id": run_id}))
    except Exception as e:
        q.put(("error", {"message": str(e)}))

@app.post("/start")
def start():
    body = request.get_json(force=True)
    project_id = body["project_id"]
    chat_id = body["chat_id"]
    key = (project_id, chat_id)

    # idempotency
    if key in RUNS:
        run_id = RUNS[key]
        return {"run_id": run_id}, 200

    run_id = body.get("run_id") or f"run_{project_id}_{chat_id}"
    RUNS[key] = run_id
    EVENTS[run_id] = queue.Queue(maxsize=1000)

    t = threading.Thread(target=background_worker, args=(project_id, body), daemon=True)
    t.start()
    return {"run_id": run_id}, 202

@app.get("/events/stream")
def events_stream():
    run_id = request.args.get("run_id")
    if not run_id or run_id not in EVENTS:
        return abort(404, "Unknown run_id")

    q = EVENTS[run_id]

    @stream_with_context
    def gen():
        # keep-alive first line for some proxies
        yield ":ok\n\n"
        while True:
            evt, data = q.get()
            yield sse_event(evt, data)
            if evt in ("run_completed","error"):
                break

    return Response(gen(), mimetype="text/event-stream")

@app.get("/status/<project_id>")
def status(project_id):
    spec = fetch_project_spec(project_id)
    return spec or {}, 200

@app.get("/health")
def health():
    return {"ok": True}, 200

if __name__ == "__main__":
    app.run("0.0.0.0", PORT, threaded=True)