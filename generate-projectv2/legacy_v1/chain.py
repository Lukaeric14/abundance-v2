import time, uuid, json
from langchain_openai import ChatOpenAI
from langchain.schema import SystemMessage, HumanMessage
from config import OPENAI_API_KEY, OPENAI_MODEL

SYSTEM = """You are a curriculum designer for Grades 6–8 Math in the UAE.
Return STRICT JSON ONLY matching the provided schema. No prose, no code fences.
Respect: group size 2–4, duration, age-appropriateness, simple materials, quantifiable success_criteria per section.
If constraints cannot be met, return {"error":{"code":"CONSTRAINT","message":"..."}}.

REQUIRED EXACT SCHEMA:
{
  "schema_version": "proj.v1",
  "run_id": "uuid",
  "chat_id": "string", 
  "status": "generating",
  "meta": {
    "grade_band": "6-8",
    "topic": "string",
    "life_skill": "string", 
    "group_size": 2-4,
    "duration_min": 15-60,
    "owner_email": "string",
    "uae_context": true
  },
  "plan": {
    "blocklist_ok": true,
    "sections": [{
      "id": "sec_01", 
      "name": "string",
      "math_objective": "specific learning objective",
      "constraints": {"time_min": number, "materials": ["item1", "item2"]},
      "success_criteria": [{"metric": "string", "target_op": ">=" | "<=", "target_value": number}],
      "roles": ["teacher", "shared", "seat_1", "seat_2"]
    }]
  },
  "sections": {
    "sec_01": {
      "teacher": {
        "objective": "What the teacher needs to accomplish",
        "steps": [
          {"stage_title": "Phase Name (Xmins)", "stage_text": "Detailed description of what to do in this phase"},
          {"stage_title": "Phase Name (Xmins)", "stage_text": "Detailed description of what to do in this phase"}
        ],
        "data": {}
      },
      "shared": {
        "objective": "What the group needs to accomplish together", 
        "steps": ["Step 1", "Step 2"],
        "data": {}
      },
      "seats": {
        "1": {
          "objective": "What student 1 specifically needs to do",
          "steps": ["Step 1", "Step 2"], 
          "data": {}
        },
        "2": {
          "objective": "What student 2 specifically needs to do",
          "steps": ["Step 1", "Step 2"],
          "data": {}
        }
      }
    }
  },
  "validator": null,
  "logs": {"csv_url": null, "events_replayable": false}
}

CRITICAL: Each section MUST have teacher.objective, teacher.steps, shared.objective, shared.steps, and seats.1.objective, seats.1.steps, seats.2.objective, seats.2.steps fields. Use specific instructional content for UAE Grade 6-8 math.
"""

def generate_project(topic, life_skill, grade_band, group_size, duration_min, owner_email, chat_id):
    llm = ChatOpenAI(
        api_key=OPENAI_API_KEY, 
        model=OPENAI_MODEL,
        temperature=1.0
    )
    run_id = str(uuid.uuid4())
    user = {
        "topic": topic, "life_skill": life_skill, "grade_band": grade_band,
        "group_size": group_size, "duration_min": duration_min,
        "owner_email": owner_email, "chat_id": chat_id, "run_id": run_id
    }
    msgs = [
        SystemMessage(content=SYSTEM),
        HumanMessage(content=json.dumps(user))
    ]
    start = time.time()
    resp = llm.invoke(msgs)
    elapsed = time.time() - start

    # Parse JSON (strict)
    try:
        data = json.loads(resp.content)
        if "error" in data:
            return run_id, data, elapsed
    except Exception as e:
        data = {"error": {"code":"PARSE","message": str(e)}}

    # Ensure required top-levels exist
    if "schema_version" not in data:
        data["schema_version"] = "proj.v1"
    data["run_id"] = run_id
    data["status"] = "generating"
    data.setdefault("logs", {"csv_url": None, "events_replayable": False})
    return run_id, data, elapsed