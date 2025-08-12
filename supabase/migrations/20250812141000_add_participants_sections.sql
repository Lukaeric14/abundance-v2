-- participants: who is in the project
create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  role text not null check (role in ('teacher','student')),
  seat_number int, -- 1..N for students; null for teacher
  name text,
  email text,
  meta jsonb not null default '{}'::jsonb,
  constraint seat_rules check (
    (role='teacher' and seat_number is null) or
    (role='student' and seat_number is not null)
  )
);

create unique index if not exists one_teacher_per_project
  on public.participants(project_id) where role='teacher';

create unique index if not exists students_unique_seat
  on public.participants(project_id, seat_number) where role='student';

create index if not exists participants_project_role
  on public.participants(project_id, role, seat_number);

-- sections: what to render (textarea content)
create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,

  section_type text not null check (
    section_type in ('objective','steps','data','rubric','resource','hint','assessment','note')
  ),

  scope text not null check (scope in ('teacher','group','participant')),
  participant_id uuid references public.participants(id),
  constraint participant_scope_match check ((scope='participant') = (participant_id is not null)),

  title text,
  content_text text not null default '',
  order_index int not null default 0,
  status text not null default 'active' check (status in ('active','archived','hidden')),

  last_edited_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sections_rendering
  on public.sections(project_id, scope, section_type, order_index);

create index if not exists sections_participant
  on public.sections(participant_id);


