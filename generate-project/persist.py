import json
from db import upsert_spec
from logging_utils import write_artifact, append_csv

def merge_meta(spec, generated):
    # Minimal merge: status/meta/plan; leave sections for later loop
    spec = spec or {}
    spec.update({
        "schema_version": generated.get("schema_version","proj.v1"),
        "run_id": generated["run_id"],
        "chat_id": generated.get("chat_id"),
        "status": "generating",
        "meta": generated.get("meta",{}),
        "plan": generated.get("plan",{}),
        "sections": spec.get("sections",{})
    })
    spec.setdefault("logs", {"csv_url": None, "events_replayable": False})
    return spec

def persist_sections(project_id, spec, generated, emit):
    plan = generated.get("plan", {})
    sections = generated.get("sections", {})
    for s in plan.get("sections", []):
        sec_id = s["id"]
        emit("section_started", {"section_id": sec_id, "name": s.get("name")})
        # merge this section
        spec["sections"][sec_id] = sections.get(sec_id, {})
        upsert_spec(project_id, spec)
        emit("section_completed", {"section_id": sec_id})
    # finalize
    spec["status"] = "complete"
    upsert_spec(project_id, spec)
    return spec