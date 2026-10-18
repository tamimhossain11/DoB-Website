-- ════════════════════════════════════════════════════════════════════════════
-- Board members — who holds which role
--
-- 1. Create each person's login first: Dashboard → Authentication → Users →
--    Add user → Create new user (email + temporary password, "Auto Confirm User" on).
-- 2. Keep the list below up to date, then run this whole file in the SQL Editor.
--    Re-running is safe.
--
-- Roles: president, ceo, cto, cio, cfo, designer (Creative Designer).
--
-- When a role moves to a new person, the previous holder is deactivated
-- automatically — but only if the new person's login already exists. A typo or a
-- missing login never deactivates anyone; it just shows up in the check below.
-- Deactivated members keep their history; they simply can't sign in to the board.
-- ════════════════════════════════════════════════════════════════════════════

drop table if exists pg_temp.board_people;
create temp table board_people (email text, role_id text, name text);

insert into board_people (email, role_id, name) values
  ('moin.apscl@gmail.com',         'president', 'Moin Uddin'),
  ('mahadirislam0@gmail.com',      'ceo',       'Mahadir Islam'),
  ('amdtamim3@gmail.com',          'cto',       'Tamim Hossain'),
  ('mahadihasanshurov1.com',       'cio',       'Mahadi Hasan'),   -- VERIFY: missing "@…"? Must match the login exactly.
  ('shurov895@gmail.com',       'cfo',       'Mahadi Hasan'),   -- VERIFY: missing "@…"? Must match the login exactly.
  ('mohammadsifat.me@gmail.com',   'designer',  'Mohammad Sifat');

-- Hand roles over: deactivate the current holder when the listed person (with a
-- login) is someone else.
update public.board_members m
   set active = false
  from board_people p
  join auth.users u on lower(u.email) = lower(p.email)
 where m.active and m.role_id = p.role_id and m.user_id <> u.id;

insert into public.board_members (user_id, role_id, name)
select u.id, p.role_id, p.name
from board_people p
join auth.users u on lower(u.email) = lower(p.email)
on conflict (user_id) do update
  set role_id = excluded.role_id, name = excluded.name, active = true;

-- Result: the active board, plus anyone listed above who has no login yet.
-- (The SQL Editor shows only the last result, so both are in one table.)
select x.role_id as role, x.name, x.email, x.status
from (
  select m.role_id, m.name, u.email, 'active' as status
  from public.board_members m
  join auth.users u on u.id = m.user_id
  where m.active
  union all
  select p.role_id, p.name, p.email, 'NO LOGIN — create it in Authentication → Users'
  from board_people p
  where not exists (select 1 from auth.users u where lower(u.email) = lower(p.email))
) x
order by public.board_role_order(x.role_id), x.status;
