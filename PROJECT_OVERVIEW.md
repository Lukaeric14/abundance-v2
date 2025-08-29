## Abundance Projects — Project Overview

Abundance is a Next.js app that helps educators generate AI-assisted project experiences through a chat interface. It combines secure server-side authentication with efficient data storage for educational content creation.

### Key points
- **Web app**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase (server-only auth)
- **LLM orchestration**: LangChain + OpenAI
- **Mock Data**: Project generation uses static mock data from `data/mock-project.json` for demonstration
- **Database**: Supabase Postgres with migrations in `supabase/migrations`

## Tech stack
- **Frontend/App**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Auth & data**: Supabase (`@supabase/ssr`, server-side only)
- **AI**: LangChain core/openai packages
- **Runtime**: Node.js for the app

## Repository structure (high level)
```text
app/
  api/
    chat/route.ts        # Chat endpoint; handles project generation with mock data
  (pages, layout, auth views)

components/              # UI and layout components
lib/                     # Supabase client/server, auth helpers, utils
middleware.ts            # Route protection
supabase/                # Config, migrations, seed

# Streamlined architecture focused on core functionality
```

## App capabilities
- **Auth flow**: Server-only Supabase auth; unauthenticated users redirected to `/login` (see `middleware.ts` and `app/login/page.tsx`).
- **Chat to project**: `POST /api/chat` uses LangChain to collect minimal requirements and generates a `projects` row with mock data from the demonstration file.
- **Project API**: Data is stored in the project's `spec_json` field using structured mock data.

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
  - Persists chat messages, creates a `projects` row with mock data from `data/mock-project.json`.
  - Expects the model to sometimes return an action JSON: `{"action":"generate_project","project":{...}}`.



## Environment
Create `.env.local` in the repo root for the Next.js app:
```bash
SUPABASE_URL=...           # from Supabase project
SUPABASE_ANON_KEY=...      # anon key, used server-side only
OPENAI_API_KEY=...         # used by /api/chat
```

Mock project data is stored in `data/mock-project.json` and loaded automatically.

## Running locally
```bash
npm install
npm run dev
# http://localhost:3000
```

The app uses mock data from `data/mock-project.json` for demonstration purposes.

## Database & migrations
- Supabase configuration in `supabase/config.toml`
- SQL migrations under `supabase/migrations/` (core tables for efficient data management)
- Local workflows: `supabase db reset` / `supabase db push` (see `README.md`)

## User workflows

### Teacher/PM (happy path)
1. Start a chat in the web app; provide topic, group size (2–4), life skill, time window.
2. When prompted, the assistant returns a generation action. The app creates a project with mock data.
3. The teacher can open the project view to see the generated content and sections.
4. Project data is loaded from the mock data in `spec_json`.
5. If results aren't satisfactory, start a new chat to generate different content.

### Student
1. Student opens a seat-specific view for a project.
2. Student data is loaded from the project's mock data structure.
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

## System workflow

1. User starts chat and provides project requirements (topic, group size, life skill, duration)
2. LangChain processes the conversation and determines when to generate a project
3. App creates a new `projects` row with mock data from `data/mock-project.json`
4. User can view the generated project through the teacher interface

## Data and Quality
- **Mock data**: Consistent demonstration data from `data/mock-project.json`
- **Simple validation**: Basic checks on user input and project creation
- **Logging**: Server-side logging for debugging and monitoring

## Architecture Philosophy

The app focuses on core functionality with a clean design:
- **Single API endpoint** (`/api/chat`) handles all project generation
- **Mock data integration** for demonstration and testing
- **Server-side only** authentication and data access
- **Minimal dependencies** for easier maintenance

## Scripts (app)
From `package.json`:
- **dev**: start dev server
- **build / start**: production
- **lint**: run ESLint
- **save / quick / commit / sync / deploy / restart**: convenience git and lifecycle helpers

## Contributing
- Start with `README.md` for setup and Supabase workflows
- Focus on core chat-to-project functionality
- Database schema uses 3 core tables for streamlined development

## Roadmap (high level)
- Enhance AI project generation with better prompts
- Add real-time collaboration features
- Implement advanced teacher/student views
- Add project analytics and reporting


