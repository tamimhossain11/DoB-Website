-- ════════════════════════════════════════════════════════════════════════════
-- Proposal Board — Tasks
--
-- Run AFTER 20261015000000_proposal_board.sql:
--   Dashboard → SQL Editor → New query → paste this file → Run
--   (or `supabase db push`)
--
-- Any board member can create a task and assign it to any board role.
--   • Due date: set by the creator when assigning. If left empty, the assignee may
--     set it once (their commitment). After that only the creator or an admin
--     (President, CEO) can change it — otherwise the lock would be meaningless.
--   • Lock rule (per task, on by default): once the due date passes without a
--     submission, the task locks — the assignee can no longer submit — and the
--     assignee, the creator and the admins are notified that it was missed.
--     Changing the due date to a future date reopens it.
--   • The lock is enforced on the server at submit time, and board_task_sweep()
--     records it and sends the notifications. The site calls the sweep while
--     anyone is signed in; supabase/cron.sql schedules it every 5 minutes too.
--   • Tasks have a description, attachments, submissions, reviews, a discussion
--     thread (the same one proposals use) and full audit history.
-- ════════════════════════════════════════════════════════════════════════════


-- ─── Tables ────────────────────────────────────────────────────────────────

create sequence public.board_task_seq;

create table public.board_tasks (
  id                  uuid primary key default gen_random_uuid(),
  ref                 text not null unique,
  title               text not null check (length(title) between 1 and 160),
  description         text not null default '' check (length(description) <= 20000),
  attachments         jsonb not null default '[]' check (jsonb_typeof(attachments) = 'array'),
  priority            text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  creator_role        text not null,
  creator_user        uuid not null references auth.users (id),
  assignee_role       text not null check (assignee_role in ('president', 'ceo', 'cto', 'cio', 'cfo')),
  due_at              timestamptz,
  lock_on_overdue     boolean not null default true,
  status              text not null default 'open'
                      check (status in ('open', 'submitted', 'changes_requested', 'done', 'missed', 'cancelled')),
  overdue_notified_at timestamptz,   -- set once the due date has passed and been handled
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  closed_at           timestamptz
);
create index on public.board_tasks (assignee_role, status);

-- Work handed in and the creator's response to it. Append-only.
create table public.board_task_submissions (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.board_tasks (id),
  kind        text not null check (kind in ('submission', 'accepted', 'changes_requested')),
  by_role     text not null,
  by_user     uuid not null references auth.users (id),
  by_name     text not null default '',
  note        text not null default '' check (length(note) <= 10000),
  attachments jsonb not null default '[]' check (jsonb_typeof(attachments) = 'array'),
  at          timestamptz not null default now()
);
create index on public.board_task_submissions (task_id);


-- ─── Shared tables now serve tasks as well as proposals ───────────────────

alter table public.board_comments
  alter column proposal_id drop not null,
  alter column version drop not null,
  add column task_id uuid references public.board_tasks (id);
alter table public.board_comments
  add constraint board_comments_one_thread check ((proposal_id is null) <> (task_id is null));
create index on public.board_comments (task_id);

alter table public.board_notifications
  alter column proposal_id drop not null,
  add column task_id uuid references public.board_tasks (id);
alter table public.board_notifications
  add constraint board_notifications_one_target check ((proposal_id is null) <> (task_id is null));

alter table public.board_audit add column task_id uuid references public.board_tasks (id);
create index on public.board_audit (task_id);

create or replace function public.board_guard_notification() returns trigger
language plpgsql as $$
begin
  if (new.id, new.to_role, new.proposal_id, new.task_id, new.text, new.at)
     is distinct from (old.id, old.to_role, old.proposal_id, old.task_id, old.text, old.at) then
    raise exception 'Only the read flag of a notification can change' using errcode = '42501';
  end if;
  return new;
end $$;


-- ─── History protections ──────────────────────────────────────────────────

create trigger board_task_submissions_append_only before update or delete on public.board_task_submissions
  for each row execute function public.board_forbid_change();
create trigger board_task_submissions_no_truncate before truncate on public.board_task_submissions
  for each statement execute function public.board_forbid_change();
