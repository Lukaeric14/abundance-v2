import csv, json, os, re, time
from config import CSV_LOG_DIR

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")

def redact(text: str) -> str:
    return EMAIL_RE.sub("[redacted@email]", text or "")

def run_paths(run_id):
    base = os.path.join(CSV_LOG_DIR, run_id)
    os.makedirs(base, exist_ok=True)
    return base, os.path.join(CSV_LOG_DIR, f"{run_id}.csv")

def write_artifact(run_id, name, obj):
    base, _ = run_paths(run_id)
    path = os.path.join(base, f"{name}.json")
    with open(path, "w") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
    return path

def append_csv(run_id, row: dict):
    _, csv_path = run_paths(run_id)
    exists = os.path.exists(csv_path)
    with open(csv_path, "a", newline="") as f:
        w = csv.DictWriter(f, fieldnames=[
            "timestamp","run_id","stage","model","temperature","prompt_tokens",
            "completion_tokens","cost_est","decision_summary","input_path","output_path","warning"
        ])
        if not exists: w.writeheader()
        row["timestamp"] = row.get("timestamp") or int(time.time())
        row["run_id"] = run_id
        w.writerow(row)
    return csv_path