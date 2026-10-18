# Dreams of Bangladesh — website

Website for Dreams of Bangladesh. Vite + React + Tailwind CSS v4.

## Pages

| URL                    | Source                          |
| ---------------------- | ------------------------------- |
| `/`                    | `index.html` → `src/main.jsx`   |
| `/wice-press-release`  | `wice-press-release/index.html` → `src/press.jsx` |
| `/signin`              | `signin/index.html` → `src/signin.jsx` (member sign-in, `noindex`) |
| `/board`               | `board/index.html` → `src/board.jsx` (internal, `noindex`) |

This is a Vite **multi-page** build (`build.rollupOptions.input` in `vite.config.js`), not a
client-side router — each page is a real HTML file, so the press release has a shareable,
indexable URL and needs no SPA rewrite rules on the host.

### WICE Press Release page

Hosts `public/DOB_WICE_2026_Press_Release_A4.pdf` with download + open-in-tab actions, an
inline PDF viewer on desktop, a rendered image fallback on mobile, and the full Bengali text
transcribed into HTML (so the release is searchable and screen-reader accessible — PDFs are
opaque to both). The transcription lives in `src/data/press.js`; **if the PDF is revised,
update that file to match.**

### Tasks (on the Proposal Board)

Any board member can create a task and assign it to one or more people on the team,
with a description, priority, attachments and a due date. With several assignees, each
person hands in their own work and is reviewed on their own; the task is Done when
everyone's work is accepted.

- **Due date:** set by the creator. If they leave it empty, the assignee sets it once
  (their commitment); after that only the creator or an admin (President, CEO) can
  change it — otherwise the lock below would be meaningless.
- **Lock rule** (per task, on by default): when the due date passes, everyone who
  hasn't submitted is locked out — the server refuses their late submissions — and
  they, the creator and the admins are notified, naming exactly who missed it.
  Assignees who already submitted are unaffected (the task shows "Partly locked"). The creator or an admin
  reopens it by setting a new due date. With the lock off, the task is flagged overdue
  but still accepts work.
- **Flow:** Open → Submitted → Done, or Changes requested → resubmit; Locked — missed;
  Cancelled (with a reason). Submissions and reviews form a work log on the task.
- **Tracking:** sidebar queues (My tasks, To review, Assigned by me, All open, All),
  due-date urgency colours, a live countdown, notifications, a discussion thread per
  task (same features as proposals) and every action in the audit log.
- **Timing of the lock:** enforced at submit time on the server. `board_task_sweep()`
  records it and sends the notifications; the site calls it on load and every minute,
  and `supabase/cron.sql` schedules it every 5 minutes.

### Member sign-in (`/signin`)

One sign-in page for every member area — today the Proposal Board, later the general
member area. The nav shows **Sign in** (or **Account** when a session exists; checked
without loading Supabase, so public pages stay light). After signing in, people go to
`?next=` if they may open it, else to their only area, else they choose. `?next=` only
accepts paths on this site. Signed-out visits to `/board/…` redirect here and come back
to the same page afterwards. Password resets also land here.

To add a member area: add an entry to `areas` in `src/lib/account.js`.

### Proposal Board (`/board`) — Internal Workstation & Board Approval

Board members submit **proposals, event budgets, course launches and technical requisitions**
(with text, PDF and image attachments); the required approvers approve, request a revision or
reject. Members reach it through **Sign in** in the site navigation.

- **Workflow:** Draft → Submitted → Under Review → Revision Requested / Partially Approved →
  Final Approved / Rejected. Status is derived from the decisions, never set by hand.
- **Approvers** are configured per type in the `board_requisition_types` table (defaults
  mirrored in `src/data/board.js`). President and CEO are required
  on every type; CFO, CTO and CIO are added per type. Final approval needs **every** required
  approval — not a majority — and one rejection closes the submission. Authors are recused from
  approving their own submissions.
- **Versioning:** a submitted version can't be edited. Revising creates V2 (V3 …) with a fresh
  approval cycle; earlier versions and their approvals stay viewable and unchanged.
- **Discussion:** replies, @mentions, attachments, "seen by" read receipts, notifications and
  meeting requests with accept/decline. Messages can't be edited or deleted — authors post a
  correction that links back to the original.
- **Audit:** every view, submission, decision, correction, message and attachment open is
  logged with its timestamp (per proposal and board-wide at `/board#/audit`, exportable as CSV).
- **Backend:** Supabase — Postgres, Auth (email + password), Storage for attachments and
  Realtime for live updates. Members can only *read* tables (row-level security); every
  write goes through a Postgres function that enforces the workflow, so the rules hold
  even if someone bypasses the website. Triggers make history append-only, even from
  the Supabase dashboard.

**Setup:** follow [`supabase/SETUP.md`](supabase/SETUP.md) — create the project, run the
migration, create the five logins, run `supabase/members.sql`, then set
`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (see `.env.example`) locally and on
the host. Without them, `/board` shows a "not connected" notice; the rest of the site is
unaffected.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs to dist/
npm run preview  # serve the production build
```

> **Note:** this machine has `NODE_ENV=production` exported in the shell, which makes
> `npm install` silently skip devDependencies (Vite and Tailwind). If `vite: command not
> found` appears, install with:
>
> ```bash
> NODE_ENV=development npm install --include=dev
> ```

