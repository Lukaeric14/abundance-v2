## Abundance Projects — Project Overview

Abundance is a Next.js app that helps educators generate classroom-ready, standards-aligned project experiences. It combines a secure web app (Supabase auth, server actions) with a backend microservice that composes project content using LLMs.

### Key points
- **Web app**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase (server-only auth)
- **LLM orchestration**: LangChain + OpenAI
- **Microservice**: Two implementations exist under `generate-project/` and `generate-projectv2/` (both are WIP; see below)
- **Database**: Supabase Postgres with migrations in `supabase/migrations`

## Tech stack
- **Frontend/App**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Auth & data**: Supabase (`@supabase/ssr`, server-side only)
- **AI**: LangChain core/openai packages
- **Runtime**: Node.js for the app; Python for the microservice(s)

## Repository structure (high level)
```text
app/
  api/
    chat/route.ts        # Chat endpoint; kicks off project generation
    sections/route.ts    # Teacher/student section fetch & updates via Supabase RPCs
  (pages, layout, auth views)

components/              # UI and layout components
lib/                     # Supabase client/server, auth helpers, utils
middleware.ts            # Route protection
supabase/                # Config, migrations, seed

generate-project/        # Microservice v1 (Flask, single-chain, SSE) — WIP
generate-projectv2/      # Microservice v2 (node-based pipeline) — WIP
```

## App capabilities
- **Auth flow**: Server-only Supabase auth; unauthenticated users redirected to `/login` (see `middleware.ts` and `app/login/page.tsx`).
- **Chat to project**: `POST /api/chat` uses LangChain to collect minimal requirements and, when ready, creates a `projects` row and calls the microservice to generate the full project spec.
- **Sections API**: `POST /api/sections` fetches teacher or student views of project sections via Supabase RPCs and allows text updates for a section record.

## Desired outcomes
- **For teachers**: Classroom-ready, realistic projects that fit a specified grade band, time window, and target skills; minimal prep; clear steps and artifacts.
- **For students**: Engaging roles with asymmetric information that promote collaboration, problem-solving, and authentic artifacts (tables, graphs, written notes).
- **For internal reviewers**: High pass rates on schema and consistency checks; traceable alignment to standards; observable runs with reproducible state.
- **Operationally**: E2E generation in under ~3 minutes, idempotent retries, and safe partial results when failures occur.

### Success criteria (MVP)
- ≥ 95% runs produce a schema-valid bundle without manual edits.
- ≤ 2–3 minutes median E2E latency with default seeds/models.
- Each bundle includes at least one mapped standard with evidence notes.
- Full observability: node timings, token usage, inputs/outputs keys, and run status.

### API endpoints
- `POST /api/chat`
  - Auth required (Supabase session).
  - Persists chat messages, creates a `projects` row, and calls the microservice: `GENERATE_PROJECT_URL + /start`.
  - Expects the model to sometimes return an action JSON: `{"action":"generate_project","project":{...}}`.

- `POST /api/sections`
  - Body: `{ projectId, role: 'teacher' | 'student', seat?: number }` or `{ update: { id, content_text } }`.
  - Calls RPCs `get_teacher_sections` or `get_student_sections`; supports updating a section row’s `content_text`.

## Environment
Create `.env.local` in the repo root for the Next.js app:
```bash
SUPABASE_URL=...           # from Supabase project
SUPABASE_ANON_KEY=...      # anon key, used server-side only
OPENAI_API_KEY=...         # used by /api/chat
GENERATE_PROJECT_URL=http://localhost:8080  # where the microservice runs
```

For the microservice(s), set environment variables per their docs (see below). Typical variables:
- `OPENAI_API_KEY`, `DATABASE_URL`, optional `PORT`, and logging options.

## Running locally
1) App
```bash
npm install
npm run dev
# http://localhost:3000
```

2) Microservice (v1 example)
```bash
cd generate-project
pip install -r requirements.txt
python app.py   # serves on :8080 by default
```

Alternatively, use the Dockerfile under `generate-project/`.

## Database & migrations
- Supabase configuration in `supabase/config.toml`
- SQL migrations under `supabase/migrations/` (participants/sections, RPCs, seeds, and related updates)
- Local workflows: `supabase db reset` / `supabase db push` (see `README.md`)

## User workflows

### Teacher/PM (happy path)
1. Start a chat in the web app; provide topic, group size (2–4), life skill, time window.
2. When prompted, the assistant returns a generation action. The app creates a project and starts the microservice run.
3. While the run proceeds, the teacher can refresh or later open the project view to see sections (teacher view and shared/student views).
4. Minor edits can be applied via `POST /api/sections` for text content fields.
5. If results aren’t satisfactory, re-run generation (idempotent by `(project_id, chat_id)` in v1; planned re-run knobs in v2).

### Student
1. Student opens a seat-specific view for a project.
2. The app requests `POST /api/sections` with `role='student'` and `seat=n` to fetch individualized steps and private data slices.
3. Students complete steps and artifacts guided by the objective and shared data.

### Internal reviewer/content engineer
1. Run a seed through the pipeline; verify structure, clarity, and standards alignment.
2. Inspect logs/outputs; in v2, run nodes in isolation and review intermediate artifacts.
3. File issues or tighten prompts/validators; maintain golden seeds and snapshot tests (v2 direction).

