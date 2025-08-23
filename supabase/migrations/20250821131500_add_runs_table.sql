-- Create runs table for orchestrator tracking
create table if not exists public.runs (
  run_id text primary key,
  project_id text,
  status text,
  started_at double precision,
  completed_at double precision,
  node_timings jsonb default '{}'::jsonb,
  error text
);

create index if not exists runs_project_id_idx on public.runs(project_id);
create index if not exists runs_started_at_idx on public.runs(started_at);

