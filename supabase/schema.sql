-- LabOS tasks table (reference schema, NOT yet applied anywhere).
-- Paste into Supabase → SQL editor once your project exists. Column names mirror lib/taskRepository.ts (TaskRow).
-- Ids are text because the UI creates ids client-side; switch to uuid + default gen_random_uuid() if the backend assigns them.

create table if not exists public.tasks (
  id                   text primary key,
  title                text        not null,
  description          text        not null default '',
  owner_id             text        not null,          -- person who must act
  created_by_id        text,                          -- person who created the task
  requester_id         text,                          -- person waiting for the result (null = personal task)
  due_date             date,
  due_time             time,
  project_id           text,
  course_id            text,
  related_person_id    text,
  event_id             text,
  offset_amount        integer,                       -- relative deadline vs. the linked event
  offset_unit          text check (offset_unit in ('calendar-days', 'working-days')),
  status               text        not null default 'open'
                         check (status in ('open', 'in-progress', 'completed', 'cancelled')),
  created_date         date        not null default current_date,
  last_contact_date    date,
  follow_up_after_days integer,
  source               text        not null default 'manual'
                         check (source in ('manual', 'capture', 'calendar', 'suggestion')),
  milestone            boolean     not null default false,
  blocks_id            text,                          -- "this task blocks milestone <id>"
  priority             text check (priority in ('high', 'normal', 'low'))
);

create index if not exists tasks_owner_idx     on public.tasks (owner_id);
create index if not exists tasks_requester_idx on public.tasks (requester_id);
create index if not exists tasks_due_idx       on public.tasks (due_date);

-- Row Level Security: turn it on BEFORE using real data.
-- This placeholder lets any signed-in user read/write; tighten it once people/accounts are modelled.
alter table public.tasks enable row level security;
create policy "tasks: authenticated access" on public.tasks
  for all to authenticated using (true) with check (true);
