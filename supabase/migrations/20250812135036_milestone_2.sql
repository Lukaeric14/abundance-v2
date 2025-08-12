-- ===== CORE EXTENSIONS =====
create extension if not exists "pgcrypto" with schema public;

-- ===== PROJECTS (text-only spec) =====
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_email text,                      -- prototype: store email, not FK
  title text not null,
  topic text not null,
  life_skill text not null,
  group_size int not null check (group_size between 2 and 4),
  duration_min int not null check (duration_min between 20 and 90),
  spec_json jsonb not null,              -- validated client/server side
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ===== CHATS & MESSAGES =====
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  owner_email text,                      -- prototype identity
  created_at timestamptz default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz default now()
);

-- ===== BASIC INDEXES =====
create index if not exists projects_created_idx on public.projects (created_at desc);
create index if not exists chats_created_idx on public.chats (created_at desc);
create index if not exists chat_messages_chat_idx on public.chat_messages (chat_id, created_at);

-- ===== DISABLE RLS (PUBLIC PROTOTYPE) =====
alter table public.projects       disable row level security;
alter table public.chats          disable row level security;
alter table public.chat_messages  disable row level security;

-- ===== PERMISSIONS: allow anon + authenticated to read/write =====
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.projects      to anon, authenticated;
grant select, insert, update, delete on public.chats         to anon, authenticated;
grant select, insert, update, delete on public.chat_messages to anon, authenticated;

-- sequences (if any get created later)
grant usage, select on all sequences in schema public to anon, authenticated;
