-- ════════════════════════════════════════════════════════════════════════════
-- Reset the Proposal Board — delete ALL proposals and tasks (one-off, before going live)
--
-- ⚠ PERMANENT. This removes every proposal, version, decision, task, submission,
--   assignment, comment, read receipt, meeting response, notification and audit
--   entry. It cannot be undone.
--
-- KEPT: board members (board_members), logins (auth.users) and the approval rules
--       (board_requisition_types).
-- RESET: reference numbers start again at DOB-YYYY-001 and TSK-YYYY-001.
--
-- History is normally append-only — the database refuses deletes, even from the
-- dashboard. This script switches those protections off for the duration of the
-- reset, inside one transaction, and switches them back on. If anything fails,
-- nothing changes and the protections stay on.
--
-- Run in Supabase → SQL Editor.
--   • Clicking Run with nothing selected runs the WHOLE file and deletes immediately.
--   • To preview first, highlight only the STEP 1 query and click Run — the editor
--     runs just the highlighted part.
-- Uploaded files are NOT removed by SQL — see STEP 3.
-- ════════════════════════════════════════════════════════════════════════════


-- ─── STEP 1 (safe, read-only): what will be deleted ──────────────────────────

select 'proposals' as what, count(*) from public.board_proposals
union all select 'proposal versions', count(*) from public.board_versions
union all select 'decisions', count(*) from public.board_decisions
union all select 'tasks', count(*) from public.board_tasks
union all select 'task submissions & reviews', count(*) from public.board_task_submissions
union all select 'task assignments', count(*) from public.board_task_assignees
union all select 'discussion messages', count(*) from public.board_comments
union all select 'notifications', count(*) from public.board_notifications
union all select 'audit log entries', count(*) from public.board_audit
union all select 'board members (KEPT)', count(*) from public.board_members;


-- ─── STEP 2: delete everything listed above (except members) ────────────────
-- Select from "begin;" to "commit;" and run it.

begin;

alter table public.board_proposals          disable trigger user;
alter table public.board_versions           disable trigger user;
alter table public.board_decisions          disable trigger user;
alter table public.board_views              disable trigger user;
alter table public.board_comments           disable trigger user;
alter table public.board_comment_reads      disable trigger user;
alter table public.board_meeting_responses  disable trigger user;
alter table public.board_notifications      disable trigger user;
alter table public.board_audit              disable trigger user;
alter table public.board_tasks              disable trigger user;
alter table public.board_task_submissions   disable trigger user;
alter table public.board_task_assignees     disable trigger user;

truncate table
  public.board_task_assignees,
  public.board_task_submissions,
  public.board_comment_reads,
  public.board_meeting_responses,
  public.board_notifications,
  public.board_audit,
  public.board_comments,
  public.board_tasks,
  public.board_views,
  public.board_decisions,
  public.board_versions,
  public.board_proposals
restart identity;

alter sequence public.board_ref_seq  restart with 1;
alter sequence public.board_task_seq restart with 1;

alter table public.board_proposals          enable trigger user;
alter table public.board_versions           enable trigger user;
alter table public.board_decisions          enable trigger user;
alter table public.board_views              enable trigger user;
alter table public.board_comments           enable trigger user;
alter table public.board_comment_reads      enable trigger user;
alter table public.board_meeting_responses  enable trigger user;
alter table public.board_notifications      enable trigger user;
alter table public.board_audit              enable trigger user;
alter table public.board_tasks              enable trigger user;
alter table public.board_task_submissions   enable trigger user;
alter table public.board_task_assignees     enable trigger user;

commit;

-- Afterwards, run STEP 1 again: everything should be 0 except board members.


-- ─── STEP 3: uploaded files ─────────────────────────────────────────────────
-- Attachments live in Supabase Storage, which SQL can't empty safely.
-- Dashboard → Storage → "board-attachments" → bucket menu (⋯) → Empty bucket.
