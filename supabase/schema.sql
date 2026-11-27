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

-- Row Level Security is ENABLED and there are deliberately NO policies yet.
-- With RLS on and no policy, Supabase denies every read and write from the browser (anon / authenticated keys).
-- Only the service-role key (server scripts such as seed-supabase.mjs) can touch the table, which is the safe default.
-- Do NOT add a blanket "using (true)" policy: that would let every signed-in user read and change every task.
alter table public.tasks enable row level security;

-- ───────────────────────────────────────────────────────────────────────────────
-- TEMPLATE (commented out): scope tasks to workspace members. Adapt when workspaces/accounts exist.
-- Step 1: model membership and tag every task with its workspace.
--
--   create table public.workspace_members (
--     workspace_id uuid not null,
--     user_id      uuid not null references auth.users (id) on delete cascade,
--     role         text not null check (role in ('owner', 'editor', 'viewer')),
--     primary key (workspace_id, user_id)
--   );
--   alter table public.tasks add column workspace_id uuid not null;
--   alter table public.workspace_members enable row level security;
--   create policy "members: read own memberships" on public.workspace_members
--     for select to authenticated using (user_id = auth.uid());
--
-- Step 2: one policy per operation, each checking membership (and role for writes).
--
--   create policy "tasks: members read" on public.tasks for select to authenticated
--     using (exists (select 1 from public.workspace_members m
--                    where m.workspace_id = tasks.workspace_id and m.user_id = auth.uid()));
--   create policy "tasks: editors insert" on public.tasks for insert to authenticated
--     with check (exists (select 1 from public.workspace_members m
--                    where m.workspace_id = tasks.workspace_id and m.user_id = auth.uid()
--                      and m.role in ('owner', 'editor')));
--   create policy "tasks: editors update" on public.tasks for update to authenticated
--     using      (exists (select 1 from public.workspace_members m
--                    where m.workspace_id = tasks.workspace_id and m.user_id = auth.uid()
--                      and m.role in ('owner', 'editor')))
--     with check (exists (select 1 from public.workspace_members m
--                    where m.workspace_id = tasks.workspace_id and m.user_id = auth.uid()
--                      and m.role in ('owner', 'editor')));
--   create policy "tasks: owners delete" on public.tasks for delete to authenticated
--     using (exists (select 1 from public.workspace_members m
--                    where m.workspace_id = tasks.workspace_id and m.user_id = auth.uid()
--                      and m.role = 'owner'));
--
-- Step 3 (verify with two test workspaces): a user in workspace A must get zero rows from, and be unable to
-- update or delete, any task in workspace B. Then add workspace_id to TaskRow in lib/taskRepository.ts.
