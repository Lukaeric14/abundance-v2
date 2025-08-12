-- Usage: set the project id here for local testing
-- select '<YOUR-PROJECT-UUID>'::uuid as project_id \gset
-- \set project_id '<uuid>'

-- Ensure one teacher
insert into public.participants(project_id, role, seat_number, name, email)
select :'project_id', 'teacher', null, 'Teacher', null
where not exists (
  select 1 from public.participants where project_id = :'project_id' and role='teacher'
);

-- Ensure N students (1..group_size from projects)
do $$
declare gs int; i int;
begin
  select group_size into gs from public.projects where id = :'project_id';
  for i in 1..gs loop
    insert into public.participants(project_id, role, seat_number)
    select :'project_id', 'student', i
    where not exists (
      select 1 from public.participants
      where project_id = :'project_id' and role='student' and seat_number = i
    );
  end loop;
end$$;

-- Seed group objective + steps (idempotent)
insert into public.sections(project_id, section_type, scope, title, content_text, order_index)
select :'project_id', 'objective', 'group', 'Objective', 'Group objective text…', 0
where not exists (
  select 1 from public.sections
  where project_id = :'project_id' and section_type='objective' and scope='group'
);

insert into public.sections(project_id, section_type, scope, title, content_text, order_index)
select :'project_id', 'steps', 'group', 'Group Steps', '- Step 1\n- Step 2', 1
where not exists (
  select 1 from public.sections
  where project_id = :'project_id' and section_type='steps' and scope='group'
);

-- Seed per-student steps
insert into public.sections(project_id, section_type, scope, participant_id, title, content_text, order_index)
select :'project_id', 'steps', 'participant', p.id, 'Your Steps', 'Personalized steps…', 0
from public.participants p
where p.project_id = :'project_id' and p.role='student'
  and not exists (
    select 1 from public.sections s
    where s.project_id = :'project_id'
      and s.section_type='steps' and s.scope='participant'
      and s.participant_id = p.id
  );


