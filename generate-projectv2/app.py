import json, queue, threading
from flask import Flask, request, Response, stream_with_context, abort, jsonify
from flask_cors import CORS
import sys
import os

# Add shared infrastructure to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'shared_infrastructure'))
sys.path.append(os.path.join(os.path.dirname(__file__), '01_spec_builder_node'))

from data_structures import Seed
from spec_builder_node import SpecBuilderNode

app = Flask(__name__)
CORS(app)

# run_id -> Queue of SSE events
EVENTS = {}
# (project_id, chat_id) -> run_id
RUNS = {}

def sse_event(event_type, data):
    return f"event: {event_type}\n" + "data: " + json.dumps(data) + "\n\n"

def background_worker(project_id, payload):
    """Process spec building in background"""
    project_id = payload["project_id"]
    chat_id = payload["chat_id"]
    topic = payload["topic"]
    life_skill = payload.get("life_skill", "")
    
    q = EVENTS[RUNS[(project_id, chat_id)]]
    q.put(("run_started", {"project_id": project_id}))
    
    try:
        # Map legacy inputs to new Seed structure
        # Combine topic and life_skill for richer context
        combined_topic = f"{topic} {life_skill}".strip()
        
        # Convert group_size to grade_band (simple mapping for now)
        grade_band = "6-8"  # Default grade band, can be enhanced later
        
        # Create Seed object
        seed = Seed(
            topic=combined_topic,
            grade_band=grade_band,
            constraints={"duration_min": payload.get("duration_min", 45)}
        )
        
        q.put(("spec_building_started", {"topic": combined_topic, "grade_band": grade_band}))
        
        # Process with Spec Builder
        spec_builder = SpecBuilderNode()
        result = spec_builder.process(seed)
        
        if result.output:
            # Send spec result
            spec_data = {
                "subject": result.output.subject,
                "grade_band": result.output.grade_band,
                "skills": result.output.skills,
                "time_minutes": result.output.time_minutes,
                "guards": result.output.guards,
                "schema_version": result.output.schema_version
            }
            
            q.put(("spec_completed", {"spec": spec_data, "thoughts": result.thoughts}))
            q.put(("run_completed", {"project_id": project_id, "spec": spec_data}))
        else:
            q.put(("error", {"message": "Failed to generate spec"}))
            
    except Exception as e:
        q.put(("error", {"message": str(e)}))

@app.post("/start")
def start():
    """Legacy endpoint that accepts original frontend payload"""
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
    """Legacy SSE endpoint for streaming events"""
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

@app.route('/spec_builder', methods=['POST'])
def spec_builder_direct():
    """Direct endpoint for testing spec builder with new format"""
    try:
        data = request.get_json()
        
        # Create Seed from request
        seed = Seed(
            topic=data['topic'],
            grade_band=data['grade_band'],
            constraints=data.get('constraints', {})
        )
        
        # Process with Spec Builder
        node = SpecBuilderNode()
        result = node.process(seed)
        
        return jsonify({
            'state': result.state.value,
            'output': result.output.__dict__ if result.output else None,
            'thoughts': result.thoughts
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.get("/health")
def health():
    return {"ok": True}, 200

if __name__ == "__main__":
    app.run("0.0.0.0", 5001, threaded=True)