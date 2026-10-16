import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowUpRight,
  Bell,
  ClipboardPlus,
  CircleAlert,
  History,
  KeyRound,
  LoaderCircle,
  LogOut,
  Menu,
  Plus,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react'
import { actions, useBoard } from '../../board/store'
import { formatWhen, needsActionFrom, who } from '../../board/workflow'
import { account } from '../../lib/account'
import { SIGN_IN_PATH, signInUrl } from '../../lib/signin'
import PasswordForm from '../account/PasswordForm'
import { EASE } from '../ui'
import AuditTrail from './AuditTrail'
import ProposalDetail from './ProposalDetail'
import ProposalForm from './ProposalForm'
import ProposalList, { VIEWS, visibleProposals } from './ProposalList'
import TaskDetail from './TaskDetail'
import TaskForm from './TaskForm'
import TaskList, { taskViewIcon } from './TaskList'
import { canTask, dueSoonForMe, TASK_VIEWS } from '../../board/tasks'
import { Btn, Card, RoleBadge } from './bits'

function useHashRoute() {
  const read = () => window.location.hash.replace(/^#\/?/, '')
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const on = () => (setRoute(read()), window.scrollTo(0, 0))
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return [route, (r) => (window.location.hash = r ? `/${r}` : '')]
}

export default function BoardApp() {
  const session = useBoard()
  const [route, go] = useHashRoute()
  const { status, me, board } = session

  // Signing in happens on the shared sign-in page, which sends people back here —
  // to the exact proposal they opened, since the hash route rides along in ?next=.
  useEffect(() => {
    if (status === 'signed-out') window.location.replace(signInUrl(window.location.pathname + window.location.hash))
  }, [status])

  if (status === 'ready') return <Shell me={me} board={board} email={session.email} route={route} go={go} />

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-5 sm:px-8">
          <a href="/" aria-label="Dreams of Bangladesh home">
            <img src="/logo-mark.png" alt="" className="h-9 w-auto" />
          </a>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-16">
        {status === 'loading' || status === 'signed-out' ? (
          <p className="flex items-center gap-3 text-sm text-ink/55">
            <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={1.75} aria-hidden="true" />
            {status === 'loading' ? 'Loading the board…' : 'Taking you to sign in…'}
          </p>
        ) : status === 'not-member' ? (
          <Notice icon={ShieldAlert} title="This account isn’t on the board">
            You’re signed in as <strong className="font-medium text-ink">{session.email}</strong>, but that account hasn’t been added as a board
            member. Ask the board administrator to add you.
            <Btn variant="outline" icon={LogOut} className="mt-6" onClick={signOut}>Sign out</Btn>
          </Notice>
        ) : status === 'unconfigured' ? (
          <Notice icon={CircleAlert} title="The board isn’t connected yet">
            Set <code className="font-mono text-sm">VITE_SUPABASE_URL</code> and <code className="font-mono text-sm">VITE_SUPABASE_PUBLISHABLE_KEY</code> — see
            supabase/SETUP.md.
          </Notice>
        ) : (
          <Notice icon={CircleAlert} title="Couldn’t load the board">
            {session.error}
            <Btn variant="outline" className="mt-6" onClick={() => window.location.reload()}>Try again</Btn>
          </Notice>
        )}
      </main>
    </div>
  )
}

/* ───────────────────────── Signed-in shell ───────────────────────── */

