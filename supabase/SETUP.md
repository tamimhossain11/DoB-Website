# Proposal Board — Supabase setup

About 20 minutes, once. You need a Supabase account (free tier is fine to start)
and the emails of the five board members.

## 1. Create the project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Name it (e.g. `dob-board`), set a strong **database password** and save it in your
   password manager — you rarely need it, but you can't see it again.
3. **Region:** pick the one closest to Dhaka — *South Asia (Mumbai)*, or *Southeast
   Asia (Singapore)*.
4. Wait for the project to finish provisioning (~2 minutes).

## 2. Create the database

1. Left sidebar → **SQL Editor** → **New query**.
2. Open [`migrations/20261015000000_proposal_board.sql`](migrations/20261015000000_proposal_board.sql),
   copy the **whole file**, paste it in, click **Run**.
3. Expect *"Success. No rows returned"*. If Supabase warns that the query has
   destructive operations, that refers to the `revoke` statements — confirm and run.

This creates the tables, the approval rules, the append-only protections, the
private `board-attachments` storage bucket and the realtime feed. Run it **once** —
running it again will fail because the tables already exist.

4. Then do the same with [`migrations/20261016000000_board_tasks.sql`](migrations/20261016000000_board_tasks.sql)
   — it adds **Tasks** (assigning work, due dates, the overdue lock). Run it once,
   after the first file. *(Already set up the board earlier? Just run this one.)*
   Then run [`migrations/20261017000000_task_assignees.sql`](migrations/20261017000000_task_assignees.sql)
   — it lets one task have **several assignees**. Existing tasks keep their assignee,
   status and history.
5. *(Recommended)* **Database → Extensions →** enable **pg_cron**, then run
   [`cron.sql`](cron.sql) in the SQL Editor. Overdue tasks are then locked — and the
   assignee, creator and admins notified — within 5 minutes of the deadline even when
   nobody has the board open. Without it the lock still applies (late submissions are
   always refused); the notification just goes out the next time someone opens the board.

> **Using the Supabase CLI instead?** `npx supabase login`, then
> `npx supabase link --project-ref <your-ref>`, then `npx supabase db push`.

## 3. Lock down sign-up and set the site address

1. **Authentication → Sign In / Providers → Email:** keep Email enabled, and turn
   **off "Allow new users to sign up"**. Only you create accounts. (Even if someone
   did sign up, they couldn't see anything without being added as a member in step 5.)
2. **Authentication → URL Configuration:**
   - **Site URL:** `https://dreamsofbangladesh.com/signin/`
   - **Redirect URLs:** add `https://dreamsofbangladesh.com/signin/` and
     `http://localhost:5173/signin/` (for local development).

   "Forgot your password?" emails send people back to the sign-in page, so it must be
   on this list.
3. *(Before real use)* **Authentication → Emails → SMTP Settings:** connect your own
   email sender (e.g. Gmail SMTP, Brevo, Resend). Supabase's built-in sender is for
   testing only: it is heavily rate-limited and may only deliver to people on your
   Supabase team. Without this, board members' password-reset emails may not arrive.
   Everything else works without it.

## 4. Create the five logins

**Authentication → Users → Add user → Create new user**, once per member:

- Email: their email
- Password: a temporary password (they change it after signing in: avatar menu →
  *Change password*)
- **Auto Confirm User: on**

Share each temporary password privately (not in a group chat).

## 5. Make them board members

A login on its own can't see anything. This step links each login to a board role.

1. Open [`members.sql`](members.sql) and replace the five example emails and names.
2. SQL Editor → New query → paste → **Run**.
3. The result table should list all five. A missing row means that email doesn't
   match a login from step 4 — check the spelling.

To hand a role to someone new later, see the bottom of `members.sql`. Don't delete
the old person's login — their approvals stay attributed to them.

## 6. Connect the website

1. **Project Settings → API Keys:** copy the **Publishable key** (`sb_publishable_…`).
   Older projects show an **anon public** key instead; that works in the same slot.
2. **Project URL:** click **Connect** at the top of the dashboard (or **Project Settings →
   Data API**) and copy the URL, e.g. `https://abcd1234.supabase.co`.
3. In the project folder, copy `.env.example` to `.env.local` and fill in both values.
   `.env.local` is git-ignored.

> **Never** put the *secret* / *service_role* key in the website or `.env.local` — it
> bypasses every protection. The publishable key is designed to be public.

## 7. Try it locally

```bash
NODE_ENV=development npm install --include=dev
npm run dev
```

Open <http://localhost:5173/signin/> (or click **Sign in** in the site navigation) and
sign in as one of the members — you'll land on the Proposal Board. To try the
full approval flow, use a second browser (or a private window) signed in as a
different member — changes appear in both live.

## 8. Deploy

In your hosting provider's settings (Vercel, Netlify, Cloudflare Pages, …), add the
same two environment variables — `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY` — then **redeploy**. Vite bakes them in at build
time, so a deploy made before they were added won't pick them up.

## Checklist

- [ ] All three migrations ran without errors, in order (proposal board → tasks → task assignees)
- [ ] *(Recommended)* pg_cron enabled and `cron.sql` run
- [ ] Sign-ups disabled; Site URL and Redirect URLs set
- [ ] Five logins created, five rows from `members.sql`
- [ ] `.env.local` filled in; local sign-in works
- [ ] Environment variables added to the host; production `/signin/` works
- [ ] Custom SMTP configured (before relying on password reset)

## Good to know

- **One sign-in page for everyone:** `/signin/` sends each account to the member
  area it can use. A general member area can be added later as another entry in
  `areas` in `src/lib/account.js`; until then, accounts that aren't board members
  see "no access to a member area yet".
- **Who must approve what** lives in the `board_requisition_types` table
  (Table Editor). The site reads it on load, so a change there takes effect
  everywhere. Existing proposals keep the approvers they were created with.
- **History can't be edited or deleted** — not from the site, and not from the
  Table Editor either (database triggers block it). That's intentional.
- **Audit export:** Audit log → *Export CSV*.
- **Backups:** paid Supabase plans include daily backups. On the free tier,
  inactive projects can be paused after a week without activity; resume them from
  the dashboard.
