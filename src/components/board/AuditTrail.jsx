import {
  AlarmClock,
  Ban,
  CalendarCheck,
  CalendarClock,
  ClipboardPlus,
  Lock,
  LockOpen,
  CalendarPlus,
  CircleCheck,
  CircleX,
  Download,
  Eye,
  FileCheck2,
  FilePen,
  FilePlus2,
  FileX2,
  GitBranch,
  MessageSquare,
  Paperclip,
  PenLine,
  Reply,
  RotateCcw,
  Send,
} from 'lucide-react'
import { roleOf, who } from '../../board/workflow'
import { Btn } from './bits'

const ACTIONS = {
  created: { label: 'Created draft', icon: FilePlus2 },
  edited_draft: { label: 'Edited draft', icon: FilePen },
  submitted: { label: 'Submitted', icon: Send },
  new_version: { label: 'New version', icon: GitBranch },
  viewed: { label: 'Viewed', icon: Eye, quiet: true },
  approved: { label: 'Approved', icon: CircleCheck, tone: 'text-flag' },
  revision_requested: { label: 'Requested revision', icon: RotateCcw, tone: 'text-orange-700' },
  rejected: { label: 'Rejected', icon: CircleX, tone: 'text-red-700' },
  final_approved: { label: 'Final approved', icon: FileCheck2, tone: 'text-flag font-semibold' },
  final_rejected: { label: 'Closed — rejected', icon: FileX2, tone: 'text-red-700 font-semibold' },
  commented: { label: 'Commented', icon: MessageSquare },
  replied: { label: 'Replied', icon: Reply },
  correction: { label: 'Posted correction', icon: PenLine },
  meeting_requested: { label: 'Requested meeting', icon: CalendarPlus },
  meeting_response: { label: 'Meeting response', icon: CalendarCheck },
  opened_attachment: { label: 'Opened attachment', icon: Paperclip, quiet: true },
  task_created: { label: 'Created task', icon: ClipboardPlus },
  task_edited: { label: 'Edited task', icon: FilePen },
  task_due_set: { label: 'Set due date', icon: CalendarClock },
  task_reopened: { label: 'Reopened task', icon: LockOpen, tone: 'text-flag' },
  task_submitted: { label: 'Submitted work', icon: Send },
  task_submit_blocked: { label: 'Submission blocked', icon: Lock, tone: 'text-red-700' },
  task_locked: { label: 'Locked — missed', icon: Lock, tone: 'text-red-700 font-semibold' },
  task_overdue: { label: 'Became overdue', icon: AlarmClock, tone: 'text-red-700' },
  task_accepted: { label: 'Accepted work', icon: CircleCheck, tone: 'text-flag font-semibold' },
  task_changes_requested: { label: 'Requested changes', icon: RotateCcw, tone: 'text-orange-700' },
  task_cancelled: { label: 'Cancelled task', icon: Ban },
}

/**
 * Append-only record of every view, decision, correction and message, with exact
 * timestamps. There is deliberately no way to edit or delete an entry.
 */
export default function AuditTrail({ entries, showRef = false }) {
  const rows = [...entries].reverse()

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-ink/50">
          <span className="tabular font-medium text-ink/70">{entries.length}</span> entries · append-only · local time
        </p>
        <Btn variant="outline" size="sm" icon={Download} onClick={() => downloadCsv(entries)} disabled={!entries.length}>
          Export CSV
        </Btn>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-ink/10 bg-white">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead>
            <tr className="label border-b border-ink/10 bg-paper text-ink/45">
              <th className="px-4 py-3 font-medium">Timestamp</th>
              {showRef && <th className="px-4 py-3 font-medium">Ref</th>}
              <th className="px-4 py-3 font-medium">Member</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Ver.</th>
              <th className="px-4 py-3 font-medium">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/[0.06]">
            {rows.map((a) => {
              const meta = ACTIONS[a.action] ?? { label: a.action, icon: FilePen }
              const Icon = meta.icon
              return (
                <tr key={a.id} className={`align-top transition-colors hover:bg-paper/70 ${meta.quiet ? 'text-ink/50' : ''}`}>
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-ink/55">
                    <time dateTime={a.at}>{fullTime(a.at)}</time>
                  </td>
                  {showRef && (
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs">
                      {a.proposalId || a.taskId ? (
                        <a href={a.taskId ? `#/t/${a.taskId}` : `#/p/${a.proposalId}`} className="text-flag hover:underline">{a.ref}</a>
                      ) : '—'}
                    </td>
                  )}
                  <td className="whitespace-nowrap px-4 py-2.5" title={actorOf(a)}>
                    <span className="font-medium text-ink/85">{roleOf(a.actor)}</span>
                    {a.actorName && a.actorName !== roleOf(a.actor) && <span className="block text-xs text-ink/45">{a.actorName}</span>}
                  </td>
                  <td className={`whitespace-nowrap px-4 py-2.5 ${meta.tone ?? 'text-ink/80'}`}>
                    <span className="inline-flex items-center gap-2">
                      <Icon className="h-4 w-4 shrink-0 opacity-70" strokeWidth={1.75} aria-hidden="true" />
                      {meta.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-ink/50">{a.version ? `V${a.version}` : ''}</td>
                  <td className="max-w-md px-4 py-2.5 text-ink/60">{a.detail}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!rows.length && <p className="px-4 py-10 text-center text-sm text-ink/45">No activity yet.</p>}
      </div>
    </div>
  )
}

/** The name recorded with the entry (who held the role then), else the role's current holder. */
const actorOf = (a) => (a.actor === 'system' ? 'System' : a.actorName ? `${roleOf(a.actor)} · ${a.actorName}` : who(a.actor))

const fullTime = (iso) =>
  new Date(iso).toLocaleString('en-GB', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  })

function downloadCsv(entries) {
  const esc = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`
  const lines = [
    ['timestamp_utc', 'ref', 'actor_role', 'actor', 'action', 'version', 'detail'].join(','),
    ...entries.map((a) =>
      [a.at, a.ref, roleOf(a.actor), actorOf(a), ACTIONS[a.action]?.label ?? a.action, a.version ? `V${a.version}` : '', a.detail].map(esc).join(','),
    ),
  ]
  const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }))
  const link = Object.assign(document.createElement('a'), {
    href: url,
    download: `dob-board-audit-${new Date().toISOString().slice(0, 10)}.csv`,
  })
  link.click()
  URL.revokeObjectURL(url)
}
