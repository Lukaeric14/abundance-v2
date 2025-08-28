-- ===== SESSIONS TABLE =====
-- Manages student session state for NPC roleplay projects
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  session_code text not null unique, -- e.g., 'abc123' for URL generation
  
  -- Session state
  current_phase text not null default 'research' check (
    current_phase in ('research', 'discovery', 'planning', 'implementation', 'reflection')
  ),
  phase_start_time timestamptz not null default now(),
  total_elapsed_seconds int not null default 0,
  conversation_history jsonb not null default '[]'::jsonb,
  
  -- Session configuration
  phase_time_limits jsonb not null default '{
    "research": 900,
    "discovery": 1200,
    "planning": 1800,
    "implementation": 2400,
    "reflection": 600
  }'::jsonb, -- time limits in seconds for each phase
  
  -- Session metadata
  status text not null default 'active' check (
    status in ('active', 'paused', 'completed', 'expired')
  ),
  completion_data jsonb not null default '{}'::jsonb,
  
  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_accessed_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '48 hours')
);

-- ===== SESSION PARTICIPANTS =====
-- Links sessions to specific participants (students)
create table if not exists public.session_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  
  unique(session_id, participant_id)
);

-- ===== PHASE HISTORY =====
-- Tracks phase transitions and timing
create table if not exists public.session_phase_history (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  phase_name text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds int,
  completed boolean not null default false
);

-- ===== INDEXES =====
create index if not exists sessions_project_id_idx on public.sessions(project_id);
create index if not exists sessions_status_idx on public.sessions(status);
create index if not exists sessions_expires_at_idx on public.sessions(expires_at);
create index if not exists sessions_code_idx on public.sessions(session_code);
create index if not exists session_participants_session_idx on public.session_participants(session_id);
create index if not exists session_phase_history_session_idx on public.session_phase_history(session_id);

-- ===== FUNCTIONS =====

-- Function to generate unique session codes
create or replace function generate_session_code() returns text as $$
declare
  chars text := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result text := '';
  i int;
begin
  for i in 1..6 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return result;
end;
$$ language plpgsql;

-- Function to update session last_accessed_at
create or replace function update_session_access(session_id_param uuid) returns void as $$
begin
  update public.sessions 
  set last_accessed_at = now(), updated_at = now()
  where id = session_id_param;
end;
$$ language plpgsql;

-- Function to progress to next phase
create or replace function progress_session_phase(
  session_id_param uuid,
  new_phase text default null
) returns jsonb as $$
declare
  current_session record;
  next_phase text;
  phase_order text[] := array['research', 'discovery', 'planning', 'implementation', 'reflection'];
  current_phase_index int;
  phase_duration int;
begin
  -- Get current session state
  select * into current_session 
  from public.sessions 
  where id = session_id_param;
  
  if not found then
    return jsonb_build_object('error', 'Session not found');
  end if;
  
  -- Calculate duration of current phase
  phase_duration := extract(epoch from (now() - current_session.phase_start_time))::int;
  
  -- End current phase in history
  update public.session_phase_history
  set ended_at = now(), duration_seconds = phase_duration, completed = true
  where session_id = session_id_param 
    and phase_name = current_session.current_phase 
    and ended_at is null;
  
  -- Determine next phase
  if new_phase is not null then
    next_phase := new_phase;
  else
    -- Auto-progress to next phase
    current_phase_index := array_position(phase_order, current_session.current_phase);
    if current_phase_index < array_length(phase_order, 1) then
      next_phase := phase_order[current_phase_index + 1];
    else
      -- Mark session as completed if we're at the last phase
      update public.sessions
      set status = 'completed', updated_at = now()
      where id = session_id_param;
      
      return jsonb_build_object(
        'completed', true, 
        'final_phase', current_session.current_phase
      );
    end if;
  end if;
  
  -- Update session to new phase
  update public.sessions
  set 
    current_phase = next_phase,
    phase_start_time = now(),
    total_elapsed_seconds = current_session.total_elapsed_seconds + phase_duration,
    updated_at = now()
  where id = session_id_param;
  
  -- Start new phase in history
  insert into public.session_phase_history (session_id, phase_name)
  values (session_id_param, next_phase);
  
  return jsonb_build_object(
    'success', true,
    'previous_phase', current_session.current_phase,
    'new_phase', next_phase,
    'phase_duration', phase_duration
  );
end;
$$ language plpgsql;

-- Function to clean up expired sessions
create or replace function cleanup_expired_sessions() returns int as $$
declare
  deleted_count int;
begin
  delete from public.sessions where expires_at < now();
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$ language plpgsql;

-- ===== PERMISSIONS =====
alter table public.sessions disable row level security;
alter table public.session_participants disable row level security;
alter table public.session_phase_history disable row level security;

grant select, insert, update, delete on public.sessions to anon, authenticated;
grant select, insert, update, delete on public.session_participants to anon, authenticated;
grant select, insert, update, delete on public.session_phase_history to anon, authenticated;

grant execute on function generate_session_code() to anon, authenticated;
grant execute on function update_session_access(uuid) to anon, authenticated;
grant execute on function progress_session_phase(uuid, text) to anon, authenticated;
grant execute on function cleanup_expired_sessions() to anon, authenticated;