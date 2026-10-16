-- ════════════════════════════════════════════════════════════════════════════
-- Tasks — several assignees per task
--
-- Run AFTER 20261016000000_board_tasks.sql (SQL Editor → paste → Run).
-- Existing tasks keep their assignee, status and history.
--
-- Each assignee hands in their own work and is reviewed on their own:
--   • the task is Done when every assignee's work is accepted;
--   • at the due date, only the assignees who haven't submitted are locked out
--     (when the task locks) — they, the creator and the admins are notified, naming
--     exactly who missed it. Assignees who already submitted are unaffected;
--   • moving the due date later reopens everyone who was locked out.
-- ════════════════════════════════════════════════════════════════════════════


-- ─── Per-assignee state ───────────────────────────────────────────────────

create table public.board_task_assignees (
  task_id             uuid not null references public.board_tasks (id),
  role_id             text not null check (role_id in ('president', 'ceo', 'cto', 'cio', 'cfo')),
  status              text not null default 'open'
                      check (status in ('open', 'submitted', 'changes_requested', 'done', 'missed', 'removed')),
  overdue_notified_at timestamptz,   -- set once this person's deadline has been handled
  added_at            timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  primary key (task_id, role_id)
);

-- Carry existing single-assignee tasks over.
insert into public.board_task_assignees (task_id, role_id, status, overdue_notified_at, added_at, updated_at)
select id, assignee_role,
       case when status in ('open', 'submitted', 'changes_requested', 'done', 'missed') then status else 'open' end,
       overdue_notified_at, created_at, updated_at
from public.board_tasks;

-- Submissions and reviews now say whose work they are about.
alter table public.board_task_submissions add column assignee_role text;
alter table public.board_task_submissions disable trigger board_task_submissions_append_only;
update public.board_task_submissions s
   set assignee_role = case when s.kind = 'submission' then s.by_role else t.assignee_role end
  from public.board_tasks t
 where t.id = s.task_id;
alter table public.board_task_submissions enable trigger board_task_submissions_append_only;
alter table public.board_task_submissions alter column assignee_role set not null;

create trigger board_task_assignees_no_delete before delete on public.board_task_assignees
  for each row execute function public.board_forbid_change();
create trigger board_task_assignees_no_truncate before truncate on public.board_task_assignees
  for each statement execute function public.board_forbid_change();


-- ─── Replace the single-assignee functions ────────────────────────────────

drop function public.board_task_handle_overdue(public.board_tasks);
drop function public.board_task_create(text, text, text, timestamptz, boolean, text, jsonb);
drop function public.board_task_update(uuid, text, text, text, boolean, text);
drop function public.board_task_review(uuid, text, text, timestamptz);

-- The task row now only holds what's shared; per-person state lives above.
-- Task status: open, done (everyone accepted), missed (nobody left who can still
-- submit, at least one locked out) or cancelled.
alter table public.board_tasks drop column assignee_role;
alter table public.board_tasks drop column overdue_notified_at;


-- ─── Helpers (internal) ───────────────────────────────────────────────────

create function public.board_role_order(r text) returns int
language sql immutable as $$ select array_position(array['president', 'ceo', 'cto', 'cio', 'cfo'], r) $$;

-- {cio, cfo} → "CIO and CFO"; {cto, cio, cfo} → "CTO, CIO and CFO"
create function public.board_role_list(r text[]) returns text
language sql immutable as $$
  select case
    when cardinality(r) is null or cardinality(r) = 0 then ''
    when cardinality(r) = 1 then board_role_label(r[1])
    else (select string_agg(board_role_label(x), ', ' order by i) from unnest(r[1:cardinality(r) - 1]) with ordinality u(x, i))
         || ' and ' || board_role_label(r[cardinality(r)])
  end
$$;

create function public.board_task_assignee_roles(p_task uuid) returns text[]
language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(role_id order by board_role_order(role_id)), '{}')
  from board_task_assignees where task_id = p_task and status <> 'removed'
