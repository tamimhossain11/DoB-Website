-- ════════════════════════════════════════════════════════════════════════════
-- Add board members
--
-- 1. Create each person's login first: Dashboard → Authentication → Users →
--    Add user → Create new user (email + temporary password, "Auto Confirm User" on).
-- 2. Replace the emails and names below, then run this in the SQL Editor.
--    Re-running is safe: existing members are updated.
-- ════════════════════════════════════════════════════════════════════════════

insert into public.board_members (user_id, role_id, name)
select u.id, v.role_id, v.name
from (values
  ('president@example.com', 'president', 'Moin Uddin'),
  ('mahadirislam0@gmail.com',       'ceo',       'Mahadir Islam'),
  ('amdtamim3@gmail.com',       'cto',       'Tamim Hossain'),
  ('mahadihasanshurov1.com',       'cio',       'Mahadi Hasan'),
  ('mahadihasanshurov2.com',       'cfo',       'Mahadi Hasan')
) as v (email, role_id, name)
join auth.users u on lower(u.email) = lower(v.email)
on conflict (user_id) do update
  set role_id = excluded.role_id, name = excluded.name, active = true;

-- Check: all five should be listed. A missing row means that email has no login yet.
select m.role_id, m.name, u.email, m.active
from public.board_members m
join auth.users u on u.id = m.user_id
order by array_position(array['president', 'ceo', 'cto', 'cio', 'cfo'], m.role_id);


-- ── Handing a role to someone new ───────────────────────────────────────────
-- Deactivate the outgoing holder (their history stays intact, attributed to
-- them), then add the new person with the insert above.
--
--   update public.board_members set active = false where role_id = 'cfo' and active;
