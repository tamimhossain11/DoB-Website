/**
 * Task rules for the UI. Pure functions. The server enforces the same rules — see
 * supabase/migrations/20261016000000_board_tasks.sql — so these only decide what to show.
 */
import { useEffect, useState } from 'react'

export const ADMINS = ['president', 'ceo']
export const isAdmin = (me) => ADMINS.includes(me)

export const PRIORITIES = [
  { id: 'low', label: 'Low' },
  { id: 'normal', label: 'Normal' },
  { id: 'high', label: 'High' },
  { id: 'urgent', label: 'Urgent' },
]

export const TASK_STATUS = {
  open: { label: 'Open' },
  changes_requested: { label: 'Changes requested' },
  submitted: { label: 'Submitted' },
  done: { label: 'Done' },
  overdue: { label: 'Overdue' },
  missed: { label: 'Locked — missed' },
  partly_locked: { label: 'Partly locked' },
  cancelled: { label: 'Cancelled' },
}

const PENDING = ['open', 'changes_requested']
export const isClosed = (t) => ['done', 'cancelled'].includes(t.status)
export const isPastDue = (t, now = Date.now()) => Boolean(t.dueAt) && new Date(t.dueAt).getTime() < now

/** People currently on the task (not removed), in board order. */
export const activeAssignees = (t) => t.assignees.filter((a) => a.status !== 'removed')
export const assigneeRoles = (t) => activeAssignees(t).map((a) => a.role)
export const myAssignment = (t, me) => activeAssignees(t).find((a) => a.role === me)

/**
 * One assignee's status as they should see it now. Past the deadline, someone who
 * hasn't submitted shows as locked (or overdue) immediately, before the server's
 * sweep has recorded it.
 */
export function assigneeState(t, a, now = Date.now()) {
  if (t.status === 'cancelled') return 'cancelled'
  if (PENDING.includes(a.status) && isPastDue(t, now)) return t.lock ? 'missed' : 'overdue'
  return a.status
}

/**
 * The task as a whole: Done when everyone is accepted; Locked — missed when nobody
 * can still submit and someone was locked out; Submitted when everyone left is
 * waiting for review; Partly locked when someone was locked out but others are still
 * in play; Overdue/Open otherwise.
 */
export function taskState(t, now = Date.now()) {
  if (t.status === 'cancelled') return 'cancelled'
  const states = activeAssignees(t).map((a) => assigneeState(t, a, now))
  if (states.length && states.every((x) => x === 'done')) return 'done'
  const pending = states.filter((x) => ['open', 'changes_requested', 'overdue', 'submitted'].includes(x))
  if (!pending.length && states.includes('missed')) return 'missed'
  if (states.includes('missed')) return 'partly_locked' // someone locked out, others still in play
  if (pending.length && pending.every((x) => x === 'submitted')) return 'submitted'
  if (states.includes('overdue')) return 'overdue'
  if (states.includes('changes_requested')) return 'changes_requested'
  return 'open'
}

export function progress(t) {
  const list = activeAssignees(t)
  return { done: list.filter((a) => a.status === 'done').length, total: list.length }
}

/** Creator (by role) or an admin. The server checks the individual creator. */
export const canManage = (t, me) => t.creatorId === me || isAdmin(me)

const myState = (t, me, now) => {
  const a = myAssignment(t, me)
  return a ? assigneeState(t, a, now) : null
}

export const canTask = {
  /** The signed-in assignee can hand in their own work. */
  submit: (t, me, now) => ['open', 'changes_requested', 'overdue'].includes(myState(t, me, now)),
  /** Any assignee may set the due date while none is set. */
  setOwnDue: (t, me) => Boolean(myAssignment(t, me)) && !t.dueAt && !isClosed(t),
  changeDue: (t, me) => canManage(t, me) && !isClosed(t),
  review: (t, me) => canManage(t, me) && activeAssignees(t).some((a) => a.status === 'submitted'),
  edit: (t, me) => canManage(t, me) && !isClosed(t),
  cancel: (t, me) => canManage(t, me) && !isClosed(t),
}

export const needsTaskAction = (t, me, now) =>
  canTask.submit(t, me, now) || canTask.setOwnDue(t, me) || (t.creatorId === me && activeAssignees(t).some((a) => a.status === 'submitted'))

/** My task is still in play: assigned to me and not done, missed or cancelled. */
const stillMine = (t, me, now) => ['open', 'changes_requested', 'overdue', 'submitted'].includes(myState(t, me, now))

export const TASK_VIEWS = [
  { id: 'mine', label: 'My tasks', blurb: 'Assigned to you and still to do.', test: (t, me, now) => stillMine(t, me, now) },
  { id: 'review', label: 'To review', blurb: 'Work handed in on tasks you created.', test: (t, me) => t.creatorId === me && activeAssignees(t).some((a) => a.status === 'submitted') },
  { id: 'created', label: 'Assigned by me', blurb: 'Tasks you created for the team.', test: (t, me) => t.creatorId === me },
  { id: 'open', label: 'All open tasks', blurb: 'Everything the team still has to do.', test: (t) => !isClosed(t) && t.status !== 'missed' },
  { id: 'all', label: 'All tasks', blurb: 'Every task, including done, missed and cancelled.', test: () => true },
]
export const taskViewById = (id) => TASK_VIEWS.find((v) => v.id === id) ?? TASK_VIEWS[TASK_VIEWS.length - 1]

/** My own pending work is due within 48 h (or already overdue). */
export const dueSoonForMe = (t, me, now = Date.now()) =>
  ['open', 'changes_requested', 'overdue'].includes(myState(t, me, now)) && Boolean(t.dueAt) && new Date(t.dueAt) - now < 48 * 3600e3

/** "in 2 d 4 h", "3 h ago" … */
export function relative(iso, now = Date.now()) {
  const ms = new Date(iso).getTime() - now
  const abs = Math.abs(ms)
  const m = Math.round(abs / 60000)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  const span = d >= 1 ? `${d} d${h % 24 ? ` ${h % 24} h` : ''}` : h >= 1 ? `${h} h${m % 60 ? ` ${m % 60} min` : ''}` : `${Math.max(m, 1)} min`
  return ms >= 0 ? `in ${span}` : `${span} ago`
}

/** Due-date wording and urgency for lists and badges. */
export function dueInfo(t, now = Date.now()) {
  if (!t.dueAt) return { text: 'No due date', tone: 'muted' }
  const ms = new Date(t.dueAt).getTime() - now
  if (isClosed(t)) return { text: formatDue(t.dueAt), tone: 'muted' }
  if (ms < 0) return { text: `Overdue · ${relative(t.dueAt, now).replace(' ago', '')}`, tone: 'late' }
  if (ms < 48 * 3600e3) return { text: `Due ${relative(t.dueAt, now)}`, tone: 'soon' }
  return { text: `Due ${formatDue(t.dueAt)}`, tone: 'ok' }
}

export const formatDue = (iso) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

/** <input type="datetime-local"> value ⇄ ISO */
export const toLocalInput = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
export const fromLocalInput = (v) => (v ? new Date(v).toISOString() : null)

/** Re-renders every `ms` so countdowns and the overdue lock flip without a reload. */
export function useNow(ms = 30_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(id)
  }, [ms])
  return now
}
