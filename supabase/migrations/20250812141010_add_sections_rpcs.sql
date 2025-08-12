-- Teacher view: returns all sections + seat_number when participant-scoped
create or replace view public.v_teacher_sections as
select
  s.*,
  p.seat_number
from public.sections s
left join public.participants p on p.id = s.participant_id;

create or replace function public.get_teacher_sections(p_project_id uuid)
returns setof public.v_teacher_sections
language sql stable parallel safe as $$
  select *
  from public.v_teacher_sections
  where project_id = p_project_id
  order by
    case scope when 'teacher' then 0 when 'group' then 1 else 2 end,
    coalesce(seat_number, 0),
    section_type,
    order_index;
$$;

-- Student view: returns group + own participant sections
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
      s.scope = 'group'
      or (s.scope = 'participant' and s.participant_id = (select id from me))
    )
  order by s.section_type, s.order_index;
$$;


