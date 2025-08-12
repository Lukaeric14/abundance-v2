-- Demo data for a single project with teacher + 2 students
-- Idempotent via fixed project UUID

with upsert_project as (
  insert into public.projects (id, owner_email, title, topic, life_skill, group_size, duration_min, spec_json)
  values (
    '11111111-1111-1111-1111-111111111111',
    'demo@example.com',
    'Real Estate Case Challenge: A Problem-Solving Project for 2 Students',
    'Numbers',
    'Problem Solving',
    2,
    30,
    '{}'::jsonb
  )
  on conflict (id) do nothing
  returning id
), proj as (
  select id from upsert_project
  union all
  select id from public.projects where id = '11111111-1111-1111-1111-111111111111'
  limit 1
)
-- Participants
, ins_teacher as (
  insert into public.participants (project_id, role, seat_number, name)
  select id, 'teacher', null, 'Teacher' from proj
  on conflict do nothing
  returning id, project_id
), ins_s1 as (
  insert into public.participants (project_id, role, seat_number, name)
  select id, 'student', 1, 'Student 1' from proj
  on conflict do nothing
  returning id, project_id
), ins_s2 as (
  insert into public.participants (project_id, role, seat_number, name)
  select id, 'student', 2, 'Student 2' from proj
  on conflict do nothing
  returning id, project_id
)
-- Sections
insert into public.sections (project_id, section_type, scope, participant_id, title, content_text, order_index)
-- Teacher-only objective/steps/data
select p.id, 'objective', 'teacher', null::uuid, 'Teacher Objective', 'Teacher notes and objective for guiding the session.', 0 from proj p
union all
select p.id, 'steps', 'teacher', null::uuid, 'Teacher Steps', '- Brief warm-up\n- Guide exploration\n- Debrief', 1 from proj p
union all
select p.id, 'data', 'teacher', null::uuid, 'Teacher Data', 'Answer key and scaffolds.', 2 from proj p
-- Group objective/steps/data visible to all
union all
select p.id, 'objective', 'group', null::uuid, 'Objective', 'Investigate real estate fraction problems as a team.', 0 from proj p
union all
select p.id, 'steps', 'group', null::uuid, 'Group Steps', '- Step 1\n- Step 2', 1 from proj p
union all
select p.id, 'data', 'group', null::uuid, 'Group Data', 'Listings, prices, and floorplans.', 2 from proj p
-- Student 1 personalized
union all
select p.id, 'objective', 'participant', (select id from ins_s1), 'Your Objective', 'Focus on area and price per sq ft.', 0 from proj p
union all
select p.id, 'steps', 'participant', (select id from ins_s1), 'Your Steps', '- Compute areas\n- Compare prices', 1 from proj p
union all
select p.id, 'data', 'participant', (select id from ins_s1), 'Your Data', 'Condo and townhouse samples.', 2 from proj p
-- Student 2 personalized
union all
select p.id, 'objective', 'participant', (select id from ins_s2), 'Your Objective', 'Focus on fractions in mortgage splits.', 0 from proj p
union all
select p.id, 'steps', 'participant', (select id from ins_s2), 'Your Steps', '- Fraction decomposition\n- Compare lenders', 1 from proj p
union all
select p.id, 'data', 'participant', (select id from ins_s2), 'Your Data', 'Loan offers and terms.', 2 from proj p
on conflict do nothing;


