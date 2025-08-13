### Project Generator Contract (for Flask `contract.py`)

- Purpose: Convert chat-derived fields into a fully structured project with seat-based sections and store them via Supabase RPC/SQL.

### Inputs
- project meta
  - title: string
  - topic: string
  - life_skill: string
  - group_size: int (2–4)
  - duration_min: int (20–90)
- participants
  - teacher seat: always 0
  - students: seat 1..group_size
- content policy
  - section types: objective, steps, data
  - scope model: seat_number
    - 0 = teacher-only
    - null = student-shared
    - N>0 = student-specific

### Flask endpoint
- POST /generate
- Request body (JSON):
```json
{
  "owner_email": "teacher@example.com",
  "title": "Real Estate Case Challenge",
  "topic": "Numbers",
  "life_skill": "Problem Solving",
  "group_size": 2,
  "duration_min": 30,
  "inputs": {
    "chat_summary": "topic, group size, life skill, and constraints",
    "preferences": {
      "tone": "concise",
      "level": "grade-5"
    }
  }
}
```

### Output contract
- Response JSON:
```json
{
  "project": {
    "id": "uuid",                       // created project id
    "title": "Real Estate Case Challenge",
    "topic": "Numbers",
    "life_skill": "Problem Solving",
    "group_size": 2,
    "duration_min": 30
  },
  "participants": [
    { "seat_number": 0, "role": "teacher" },
    { "seat_number": 1, "role": "student" },
    { "seat_number": 2, "role": "student" }
  ],
  "sections": [
    { "section_type": "objective", "seat_number": 0, "content_text": "Teacher notes..." },
    { "section_type": "steps",     "seat_number": 0, "content_text": "- Warm-up\n- Guide\n- Debrief" },

    { "section_type": "objective", "seat_number": null, "content_text": "Group objective..." },
    { "section_type": "steps",     "seat_number": null, "content_text": "- Step 1\n- Step 2" },
    { "section_type": "data",      "seat_number": null, "content_text": "Shared dataset..." },

    { "section_type": "objective", "seat_number": 1, "content_text": "Student 1 objective..." },
    { "section_type": "steps",     "seat_number": 1, "content_text": "- S1 step A\n- S1 step B" },
    { "section_type": "data",      "seat_number": 1, "content_text": "S1 data..." },

    { "section_type": "objective", "seat_number": 2, "content_text": "Student 2 objective..." },
    { "section_type": "steps",     "seat_number": 2, "content_text": "- S2 step A\n- S2 step B" },
    { "section_type": "data",      "seat_number": 2, "content_text": "S2 data..." }
  ]
}
```

### Persistence requirements (Supabase)
- Insert `projects` row; return `id`.
- Participants:
  - Insert into `participants`:
    - one teacher row: `{ project_id, role: 'teacher', seat_number: 0 }`
    - N student rows: `{ project_id, role: 'student', seat_number: i }` for i in 1..group_size
- Sections:
  - Insert into `sections` (bulk insert allowed):
    - `project_id`, `section_type` in ['objective','steps','data']
    - `seat_number` as per policy above
    - `content_text` as generated
    - `order_index` default 0 unless multiple rows per section_type are emitted

Note: Do not use `participant_id` in this prototype. The UI reads by `seat_number`.

### Minimal algorithm
1. Validate fields: title, topic, life_skill, group_size (2–4), duration_min (20–90).
2. Create project in `projects`.
3. Upsert participants (teacher seat 0, students 1..group_size).
4. Generate content (LLM or rules) for:
   - Teacher seat 0: objective, steps, data (optional)
   - Student shared (seat_number null): objective, steps, data
   - Each student seat i: objective, steps, data (optional overrides)
5. Bulk insert `sections`.
6. Return the response (project, participants, sections).

### Idempotency
- If called with an existing `project_id`, allow overwrite by:
  - Deleting existing `sections` for project_id then inserting new ones, or
  - Upserting on `(project_id, section_type, seat_number, order_index)`.

### Error responses
- 400: missing/invalid inputs
- 500: DB failure (include concise message)

### Example SQL snippets (for Python)
- Insert project:
```sql
insert into public.projects(owner_email, title, topic, life_skill, group_size, duration_min, spec_json)
values ($1, $2, $3, $4, $5, $6, '{}'::jsonb)
returning id;
```
- Insert participants (teacher + N students):
```sql
insert into public.participants(project_id, role, seat_number)
values ($1, 'teacher', 0),
       ($1, 'student', 1),
       ($1, 'student', 2);
```
- Insert sections (bulk):
```sql
insert into public.sections(project_id, section_type, seat_number, content_text, order_index)
select $1, section_type, seat_number, content_text, order_index
from jsonb_to_recordset($2::jsonb)
as t(section_type text, seat_number int, content_text text, order_index int);
```

### Non-goals for now
- No titles per section; the UI uses fixed headers. Only `content_text` is required.
- No versioning; each save updates `content_text`.
- No participant IDs; seat-based only.

This contract is ready to drive a Flask `contract.py` that:
- Accepts the JSON input,
- Generates the content,
- Stores everything via Supabase,
- Returns the output structure exactly as above.