-- A task's status changes over time, but a task can never be deleted.
create trigger board_tasks_no_delete before delete on public.board_tasks
  for each row execute function public.board_forbid_change();
create trigger board_tasks_no_truncate before truncate on public.board_tasks
  for each statement execute function public.board_forbid_change();


-- ════════════════════════════════════════════════════════════════════════════
-- Helpers (internal)
-- ════════════════════════════════════════════════════════════════════════════

create function public.board_is_admin(r text) returns boolean
language sql immutable as $$ select r in ('president', 'ceo') $$;

-- Thread visibility for comments, read receipts and audit rows: a proposal the
-- member may see, or any task (tasks are visible to every board member).
create function public.board_can_see_thread(p_proposal uuid, p_task uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when p_proposal is not null then board_can_see(p_proposal)
    when p_task is not null then board_is_member() and exists (select 1 from board_tasks where id = p_task)
    else false
  end
$$;

create function public.board_task_title(t public.board_tasks) returns text
language sql immutable as $$ select t.ref || ' “' || t.title || '”' $$;

create function public.board_fmt_time(ts timestamptz) returns text
language sql immutable as $$ select to_char(ts at time zone 'Asia/Dhaka', 'DD Mon YYYY, HH24:MI') $$;

create function public.board_log_task(p_actor public.board_members, p_action text, p_task uuid, p_detail text default '')
returns void language sql security definer set search_path = public as $$
  insert into board_audit (actor_role, actor_user, actor_name, action, task_id, ref, detail)
  select p_actor.role_id, p_actor.user_id, p_actor.name, p_action, t.id, t.ref, coalesce(p_detail, '')
  from board_tasks t where t.id = p_task
$$;

create function public.board_notify_task(p_to text[], p_from text, p_task uuid, p_text text)
returns void language sql security definer set search_path = public as $$
  insert into board_notifications (to_role, task_id, text)
  select distinct r, p_task, p_text from unnest(p_to) as r
  where r is not null and r is distinct from p_from
$$;

create function public.board_lock_task_row(p_id uuid) returns public.board_tasks
language plpgsql security definer set search_path = public as $$
declare t board_tasks;
begin
  select * into t from board_tasks where id = p_id for update;
  if not found then raise exception 'Task not found'; end if;
  return t;
end $$;

-- The due date passed without a submission: lock it (or flag it as overdue when the
-- task doesn't lock) and tell the people who need to know. Runs once per deadline.
create function public.board_task_handle_overdue(t public.board_tasks) returns void
language plpgsql security definer set search_path = public as $$
begin
  if t.lock_on_overdue then
    update board_tasks
       set status = 'missed', overdue_notified_at = now(), updated_at = now(), closed_at = now()
     where id = t.id;
    insert into board_audit (actor_role, actor_user, actor_name, action, task_id, ref, detail)
    values ('system', null, 'System', 'task_locked', t.id, t.ref,
            'Due ' || board_fmt_time(t.due_at) || ' passed without a submission — locked');
    perform board_notify_task(array[t.assignee_role, t.creator_role, 'president', 'ceo'], null, t.id,
      board_role_label(t.assignee_role) || ' was unable to submit ' || board_task_title(t)
        || ' by the due date (' || board_fmt_time(t.due_at) || '). The task is now locked.');
  else
    update board_tasks set overdue_notified_at = now(), updated_at = now() where id = t.id;
    insert into board_audit (actor_role, actor_user, actor_name, action, task_id, ref, detail)
    values ('system', null, 'System', 'task_overdue', t.id, t.ref, 'Due ' || board_fmt_time(t.due_at) || ' passed');
    perform board_notify_task(array[t.assignee_role, t.creator_role], null, t.id,
      board_task_title(t) || ' is overdue (due ' || board_fmt_time(t.due_at) || ')');
  end if;
end $$;


-- ════════════════════════════════════════════════════════════════════════════
-- Actions (called from the browser with supabase.rpc)
-- ════════════════════════════════════════════════════════════════════════════

-- Lock / flag every task whose due date has passed. Idempotent and cheap: the site
-- calls it on load and every minute; cron.sql schedules it as well.
create function public.board_task_sweep() returns integer
language plpgsql security definer set search_path = public as $$
declare
  t board_tasks;
  n int := 0;
begin
  if auth.uid() is not null and not board_is_member() then
    raise exception 'You are not an active board member' using errcode = '42501';
  end if;
  for t in
    select * from board_tasks
     where due_at < now() and status in ('open', 'changes_requested') and overdue_notified_at is null
     for update skip locked
  loop
    perform board_task_handle_overdue(t);
    n := n + 1;
  end loop;
  return n;
end $$;

create function public.board_task_create(
  p_title       text,
  p_description text default '',
  p_assignee    text default null,
  p_due         timestamptz default null,
  p_lock        boolean default true,
  p_priority    text default 'normal',
  p_attachments jsonb default '[]'
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  m board_members := board_require_member();
  t board_tasks;
begin
  if btrim(coalesce(p_title, '')) = '' then raise exception 'Give the task a title.'; end if;
  if p_assignee is null or not exists (select 1 from board_members where role_id = p_assignee and active) then
    raise exception 'Choose who the task is assigned to.';
  end if;
  if p_due is not null and p_due <= now() then raise exception 'The due date must be in the future.'; end if;
  if coalesce(p_priority, 'normal') not in ('low', 'normal', 'high', 'urgent') then
    raise exception 'Unknown priority %', p_priority;
  end if;

  insert into board_tasks (ref, title, description, attachments, priority, creator_role, creator_user,
                           assignee_role, due_at, lock_on_overdue)
  values ('TSK-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('board_task_seq')::text, 3, '0'),
          btrim(p_title), btrim(coalesce(p_description, '')), coalesce(p_attachments, '[]'),
          coalesce(p_priority, 'normal'), m.role_id, m.user_id, p_assignee, p_due, coalesce(p_lock, true))
  returning * into t;

  perform board_log_task(m, 'task_created', t.id,
    'Assigned to ' || board_role_label(p_assignee)
      || coalesce(' · due ' || board_fmt_time(p_due), ' · no due date yet')
      || case when coalesce(p_lock, true) then ' · locks when overdue' else '' end);
  perform board_notify_task(array[p_assignee], m.role_id, t.id,
    board_role_label(m.role_id) || ' assigned you ' || board_task_title(t)
      || coalesce(' — due ' || board_fmt_time(p_due), ' — please set a due date'));
  return t.id;
end $$;

-- Creator or admin: any time while the task is still open (this also reopens a
-- locked task). Assignee: only to set a due date that hasn't been set yet.
create function public.board_task_set_due(p_task uuid, p_due timestamptz)
returns void language plpgsql security definer set search_path = public as $$
declare
  m        board_members := board_require_member();
  t        board_tasks := board_lock_task_row(p_task);
  manager  boolean := m.user_id = t.creator_user or board_is_admin(m.role_id);
  reopened boolean := t.status = 'missed';
begin
  if t.status in ('done', 'cancelled') then raise exception 'This task is closed.'; end if;
  if p_due is null or p_due <= now() then raise exception 'Pick a due date in the future.'; end if;
  if not manager then
    if m.role_id <> t.assignee_role then
      raise exception 'Only the creator, the assignee or an admin can set the due date' using errcode = '42501';
    end if;
    if t.due_at is not null then
      raise exception 'The due date is already set — ask the task creator or an admin to change it.' using errcode = '42501';
    end if;
  end if;

  update board_tasks
     set due_at = p_due,
         overdue_notified_at = null,
         status = case when reopened then 'open' else status end,
         closed_at = case when reopened then null else closed_at end,
         updated_at = now()
   where id = t.id;

  perform board_log_task(m, case when reopened then 'task_reopened' else 'task_due_set' end, t.id,
    coalesce('Due date ' || board_fmt_time(t.due_at) || ' → ', 'Due date set to ') || board_fmt_time(p_due));
  perform board_notify_task(
    case when reopened then array[t.assignee_role, t.creator_role, 'president', 'ceo'] else array[t.assignee_role, t.creator_role] end,
    m.role_id, t.id,
    board_role_label(m.role_id) || case when reopened then ' reopened ' else ' set the due date of ' end
      || board_task_title(t) || ' — due ' || board_fmt_time(p_due));
end $$;

-- Creator or admin: edit title, description, priority, lock rule or assignee.
create function public.board_task_update(
  p_task        uuid,
  p_title       text,
  p_description text,
  p_priority    text,
  p_lock        boolean,
  p_assignee    text
) returns void language plpgsql security definer set search_path = public as $$
declare
  m          board_members := board_require_member();
  t          board_tasks := board_lock_task_row(p_task);
  changes    text[] := '{}';
  reassigned boolean := p_assignee is distinct from t.assignee_role;
begin
  if not (m.user_id = t.creator_user or board_is_admin(m.role_id)) then
    raise exception 'Only the task creator or an admin can edit this task' using errcode = '42501';
  end if;
  if t.status in ('done', 'cancelled') then raise exception 'This task is closed.'; end if;
  if btrim(coalesce(p_title, '')) = '' then raise exception 'Give the task a title.'; end if;
  if p_priority not in ('low', 'normal', 'high', 'urgent') then raise exception 'Unknown priority %', p_priority; end if;
  if not exists (select 1 from board_members where role_id = p_assignee and active) then
    raise exception 'Choose who the task is assigned to.';
  end if;

  if btrim(p_title) <> t.title then changes := array_append(changes, 'title'); end if;
  if btrim(coalesce(p_description, '')) <> t.description then changes := array_append(changes, 'description'); end if;
  if p_priority <> t.priority then changes := array_append(changes, ('priority → ' || p_priority)); end if;
  if p_lock <> t.lock_on_overdue then changes := array_append(changes, case when p_lock then 'lock when overdue: on' else 'lock when overdue: off' end); end if;
  if reassigned then changes := array_append(changes, ('reassigned to ' || board_role_label(p_assignee))); end if;
  if cardinality(changes) = 0 then return; end if;

  update board_tasks
     set title = btrim(p_title), description = btrim(coalesce(p_description, '')), priority = p_priority,
         lock_on_overdue = p_lock, assignee_role = p_assignee, updated_at = now()
   where id = t.id;
  select * into t from board_tasks where id = p_task;

  perform board_log_task(m, 'task_edited', t.id, array_to_string(changes, ', '));
  if reassigned then
    perform board_notify_task(array[p_assignee], m.role_id, t.id,
      board_role_label(m.role_id) || ' assigned you ' || board_task_title(t)
        || coalesce(' — due ' || board_fmt_time(t.due_at), ''));
  else
    perform board_notify_task(array[t.assignee_role], m.role_id, t.id,
      board_role_label(m.role_id) || ' updated ' || board_task_title(t) || ' (' || array_to_string(changes, ', ') || ')');
  end if;
end $$;

-- Assignee hands in their work. Returns 'submitted', or 'locked' when the due date
-- has passed on a task that locks (the miss is recorded and notified, not raised,
-- so it isn't rolled back).
create function public.board_task_submit(p_task uuid, p_note text default '', p_attachments jsonb default '[]')
returns text language plpgsql security definer set search_path = public as $$
declare
  m    board_members := board_require_member();
  t    board_tasks := board_lock_task_row(p_task);
  note text := btrim(coalesce(p_note, ''));
begin
  if m.role_id <> t.assignee_role then
    raise exception 'Only the assignee can submit this task' using errcode = '42501';
  end if;

  if t.status = 'missed'
     or (t.status in ('open', 'changes_requested') and t.lock_on_overdue and t.due_at is not null and t.due_at < now()) then
    if t.status <> 'missed' then perform board_task_handle_overdue(t); end if;
    perform board_log_task(m, 'task_submit_blocked', t.id, 'Tried to submit after the due date — task is locked');
    return 'locked';
  end if;

  if t.status not in ('open', 'changes_requested') then
    raise exception 'This task can’t be submitted right now (status: %).', replace(t.status, '_', ' ');
  end if;
  if note = '' and jsonb_array_length(coalesce(p_attachments, '[]')) = 0 then
    raise exception 'Add a note or attach your work before submitting.';
  end if;

  insert into board_task_submissions (task_id, kind, by_role, by_user, by_name, note, attachments)
  values (t.id, 'submission', m.role_id, m.user_id, m.name, note, coalesce(p_attachments, '[]'));
  update board_tasks set status = 'submitted', updated_at = now() where id = t.id;

  perform board_log_task(m, 'task_submitted', t.id, left(note, 140));
  perform board_notify_task(array[t.creator_role], m.role_id, t.id,
    board_role_label(m.role_id) || ' submitted ' || board_task_title(t) || ' for your review');
  return 'submitted';
end $$;

-- Creator or admin reviews a submission: accept (done) or request changes, with an
-- optional new due date so the task doesn't lock straight away.
create function public.board_task_review(p_task uuid, p_decision text, p_note text default '', p_new_due timestamptz default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  m    board_members := board_require_member();
  t    board_tasks := board_lock_task_row(p_task);
  note text := btrim(coalesce(p_note, ''));
begin
  if not (m.user_id = t.creator_user or board_is_admin(m.role_id)) then
    raise exception 'Only the task creator or an admin can review this task' using errcode = '42501';
  end if;
  if t.status <> 'submitted' then raise exception 'There is no submission waiting for review.'; end if;

  if p_decision = 'accept' then
    insert into board_task_submissions (task_id, kind, by_role, by_user, by_name, note)
    values (t.id, 'accepted', m.role_id, m.user_id, m.name, note);
    update board_tasks set status = 'done', closed_at = now(), updated_at = now() where id = t.id;
    perform board_log_task(m, 'task_accepted', t.id, note);
    perform board_notify_task(array[t.assignee_role], m.role_id, t.id,
      board_role_label(m.role_id) || ' accepted your work on ' || board_task_title(t));
  elsif p_decision = 'changes' then
    if note = '' then raise exception 'Say what needs to change.'; end if;
    if p_new_due is not null and p_new_due <= now() then raise exception 'The new due date must be in the future.'; end if;
    insert into board_task_submissions (task_id, kind, by_role, by_user, by_name, note)
    values (t.id, 'changes_requested', m.role_id, m.user_id, m.name, note);
    update board_tasks
       set status = 'changes_requested',
           due_at = coalesce(p_new_due, due_at),
           overdue_notified_at = case when p_new_due is not null then null else overdue_notified_at end,
           updated_at = now()
     where id = t.id;
    perform board_log_task(m, 'task_changes_requested', t.id,
      note || coalesce(' · new due date ' || board_fmt_time(p_new_due), ''));
    perform board_notify_task(array[t.assignee_role], m.role_id, t.id,
      board_role_label(m.role_id) || ' requested changes on ' || board_task_title(t)
        || coalesce(' — new due date ' || board_fmt_time(p_new_due), ''));
  else
    raise exception 'Unknown decision %', p_decision;
  end if;
end $$;

create function public.board_task_cancel(p_task uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare
  m      board_members := board_require_member();
  t      board_tasks := board_lock_task_row(p_task);
  reason text := btrim(coalesce(p_reason, ''));
begin
  if not (m.user_id = t.creator_user or board_is_admin(m.role_id)) then
    raise exception 'Only the task creator or an admin can cancel this task' using errcode = '42501';
  end if;
  if t.status in ('done', 'cancelled') then raise exception 'This task is already closed.'; end if;
  if reason = '' then raise exception 'Give a reason for cancelling.'; end if;
  update board_tasks set status = 'cancelled', closed_at = now(), updated_at = now() where id = t.id;
  perform board_log_task(m, 'task_cancelled', t.id, reason);
  perform board_notify_task(array[t.assignee_role, t.creator_role], m.role_id, t.id,
    board_role_label(m.role_id) || ' cancelled ' || board_task_title(t) || ': ' || left(reason, 120));
end $$;

create function public.board_task_view(p_task uuid)
returns void language plpgsql security definer set search_path = public as $$
declare m board_members := board_require_member();
begin
  if not exists (select 1 from board_tasks where id = p_task) then raise exception 'Task not found'; end if;
  perform board_log_task(m, 'viewed', p_task);
  update board_notifications set read = true where to_role = m.role_id and task_id = p_task and not read;
end $$;

-- Task discussion — same rules as proposal discussion (replies, mentions,
-- attachments, meeting requests, corrections that never overwrite).
create function public.board_task_comment(
  p_task        uuid,
  p_body        text,
  p_parent      uuid default null,
  p_corrects    uuid default null,
  p_attachments jsonb default '[]',
  p_mentions    text[] default '{}',
  p_meeting     jsonb default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  m        board_members := board_require_member();
  t        board_tasks;
  body     text := btrim(coalesce(p_body, ''));
  roles    text[] := array['president', 'ceo', 'cto', 'cio', 'cfo'];
  mentions text[];
  invitees text[];
  meeting  jsonb;
  parent   board_comments;
  cid      uuid;
  kind     text;
begin
  select * into t from board_tasks where id = p_task;
  if not found then raise exception 'Task not found'; end if;

  if p_parent is not null then
    select * into parent from board_comments where id = p_parent and task_id = p_task;
    if not found then raise exception 'The message you replied to does not exist'; end if;
  end if;
  if p_corrects is not null and not exists (
    select 1 from board_comments where id = p_corrects and task_id = p_task and author_user = m.user_id
  ) then
    raise exception 'You can only post corrections to your own messages' using errcode = '42501';
  end if;

  mentions := array(select distinct x from unnest(coalesce(p_mentions, '{}')) x where x = any (roles) and x <> m.role_id);

  if p_meeting is not null then
    invitees := array(
      select distinct x from jsonb_array_elements_text(coalesce(p_meeting -> 'invitees', '[]')) x
      where x = any (roles) and x <> m.role_id);
    if coalesce(p_meeting ->> 'when', '') = '' then raise exception 'Pick a time for the meeting'; end if;
    if cardinality(invitees) = 0 then raise exception 'Invite at least one person to the meeting'; end if;
    meeting := jsonb_build_object(
      'when', (p_meeting ->> 'when')::timestamptz,
      'duration', greatest(5, coalesce(nullif(p_meeting ->> 'duration', '')::int, 30)),
      'where', coalesce(p_meeting ->> 'where', ''),
      'invitees', to_jsonb(invitees));
  end if;

  if body = '' and jsonb_array_length(coalesce(p_attachments, '[]')) = 0 and meeting is null then
    raise exception 'Write a message, attach a file or request a meeting';
  end if;

  insert into board_comments (task_id, parent_id, corrects_id, author_role, author_user, body, attachments, mentions, meeting)
  values (p_task, p_parent, p_corrects, m.role_id, m.user_id, body, coalesce(p_attachments, '[]'), mentions, meeting)
  returning id into cid;
  insert into board_comment_reads (comment_id, role_id) values (cid, m.role_id);

  kind := case
    when meeting is not null then 'meeting_requested'
    when p_corrects is not null then 'correction'
    when p_parent is not null then 'replied'
    else 'commented' end;
  perform board_log_task(m, kind, p_task, left(body, 140));

  if cardinality(mentions) > 0 then
    perform board_notify_task(mentions, m.role_id, p_task,
      board_role_label(m.role_id) || ' mentioned you on ' || board_task_title(t));
  end if;
  if meeting is not null then
    perform board_notify_task(invitees, m.role_id, p_task,
      board_role_label(m.role_id) || ' requested a meeting about ' || board_task_title(t));
  end if;
  perform board_notify_task(
    array(select x from unnest(array[t.creator_role, t.assignee_role, parent.author_role]) x
          where x is not null and not x = any (mentions)),
    m.role_id, p_task,
    board_role_label(m.role_id) || case when p_parent is null then ' commented on ' else ' replied on ' end || board_task_title(t));
  return cid;
end $$;

create function public.board_task_mark_read(p_task uuid)
returns void language plpgsql security definer set search_path = public as $$
declare m board_members := board_require_member();
begin
  insert into board_comment_reads (comment_id, role_id)
  select id, m.role_id from board_comments where task_id = p_task
  on conflict do nothing;
end $$;

create function public.board_task_opened_attachment(p_task uuid, p_name text)
returns void language plpgsql security definer set search_path = public as $$
declare m board_members := board_require_member();
begin
  if not exists (select 1 from board_tasks where id = p_task) then raise exception 'Task not found'; end if;
  perform board_log_task(m, 'opened_attachment', p_task, left(coalesce(p_name, ''), 255));
end $$;

-- Meeting responses now work on task threads as well as proposal threads.
create or replace function public.board_respond_meeting(p_comment uuid, p_response text)
returns void language plpgsql security definer set search_path = public as $$
declare
  m      board_members := board_require_member();
  c      board_comments;
  detail text;
  msg    text;
begin
  select * into c from board_comments where id = p_comment;
  if not found or c.meeting is null or not board_can_see_thread(c.proposal_id, c.task_id) then
    raise exception 'Meeting request not found';
  end if;
  if not (c.meeting -> 'invitees') ? m.role_id then
    raise exception 'You were not invited to this meeting' using errcode = '42501';
  end if;
  if p_response not in ('accept', 'decline') then raise exception 'Unknown response %', p_response; end if;

  insert into board_meeting_responses (comment_id, role_id, response) values (p_comment, m.role_id, p_response)
  on conflict (comment_id, role_id) do update set response = excluded.response, at = now();

  detail := case p_response when 'accept' then 'Accepted' else 'Declined' end || ' meeting on ' || (c.meeting ->> 'when');
  msg := board_role_label(m.role_id) || ' ' || p_response || 'ed your meeting request';
  if c.proposal_id is not null then
    perform board_log(m, 'meeting_response', c.proposal_id, detail);
    perform board_notify(array[c.author_role], m.role_id, c.proposal_id, msg);
  else
    perform board_log_task(m, 'meeting_response', c.task_id, detail);
    perform board_notify_task(array[c.author_role], m.role_id, c.task_id, msg);
  end if;
end $$;


-- ════════════════════════════════════════════════════════════════════════════
-- Permissions
-- ════════════════════════════════════════════════════════════════════════════

do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and (p.proname like 'board\_task%' or p.proname in (
        'board_is_admin', 'board_can_see_thread', 'board_fmt_time', 'board_log_task',
        'board_notify_task', 'board_lock_task_row'))
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
  end loop;
end $$;

grant execute on function
  public.board_task_sweep(),
  public.board_task_create(text, text, text, timestamptz, boolean, text, jsonb),
  public.board_task_set_due(uuid, timestamptz),
  public.board_task_update(uuid, text, text, text, boolean, text),
  public.board_task_submit(uuid, text, jsonb),
  public.board_task_review(uuid, text, text, timestamptz),
  public.board_task_cancel(uuid, text),
  public.board_task_view(uuid),
  public.board_task_comment(uuid, text, uuid, uuid, jsonb, text[], jsonb),
  public.board_task_mark_read(uuid),
  public.board_task_opened_attachment(uuid, text)
to authenticated;
grant execute on function public.board_can_see_thread(uuid, uuid) to authenticated;

alter table public.board_tasks enable row level security;
alter table public.board_task_submissions enable row level security;
revoke all on public.board_tasks, public.board_task_submissions from anon;
revoke insert, update, delete, truncate on public.board_tasks, public.board_task_submissions from authenticated;

create policy "members see tasks" on public.board_tasks
  for select to authenticated using (public.board_is_member());
create policy "members see task submissions" on public.board_task_submissions
  for select to authenticated using (public.board_is_member());

-- Comments, read receipts, meeting responses and the audit log follow thread visibility.
drop policy "members see comments" on public.board_comments;
create policy "members see comments" on public.board_comments
  for select to authenticated using (public.board_can_see_thread(proposal_id, task_id));

drop policy "members see read receipts" on public.board_comment_reads;
create policy "members see read receipts" on public.board_comment_reads
  for select to authenticated using (
    exists (select 1 from public.board_comments c
            where c.id = comment_id and public.board_can_see_thread(c.proposal_id, c.task_id)));

drop policy "members see meeting responses" on public.board_meeting_responses;
create policy "members see meeting responses" on public.board_meeting_responses
  for select to authenticated using (
    exists (select 1 from public.board_comments c
            where c.id = comment_id and public.board_can_see_thread(c.proposal_id, c.task_id)));

drop policy "members see the audit log" on public.board_audit;
create policy "members see the audit log" on public.board_audit
  for select to authenticated using (public.board_can_see_thread(proposal_id, task_id));

alter publication supabase_realtime add table public.board_tasks, public.board_task_submissions;
