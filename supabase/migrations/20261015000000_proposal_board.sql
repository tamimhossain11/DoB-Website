-- ════════════════════════════════════════════════════════════════════════════
-- Proposal Board — Internal Workstation & Board Approval (Phase 1)
--
-- Run once on a new Supabase project:
--   Dashboard → SQL Editor → New query → paste this file → Run
--   (or with the Supabase CLI: `supabase db push`)
--
-- Design:
--   • Clients can only READ (row-level security). Every write goes through the
--     board_* functions at the bottom, which enforce the approval workflow on the
--     server — the browser can't skip a step or approve on someone else's behalf.
--   • History is append-only. Triggers block UPDATE/DELETE/TRUNCATE on decisions,
--     comments, views, read receipts and the audit log, for everyone — including
--     the dashboard. A submitted version can never be edited.
--   • Identity: every action records the role AND the individual user who took it.
--
-- Keep in sync with src/board/workflow.js (status rules) when changing either.
-- ════════════════════════════════════════════════════════════════════════════


-- ─── Board members ─────────────────────────────────────────────────────────
-- Links a Supabase Auth user to a board role. Add people with
-- supabase/members.sql. `on delete restrict` keeps auth users that have
-- history from being deleted; set active = false instead.

create table public.board_members (
  user_id    uuid primary key references auth.users (id) on delete restrict,
  role_id    text not null check (role_id in ('president', 'ceo', 'cto', 'cio', 'cfo')),
  name       text not null default '',
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
-- One active holder per role at a time.
create unique index board_members_one_active_per_role on public.board_members (role_id) where active;


-- ─── Requisition types and their REQUIRED approvers ───────────────────────
-- Source of truth for who must approve what. President and CEO are on every
-- type. Final approval needs all of them (minus the author, who is recused).

create table public.board_requisition_types (
  id        text primary key,
  label     text not null,
  approvers text[] not null
);

insert into public.board_requisition_types (id, label, approvers) values
  ('proposal',      'Proposal',              '{president,ceo}'),
  ('event-budget',  'Event budget',          '{president,ceo,cfo}'),
  ('course-launch', 'Course launch',         '{president,ceo,cio}'),
  ('technical',     'Technical requisition', '{president,ceo,cto,cfo}');


-- ─── Proposals and versions ────────────────────────────────────────────────

create sequence public.board_ref_seq;

create table public.board_proposals (
  id          uuid primary key default gen_random_uuid(),
  ref         text not null unique,
  type        text not null references public.board_requisition_types (id),
  author_role text not null,
  author_user uuid not null references auth.users (id),
  approvers   text[] not null, -- snapshot at creation; later rule changes don't rewrite history
  created_at  timestamptz not null default now()
);

create table public.board_versions (
  proposal_id  uuid not null references public.board_proposals (id),
  n            int  not null,
  title        text not null check (length(title) between 1 and 160),
  summary      text not null default '' check (length(summary) <= 400),
  body         text not null default '' check (length(body) <= 50000),
  amount       numeric(14, 2) check (amount >= 0),
  attachments  jsonb not null default '[]' check (jsonb_typeof(attachments) = 'array'),
  created_at   timestamptz not null default now(),
  submitted_at timestamptz,
  primary key (proposal_id, n)
);

create table public.board_decisions (
  proposal_id uuid not null,
  version     int  not null,
  by_role     text not null,
  by_user     uuid not null references auth.users (id),
  by_name     text not null default '',
  decision    text not null check (decision in ('approve', 'revise', 'reject')),
  note        text not null default '',
  at          timestamptz not null default now(),
  primary key (proposal_id, version, by_role), -- one decision per role per version
  foreign key (proposal_id, version) references public.board_versions (proposal_id, n)
);

-- First time each role opened each version (drives Submitted → Under review).
-- Every individual open is also written to board_audit.
create table public.board_views (
  proposal_id uuid not null,
  version     int  not null,
  role_id     text not null,
  first_at    timestamptz not null default now(),
  primary key (proposal_id, version, role_id),
  foreign key (proposal_id, version) references public.board_versions (proposal_id, n)
);


-- ─── Discussion ────────────────────────────────────────────────────────────

create table public.board_comments (
  id          uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.board_proposals (id),
  parent_id   uuid references public.board_comments (id),
  corrects_id uuid references public.board_comments (id),
  author_role text not null,
  author_user uuid not null references auth.users (id),
  body        text not null default '' check (length(body) <= 10000),
  attachments jsonb not null default '[]' check (jsonb_typeof(attachments) = 'array'),
  mentions    text[] not null default '{}',
  meeting     jsonb, -- { when, duration, where, invitees[] } for meeting requests
  version     int  not null,
  at          timestamptz not null default now()
);
create index on public.board_comments (proposal_id);

create table public.board_comment_reads (
  comment_id uuid not null references public.board_comments (id),
  role_id    text not null,
  at         timestamptz not null default now(),
  primary key (comment_id, role_id)
);

create table public.board_meeting_responses (
  comment_id uuid not null references public.board_comments (id),
  role_id    text not null,
  response   text not null check (response in ('accept', 'decline')),
  at         timestamptz not null default now(),
  primary key (comment_id, role_id)
);


-- ─── Notifications and audit ───────────────────────────────────────────────

create table public.board_notifications (
  id          uuid primary key default gen_random_uuid(),
  to_role     text not null,
  proposal_id uuid not null references public.board_proposals (id),
  text        text not null,
  at          timestamptz not null default now(),
  read        boolean not null default false
);
create index on public.board_notifications (to_role, read);

create table public.board_audit (
  id          bigint generated always as identity primary key,
  at          timestamptz not null default now(),
  actor_role  text not null,
  actor_user  uuid references auth.users (id),
  actor_name  text not null default '',
  action      text not null,
  proposal_id uuid references public.board_proposals (id),
  ref         text,
  version     int,
  detail      text not null default ''
);
create index on public.board_audit (proposal_id);


-- ════════════════════════════════════════════════════════════════════════════
-- Append-only guarantees
-- ════════════════════════════════════════════════════════════════════════════

create function public.board_forbid_change() returns trigger
language plpgsql as $$
begin
  raise exception '% is append-only: % is not allowed', tg_table_name, tg_op
    using errcode = '42501';
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'board_proposals', 'board_decisions', 'board_views', 'board_comments',
    'board_comment_reads', 'board_audit'
  ] loop
    execute format(
      'create trigger %1$s_append_only before update or delete on public.%1$s
         for each row execute function public.board_forbid_change()', t);
    execute format(
      'create trigger %1$s_no_truncate before truncate on public.%1$s
         for each statement execute function public.board_forbid_change()', t);
  end loop;

  -- Meeting RSVPs may change (every change is audited); notifications may be
  -- marked read. Neither can be deleted.
  foreach t in array array['board_meeting_responses', 'board_notifications', 'board_versions'] loop
    execute format(
      'create trigger %1$s_no_delete before delete on public.%1$s
         for each row execute function public.board_forbid_change()', t);
    execute format(
      'create trigger %1$s_no_truncate before truncate on public.%1$s
         for each statement execute function public.board_forbid_change()', t);
  end loop;
end $$;

-- A version can be edited only while it is an unsubmitted draft. Once submitted
-- it is frozen; changes have to become a new version.
create function public.board_guard_version() returns trigger
language plpgsql as $$
begin
  if old.submitted_at is not null then
    raise exception 'V% has been submitted and is locked; revise to create a new version', old.n
      using errcode = '42501';
  end if;
  if new.proposal_id <> old.proposal_id or new.n <> old.n or new.created_at <> old.created_at then
    raise exception 'Version identity cannot change' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger board_versions_lock before update on public.board_versions
  for each row execute function public.board_guard_version();

create function public.board_guard_notification() returns trigger
language plpgsql as $$
begin
  if (new.id, new.to_role, new.proposal_id, new.text, new.at)
     is distinct from (old.id, old.to_role, old.proposal_id, old.text, old.at) then
    raise exception 'Only the read flag of a notification can change' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger board_notifications_read_only before update on public.board_notifications
  for each row execute function public.board_guard_notification();


-- ════════════════════════════════════════════════════════════════════════════
-- Helpers (internal — not callable from the browser)
-- ════════════════════════════════════════════════════════════════════════════

create function public.board_is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from board_members where user_id = auth.uid() and active)
$$;

create function public.board_my_role() returns text
language sql stable security definer set search_path = public as $$
  select role_id from board_members where user_id = auth.uid() and active
$$;

-- Drafts are private to their author until first submitted.
create function public.board_can_see(p_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select board_is_member() and exists (
    select 1 from board_proposals p
    where p.id = p_id
      and (p.author_user = auth.uid()
           or exists (select 1 from board_versions v where v.proposal_id = p.id and v.submitted_at is not null))
  )
$$;

create function public.board_require_member() returns public.board_members
language plpgsql stable security definer set search_path = public as $$
declare m board_members;
begin
  select * into m from board_members where user_id = auth.uid() and active;
  if not found then
    raise exception 'You are not an active board member' using errcode = '42501';
  end if;
  return m;
end $$;

create function public.board_role_label(r text) returns text
language sql immutable as $$
  select case r when 'president' then 'President' else upper(r) end
$$;

create function public.board_latest(p_id uuid) returns public.board_versions
language sql stable security definer set search_path = public as $$
  select * from board_versions where proposal_id = p_id order by n desc limit 1
$$;

-- "DOB-2026-001 “Title”" — used in notification text.
create function public.board_title(p_id uuid) returns text
language sql stable security definer set search_path = public as $$
  select p.ref || ' “' || (board_latest(p.id)).title || '”' from board_proposals p where p.id = p_id
$$;

-- Required approvers minus the author (recused from their own submission).
create function public.board_reviewers(p_id uuid) returns text[]
language sql stable security definer set search_path = public as $$
  select array(
    select r from board_proposals p, unnest(p.approvers) with ordinality as a(r, i)
    where p.id = p_id and r <> p.author_role order by i
  )
$$;

-- Mirrors statusOf() in src/board/workflow.js.
create function public.board_status(p_id uuid) returns text
language plpgsql stable security definer set search_path = public as $$
declare
  v        board_versions := board_latest(p_id);
  req      text[] := board_reviewers(p_id);
  approved int;
begin
  if v.submitted_at is null then return 'draft'; end if;
  if exists (select 1 from board_decisions d where d.proposal_id = p_id and d.version = v.n and d.decision = 'reject') then
    return 'rejected';
  end if;
  if exists (select 1 from board_decisions d where d.proposal_id = p_id and d.version = v.n and d.decision = 'revise') then
    return 'revision_requested';
  end if;

  select count(*) into approved from board_decisions d
  where d.proposal_id = p_id and d.version = v.n and d.decision = 'approve' and d.by_role = any (req);

  if approved = cardinality(req) then return 'approved'; end if;
  if approved > 0 then return 'partially_approved'; end if;
  if exists (select 1 from board_views w where w.proposal_id = p_id and w.version = v.n and w.role_id = any (req)) then
    return 'under_review';
  end if;
  return 'submitted';
end $$;

create function public.board_log(p_actor public.board_members, p_action text, p_proposal uuid, p_detail text default '')
returns void language sql security definer set search_path = public as $$
  insert into board_audit (actor_role, actor_user, actor_name, action, proposal_id, ref, version, detail)
  select p_actor.role_id, p_actor.user_id, p_actor.name, p_action, p.id, p.ref,
         (select max(n) from board_versions where proposal_id = p.id), coalesce(p_detail, '')
  from board_proposals p where p.id = p_proposal
$$;

-- Notify each role in p_to once, skipping the person who caused it.
create function public.board_notify(p_to text[], p_from text, p_proposal uuid, p_text text)
returns void language sql security definer set search_path = public as $$
  insert into board_notifications (to_role, proposal_id, text)
  select distinct r, p_proposal, p_text from unnest(p_to) as r
  where r is not null and r is distinct from p_from
$$;

create function public.board_write_version(p_id uuid, p_n int, p_fields jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  t text := btrim(coalesce(p_fields ->> 'title', ''));
begin
  if t = '' then raise exception 'Give the proposal a title.'; end if;
  insert into board_versions (proposal_id, n, title, summary, body, amount, attachments)
  values (
    p_id, p_n, t,
    btrim(coalesce(p_fields ->> 'summary', '')),
    btrim(coalesce(p_fields ->> 'body', '')),
    nullif(p_fields ->> 'amount', '')::numeric,
    coalesce(p_fields -> 'attachments', '[]')
  )
  on conflict (proposal_id, n) do update set
    title = excluded.title, summary = excluded.summary, body = excluded.body,
    amount = excluded.amount, attachments = excluded.attachments;
end $$;

create function public.board_submit_current(m public.board_members, p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v board_versions := board_latest(p_id);
begin
  if v.submitted_at is not null then raise exception 'V% is already submitted', v.n; end if;
  if v.summary = '' then raise exception 'Add a short summary before submitting.'; end if;

  update board_versions set submitted_at = now() where proposal_id = p_id and n = v.n;
  perform board_log(m, 'submitted', p_id, 'V' || v.n || ' submitted for approval');
  perform board_notify(board_reviewers(p_id), m.role_id, p_id,
    case when v.n > 1
      then board_role_label(m.role_id) || ' submitted V' || v.n || ' of ' || board_title(p_id) || ' — new approval cycle'
      else board_role_label(m.role_id) || ' submitted ' || board_title(p_id) || ' for your approval'
    end);
end $$;

create function public.board_lock_own(m public.board_members, p_id uuid)
returns public.board_proposals language plpgsql security definer set search_path = public as $$
declare p board_proposals;
begin
  select * into p from board_proposals where id = p_id for update;
  if not found then raise exception 'Proposal not found'; end if;
  if p.author_user <> m.user_id then raise exception 'Only the author can change this proposal' using errcode = '42501'; end if;
  return p;
end $$;


-- ════════════════════════════════════════════════════════════════════════════
-- Actions (called from the browser with supabase.rpc)
-- ════════════════════════════════════════════════════════════════════════════

-- Create a proposal (V1). Returns its id.
create function public.board_create(p_type text, p_fields jsonb, p_submit boolean default false)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  m   board_members := board_require_member();
  t   board_requisition_types;
  pid uuid;
begin
  select * into t from board_requisition_types where id = p_type;
  if not found then raise exception 'Unknown requisition type %', p_type; end if;
  -- Validate before taking a reference number, so rejected attempts leave no gaps.
  if btrim(coalesce(p_fields ->> 'title', '')) = '' then raise exception 'Give the proposal a title.'; end if;
  if p_submit and btrim(coalesce(p_fields ->> 'summary', '')) = '' then
    raise exception 'Add a short summary before submitting.';
  end if;

  insert into board_proposals (ref, type, author_role, author_user, approvers)
  values ('DOB-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('board_ref_seq')::text, 3, '0'),
          t.id, m.role_id, m.user_id, t.approvers)
  returning id into pid;

  perform board_write_version(pid, 1, p_fields);
  perform board_log(m, 'created', pid, t.label || ' drafted');
  if p_submit then perform board_submit_current(m, pid); end if;
  return pid;
end $$;

-- Edit the current version while it is still an unsubmitted draft.
create function public.board_edit_draft(p_id uuid, p_fields jsonb, p_submit boolean default false)
returns void language plpgsql security definer set search_path = public as $$
declare
  m board_members := board_require_member();
  p board_proposals := board_lock_own(m, p_id);
  v board_versions := board_latest(p_id);
begin
  if v.submitted_at is not null then raise exception 'Only unsubmitted drafts can be edited'; end if;
  perform board_write_version(p_id, v.n, p_fields);
  perform board_log(m, 'edited_draft', p_id, 'V' || v.n || ' draft edited');
  if p_submit then perform board_submit_current(m, p_id); end if;
end $$;

-- Revise a submitted proposal: the current version (and any approvals in it)
-- stays untouched; the change becomes V(n+1) with a fresh approval cycle.
create function public.board_revise(p_id uuid, p_fields jsonb, p_submit boolean default false)
returns void language plpgsql security definer set search_path = public as $$
declare
  m board_members := board_require_member();
  p board_proposals := board_lock_own(m, p_id);
  s text := board_status(p_id);
  n int := (board_latest(p_id)).n + 1;
begin
  if s = 'draft' then raise exception 'The current version is still a draft — edit it instead'; end if;
  if s in ('approved', 'rejected') then
    raise exception 'This proposal is % and closed — it can''t be revised',
      case s when 'approved' then 'final approved' else 'rejected' end;
  end if;
  perform board_write_version(p_id, n, p_fields);
  perform board_log(m, 'new_version', p_id, 'V' || n || ' created from V' || (n - 1));
  if p_submit then perform board_submit_current(m, p_id); end if;
end $$;

create function public.board_submit(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  m board_members := board_require_member();
  p board_proposals := board_lock_own(m, p_id);
begin
  perform board_submit_current(m, p_id);
end $$;

-- Every open is audited; a reviewer's first open of a version starts review.
create function public.board_view(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  m board_members := board_require_member();
  v board_versions := board_latest(p_id);
begin
  if not board_can_see(p_id) then raise exception 'Proposal not found'; end if;
  if v.submitted_at is not null then
    insert into board_views (proposal_id, version, role_id) values (p_id, v.n, m.role_id)
    on conflict do nothing;
  end if;
  perform board_log(m, 'viewed', p_id);
end $$;

create function public.board_decide(p_id uuid, p_decision text, p_note text default '')
returns void language plpgsql security definer set search_path = public as $$
declare
  m      board_members := board_require_member();
  p      board_proposals;
  v      board_versions;
  s      text;
  note   text := btrim(coalesce(p_note, ''));
  after  text;
begin
  -- Lock the proposal so two approvers deciding at once are applied in order.
  select * into p from board_proposals where id = p_id for update;
  if not found or not board_can_see(p_id) then raise exception 'Proposal not found'; end if;
  v := board_latest(p_id);
  s := board_status(p_id);

  if s not in ('submitted', 'under_review', 'partially_approved') then
    raise exception 'V% is not open for decisions (status: %)', v.n, replace(s, '_', ' ');
  end if;
  if not (m.role_id = any (board_reviewers(p_id))) then
    raise exception 'Your role is not a required approver for this submission' using errcode = '42501';
  end if;
  if p_decision not in ('approve', 'revise', 'reject') then
    raise exception 'Unknown decision %', p_decision;
  end if;
  if p_decision <> 'approve' and note = '' then
    raise exception 'A reason is required to reject or request a revision';
  end if;
  if exists (select 1 from board_decisions where proposal_id = p_id and version = v.n and by_role = m.role_id) then
    raise exception 'You have already decided on V%', v.n;
  end if;

  insert into board_decisions (proposal_id, version, by_role, by_user, by_name, decision, note)
  values (p_id, v.n, m.role_id, m.user_id, m.name, p_decision, note);

  perform board_log(m,
    case p_decision when 'approve' then 'approved' when 'reject' then 'rejected' else 'revision_requested' end,
    p_id, note);
  perform board_notify(array[p.author_role], m.role_id, p_id,
    board_role_label(m.role_id) || ': '
      || case p_decision when 'approve' then 'approved' when 'reject' then 'rejected' else 'revision requested' end
      || ' — ' || board_title(p_id));

  after := board_status(p_id);
  if after in ('approved', 'rejected') then
    perform board_log(m, case after when 'approved' then 'final_approved' else 'final_rejected' end, p_id,
      case after when 'approved' then 'All required approvals recorded' else 'Closed by rejection' end);
    perform board_notify(array[p.author_role] || board_reviewers(p_id), null, p_id,
      board_title(p_id) || ' is ' || case after when 'approved' then 'FINAL APPROVED' else 'REJECTED' end);
  end if;
end $$;

-- Post to the discussion. p_parent → reply; p_corrects → correction to one of
-- your own earlier messages (the original stays); p_meeting → meeting request.
create function public.board_comment(
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
  roles    text[] := array['president', 'ceo', 'cto', 'cio', 'cfo'];
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

create function public.board_respond_meeting(p_comment uuid, p_response text)
returns void language plpgsql security definer set search_path = public as $$
declare
  m board_members := board_require_member();
  c board_comments;
begin
  select * into c from board_comments where id = p_comment;
  if not found or c.meeting is null or not board_can_see(c.proposal_id) then
    raise exception 'Meeting request not found';
  end if;
  if not (c.meeting -> 'invitees') ? m.role_id then
    raise exception 'You were not invited to this meeting' using errcode = '42501';
  end if;
  if p_response not in ('accept', 'decline') then raise exception 'Unknown response %', p_response; end if;

  insert into board_meeting_responses (comment_id, role_id, response) values (p_comment, m.role_id, p_response)
  on conflict (comment_id, role_id) do update set response = excluded.response, at = now();

  perform board_log(m, 'meeting_response', c.proposal_id,
    case p_response when 'accept' then 'Accepted' else 'Declined' end || ' meeting on ' || (c.meeting ->> 'when'));
  perform board_notify(array[c.author_role], m.role_id, c.proposal_id,
    board_role_label(m.role_id) || ' ' || p_response || 'ed your meeting request');
end $$;

create function public.board_mark_thread_read(p_proposal uuid)
returns void language plpgsql security definer set search_path = public as $$
declare m board_members := board_require_member();
begin
  if not board_can_see(p_proposal) then return; end if;
  insert into board_comment_reads (comment_id, role_id)
  select id, m.role_id from board_comments where proposal_id = p_proposal
  on conflict do nothing;
end $$;

create function public.board_mark_notifications_read(p_proposal uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare m board_members := board_require_member();
begin
  update board_notifications set read = true
  where to_role = m.role_id and not read and (p_proposal is null or proposal_id = p_proposal);
end $$;

create function public.board_opened_attachment(p_proposal uuid, p_name text)
returns void language plpgsql security definer set search_path = public as $$
declare m board_members := board_require_member();
begin
  if not board_can_see(p_proposal) then raise exception 'Proposal not found'; end if;
  perform board_log(m, 'opened_attachment', p_proposal, left(coalesce(p_name, ''), 255));
end $$;


-- ════════════════════════════════════════════════════════════════════════════
-- Permissions
-- ════════════════════════════════════════════════════════════════════════════

-- Supabase grants new public functions to everyone by default. Lock them all
-- down, then open only the actions to signed-in users (each action re-checks
-- board membership itself).
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'board\_%'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
  end loop;
end $$;

grant execute on function
  public.board_create(text, jsonb, boolean),
  public.board_edit_draft(uuid, jsonb, boolean),
  public.board_revise(uuid, jsonb, boolean),
  public.board_submit(uuid),
  public.board_view(uuid),
  public.board_decide(uuid, text, text),
  public.board_comment(uuid, text, uuid, uuid, jsonb, text[], jsonb),
  public.board_respond_meeting(uuid, text),
  public.board_mark_thread_read(uuid),
  public.board_mark_notifications_read(uuid),
  public.board_opened_attachment(uuid, text)
to authenticated;

-- Used inside row-level-security policies, so the signed-in role must be able to run them.
grant execute on function public.board_is_member(), public.board_my_role(), public.board_can_see(uuid)
to authenticated;

-- Row-level security: members can read; nobody can write directly.
do $$
declare t text;
begin
  foreach t in array array[
    'board_members', 'board_requisition_types', 'board_proposals', 'board_versions',
    'board_decisions', 'board_views', 'board_comments', 'board_comment_reads',
    'board_meeting_responses', 'board_notifications', 'board_audit'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('revoke insert, update, delete, truncate on public.%I from authenticated', t);
  end loop;
end $$;

create policy "members see the roster" on public.board_members
  for select to authenticated using (public.board_is_member());

create policy "members see requisition types" on public.board_requisition_types
  for select to authenticated using (public.board_is_member());

create policy "members see proposals" on public.board_proposals
  for select to authenticated using (public.board_can_see(id));

create policy "members see versions" on public.board_versions
  for select to authenticated using (public.board_can_see(proposal_id));

create policy "members see decisions" on public.board_decisions
  for select to authenticated using (public.board_can_see(proposal_id));

create policy "members see views" on public.board_views
  for select to authenticated using (public.board_can_see(proposal_id));

create policy "members see comments" on public.board_comments
  for select to authenticated using (public.board_can_see(proposal_id));

create policy "members see read receipts" on public.board_comment_reads
  for select to authenticated using (
    exists (select 1 from public.board_comments c where c.id = comment_id and public.board_can_see(c.proposal_id)));

create policy "members see meeting responses" on public.board_meeting_responses
  for select to authenticated using (
    exists (select 1 from public.board_comments c where c.id = comment_id and public.board_can_see(c.proposal_id)));

create policy "members see their own notifications" on public.board_notifications
  for select to authenticated using (to_role = public.board_my_role());

create policy "members see the audit log" on public.board_audit
  for select to authenticated using (public.board_can_see(proposal_id));


-- ════════════════════════════════════════════════════════════════════════════
-- Attachments (Supabase Storage)
-- Private bucket: text, PDF and images, up to 10 MB. Members upload into their
-- own folder; every member can read; nobody can overwrite or delete.
-- ════════════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('board-attachments', 'board-attachments', false, 10485760, array['text/*', 'image/*', 'application/pdf'])
on conflict (id) do nothing;

create policy "board members upload attachments" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'board-attachments'
    and public.board_is_member()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "board members read attachments" on storage.objects
  for select to authenticated
  using (bucket_id = 'board-attachments' and public.board_is_member());


-- ════════════════════════════════════════════════════════════════════════════
-- Realtime: push changes to every open board tab
-- ════════════════════════════════════════════════════════════════════════════

alter publication supabase_realtime add table
  public.board_proposals, public.board_versions, public.board_decisions, public.board_views,
  public.board_comments, public.board_comment_reads, public.board_meeting_responses,
  public.board_notifications, public.board_audit;