## UI at a glance

### Teacher view
- **Header & controls**: Breadcrumbs, project title, avatar row (teacher + students this allows the teacher to see views of each student and edit them), and primary actions like **Save Project** and **Go Live**.
- **Overview/Objective**: Large objective card (expand/collapse) used to review or refine the teacher-facing objective.
- **Steps & Data panes**: Side-by-side panels. Steps show phase-based tasks with durations; Data shows shared datasets/tables used in the activity.
- **Assistant**: Prompt box to “Ask Abundance” for quick help or refinements.

### Student view
- **Objective & role**: Role-specific objective at the top with a clear call to continue. A status bar shows the current phase and a countdown to the next phase.
- **Steps timeline**: Left panel lists phases (e.g., Research, Discovery, Planning) with progress indicators and time boxes.
- **Data panel**: Center panel provides contextual data (specs, tables, notes) the student uses to complete steps.
- **In-session help**: Right chat panel for Q&A with the assistant during the task.
- **Quick actions**: Bottom toolbar for switching between Steps, Data, Research, Notes, Chat, and Help.

### New project screen
- Minimal surface prompting “Ask Abundance…” to seed a new project via chat.

## System workflows

### End-to-end (app + microservice v1)
1. Chat flow elicits minimal spec → app inserts into `projects` with `spec_json: {status: 'generating'}`.
2. App calls microservice `POST /start` with project/chat metadata.
3. Microservice writes incremental updates to `projects.spec_json` and emits SSE events.
4. On completion, `spec_json.status` becomes `complete` (or `error` on failure);
5. App surfaces teacher/student sections via RPCs.

### Orchestrated pipeline (v2 target)
1. Spec Builder → creates a constrained spec from the seed.
2. Standards Mapper → binds to curriculum codes and evidence notes.
3. Objective Composer → world, teacher objective, base roles.
4. Step Planner → global steps and artifacts.
5. Shared Data Maker → knobs, datasets, ranges with units.
6. Role Expanders → individualized steps and private data.
7. Merge → assemble canonical bundle; ensure ordering and naming.
8. Validators → schema, consistency, objective-fit.
9. Fixer → small, safe edits; otherwise escalate with guidance.

## Validation and QA
- **Schema checks**: required fields, enums, ordering (always World → Teacher Objective → Roles → Steps → Shared Data → Individuals → Standards).
- **Consistency checks**: units, references, difficulty within grade band, time fit.
- **Objective-fit**: evidence for each standards target is present in steps/artifacts.
- **Snapshot tests and golden seeds** (v2): guard against regressions.

## Observability
- **Runs**: start/end, node timings, token counts (if LLM), sizes of key payloads.
- **Logging**: CSV logs with PII redaction (v1), structured node traces (v2 direction).
- **Events**: SSE in v1; richer streaming/trace views planned for v2.

## Microservice(s) — status and intent

There are two versions of the "generate project" microservice in this repo. Both are works in progress and not yet where we want them:

### v1 — `generate-project/` (current integration target, WIP)
- **Architecture**: Flask app with a single LLM chain that produces the full project spec. Supports SSE for progress events and idempotent runs by `(project_id, chat_id)`.
- **Endpoints**: `POST /start`, `GET /events/stream?run_id=...`, `GET /status/<project_id>`, `GET /health>`.
- **Pros**: Simple to operate, end-to-end runnable, CSV logging, incremental writes to `projects.spec_json`.
- **Gaps**: Single-shot generation can drift; limited node-level observability/validation; schema/quality checks are basic.

### v2 — `generate-projectv2/` (next-gen pipeline, WIP)
- **Architecture**: A node-based pipeline (Spec Builder → Standards Mapper → Objective Composer → Step Planner → Shared Data Maker → Role Expanders → Merge → Validators → Fixer). Each node can be run and tested in isolation.
- **Status**: Early development with initial nodes and tests; richer PRD/docs in `generate-projectv2/docs/` and `v2.md`.
- **Pros**: Deterministic stages, better observability and contracts, targeted validators/fixers.
- **Gaps**: Not fully wired end-to-end; APIs and schemas may change; not production-ready.

The Next.js app currently expects a `POST /start` endpoint at `GENERATE_PROJECT_URL` and assumes v1 semantics. As v2 matures, we plan to align the app to the orchestrated pipeline and enrich progress/validation surfaces.

## Scripts (app)
From `package.json`:
- **dev**: start dev server
- **build / start**: production
- **lint**: run ESLint
- **save / quick / commit / sync / deploy / restart**: convenience git and lifecycle helpers

## Contributing
- Start with `README.md` for setup and Supabase workflows.
- For the microservice, prefer v1 for end-to-end manual testing today; explore v2 docs to understand the target architecture.
- Expect breaking changes in both microservice folders while we converge on v2.

## Roadmap (high level)
- Stabilize v1 schema and improve guardrails
- Complete v2 nodes, validators, and fixer loop; add streaming/observability surfaces
- Migrate the app to v2’s API/contract and enrich in-app progress UX


