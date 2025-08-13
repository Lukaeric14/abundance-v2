# Generate Project Microservice

A Flask-based microservice for generating educational projects using LLM chains with SSE streaming, idempotent operations, and incremental database writes.

## Features

- **Single-chain LLM generation**: One LLM call returns complete project JSON
- **SSE streaming**: Real-time progress updates via Server-Sent Events
- **Idempotent operations**: Safe to retry by (project_id, chat_id)
- **Incremental persistence**: Updates projects.spec_json section by section
- **CSV logging**: Comprehensive logging with PII redaction
- **Health monitoring**: Built-in health check endpoint

## Architecture

```
generate-project/
├── app.py                 # Flask API + SSE endpoints
├── chain.py               # Single LLM chain + schema + prompt
├── db.py                  # PostgreSQL helpers (psycopg2)
├── persist.py             # Database writes + event emission + logging
├── logging_utils.py       # CSV logger + PII redaction
├── config.py              # Environment variable parsing
├── requirements.txt       # Python dependencies
├── Dockerfile             # Container setup
└── README.md              # This file
```

## Environment Variables

Required:
- `OPENAI_API_KEY`: OpenAI API key for LLM calls
- `DATABASE_URL`: PostgreSQL connection string

Optional:
- `PORT`: Server port (default: 8080)
- `MODEL_PRIMARY`: LLM model for generation (default: gpt-5-mini)
- `CSV_LOG_DIR`: Directory for CSV logs (default: ./logs)

## API Endpoints

### POST /start

Starts project generation for a given project and chat ID.

**Request Body:**
```json
{
  "project_id": "string",
  "chat_id": "string", 
  "title": "string",
  "topic": "string",
  "life_skill": "string",
  "group_size": 3,
  "duration_min": 45,
  "owner_email": "user@example.com"
}
```

**Response:**
- `202`: `{"run_id": "uuid"}` - Generation started
- `200`: `{"run_id": "uuid"}` - Already exists (idempotent)

### GET /events/stream?run_id=<run_id>

Server-Sent Events stream for real-time progress updates.

**Events:**
- `run_started`: Generation initiated
- `section_started`: Section processing began
- `section_completed`: Section finished and persisted
- `run_completed`: All sections complete
- `error`: Generation failed

### GET /status/<project_id>

Returns current project specification from database.

**Response:**
```json
{
  "schema_version": "proj.v1",
  "run_id": "uuid",
  "status": "complete",
  "meta": {...},
  "plan": {...},
  "sections": {...}
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{"ok": true}
```

## JSON Schema

Projects are stored in the canonical v1 schema:

```json
{
  "schema_version": "proj.v1",
  "run_id": "uuid-v4",
  "chat_id": "string",
  "status": "planning|generating|validating|complete|error",
  "meta": {
    "grade_band": "6-8",
    "topic": "text",
    "life_skill": "text",
    "group_size": 3,
    "duration_min": 45,
    "owner_email": "redacted@example.com",
    "uae_context": true
  },
  "plan": {
    "blocklist_ok": true,
    "sections": [
      {
        "id": "sec_01",
        "name": "CoreTask",
        "math_objective": "text",
        "constraints": {"time_min": 30, "materials": ["paper","ruler"]},
        "success_criteria": [
          {"metric": "price_error_pct", "target_op": "<=", "target_value": 0.02}
        ],
        "roles": ["teacher","shared","seat_1","seat_2"]
      }
    ]
  },
  "sections": {
    "sec_01": {
      "teacher": {"objective": "text", "steps": ["..."], "data": {}, "extras": {}},
      "shared": {"objective": "text", "steps": ["..."], "data": {}, "extras": {}},
      "seats": {
        "1": {"objective": "text", "steps": ["..."], "data": {}, "extras": {}},
        "2": {"objective": "text", "steps": ["..."], "data": {}, "extras": {}}
      }
    }
  },
  "validator": null,
  "logs": {
    "csv_url": null,
    "events_replayable": false
  }
}
```

## Database Requirements

The service expects a PostgreSQL database with a `projects` table containing:
- `id`: Project identifier
- `spec_json`: JSONB column for project specifications  
- `updated_at`: Timestamp (automatically updated)

## Logging

The service creates comprehensive logs in CSV format:

**Log Directory Structure:**
```
logs/
├── {run_id}.csv          # Main log file
└── {run_id}/
    ├── prompt.json       # LLM input
    └── output.json       # LLM output
```

**CSV Fields:**
- timestamp, run_id, stage, model, temperature
- prompt_tokens, completion_tokens, cost_est
- decision_summary, input_path, output_path, warning

## Development Setup

1. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set Environment Variables:**
   ```bash
   export OPENAI_API_KEY="your-api-key"
   export DATABASE_URL="postgresql://user:pass@localhost/db"
   export CSV_LOG_DIR="./logs"
   ```

3. **Run Locally:**
   ```bash
   python app.py
   ```

## Docker Deployment

1. **Build Image:**
   ```bash
   docker build -t generate-project .
   ```

2. **Run Container:**
   ```bash
   docker run -p 8080:8080 \
     -e OPENAI_API_KEY="your-key" \
     -e DATABASE_URL="your-db-url" \
     -v ./logs:/app/logs \
     generate-project
   ```

## Integration with Main App

1. **Start Generation:**
   ```javascript
   const response = await fetch('/start', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({
       project_id: 'proj_123',
       chat_id: 'chat_456', 
       topic: 'Fractions',
       life_skill: 'Problem Solving',
       group_size: 3,
       duration_min: 45,
       owner_email: 'teacher@school.ae'
     })
   });
   const {run_id} = await response.json();
   ```

2. **Stream Progress:**
   ```javascript
   const eventSource = new EventSource(`/events/stream?run_id=${run_id}`);
   
   eventSource.addEventListener('section_completed', (event) => {
     const data = JSON.parse(event.data);
     console.log('Section completed:', data.section_id);
     // Refresh UI or fetch updated project status
   });
   
   eventSource.addEventListener('run_completed', (event) => {
     console.log('Project generation complete!');
     eventSource.close();
   });
   ```

3. **Get Final Result:**
   ```javascript
   const spec = await fetch(`/status/${project_id}`).then(r => r.json());
   ```

## Error Handling

The service handles errors gracefully:
- **Constraint violations**: Returns structured error in JSON
- **LLM parsing failures**: Logged and returned as parse errors
- **Database failures**: Logged and propagated via SSE error events
- **Network timeouts**: Configurable via LangChain settings

## Performance Considerations

- **Single instance**: Designed for single-container deployment
- **Memory usage**: In-memory event queues (bounded to 1000 events)
- **Concurrency**: Flask threaded mode supports multiple simultaneous requests
- **Database**: Uses FOR UPDATE locking for safe concurrent access

## Monitoring

- **Health checks**: GET /health for load balancer monitoring
- **CSV logs**: Machine-readable logs for analysis and debugging
- **SSE events**: Real-time visibility into generation progress
- **Error tracking**: Structured error reporting via logs and SSE

## Security

- **PII redaction**: Email addresses redacted in logs
- **Environment isolation**: All secrets via environment variables
- **Database safety**: Prepared statements prevent injection
- **CORS enabled**: Configurable cross-origin access