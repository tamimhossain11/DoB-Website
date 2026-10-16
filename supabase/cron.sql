-- ════════════════════════════════════════════════════════════════════════════
-- Optional, recommended: lock overdue tasks on a schedule
--
-- The lock itself is always enforced — an assignee can never submit after the due
-- date. What this adds is timing: overdue tasks are locked, and the assignee,
-- creator and admins notified, within 5 minutes of the deadline even when nobody
-- has the board open. Without it, that happens the next time anyone opens it.
--
-- 1. Dashboard → Database → Extensions → enable "pg_cron"
-- 2. SQL Editor → paste this file → Run
-- ════════════════════════════════════════════════════════════════════════════

select cron.schedule(
  'board-task-overdue',
  '*/5 * * * *',
  $$ select public.board_task_sweep(); $$
);

-- To check it:   select * from cron.job;
-- To remove it:  select cron.unschedule('board-task-overdue');
