import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlarmClock,
  ArrowRight,
  Ban,
  CalendarClock,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  ClipboardList,
  FileX2,
  History,
  Lock,
  LockOpen,
  MessageSquare,
  Paperclip,
  PenLine,
  RotateCcw,
  Send,
  ShieldAlert,
  Users,
} from 'lucide-react'
import { tasks as taskActions } from '../../board/store'
import { activeAssignees, ADMINS, assigneeRoles, assigneeState, canManage, canTask, formatDue, fromLocalInput, isPastDue, myAssignment, progress, relative, useNow } from '../../board/tasks'
import { formatWhen, roleOf, who } from '../../board/workflow'
import { EASE } from '../ui'
import { AttachButton, AttachmentList } from './Attachments'
import AuditTrail from './AuditTrail'
import Discussion from './Discussion'
import { Btn, Card, CardHeader, inputClass, RoleBadge } from './bits'
import { PriorityBadge, StatePill, TaskStatusPill } from './taskBits'

export default function TaskDetail({ me, state, id }) {
  const t = state.tasks.find((x) => x.id === id)
  const now = useNow(15_000)
  const [tab, setTab] = useState('discussion')

  // Every open is audited; it also clears this task's notifications.
  const logged = useRef(null)
  useEffect(() => {
    if (!t || logged.current === id) return
    logged.current = id
    taskActions.view(id).catch(() => {})
  }, [t, id])

  if (!t) {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <FileX2 className="h-8 w-8 text-ink/25" strokeWidth={1.5} aria-hidden="true" />
        <p className="mt-4 font-display text-2xl text-ink">Task not found</p>
        <a href="#/tasks/mine" className="mt-6 inline-flex h-10 items-center rounded-md border border-ink/15 bg-white px-4 text-sm font-medium hover:border-ink/30">
          Back to tasks
        </a>
      </div>
    )
  }

  const missedRoles = activeAssignees(t).filter((a) => assigneeState(t, a, now) === 'missed').map((a) => a.role)
  const audit = state.audit.filter((a) => a.taskId === t.id)
  const unread = state.comments.filter((c) => c.taskId === t.id && !c.readBy[me]).length
  const tabs = [
    { id: 'discussion', label: 'Discussion', icon: MessageSquare, badge: unread || null },
    { id: 'activity', label: 'Activity', icon: History, badge: null },
  ]

  return (
    <div>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-ink/50">
        <a href="#/tasks/mine" className="hover:text-ink">Tasks</a>
        <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
        <span className="font-mono text-ink/70">{t.ref}</span>
      </nav>

      <header className="mt-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-flag">
            <ClipboardList className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            Task
          </span>
          <TaskStatusPill task={t} now={now} />
          <PriorityBadge priority={t.priority} />
        </div>
        <h1 className="mt-3 max-w-4xl font-display text-[clamp(1.75rem,3vw,2.4rem)] leading-tight tracking-[-0.015em] text-ink u-balance">{t.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-ink/60">
          <span className="inline-flex items-center gap-2"><RoleBadge id={t.creatorId} size="xs" />{who(t.creatorId)}</span>
          <ArrowRight className="h-4 w-4 text-ink/35" strokeWidth={1.75} aria-label="assigned to" />
          {assigneeRoles(t).map((r) => (
            <span key={r} className="inline-flex items-center gap-2"><RoleBadge id={r} size="xs" />{who(r)}</span>
          ))}
          <span className="text-ink/40">· created {formatWhen(t.createdAt)}</span>
        </div>
      </header>

      <DeadlineBanner t={t} now={now} missedRoles={missedRoles} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-8">
        <div className="min-w-0">
          <Card>
            <CardHeader title="Description" icon={PenLine} />
            <div className="p-6 sm:p-8">
              {t.description ? (
                <div className="whitespace-pre-wrap text-[0.9375rem] leading-[1.8] text-ink/80">{t.description}</div>
              ) : (
                <p className="text-sm text-ink/40">No description.</p>
              )}
            </div>
            {t.attachments.length > 0 && (
              <div className="border-t border-ink/10 px-6 py-5 sm:px-8">
                <p className="label mb-3 flex items-center gap-2 text-ink/45">
                  <Paperclip className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                  Attachments · {t.attachments.length}
                </p>
                <AttachmentList files={t.attachments} audit={{ kind: 'task', id: t.id }} />
              </div>
            )}
          </Card>

          <AssigneesCard me={me} t={t} now={now} />

          {t.submissions.length > 0 && <WorkLog t={t} />}

          {/* On phones the actions come straight after the brief */}
          <div className="mt-6 space-y-4 lg:hidden">
            <Actions me={me} t={t} now={now} />
          </div>

          <div role="tablist" className="mt-10 flex gap-6 border-b border-ink/10">
            {tabs.map(({ id: key, label, icon: Icon, badge }) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                type="button"
                onClick={() => setTab(key)}
                className={`relative -mb-px inline-flex items-center gap-2 pb-3 text-sm font-medium transition-colors ${tab === key ? 'text-ink' : 'text-ink/50 hover:text-ink'}`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                {label}
                {badge && <span className="rounded-full bg-sky-600 px-1.5 text-[0.6875rem] text-white">{badge}</span>}
                {tab === key && <motion.span layoutId="task-tab" className="absolute inset-x-0 bottom-0 h-0.5 bg-flag" transition={{ duration: 0.3, ease: EASE }} />}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={tab} className="mt-6" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {tab === 'discussion' ? (
                <Discussion me={me} target={{ kind: 'task', id: t.id, participants: [t.creatorId, ...assigneeRoles(t)] }} comments={state.comments} />
              ) : (
                <AuditTrail entries={audit} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <aside className="hidden space-y-4 lg:sticky lg:top-24 lg:block lg:self-start">
          <Actions me={me} t={t} now={now} />
          <People t={t} />
        </aside>
      </div>
    </div>
  )
}

/* ───────────────────────── Deadline ───────────────────────── */

const listRoles = (roles) =>
  roles.length <= 1 ? roles.map(roleOf).join('') : `${roles.slice(0, -1).map(roleOf).join(', ')} and ${roleOf(roles[roles.length - 1])}`

function DeadlineBanner({ t, now, missedRoles }) {
  if (missedRoles.length && t.status !== 'cancelled') {
    return (
      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-700" strokeWidth={1.75} aria-hidden="true" />
        <div>
          <p className="font-semibold">Locked for {listRoles(missedRoles)} — the due date passed without their submission.</p>
          <p className="mt-1 leading-relaxed text-red-900/80">
            {listRoles(missedRoles)} {missedRoles.length === 1 ? 'was' : 'were'} unable to submit by {formatDue(t.dueAt)}. They, the creator and the
            admins (President, CEO) have been notified. Only the creator or an admin can reopen it by setting a new due date.
          </p>
        </div>
      </motion.div>
    )
  }
  if (!t.dueAt) {
    return (
      <div className="mt-6 flex items-center gap-3 rounded-lg border border-dashed border-ink/20 bg-white/60 p-4 text-sm text-ink/65">
        <CalendarClock className="h-5 w-5 shrink-0 text-ink/40" strokeWidth={1.5} aria-hidden="true" />
        No due date yet — any assignee can set one, or the creator.
        <LockRule t={t} className="ml-auto" />
      </div>
    )
  }
  const late = isPastDue(t, now)
  const closed = ['done', 'cancelled'].includes(t.status)
  return (
    <div className={`mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border p-4 text-sm ${late && !closed ? 'border-red-200 bg-red-50/60' : 'border-ink/10 bg-white'}`}>
      <span className="inline-flex items-center gap-3">
        {late && !closed ? (
          <AlarmClock className="h-5 w-5 text-red-700" strokeWidth={1.5} aria-hidden="true" />
        ) : (
          <CalendarClock className="h-5 w-5 text-flag" strokeWidth={1.5} aria-hidden="true" />
        )}
        <span>
          <span className="block text-xs text-ink/50">Due</span>
          <span className="font-medium text-ink">{formatDue(t.dueAt)}</span>
        </span>
      </span>
      {!closed && (
        <span className={`font-mono text-sm ${late ? 'text-red-700' : 'text-ink/70'}`}>
          {late ? `overdue by ${relative(t.dueAt, now).replace(' ago', '')}` : relative(t.dueAt, now)}
        </span>
      )}
      <LockRule t={t} className="ml-auto" />
    </div>
  )
}

function LockRule({ t, className = '' }) {
  return t.lock ? (
    <span className={`inline-flex items-center gap-1.5 rounded bg-forest px-2 py-1 text-xs text-mint ${className}`}>
      <Lock className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
      Locks at the due date
    </span>
  ) : (
    <span className={`inline-flex items-center gap-1.5 rounded bg-ink/[0.05] px-2 py-1 text-xs text-ink/60 ${className}`}>
      <LockOpen className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
      Late submissions allowed
    </span>
  )
}

/* ───────────────────────── Work log ───────────────────────── */

const LOG_STYLE = {
  submission: { icon: Send, label: 'Submitted work', cls: 'text-sky-700' },
  accepted: { icon: CircleCheck, label: 'Accepted', cls: 'text-flag' },
  changes_requested: { icon: RotateCcw, label: 'Requested changes', cls: 'text-orange-700' },
}

function WorkLog({ t }) {
  return (
    <Card className="mt-6">
      <CardHeader title="Work" icon={Send} aside={<span className="text-xs text-ink/45">{t.submissions.length} {t.submissions.length === 1 ? 'entry' : 'entries'}</span>} />
      <ol className="px-5 py-5">
        {t.submissions.map((s, i) => {
          const { icon: Icon, label, cls } = LOG_STYLE[s.kind]
          return (
            <li key={s.id} className="relative flex gap-3 pb-6 last:pb-0">
              {i < t.submissions.length - 1 && <span className="absolute bottom-0 left-[1.125rem] top-10 w-px bg-ink/10" aria-hidden="true" />}
              <span className="relative self-start">
                <RoleBadge id={s.by} />
                <span className="absolute -bottom-1 -right-1 rounded-full bg-white">
                  <Icon className={`h-4 w-4 ${cls}`} strokeWidth={2} aria-hidden="true" />
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-medium text-ink">{s.byName || roleOf(s.by)}</span>{' '}
                  <span className={cls}>{label.toLowerCase()}</span>
                  {s.kind !== 'submission' && <span className="text-ink/70"> — {roleOf(s.assignee)}’s work</span>}
                  <span className="text-ink/45"> · {formatWhen(s.at)}</span>
                </p>
                {s.note && <p className="mt-2 whitespace-pre-wrap rounded-md bg-paper px-3 py-2 text-sm leading-relaxed text-ink/80">{s.note}</p>}
                {s.attachments.length > 0 && (
                  <div className="mt-2">
                    <AttachmentList files={s.attachments} audit={{ kind: 'task', id: t.id }} />
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}

/* ───────────────────────── Actions ───────────────────────── */

function useRun() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function run(fn) {
    setBusy(true)
    setError('')
    try {
      return (await fn()) ?? true
    } catch (e) {
      setError(e.message)
      return false
    } finally {
      setBusy(false)
    }
  }
  const errorLine = error && (
    <p role="alert" className="mt-3 flex items-start gap-2 text-xs text-crimson">
      <CircleAlert className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      {error}
    </p>
  )
  return { busy, run, errorLine, setError }
}

function Actions({ me, t, now }) {
  const cards = []
  if (canTask.setOwnDue(t, me)) cards.push(<SetOwnDue key="own-due" t={t} />)
  if (canTask.submit(t, me, now)) cards.push(<Submit key="submit" t={t} now={now} />)
  const mine = myAssignment(t, me)
  if (mine && assigneeState(t, mine, now) === 'missed') cards.push(<LockedNotice key="locked" t={t} />)
  if (mine && mine.status === 'submitted' && t.status !== 'cancelled') cards.push(<Waiting key="waiting" t={t} />)
  if (canTask.changeDue(t, me)) cards.push(<Manage key="manage" t={t} now={now} />)
  if (['done', 'cancelled'].includes(t.status)) cards.push(<Closed key="closed" t={t} />)
  return cards.length ? <>{cards}</> : null
}

function Submit({ t, now }) {
  const [note, setNote] = useState('')
  const [files, setFiles] = useState([])
  const [locked, setLocked] = useState(false)
  const { busy, run, errorLine } = useRun()
  const late = isPastDue(t, now)

  async function submit() {
    const result = await run(() => taskActions.submit(t.id, note, files))
    if (result === 'locked') setLocked(true)
    else if (result) (setNote(''), setFiles([]))
  }

  if (locked) return <LockedNotice t={t} />
  return (
    <Card className="border-flag/40 shadow-[0_12px_30px_-20px_rgba(0,106,78,0.45)]">
      <CardHeader title={t.status === 'changes_requested' ? 'Resubmit your work' : 'Submit your work'} icon={Send} />
      <div className="p-5">
        {late ? (
          <p className="mb-3 text-xs leading-relaxed text-red-700">This task is overdue. Late submissions are allowed on it.</p>
        ) : t.dueAt && t.lock ? (
          <p className="mb-3 flex items-start gap-1.5 text-xs leading-relaxed text-ink/55">
            <Lock className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            Submit before {formatDue(t.dueAt)} — after that the task locks.
          </p>
        ) : null}
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="What did you do? Links, results, anything the reviewer needs." className={`${inputClass} text-sm`} />
        {files.length > 0 && (
          <div className="mt-3">
            <AttachmentList files={files} onRemove={(id) => setFiles((f) => f.filter((x) => x.id !== id))} />
          </div>
        )}
        <div className="mt-3 flex items-center justify-between gap-2">
          <AttachButton label="Attach" onAdd={(added) => setFiles((f) => [...f, ...added])} />
          <Btn icon={Send} onClick={submit} disabled={busy || (!note.trim() && !files.length)}>Submit</Btn>
        </div>
        {errorLine}
      </div>
    </Card>
  )
}

function LockedNotice({ t }) {
  return (
    <Card className="border-red-200 bg-red-50/50">
      <div className="flex gap-3 p-5">
        <Lock className="h-5 w-5 shrink-0 text-red-700" strokeWidth={1.75} aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-red-900">Submission closed</p>
          <p className="mt-1 text-xs leading-relaxed text-red-900/75">
            The due date ({formatDue(t.dueAt)}) passed before you submitted, and this task locks. You, {roleOf(t.creatorId)} and the admins have been
            notified. Ask {roleOf(t.creatorId)} or an admin to set a new due date if it should be reopened.
          </p>
        </div>
      </div>
    </Card>
  )
}

function Waiting({ t }) {
  return (
    <Card>
      <div className="flex gap-3 p-5">
        <Send className="h-5 w-5 shrink-0 text-amber-600" strokeWidth={1.75} aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-ink">Your work is submitted — waiting for review</p>
          <p className="mt-1 text-xs text-ink/55">{who(t.creatorId)} will accept it or ask for changes.</p>
        </div>
      </div>
    </Card>
  )
}

function SetOwnDue({ t }) {
  const [due, setDue] = useState('')
  const { busy, run, errorLine } = useRun()
  return (
    <Card className="border-amber-300">
      <CardHeader title="Set your due date" icon={CalendarClock} />
      <div className="p-5">
        <p className="text-xs leading-relaxed text-ink/55">
          {roleOf(t.creatorId)} left the deadline to you. Pick a date you can commit to — once set, only {roleOf(t.creatorId)} or an admin can change it
          {t.lock ? ', and the task locks when it passes' : ''}.
        </p>
        <input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} className={`${inputClass} mt-3 text-sm`} />
        <Btn className="mt-3 w-full" icon={CalendarClock} disabled={busy || !due} onClick={() => run(() => taskActions.setDue(t.id, fromLocalInput(due)))}>
          Commit to this date
        </Btn>
        {errorLine}
      </div>
    </Card>
  )
}

/* ───────────────────────── Assignees ───────────────────────── */

function AssigneesCard({ me, t, now }) {
  const list = activeAssignees(t)
  const { done, total } = progress(t)
  const manager = canManage(t, me)
  return (
    <Card className="mt-6">
      <CardHeader
        title={total > 1 ? 'Assignees' : 'Assignee'}
        icon={Users}
        aside={total > 1 && <span className="font-mono text-xs text-ink/55 tabular">{done}/{total} done</span>}
      />
      {total > 1 && (
        <div className="px-5 pt-4">
          <div className="h-1.5 overflow-hidden rounded-full bg-ink/[0.07]">
            <motion.div className="h-full rounded-full bg-flag" initial={{ width: 0 }} animate={{ width: `${(done / total) * 100}%` }} transition={{ duration: 0.8, ease: EASE }} />
          </div>
          <p className="mt-2 text-xs text-ink/50">Each person hands in their own work. The task is done when everyone’s work is accepted.</p>
        </div>
      )}
      <ul className="divide-y divide-ink/[0.07] px-5 py-2">
        {list.map((a) => (
          <AssigneeRow key={a.role} me={me} t={t} a={a} now={now} manager={manager} />
        ))}
      </ul>
    </Card>
  )
}

function AssigneeRow({ me, t, a, now, manager }) {
  const state = assigneeState(t, a, now)
  const lastSubmission = [...t.submissions].reverse().find((s) => s.kind === 'submission' && s.assignee === a.role)
  const [mode, setMode] = useState(null) // 'changes'
  const [note, setNote] = useState('')
  const [due, setDue] = useState('')
  const { busy, run, errorLine } = useRun()
  const canReview = manager && a.status === 'submitted' && t.status !== 'cancelled'
  const needsNewDue = t.lock && t.dueAt && isPastDue(t, now)

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center gap-3">
        <RoleBadge id={a.role} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">
            {who(a.role)}
            {a.role === me && <span className="font-normal text-ink/45"> (you)</span>}
          </p>
          <p className="text-xs text-ink/45">
            {lastSubmission ? `Submitted ${formatWhen(lastSubmission.at)}` : state === 'missed' ? 'Did not submit before the deadline' : 'Not submitted yet'}
          </p>
        </div>
        <StatePill state={state} />
      </div>

      {canReview && (
        <div className="mt-3 pl-12">
          <AnimatePresence mode="wait" initial={false}>
            {!mode ? (
              <motion.div key="pick" className="flex flex-wrap gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Btn size="sm" icon={CircleCheck} disabled={busy} onClick={() => run(() => taskActions.review(t.id, a.role, 'accept', ''))}>
                  Accept {roleOf(a.role)}’s work
                </Btn>
                <Btn size="sm" variant="warn" icon={RotateCcw} onClick={() => setMode('changes')}>Request changes</Btn>
              </motion.div>
            ) : (
              <motion.div key="changes" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} autoFocus placeholder={`What should ${roleOf(a.role)} change? (required)`} className={`${inputClass} text-sm`} />
                <label className="mt-3 block text-xs font-medium text-ink/70">
                  New due date for everyone {needsNewDue ? '(needed — the current one has passed)' : '(optional)'}
                  <input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} className={`${inputClass} mt-1 max-w-xs text-sm`} />
                </label>
                <div className="mt-3 flex gap-2">
                  <Btn size="sm" variant="ghost" onClick={() => setMode(null)} disabled={busy}>Cancel</Btn>
                  <Btn
                    size="sm"
                    variant="warn"
                    disabled={busy || !note.trim() || (needsNewDue && !due)}
                    onClick={async () => (await run(() => taskActions.review(t.id, a.role, 'changes', note, fromLocalInput(due)))) && setMode(null)}
                  >
                    Send back to {roleOf(a.role)}
                  </Btn>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {errorLine}
        </div>
      )}
    </li>
  )
}

function Manage({ t, now }) {
  const [panel, setPanel] = useState(null) // 'due' | 'cancel'
  const [due, setDue] = useState('')
  const [reason, setReason] = useState('')
  const { busy, run, errorLine } = useRun()
  const missedRoles = activeAssignees(t).filter((a) => assigneeState(t, a, now) === 'missed').map((a) => a.role)
  const missed = missedRoles.length > 0

  return (
    <Card className={missed ? 'border-red-200' : ''}>
      <CardHeader title={missed ? 'Reopen this task' : 'Manage task'} icon={missed ? LockOpen : PenLine} />
      <div className="p-5">
        {missed && <p className="mb-3 text-xs leading-relaxed text-ink/55">Set a new due date in the future to unlock it for {listRoles(missedRoles)}.</p>}
        <AnimatePresence mode="wait" initial={false}>
          {panel === 'due' || missed ? (
            <motion.div key="due" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <label className="block text-xs font-medium text-ink/70">
                {t.dueAt ? 'New due date' : 'Due date'}
                <input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} className={`${inputClass} mt-1 text-sm`} />
              </label>
              <div className="mt-3 flex justify-end gap-2">
                {!missed && <Btn size="sm" variant="ghost" onClick={() => setPanel(null)}>Cancel</Btn>}
                <Btn
                  size="sm"
                  icon={missed ? LockOpen : CalendarClock}
                  disabled={busy || !due}
                  onClick={async () => (await run(() => taskActions.setDue(t.id, fromLocalInput(due)))) && (setPanel(null), setDue(''))}
                >
                  {missed ? 'Reopen with this date' : 'Save due date'}
                </Btn>
              </div>
            </motion.div>
          ) : panel === 'cancel' ? (
            <motion.div key="cancel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} autoFocus placeholder="Why is it being cancelled? (required)" className={`${inputClass} text-sm`} />
              <div className="mt-3 flex justify-end gap-2">
                <Btn size="sm" variant="ghost" onClick={() => setPanel(null)}>Back</Btn>
                <Btn size="sm" variant="danger" disabled={busy || !reason.trim()} onClick={() => run(() => taskActions.cancel(t.id, reason))}>Cancel task</Btn>
              </div>
            </motion.div>
          ) : (
            <motion.div key="menu" className="grid gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Btn variant="outline" icon={CalendarClock} onClick={() => setPanel('due')}>{t.dueAt ? 'Change due date' : 'Set due date'}</Btn>
              <a href={`#/t/${t.id}/edit`} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-ink/15 bg-white text-sm font-medium text-ink hover:border-ink/30">
                <PenLine className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> Edit task
              </a>
              <Btn variant="dangerOutline" icon={Ban} onClick={() => setPanel('cancel')}>Cancel task</Btn>
            </motion.div>
          )}
        </AnimatePresence>
        {errorLine}
      </div>
    </Card>
  )
}

function Closed({ t }) {
  const done = t.status === 'done'
  const Icon = done ? CircleCheck : Ban
  return (
    <Card className={done ? 'border-flag/40 bg-flag/[0.04]' : ''}>
      <div className="flex gap-3 p-5">
        <Icon className={`h-6 w-6 shrink-0 ${done ? 'text-flag' : 'text-ink/40'}`} strokeWidth={1.5} aria-hidden="true" />
        <div>
          <p className={`text-sm font-semibold ${done ? 'text-flag' : 'text-ink/70'}`}>{done ? 'Done' : 'Cancelled'}</p>
          <p className="mt-1 text-xs text-ink/55">{t.closedAt ? `Closed ${formatWhen(t.closedAt)}. ` : ''}The record and discussion stay available.</p>
        </div>
      </div>
    </Card>
  )
}

function People({ t }) {
  const rows = [['Created by', t.creatorId], ...assigneeRoles(t).map((r) => ['Assigned to', r])]
  return (
    <Card>
      <CardHeader title="People" icon={Users} />
      <dl className="space-y-3 p-5 text-sm">
        {rows.map(([label, id]) => (
          <div key={label + id} className="flex items-center gap-3">
            <RoleBadge id={id} size="sm" />
            <div className="min-w-0">
              <dt className="text-xs text-ink/45">{label}</dt>
              <dd className="truncate text-ink">{who(id)}</dd>
            </div>
          </div>
        ))}
        {t.lock && (
          <p className="border-t border-ink/10 pt-3 text-xs leading-relaxed text-ink/50">
            If the deadline is missed, {ADMINS.map(roleOf).join(' and ')} are notified as admins.
          </p>
        )}
      </dl>
    </Card>
  )
}