function Shell({ me, board, email, route, go }) {
  const [drawer, setDrawer] = useState(false)
  const [query, setQuery] = useState('')
  const [a, id, sub] = route.split('/')
  const visible = visibleProposals(board, me)
  const defaultView = visible.some((p) => needsActionFrom(p, me)) ? 'action' : 'all'
  const listView = a === 'list' ? id : a === '' ? defaultView : null
  const taskView = a === 'tasks' && id !== 'new' ? id || 'mine' : null
  const onTasks = a === 'tasks' || a === 't'
  const activeKey =
    listView ??
    (taskView ? `tasks:${taskView}` : a === 'tasks' && id === 'new' ? 'tasks:new' : ['audit', 'new', 'password'].includes(a) ? a : null)

  useEffect(() => setDrawer(false), [route])

  return (
    <div className="min-h-screen bg-paper lg:pl-64">
      {/* Sidebar: fixed on desktop, drawer on mobile */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <Sidebar me={me} board={board} email={email} activeKey={activeKey} />
      </aside>
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawer(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] lg:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <Sidebar me={me} board={board} email={email} activeKey={activeKey} onClose={() => setDrawer(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/90 backdrop-blur">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-8">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label="Open navigation"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-ink/15 text-ink lg:hidden"
          >
            <Menu className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.75} />
          </button>

          {listView || taskView ? (
            <label className="relative flex max-w-md flex-1 items-center">
              <Search className="pointer-events-none absolute left-3 h-4 w-4 text-ink/35" strokeWidth={1.75} aria-hidden="true" />
              <span className="sr-only">Search proposals</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={taskView ? 'Search tasks by reference or title' : 'Search by reference or title'}
                className="h-9 w-full rounded-md border border-ink/12 bg-white pl-9 pr-3 text-sm text-ink placeholder:text-ink/35 focus:border-flag focus:outline-none focus:ring-4 focus:ring-flag/10"
              />
            </label>
          ) : (
            <span className="flex-1" />
          )}

          <div className="ml-auto flex items-center gap-2">
            <Notifications me={me} state={board} go={go} />
            <a
              href={onTasks ? '#/tasks/new' : '#/new'}
              className="hidden h-9 items-center gap-2 rounded-md bg-flag px-3.5 text-sm font-medium text-white transition-colors hover:bg-leaf sm:inline-flex"
            >
              <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              {onTasks ? 'New task' : 'New submission'}
            </a>
          </div>
        </div>
      </header>

      <main className="px-4 py-8 sm:px-8 lg:py-10">
        <div className="mx-auto max-w-6xl">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={route.split('?')[0]}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25, ease: EASE }}
            >
              <Page me={me} state={board} a={a} id={id} sub={sub} listView={listView} taskView={taskView} query={query} go={go} />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

function Page({ me, state, a, id, sub, listView, taskView, query, go }) {
  const proposal = state.proposals.find((p) => p.id === id)
  const task = state.tasks.find((t) => t.id === id)
  const back = () => (id ? go(`p/${id}`) : go(''))

  if (listView) return <ProposalList me={me} state={state} view={listView} query={query} />
  if ((a === 'tasks' || a === 't') && !state.tasksReady) return <TasksNotSetUp />
  if (taskView) return <TaskList me={me} state={state} view={taskView} query={query} />
  if (a === 'tasks' && id === 'new') return <TaskForm me={me} mode="new" onDone={(nid) => go(`t/${nid}`)} onCancel={() => go('tasks/mine')} />
  if (a === 't' && sub === 'edit' && task && canTask.edit(task, me))
    return <TaskForm key={`${id}-edit`} me={me} mode="edit" task={task} onDone={() => go(`t/${id}`)} onCancel={() => go(`t/${id}`)} />
  if (a === 't') return <TaskDetail key={id} me={me} state={state} id={id} />
  if (a === 'new') return <ProposalForm me={me} mode="new" onDone={(nid) => go(`p/${nid}`)} onCancel={() => go('')} />
  if (a === 'p' && proposal && (sub === 'edit' || sub === 'revise') && proposal.authorId === me)
    return <ProposalForm key={`${id}-${sub}`} me={me} mode={sub} proposal={proposal} onDone={() => go(`p/${id}`)} onCancel={back} />
  if (a === 'p') return <ProposalDetail key={id} me={me} state={state} id={id} />
  if (a === 'password') return <ChangePassword onDone={() => go('')} />
  if (a === 'audit')
    return (
      <div>
        <h1 className="flex items-center gap-3 font-display text-3xl tracking-[-0.01em] text-ink">
          <History className="h-6 w-6 text-flag" strokeWidth={1.5} aria-hidden="true" />
          Audit log
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-ink/55">
          Every view, submission, approval, rejection, revision request, correction, message and attachment open, with its timestamp. Entries can’t be
          edited or deleted.
        </p>
        <div className="mt-6">
          <AuditTrail entries={state.audit} showRef />
        </div>
      </div>
    )
  return <ProposalList me={me} state={state} view="all" query={query} />
}

/* ───────────────────────── Sidebar ───────────────────────── */

function Sidebar({ me, board, email, activeKey, onClose }) {
  const visible = visibleProposals(board, me)
  const counts = Object.fromEntries(VIEWS.map((v) => [v.id, visible.filter((p) => v.test(p, me)).length]))
  const now = Date.now()
  const taskCounts = Object.fromEntries(TASK_VIEWS.map((v) => [v.id, board.tasks.filter((t) => v.test(t, me, now)).length]))
  // Red badge on "My tasks" when something of yours is due within 48 h or overdue
  const urgentMine = board.tasks.some((t) => dueSoonForMe(t, me, now))

  return (
    <div className="flex h-full flex-col bg-forest text-paper">
      <div className="flex h-16 items-center justify-between gap-3 border-b border-paper/10 px-4">
        <a href="#/" className="flex min-w-0 items-center gap-3">
          <span className="flex shrink-0 rounded bg-paper px-2 py-1.5">
            <img src="/logo-mark.png" alt="" className="h-5 w-auto" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">Proposal Board</span>
            <span className="block text-[0.6875rem] text-paper/45">Internal workstation</span>
          </span>
        </a>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Close navigation" className="rounded p-1.5 text-paper/60 hover:bg-paper/10 hover:text-paper">
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        )}
      </div>

      <div className="px-3 pt-4">
        <a
          href="#/new"
          className={`flex h-10 items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors ${
            activeKey === 'new' ? 'bg-mint text-forest' : 'bg-paper text-forest hover:bg-white'
          }`}
        >
          <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          New submission
        </a>
      </div>

      <nav className="mt-6 flex-1 overflow-y-auto px-3" aria-label="Board">
        <p className="label px-3 pb-2 text-paper/35">Queues</p>
        <ul className="space-y-0.5">
          {VIEWS.map((v) => (
            <SideLink
              key={v.id}
              href={`#/list/${v.id}`}
              icon={v.icon}
              label={v.label}
              active={activeKey === v.id}
              count={counts[v.id]}
              alert={v.id === 'action' && counts.action > 0}
            />
          ))}
        </ul>
        <p className="label px-3 pb-2 pt-6 text-paper/35">Tasks</p>
        {!board.tasksReady ? (
          <p className="mx-3 rounded-md border border-paper/10 px-3 py-2.5 text-xs leading-relaxed text-paper/50">
            Tasks need a database update before they can be used.
          </p>
        ) : (
        <ul className="space-y-0.5">
          {TASK_VIEWS.map((v) => (
            <SideLink
              key={v.id}
              href={`#/tasks/${v.id}`}
              icon={taskViewIcon(v.id)}
              label={v.label}
              active={activeKey === `tasks:${v.id}`}
              count={taskCounts[v.id]}
              alert={(v.id === 'mine' && urgentMine) || (v.id === 'review' && taskCounts.review > 0)}
            />
          ))}
          <SideLink href="#/tasks/new" icon={ClipboardPlus} label="New task" active={activeKey === 'tasks:new'} />
        </ul>
        )}
        <p className="label px-3 pb-2 pt-6 text-paper/35">Records</p>
        <ul>
          <SideLink href="#/audit" icon={History} label="Audit log" active={activeKey === 'audit'} />
        </ul>
      </nav>

      <div className="border-t border-paper/10 p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <RoleBadge id={me} className="!bg-bottle !text-mint ring-1 ring-mint/20" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{who(me)}</span>
            <span className="block truncate text-xs text-paper/45">{email}</span>
          </span>
        </div>
        <ul className="mt-1 space-y-0.5">
          <SideLink href="#/password" icon={KeyRound} label="Change password" active={activeKey === 'password'} small />
          <SideLink href="/" icon={ArrowUpRight} label="Public website" small />
          <li>
            <button
              type="button"
              onClick={signOut}
              className="flex w-full items-center gap-3 rounded-md px-3 py-1.5 text-[0.8125rem] text-paper/65 transition-colors hover:bg-paper/[0.06] hover:text-paper"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              Sign out
            </button>
          </li>
        </ul>
      </div>
    </div>
  )
}

