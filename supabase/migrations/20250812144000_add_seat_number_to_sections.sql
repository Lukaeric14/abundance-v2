-- Add seat_number to sections and backfill from current data
alter table public.sections add column if not exists seat_number int;

-- Backfill teacher-specific rows to seat 0
update public.sections set seat_number = 0 where scope = 'teacher' and seat_number is null;

-- Backfill personalized student rows using participants.seat_number
update public.sections s
set seat_number = p.seat_number
from public.participants p
where s.scope = 'student' and s.participant_id = p.id and s.seat_number is null;

-- Shared student rows remain null (seat_number is null)

-- Adjust RPCs/views to use seat_number instead of participant_id
drop function if exists public.get_teacher_sections(uuid) cascade;
drop function if exists public.get_student_sections(uuid, int) cascade;
drop view if exists public.v_teacher_sections cascade;

create or replace view public.v_teacher_sections as
select s.* from public.sections s;

create or replace function public.get_teacher_sections(p_project_id uuid)
returns setof public.v_teacher_sections
language sql stable parallel safe as $$
  select *
  from public.v_teacher_sections
  where project_id = p_project_id
    and seat_number = 0
  order by section_type, order_index;
$$;

create or replace function public.get_student_sections(
  p_project_id uuid,
  p_seat int
)
returns setof public.sections
language sql stable parallel safe as $$
  select s.*
  from public.sections s
  where s.project_id = p_project_id
    and s.status = 'active'
    and (
      s.seat_number is null
      or s.seat_number = p_seat
    )
  order by s.section_type, s.order_index;
$$;


