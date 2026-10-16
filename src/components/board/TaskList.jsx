import { motion } from 'framer-motion'
import { AlarmClock, ArrowRight, Check, ClipboardCheck, ClipboardList, ListTodo, Lock, MessageSquare, Plus, SearchX, UserCheck } from 'lucide-react'
import { activeAssignees, assigneeState, canTask, dueSoonForMe, myAssignment, needsTaskAction, progress, taskState, taskViewById, useNow } from '../../board/tasks'
import { roleOf } from '../../board/workflow'
import { EASE } from '../ui'
import { Card, RoleBadge } from './bits'
import { DueBadge, PriorityBadge, TaskStatusPill } from './taskBits'

const VIEW_ICONS = { mine: ListTodo, review: ClipboardCheck, created: UserCheck, open: ClipboardList, all: ClipboardList }
export const taskViewIcon = (id) => VIEW_ICONS[id] ?? ClipboardList

const PRIORITY_RANK = { urgent: 0, high: 1, normal: 2, low: 3 }

export default function TaskList({ me, state, view: viewId, query = '' }) {
  const now = useNow()
  const view = taskViewById(viewId)
  const Icon = taskViewIcon(view.id)
  const q = query.trim().toLowerCase()
  const rows = state.tasks
    .filter((t) => view.test(t, me, now))
    .filter((t) => !q || [t.ref, t.title, t.description].some((s) => s?.toLowerCase().includes(q)))
    .sort(byUrgency(now))

  const unread = {}
  for (const c of state.comments) if (c.taskId && !c.readBy[me]) unread[c.taskId] = (unread[c.taskId] ?? 0) + 1

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 font-display text-3xl tracking-[-0.01em] text-ink">
            <Icon className="h-6 w-6 text-flag" strokeWidth={1.5} aria-hidden="true" />
            {view.label}
          </h1>
          <p className="mt-1.5 text-sm text-ink/55">{view.blurb}</p>
        </div>
      </div>

      <Metrics tasks={state.tasks} me={me} now={now} />

      {rows.length === 0 ? (
        <Empty view={view} hasAny={state.tasks.length > 0} searching={Boolean(q)} />
      ) : (
        <>
          <Card className="mt-6 hidden overflow-hidden md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="label border-b border-ink/10 bg-paper/60 text-ink/45">
                  <th className="w-36 px-5 py-3 font-medium">Reference</th>
                  <th className="px-3 py-3 font-medium">Task</th>
                  <th className="px-3 py-3 font-medium">Due</th>
                  <th className="hidden px-3 py-3 font-medium lg:table-cell">Priority</th>
                  <th className="px-5 py-3 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/[0.07]">
                {rows.map((t, i) => {
                  const action = needsTaskAction(t, me, now)
                  return (
                    <motion.tr
                      key={t.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: Math.min(i, 12) * 0.03, ease: EASE }}
                      className="group cursor-pointer transition-colors hover:bg-paper/70"
                      onClick={() => (window.location.hash = `/t/${t.id}`)}
                    >
                      <td className="relative whitespace-nowrap px-5 py-4 align-top">
                        {action && <span className="absolute inset-y-0 left-0 w-0.5 bg-crimson" aria-hidden="true" />}
                        <span className="font-mono text-xs text-ink/60">{t.ref}</span>
                      </td>
                      <td className="px-3 py-4 align-top">
                        <a href={`#/t/${t.id}`} onClick={(e) => e.stopPropagation()} className="font-medium text-ink group-hover:text-flag focus:outline-none focus-visible:underline">
                          {t.title}
                        </a>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/50">
                          <span className="inline-flex items-center gap-1.5">
                            <RoleBadge id={t.creatorId} size="xs" />
                            <ArrowRight className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
                            <Assignees t={t} now={now} />
                          </span>
                          {unread[t.id] > 0 && (
                            <span className="inline-flex items-center gap-1 text-sky-700">
                              <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                              {unread[t.id]} new
                            </span>
                          )}
                          {action && (
                            <span className="font-medium text-crimson">
                              {canTask.submit(t, me, now) || canTask.setOwnDue(t, me) ? 'Your part' : 'Waiting on your review'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-4 align-top"><DueBadge task={t} now={now} /></td>
                      <td className="hidden px-3 py-4 align-top lg:table-cell"><PriorityBadge priority={t.priority} /></td>
                      <td className="px-5 py-4 text-right align-top"><TaskStatusPill task={t} now={now} /></td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </Card>

          <ul className="mt-6 space-y-3 md:hidden">
            {rows.map((t) => (
              <li key={t.id}>
                <a href={`#/t/${t.id}`} className={`block rounded-lg border bg-white p-4 ${needsTaskAction(t, me, now) ? 'border-crimson/40' : 'border-ink/10'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xs text-ink/55">{t.ref}</span>
                    <TaskStatusPill task={t} now={now} />
                  </div>
                  <p className="mt-2.5 font-medium leading-snug text-ink">{t.title}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <DueBadge task={t} now={now} />
                    <PriorityBadge priority={t.priority} />
                    <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-ink/50">
                      {roleOf(t.creatorId)} <ArrowRight className="h-3 w-3" strokeWidth={2} aria-hidden="true" /> <Assignees t={t} now={now} />
                    </span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

/** Each assignee's badge, marked done (check) or locked out (lock), plus "1/3 done". */
function Assignees({ t, now }) {
  const { done, total } = progress(t)
  return (
    <span className="inline-flex items-center gap-1">
      {activeAssignees(t).map((a) => {
        const s = assigneeState(t, a, now)
        return (
          <span key={a.role} className="relative">
            <RoleBadge id={a.role} size="xs" className={s === 'missed' ? 'opacity-50' : ''} />
            {(s === 'done' || s === 'missed') && (
              <span className={`absolute -bottom-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full ${s === 'done' ? 'bg-flag' : 'bg-red-700'}`}>
                {s === 'done' ? <Check className="h-2 w-2 text-white" strokeWidth={3} /> : <Lock className="h-2 w-2 text-white" strokeWidth={3} />}
              </span>
            )}
          </span>
        )
      })}
      {total > 1 && <span className="ml-1 font-mono text-[0.6875rem] text-ink/45 tabular">{done}/{total}</span>}
    </span>
  )
}

/** Overdue/locked first, then soonest due, then priority. */
const byUrgency = (now) => (a, b) => {
  const rank = (t) => ({ missed: 2, overdue: 0, partly_locked: 1, open: 1, changes_requested: 1, submitted: 3, done: 5, cancelled: 6 })[taskState(t, now)] ?? 4
  return (
    rank(a) - rank(b) ||
    (a.dueAt ? new Date(a.dueAt) : Infinity) - (b.dueAt ? new Date(b.dueAt) : Infinity) ||
    PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
  )
}

function Metrics({ tasks, me, now }) {
  const myPart = (t) => {
    const a = myAssignment(t, me)
    return a ? assigneeState(t, a, now) : null
  }
  const items = [
    { label: 'My open tasks', value: tasks.filter((t) => ['open', 'changes_requested', 'overdue'].includes(myPart(t))).length, icon: ListTodo, href: '#/tasks/mine' },
    { label: 'Due in 48 h', value: tasks.filter((t) => dueSoonForMe(t, me, now)).length, icon: AlarmClock, href: '#/tasks/mine', alert: true },
    {
      label: 'Waiting on my review',
      value: tasks.filter((t) => t.creatorId === me && activeAssignees(t).some((a) => a.status === 'submitted')).length,
      icon: ClipboardCheck,
      href: '#/tasks/review',
    },
    { label: 'Locked — missed', value: tasks.filter((t) => taskState(t, now) === 'missed').length, icon: Lock, href: '#/tasks/all' },
  ]
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(({ label, value, icon: Icon, href, alert }) => (
        <a key={label} href={href} className="rounded-lg border border-ink/10 bg-white p-4 transition-colors hover:border-ink/25">
          <div className="flex items-center justify-between">
            <span className="text-[0.8125rem] text-ink/55">{label}</span>
            <Icon className={`h-4 w-4 ${alert && value ? 'text-amber-600' : 'text-ink/30'}`} strokeWidth={1.75} aria-hidden="true" />
          </div>
          <p className={`mt-2 font-display text-3xl tabular ${alert && value ? 'text-amber-700' : 'text-ink'}`}>{value}</p>
        </a>
      ))}
    </div>
  )
}

function Empty({ view, hasAny, searching }) {
  const Icon = searching ? SearchX : taskViewIcon(view.id)
  return (
    <div className="mt-6 flex flex-col items-center rounded-lg border border-dashed border-ink/20 bg-white/50 px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-md bg-ink/[0.04] text-ink/35">
        <Icon className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
      </span>
      <p className="mt-5 font-display text-xl text-ink">
        {searching ? 'No matches' : !hasAny ? 'No tasks yet' : view.id === 'mine' ? 'Nothing on your list' : 'Nothing here'}
      </p>
      <p className="mt-2 max-w-sm text-sm text-ink/55">
        {searching ? 'Try a different reference number or title.' : !hasAny ? 'Create a task and assign it to anyone on the team.' : 'No tasks match this view.'}
      </p>
      {!searching && (
        <a href="#/tasks/new" className="mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-flag px-4 text-sm font-medium text-white hover:bg-leaf">
          <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          New task
        </a>
      )}
    </div>
  )
}