function SideLink({ href, icon: Icon, label, active, count, alert, small }) {
  return (
    <li>
      <a
        href={href}
        aria-current={active ? 'page' : undefined}
        className={`relative flex items-center gap-3 rounded-md px-3 transition-colors ${small ? 'py-1.5 text-[0.8125rem]' : 'py-2 text-sm'} ${
          active ? 'text-paper' : 'text-paper/65 hover:bg-paper/[0.06] hover:text-paper'
        }`}
      >
        {active && <motion.span layoutId="side-active" className="absolute inset-0 rounded-md bg-bottle ring-1 ring-mint/15" transition={{ duration: 0.3, ease: EASE }} />}
        <Icon className={`relative h-4 w-4 shrink-0 ${active ? 'text-mint' : ''}`} strokeWidth={1.75} aria-hidden="true" />
        <span className="relative flex-1 truncate">{label}</span>
        {count != null && (
          <span className={`relative rounded px-1.5 font-mono text-[0.6875rem] tabular ${alert ? 'bg-crimson text-white' : 'text-paper/40'}`}>{count}</span>
        )}
      </a>
    </li>
  )
}

/* ───────────────────────── Notifications ───────────────────────── */

function Notifications({ me, state, go }) {
  const [open, setOpen] = useState(false)
  const ref = useOutsideClose(open, () => setOpen(false))
  const mine = state.notifications.filter((n) => n.to === me).reverse()
  const unread = mine.filter((n) => !n.read).length

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        className="relative flex h-9 w-9 items-center justify-center rounded-md border border-ink/12 bg-white text-ink/70 transition-colors hover:border-ink/30 hover:text-ink"
      >
        <Bell className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.75} />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -right-1.5 -top-1.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-crimson px-1 font-mono text-[0.625rem] text-white"
            >
              {unread > 99 ? '99+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-x-3 top-16 z-50 origin-top-right overflow-hidden rounded-lg border border-ink/10 bg-white shadow-[0_24px_60px_-20px_rgba(11,26,19,0.35)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-11 sm:w-96"
          >
            <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
              <p className="text-sm font-semibold text-ink">Notifications</p>
              {unread > 0 && (
                <button type="button" onClick={() => actions.markNotificationsRead().catch(() => {})} className="text-xs font-medium text-flag hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <ul className="max-h-[60vh] overflow-y-auto">
              {mine.length === 0 && (
                <li className="flex flex-col items-center px-4 py-10 text-center text-sm text-ink/45">
                  <Bell className="mb-2 h-6 w-6 text-ink/20" strokeWidth={1.5} aria-hidden="true" />
                  Nothing yet.
                </li>
              )}
              {mine.slice(0, 50).map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => (setOpen(false), go(n.taskId ? `t/${n.taskId}` : `p/${n.proposalId}`))}
                    className={`flex w-full gap-3 border-b border-ink/[0.06] px-4 py-3 text-left transition-colors hover:bg-paper ${n.read ? '' : 'bg-sky-50/50'}`}
                  >
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-crimson'}`} />
                    <span className="min-w-0">
                      <span className={`block text-sm leading-snug ${n.read ? 'text-ink/60' : 'text-ink'}`}>{n.text}</span>
                      <span className="mt-1 block text-xs text-ink/40">{formatWhen(n.at)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ───────────────────────── Misc ───────────────────────── */

async function signOut() {
  await account.signOut().catch(() => {})
  window.location.assign(SIGN_IN_PATH)
}

function ChangePassword({ onDone }) {
  const [done, setDone] = useState(false)
  return (
    <div className="mx-auto max-w-md py-4">
      <h1 className="flex items-center gap-3 font-display text-3xl tracking-[-0.01em] text-ink">
        <KeyRound className="h-6 w-6 text-flag" strokeWidth={1.5} aria-hidden="true" />
        Change your password
      </h1>
      <Card className="mt-8 p-6">
        {done ? (
          <div className="text-sm text-ink/70">
            Password updated.
            <Btn variant="outline" className="mt-5 w-full" onClick={onDone}>Back to the board</Btn>
          </div>
        ) : (
          <PasswordForm onSaved={() => setDone(true)} />
        )}
      </Card>
    </div>
  )
}

/** Shown when the site is deployed before the tasks migrations have been run. */
function TasksNotSetUp() {
  return (
    <div className="flex justify-center py-12">
      <Notice icon={CircleAlert} title="Tasks aren’t set up yet">
        The database is missing the tasks tables. In Supabase → SQL Editor, run these files from <code className="font-mono text-sm">supabase/migrations</code>, in
        order, skipping any you’ve already run:
        <ol className="mx-auto mt-4 max-w-sm space-y-1 text-left font-mono text-xs text-ink/70">
          <li>20261016000000_board_tasks.sql</li>
          <li>20261017000000_task_assignees.sql</li>
        </ol>
        <span className="mt-4 block">Proposals keep working in the meantime.</span>
      </Notice>
    </div>
  )
}

function Notice({ icon: Icon, title, children }) {
  return (
    <div className="max-w-lg text-center">
      <Icon className="mx-auto h-9 w-9 text-ink/25" strokeWidth={1.5} aria-hidden="true" />
      <h1 className="mt-5 font-display text-3xl text-ink">{title}</h1>
      <div className="mt-4 text-[0.9375rem] leading-relaxed text-ink/60">{children}</div>
    </div>
  )
}

function useOutsideClose(open, close) {
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && close()
    const onKey = (e) => e.key === 'Escape' && close()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => (document.removeEventListener('mousedown', onDown), document.removeEventListener('keydown', onKey))
  }, [open, close])
  return ref
}
