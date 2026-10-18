-- ════════════════════════════════════════════════════════════════════════════
-- Creative Designer role + larger uploads
--
-- Run AFTER 20261017000000_task_assignees.sql (SQL Editor → paste → Run).
--
--   • Adds the role "Creative Designer" (id: designer). Like every board member,
--     a designer can sign in, see the board, submit proposals, be assigned tasks
--     and take part in discussions. The role is not a required approver on any
--     requisition type (change board_requisition_types if it should be).
--   • The list of roles now lives in ONE function, board_role_ids(). Adding a role
--     later means updating that function and board_role_label() — nothing else in
--     the database.
--   • Attachments: up to 50 MB per file (was 10 MB). 50 MB is also Supabase's
--     default per-file limit for a project; to go higher, raise
--     Project Settings → Storage → "Upload file size limit" first.
-- ════════════════════════════════════════════════════════════════════════════


-- ─── One source of truth for roles ────────────────────────────────────────

create function public.board_role_ids() returns text[]
language sql immutable as $$
  select array['president', 'ceo', 'cto', 'cio', 'cfo', 'designer']
$$;

create function public.board_is_role(r text) returns boolean
language sql immutable as $$ select r = any (public.board_role_ids()) $$;

create or replace function public.board_role_order(r text) returns int
language sql immutable as $$ select array_position(public.board_role_ids(), r) $$;

create or replace function public.board_role_label(r text) returns text
language sql immutable as $$
  select case r
    when 'president' then 'President'
    when 'designer' then 'Creative Designer'
    else upper(r)
  end
$$;

alter table public.board_members drop constraint if exists board_members_role_id_check;
alter table public.board_members add constraint board_members_role_id_check check (public.board_is_role(role_id));

alter table public.board_task_assignees drop constraint if exists board_task_assignees_role_id_check;
alter table public.board_task_assignees add constraint board_task_assignees_role_id_check check (public.board_is_role(role_id));


-- ─── Discussion: mentions and meeting invites accept every role ───────────
-- Same functions as before; only the role list now comes from board_role_ids().

create or replace function public.board_comment(
  p_proposal    uuid,
  p_body        text,
  p_parent      uuid default null,
  p_corrects    uuid default null,
  p_attachments jsonb default '[]',
  p_mentions    text[] default '{}',
  p_meeting     jsonb default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  m        board_members := board_require_member();
  p        board_proposals;
  body     text := btrim(coalesce(p_body, ''));
  roles    text[] := board_role_ids();
  mentions text[];
  invitees text[];
  meeting  jsonb;
  parent   board_comments;
  cid      uuid;
  kind     text;
begin
  if not board_can_see(p_proposal) then raise exception 'Proposal not found'; end if;
  select * into p from board_proposals where id = p_proposal;

  if p_parent is not null then
    select * into parent from board_comments where id = p_parent and proposal_id = p_proposal;
    if not found then raise exception 'The message you replied to does not exist'; end if;
  end if;
  if p_corrects is not null and not exists (
    select 1 from board_comments where id = p_corrects and proposal_id = p_proposal and author_user = m.user_id
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

  insert into board_comments (proposal_id, parent_id, corrects_id, author_role, author_user,
                              body, attachments, mentions, meeting, version)
  values (p_proposal, p_parent, p_corrects, m.role_id, m.user_id,
          body, coalesce(p_attachments, '[]'), mentions, meeting, (board_latest(p_proposal)).n)
  returning id into cid;

  insert into board_comment_reads (comment_id, role_id) values (cid, m.role_id);

  kind := case
    when meeting is not null then 'meeting_requested'
    when p_corrects is not null then 'correction'
    when p_parent is not null then 'replied'
    else 'commented' end;
  perform board_log(m, kind, p_proposal, left(body, 140));

  if cardinality(mentions) > 0 then
    perform board_notify(mentions, m.role_id, p_proposal,
      board_role_label(m.role_id) || ' mentioned you on ' || board_title(p_proposal));
  end if;
  if meeting is not null then
    perform board_notify(invitees, m.role_id, p_proposal,
      board_role_label(m.role_id) || ' requested a meeting about ' || board_title(p_proposal));
  end if;
  perform board_notify(
    array(select x from unnest(array[p.author_role, parent.author_role]) x where x is not null and not x = any (mentions)),
    m.role_id, p_proposal,
    board_role_label(m.role_id) || case when p_parent is null then ' commented on ' else ' replied on ' end
      || board_title(p_proposal));
  return cid;
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
  roles    text[] := board_role_ids();
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


-- ─── Larger attachments ───────────────────────────────────────────────────

update storage.buckets set file_size_limit = 52428800  -- 50 MB
 where id = 'board-attachments';
