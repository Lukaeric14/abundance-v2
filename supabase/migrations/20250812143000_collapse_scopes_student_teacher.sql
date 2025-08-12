-- Collapse scopes to only 'teacher' and 'student'
-- Keep participant_id = null for student-shared; participant_id = uuid for personalized

-- 1) Create new scope2 column with new check
alter table public.sections add column if not exists scope2 text;

update public.sections
set scope2 = case when scope = 'teacher' then 'teacher' else 'student' end
where scope2 is null;

alter table public.sections
  add constraint sections_scope2_check check (scope2 in ('teacher','student'));

-- 2) Replace dependent view/functions BEFORE dropping old scope
drop function if exists public.get_teacher_sections(uuid) cascade;
drop function if exists public.get_student_sections(uuid, int) cascade;
drop view if exists public.v_teacher_sections cascade;

-- 3) Drop old scope column and rename scope2 -> scope
alter table public.sections drop column scope;
alter table public.sections rename column scope2 to scope;

-- 4) Ensure teacher rows never reference a participant
alter table public.sections drop constraint if exists participant_scope_match;
alter table public.sections add constraint teacher_scope_no_participant check (scope <> 'teacher' or participant_id is null);

create or replace view public.v_teacher_sections as
select s.*, p.seat_number
from public.sections s
left join public.participants p on p.id = s.participant_id;

create or replace function public.get_teacher_sections(p_project_id uuid)
returns setof public.v_teacher_sections
language sql stable parallel safe as $$
  select *
  from public.v_teacher_sections
  where project_id = p_project_id
  order by
    case scope when 'teacher' then 0 else 1 end,
    coalesce(seat_number, 0),
    section_type,
    order_index;
$$;

create or replace function public.get_student_sections(
  p_project_id uuid,
  p_seat int
)
returns setof public.sections
language sql stable parallel safe as $$
  with me as (
    select id
    from public.participants
    where project_id = p_project_id and role='student' and seat_number = p_seat
    limit 1
  )
  select s.*
  from public.sections s
  where s.project_id = p_project_id
    and s.status = 'active'
    and (
      (s.scope = 'student' and s.participant_id is null)
      or (s.scope = 'student' and s.participant_id = (select id from me))
    )
  order by s.section_type, s.order_index;
$$;