## Editing content

All copy, stats, projects, competitions, roster, sponsor tiers and contact details live in
one file:

```
src/data/content.js
```

Change text there — no component edits needed. Entries marked `// VERIFY` are drawn from
public reporting about the team and **should be confirmed against your own records before
launch**, in particular:

- the placement and "only Asian team" claim for NASA HERC
- competition years, host cities and standings
- the Best Innovator Award attribution
- team size, founding year, email address and social links

The leadership roster is placeholder — replace names/roles, and optionally add
`photo: '/team/name.jpg'` to any member to show a portrait instead of initials.

## Brand

Colours are sampled from the logo and defined as Tailwind theme tokens in `src/index.css`:

| Token        | Hex       | Use                               |
| ------------ | --------- | --------------------------------- |
| `flag`       | `#006A4E` | primary green, buttons, accents   |
| `leaf`       | `#00563F` | green hover                       |
| `forest`     | `#062118` | dark sections, board sidebar      |
| `ink`        | `#0B1A13` | body text, darkest ground         |
| `mint`       | `#8FD3B6` | green on dark                     |
| `crimson`    | `#C8102E` | flag red — used sparingly         |
| `paper`      | `#F6F5F1` | page background                   |
| `surface`    | `#FFFFFF` | cards, panels, alternate sections |
| `parchment`  | `#EDEBE4` | quiet fills                       |

Type: **Source Serif 4** (headlines), **IBM Plex Sans** (text and interface), **IBM Plex Mono**
(labels, reference codes, figures). Bengali text uses **Noto Sans Bengali**.

Icons: **lucide-react** (Lucide 1.x has no brand logos, so social links are text links; the
Facebook mark on the press page is inline SVG). Motion: **framer-motion**, wrapped in
`MotionRoot` so it respects the visitor's "reduce motion" setting.

Design rules the site follows: numbered report-style section headings, hairline rules
instead of heavy cards, real tables for specs and records, restrained motion (scroll
reveals, tab and page transitions), and no decorative blur, gradients or emoji.

## Supabase (Proposal Board backend)

```
supabase/
  SETUP.md                step-by-step project setup
  migrations/…_proposal_board.sql   schema, workflow functions, security, storage, realtime
  migrations/…_board_tasks.sql      tasks: assignment, due dates, overdue lock, task threads
  migrations/…_task_assignees.sql   several assignees per task, each submits and is reviewed separately
  migrations/…_designer_role_and_uploads.sql   Creative Designer role; 50 MB attachments
  members.sql             who holds which role (re-runnable; hands roles over safely)
  reset-test-data.sql     one-off: delete all proposals and tasks before going live
  cron.sql                optional: run the overdue-task sweep every 5 minutes
```

If you change a workflow rule, change it in both the SQL functions and
`src/board/workflow.js` (the UI uses the latter to decide which buttons to show; the
server has the final say).

## Images

`public/logo.jpeg` is the original supplied logo. The other assets are generated from it:

- `logo-mark.png` — background removed, transparent, used in the nav/footer
- `favicon-32/180/512.png` — square app icons (flag + robot detail)
- `og-image.png` — 1200×630 social share card

If the logo is ever re-supplied at higher resolution, regenerate these to match.

## Structure

```
src/
  main.jsx                home page entry
  press.jsx               press release page entry
  signin.jsx              sign-in page entry
  board.jsx               Proposal Board entry
  App.jsx                 home section order
  index.css               theme tokens, utilities, keyframes
  data/content.js         ← all home page copy
  data/press.js           ← WICE press release transcription
  data/board.js           ← board roles, requisition type labels, attachment rules
  lib/supabase.js         the one Supabase client, shared by every signed-in page
  lib/account.js          sign-in/out, password reset, member areas
  lib/signin.js           sign-in links + session hint (no Supabase import)
  board/workflow.js       approval rules for the UI (mirrors the SQL functions)
  board/tasks.js          task rules for the UI: status, deadlines, permissions
  board/store.js          Supabase client: sign-in, loading, realtime, actions, files
  components/
    PressRelease.jsx      the press release page
    SignInPage.jsx        the member sign-in page
    account/              shared account UI (password form)
    board/                Proposal Board UI — proposals, tasks, discussion, audit
    ui.jsx                MotionRoot / Reveal / Stagger / Section / SectionHeader / Button
    Nav.jsx               fixed nav, animated mobile menu, scroll spy
    Hero.jsx              headline, programmes panel, record band
    Mission.jsx           mission statement + principles
    Projects.jsx          programme explorer (tabs + spec sheet)
    Campaigns.jsx         campaign ledger + recognition
    Team.jsx              divisions, roster, join block
    Partners.jsx          sponsor tiers + logo slots
    Footer.jsx
    ScrollProgress.jsx
```

## Still to add

- Real photography — the site is deliberately type- and diagram-led because no team or
  rover photos were supplied. Hero, projects and team sections all have natural places for
  images once you have them.
- Real sponsor logos in place of the five "Partner logo" slots in `Partners.jsx`.
- Real names for the leadership roster (currently placeholders in `src/data/content.js`).