$$;

create function public.board_task_refresh_status(p_task uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  cur     text;
  total   int;
  done    int;
  pending int;
  missed  int;
  nxt     text;
begin
  select status into cur from board_tasks where id = p_task;
  if cur = 'cancelled' then return; end if;
  select count(*) filter (where status <> 'removed'),
         count(*) filter (where status = 'done'),
         count(*) filter (where status in ('open', 'submitted', 'changes_requested')),
         count(*) filter (where status = 'missed')
    into total, done, pending, missed
    from board_task_assignees where task_id = p_task;
  nxt := case
    when total > 0 and done = total then 'done'
    when pending = 0 and missed > 0 then 'missed'
    else 'open' end;
  if nxt is distinct from cur then
    update board_tasks
       set status = nxt, updated_at = now(),
           closed_at = case when nxt in ('done', 'missed') then now() else null end
     where id = p_task;
  end if;
end $$;

-- Deadline passed: lock out (or flag) every assignee who still hadn't submitted.
-- Returns how many people it handled. Runs once per person per deadline.
create function public.board_task_handle_overdue(p_task uuid) returns int
language plpgsql security definer set search_path = public as $$
declare
  t    board_tasks;
  late text[];
begin
  select * into t from board_tasks where id = p_task;
  if not found or t.status = 'cancelled' or t.due_at is null or t.due_at >= now() then return 0; end if;
  late := array(
    select role_id from board_task_assignees
     where task_id = p_task and status in ('open', 'changes_requested') and overdue_notified_at is null
     order by board_role_order(role_id));
  if cardinality(late) = 0 then return 0; end if;

  if t.lock_on_overdue then
    update board_task_assignees set status = 'missed', overdue_notified_at = now(), updated_at = now()
     where task_id = p_task and role_id = any (late);
    insert into board_audit (actor_role, actor_user, actor_name, action, task_id, ref, detail)
    values ('system', null, 'System', 'task_locked', t.id, t.ref,
            'Due ' || board_fmt_time(t.due_at) || ' passed — locked for ' || board_role_list(late));
    perform board_notify_task(late || array[t.creator_role, 'president', 'ceo'], null, t.id,
      board_role_list(late) || case when cardinality(late) = 1 then ' was' else ' were' end
        || ' unable to submit ' || board_task_title(t) || ' by the due date (' || board_fmt_time(t.due_at)
        || '). Submission is now locked for ' || case when cardinality(late) = 1 then 'them' else 'each of them' end || '.');
  else
    update board_task_assignees set overdue_notified_at = now(), updated_at = now()
     where task_id = p_task and role_id = any (late);
    insert into board_audit (actor_role, actor_user, actor_name, action, task_id, ref, detail)
    values ('system', null, 'System', 'task_overdue', t.id, t.ref,
            'Due ' || board_fmt_time(t.due_at) || ' passed — overdue for ' || board_role_list(late));
    perform board_notify_task(late || array[t.creator_role], null, t.id,
      board_task_title(t) || ' is overdue for ' || board_role_list(late) || ' (due ' || board_fmt_time(t.due_at) || ')');
  end if;

  perform board_task_refresh_status(p_task);
  return cardinality(late);
end $$;

-- Set a new due date: re-arms the deadline for everyone still working and reopens
-- anyone who was locked out. Callers check who may do it.
create function public.board_task_apply_due(m public.board_members, p_task uuid, p_due timestamptz)
returns void language plpgsql security definer set search_path = public as $$
declare
  t        board_tasks;
  reopened text[];
begin
  select * into t from board_tasks where id = p_task;
  reopened := array(select role_id from board_task_assignees where task_id = p_task and status = 'missed' order by board_role_order(role_id));

  update board_tasks set due_at = p_due, updated_at = now() where id = p_task;
  update board_task_assignees
     set status = case when status = 'missed' then 'open' else status end,
         overdue_notified_at = null, updated_at = now()
   where task_id = p_task and status in ('open', 'changes_requested', 'missed');
  perform board_task_refresh_status(p_task);

  perform board_log_task(m, case when cardinality(reopened) > 0 then 'task_reopened' else 'task_due_set' end, p_task,
    coalesce('Due date ' || board_fmt_time(t.due_at) || ' → ', 'Due date set to ') || board_fmt_time(p_due)
      || case when cardinality(reopened) > 0 then ' · reopened for ' || board_role_list(reopened) else '' end);
  perform board_notify_task(
    board_task_assignee_roles(p_task) || array[t.creator_role]
      || case when cardinality(reopened) > 0 then array['president', 'ceo'] else '{}'::text[] end,
    m.role_id, p_task,
    board_role_label(m.role_id)
      || case when cardinality(reopened) > 0 then ' reopened ' || board_task_title(t) || ' for ' || board_role_list(reopened)
              else ' set the due date of ' || board_task_title(t) end
      || ' — due ' || board_fmt_time(p_due));
end $$;


-- ─── Actions ──────────────────────────────────────────────────────────────

create or replace function public.board_task_sweep() returns integer
language plpgsql security definer set search_path = public as $$
declare
  tid uuid;
  n   int := 0;
begin
  if auth.uid() is not null and not board_is_member() then
    raise exception 'You are not an active board member' using errcode = '42501';
  end if;
  for tid in
    select distinct a.task_id
      from board_task_assignees a join board_tasks t on t.id = a.task_id
     where t.due_at < now() and t.status <> 'cancelled'
       and a.status in ('open', 'changes_requested') and a.overdue_notified_at is null
  loop
    perform 1 from board_tasks where id = tid for update skip locked;
    if found then n := n + board_task_handle_overdue(tid); end if;
  end loop;
  return n;
end $$;

create function public.board_task_create(
  p_title       text,
  p_description text default '',
  p_assignees   text[] default '{}',
  p_due         timestamptz default null,
  p_lock        boolean default true,
  p_priority    text default 'normal',
  p_attachments jsonb default '[]'
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  m   board_members := board_require_member();
  t   board_tasks;
  who text[] := array(select x from unnest(coalesce(p_assignees, '{}')) x where x is not null group by x order by board_role_order(x));
begin
  if btrim(coalesce(p_title, '')) = '' then raise exception 'Give the task a title.'; end if;
  if cardinality(who) = 0 then raise exception 'Choose at least one person to assign the task to.'; end if;
  if exists (select 1 from unnest(who) x where not exists (select 1 from board_members where role_id = x and active)) then
    raise exception 'Every assignee must be an active board member.';
  end if;
  if p_due is not null and p_due <= now() then raise exception 'The due date must be in the future.'; end if;
  if coalesce(p_priority, 'normal') not in ('low', 'normal', 'high', 'urgent') then
    raise exception 'Unknown priority %', p_priority;
  end if;

  insert into board_tasks (ref, title, description, attachments, priority, creator_role, creator_user, due_at, lock_on_overdue)
  values ('TSK-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('board_task_seq')::text, 3, '0'),
          btrim(p_title), btrim(coalesce(p_description, '')), coalesce(p_attachments, '[]'),
          coalesce(p_priority, 'normal'), m.role_id, m.user_id, p_due, coalesce(p_lock, true))
  returning * into t;
  insert into board_task_assignees (task_id, role_id) select t.id, x from unnest(who) x;

  perform board_log_task(m, 'task_created', t.id,
    'Assigned to ' || board_role_list(who)
      || coalesce(' · due ' || board_fmt_time(p_due), ' · no due date yet')
      || case when coalesce(p_lock, true) then ' · locks when overdue' else '' end);
  perform board_notify_task(who, m.role_id, t.id,
    board_role_label(m.role_id) || ' assigned you ' || board_task_title(t)
      || case when cardinality(who) > 1 then ' (with ' || board_role_list(who) || ')' else '' end
      || coalesce(' — due ' || board_fmt_time(p_due), ' — please set a due date'));
  return t.id;
end $$;

create or replace function public.board_task_set_due(p_task uuid, p_due timestamptz)
returns void language plpgsql security definer set search_path = public as $$
declare
  m       board_members := board_require_member();
  t       board_tasks := board_lock_task_row(p_task);
  manager boolean := m.user_id = t.creator_user or board_is_admin(m.role_id);
begin
  if t.status in ('done', 'cancelled') then raise exception 'This task is closed.'; end if;
  if p_due is null or p_due <= now() then raise exception 'Pick a due date in the future.'; end if;
  if not manager then
    if not m.role_id = any (board_task_assignee_roles(p_task)) then
      raise exception 'Only the creator, an assignee or an admin can set the due date' using errcode = '42501';
    end if;
    if t.due_at is not null then
      raise exception 'The due date is already set — ask the task creator or an admin to change it.' using errcode = '42501';
    end if;
  end if;
  perform board_task_apply_due(m, p_task, p_due);
end $$;

create function public.board_task_update(
  p_task        uuid,
  p_title       text,
  p_description text,
  p_priority    text,
  p_lock        boolean,
  p_assignees   text[]
) returns void language plpgsql security definer set search_path = public as $$
declare
  m       board_members := board_require_member();
  t       board_tasks := board_lock_task_row(p_task);
  who     text[] := array(select x from unnest(coalesce(p_assignees, '{}')) x where x is not null group by x order by board_role_order(x));
  assigned text[] := board_task_assignee_roles(p_task);
  added   text[];
  removed text[];
  changes text[] := '{}';
  blocked text;
begin
  if not (m.user_id = t.creator_user or board_is_admin(m.role_id)) then
    raise exception 'Only the task creator or an admin can edit this task' using errcode = '42501';
  end if;
  if t.status in ('done', 'cancelled') then raise exception 'This task is closed.'; end if;
  if btrim(coalesce(p_title, '')) = '' then raise exception 'Give the task a title.'; end if;
  if p_priority not in ('low', 'normal', 'high', 'urgent') then raise exception 'Unknown priority %', p_priority; end if;
  if cardinality(who) = 0 then raise exception 'Choose at least one person to assign the task to.'; end if;
  if exists (select 1 from unnest(who) x where not exists (select 1 from board_members where role_id = x and active)) then
    raise exception 'Every assignee must be an active board member.';
  end if;

  added := array(select x from unnest(who) x where not x = any (assigned) order by board_role_order(x));
  removed := array(select x from unnest(assigned) x where not x = any (who) order by board_role_order(x));
  select role_id into blocked from board_task_assignees
   where task_id = p_task and role_id = any (removed) and status = 'done' limit 1;
  if blocked is not null then
    raise exception '%’s work is already accepted — they can’t be removed from the task.', board_role_label(blocked);
  end if;

  if btrim(p_title) <> t.title then changes := array_append(changes, 'title'); end if;
  if btrim(coalesce(p_description, '')) <> t.description then changes := array_append(changes, 'description'); end if;
  if p_priority <> t.priority then changes := array_append(changes, 'priority → ' || p_priority); end if;
  if p_lock <> t.lock_on_overdue then
    changes := array_append(changes, case when p_lock then 'lock when overdue: on' else 'lock when overdue: off' end);
  end if;
  if cardinality(added) > 0 then changes := array_append(changes, 'assigned ' || board_role_list(added)); end if;
  if cardinality(removed) > 0 then changes := array_append(changes, 'removed ' || board_role_list(removed)); end if;
  if cardinality(changes) = 0 then return; end if;

  update board_tasks
     set title = btrim(p_title), description = btrim(coalesce(p_description, '')), priority = p_priority,
         lock_on_overdue = p_lock, updated_at = now()
   where id = t.id;
  insert into board_task_assignees (task_id, role_id) select t.id, x from unnest(added) x
  on conflict (task_id, role_id) do update set status = 'open', overdue_notified_at = null, updated_at = now();
  update board_task_assignees set status = 'removed', updated_at = now() where task_id = t.id and role_id = any (removed);
  perform board_task_refresh_status(t.id);
  select * into t from board_tasks where id = p_task;

  perform board_log_task(m, 'task_edited', t.id, array_to_string(changes, ', '));
  if cardinality(added) > 0 then
    perform board_notify_task(added, m.role_id, t.id,
      board_role_label(m.role_id) || ' assigned you ' || board_task_title(t) || coalesce(' — due ' || board_fmt_time(t.due_at), ''));
  end if;
  if cardinality(removed) > 0 then
    perform board_notify_task(removed, m.role_id, t.id,
      board_role_label(m.role_id) || ' removed you from ' || board_task_title(t));
  end if;
  perform board_notify_task(array(select x from unnest(who) x where not x = any (added)), m.role_id, t.id,
    board_role_label(m.role_id) || ' updated ' || board_task_title(t) || ' (' || array_to_string(changes, ', ') || ')');
end $$;

-- An assignee hands in their own work. Returns 'submitted', or 'locked' when the
-- due date has passed on a task that locks (recorded and notified, not raised).
create or replace function public.board_task_submit(p_task uuid, p_note text default '', p_attachments jsonb default '[]')
returns text language plpgsql security definer set search_path = public as $$
declare
  m    board_members := board_require_member();
  t    board_tasks := board_lock_task_row(p_task);
  a    board_task_assignees;
  note text := btrim(coalesce(p_note, ''));
begin
  select * into a from board_task_assignees where task_id = p_task and role_id = m.role_id and status <> 'removed';
  if not found then raise exception 'Only an assignee can submit this task' using errcode = '42501'; end if;
  if t.status = 'cancelled' then raise exception 'This task was cancelled.'; end if;

  if a.status = 'missed'
     or (a.status in ('open', 'changes_requested') and t.lock_on_overdue and t.due_at is not null and t.due_at < now()) then
    if a.status <> 'missed' then perform board_task_handle_overdue(p_task); end if;
    perform board_log_task(m, 'task_submit_blocked', p_task, 'Tried to submit after the due date — locked for ' || board_role_label(m.role_id));
    return 'locked';
  end if;

  if a.status not in ('open', 'changes_requested') then
    raise exception 'You can’t submit right now (your status: %).', replace(a.status, '_', ' ');
  end if;
  if note = '' and jsonb_array_length(coalesce(p_attachments, '[]')) = 0 then
    raise exception 'Add a note or attach your work before submitting.';
  end if;

  insert into board_task_submissions (task_id, kind, assignee_role, by_role, by_user, by_name, note, attachments)
  values (p_task, 'submission', m.role_id, m.role_id, m.user_id, m.name, note, coalesce(p_attachments, '[]'));
  update board_task_assignees set status = 'submitted', updated_at = now() where task_id = p_task and role_id = m.role_id;
  update board_tasks set updated_at = now() where id = p_task;

  perform board_log_task(m, 'task_submitted', p_task, left(note, 140));
  perform board_notify_task(array[t.creator_role], m.role_id, p_task,
    board_role_label(m.role_id) || ' submitted their work on ' || board_task_title(t) || ' for your review');
  return 'submitted';
end $$;

-- Creator or admin reviews one assignee's submission.
create function public.board_task_review(
  p_task     uuid,
  p_assignee text,
  p_decision text,
  p_note     text default '',
  p_new_due  timestamptz default null
) returns void language plpgsql security definer set search_path = public as $$
declare
  m    board_members := board_require_member();
  t    board_tasks := board_lock_task_row(p_task);
  note text := btrim(coalesce(p_note, ''));
begin
  if not (m.user_id = t.creator_user or board_is_admin(m.role_id)) then
    raise exception 'Only the task creator or an admin can review this task' using errcode = '42501';
  end if;
  if not exists (select 1 from board_task_assignees where task_id = p_task and role_id = p_assignee and status = 'submitted') then
    raise exception 'There is no submission from % waiting for review.', coalesce(board_role_label(p_assignee), 'that person');
  end if;

  if p_decision = 'accept' then
    insert into board_task_submissions (task_id, kind, assignee_role, by_role, by_user, by_name, note)
    values (p_task, 'accepted', p_assignee, m.role_id, m.user_id, m.name, note);
    update board_task_assignees set status = 'done', updated_at = now() where task_id = p_task and role_id = p_assignee;
    perform board_task_refresh_status(p_task);
    perform board_log_task(m, 'task_accepted', p_task, board_role_label(p_assignee) || coalesce(nullif(' · ' || note, ' · '), ''));
    perform board_notify_task(array[p_assignee], m.role_id, p_task,
      board_role_label(m.role_id) || ' accepted your work on ' || board_task_title(t));
    if (select status from board_tasks where id = p_task) = 'done' then
      perform board_notify_task(board_task_assignee_roles(p_task) || array[t.creator_role], null, p_task,
        board_task_title(t) || ' is DONE — everyone’s work has been accepted');
    end if;
  elsif p_decision = 'changes' then
    if note = '' then raise exception 'Say what needs to change.'; end if;
    if p_new_due is not null and p_new_due <= now() then raise exception 'The new due date must be in the future.'; end if;
    insert into board_task_submissions (task_id, kind, assignee_role, by_role, by_user, by_name, note)
    values (p_task, 'changes_requested', p_assignee, m.role_id, m.user_id, m.name, note);
    update board_task_assignees set status = 'changes_requested', overdue_notified_at = null, updated_at = now()
     where task_id = p_task and role_id = p_assignee;
    perform board_log_task(m, 'task_changes_requested', p_task, board_role_label(p_assignee) || ' · ' || note);
    perform board_notify_task(array[p_assignee], m.role_id, p_task,
      board_role_label(m.role_id) || ' requested changes to your work on ' || board_task_title(t));
    if p_new_due is not null then perform board_task_apply_due(m, p_task, p_new_due); end if;
  else
    raise exception 'Unknown decision %', p_decision;
  end if;
end $$;

create or replace function public.board_task_cancel(p_task uuid, p_reason text)
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
  perform board_notify_task(board_task_assignee_roles(t.id) || array[t.creator_role], m.role_id, t.id,
    board_role_label(m.role_id) || ' cancelled ' || board_task_title(t) || ': ' || left(reason, 120));
end $$;

create or replace function public.board_task_comment(
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
    array(select x from unnest(array[t.creator_role, parent.author_role] || board_task_assignee_roles(p_task)) x
          where x is not null and not x = any (mentions)),
    m.role_id, p_task,
    board_role_label(m.role_id) || case when p_parent is null then ' commented on ' else ' replied on ' end || board_task_title(t));
  return cid;
end $$;


-- ─── Permissions ──────────────────────────────────────────────────────────

do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('board_role_order', 'board_role_list', 'board_task_assignee_roles', 'board_task_refresh_status',
                        'board_task_handle_overdue', 'board_task_apply_due', 'board_task_create', 'board_task_update',
                        'board_task_review')
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
  end loop;
end $$;

grant execute on function
  public.board_task_create(text, text, text[], timestamptz, boolean, text, jsonb),
  public.board_task_update(uuid, text, text, text, boolean, text[]),
  public.board_task_review(uuid, text, text, text, timestamptz)
to authenticated;

alter table public.board_task_assignees enable row level security;
revoke all on public.board_task_assignees from anon;
revoke insert, update, delete, truncate on public.board_task_assignees from authenticated;
create policy "members see task assignees" on public.board_task_assignees
  for select to authenticated using (public.board_is_member());

alter publication supabase_realtime add table public.board_task_assignees;
