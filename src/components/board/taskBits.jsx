import { AlarmClock, Ban, CalendarClock, CircleCheck, CircleDot, Lock, RotateCcw, Send, SignalHigh, SignalLow, SignalMedium, ChevronsUp } from 'lucide-react'
import { dueInfo, TASK_STATUS, taskState } from '../../board/tasks'

const STATUS_STYLE = {
  open: { icon: CircleDot, cls: 'bg-sky-50 text-sky-800 ring-1 ring-inset ring-sky-200' },
  changes_requested: { icon: RotateCcw, cls: 'bg-orange-50 text-orange-800 ring-1 ring-inset ring-orange-200' },
  submitted: { icon: Send, cls: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200' },
  done: { icon: CircleCheck, cls: 'bg-flag text-white' },
  overdue: { icon: AlarmClock, cls: 'bg-red-50 text-red-800 ring-1 ring-inset ring-red-200' },
  missed: { icon: Lock, cls: 'bg-red-700 text-white' },
  partly_locked: { icon: Lock, cls: 'bg-red-50 text-red-800 ring-1 ring-inset ring-red-200' },
  cancelled: { icon: Ban, cls: 'bg-ink/[0.06] text-ink/60' },
}

export function TaskStatusPill({ task, now, className = '' }) {
  return <StatePill state={taskState(task, now)} className={className} />
}

/** Badge for any task or per-assignee state. */
export function StatePill({ state, className = '' }) {
  const { icon: Icon, cls } = STATUS_STYLE[state] ?? STATUS_STYLE.open
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium ${cls} ${className}`}>
      <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
      {TASK_STATUS[state].label}
    </span>
  )
}

const PRIORITY_STYLE = {
  low: { icon: SignalLow, cls: 'text-ink/45', label: 'Low' },
  normal: { icon: SignalMedium, cls: 'text-ink/60', label: 'Normal' },
  high: { icon: SignalHigh, cls: 'text-amber-700', label: 'High' },
  urgent: { icon: ChevronsUp, cls: 'text-red-700 font-semibold', label: 'Urgent' },
}

export function PriorityBadge({ priority, className = '' }) {
  const { icon: Icon, cls, label } = PRIORITY_STYLE[priority] ?? PRIORITY_STYLE.normal
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap text-xs ${cls} ${className}`}>
      <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
      {label}
    </span>
  )
}

const DUE_TONE = {
  muted: 'text-ink/45',
  ok: 'text-ink/70',
  soon: 'text-amber-700 font-medium',
  late: 'text-red-700 font-medium',
}

/** Due date with urgency colour; a lock icon marks tasks that lock when overdue. */
export function DueBadge({ task, now, className = '' }) {
  const { text, tone } = dueInfo(task, now)
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs ${DUE_TONE[tone]} ${className}`}>
      <CalendarClock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      {text}
      {task.lock && task.dueAt && (
        <Lock className="h-3 w-3 shrink-0 opacity-70" strokeWidth={2} aria-label="Locks when overdue" />
      )}
    </span>
  )
}
