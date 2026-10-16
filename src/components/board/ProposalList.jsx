import { motion } from 'framer-motion'
import { CircleCheck, CircleX, FilePen, Files, Hourglass, Inbox, MessageSquare, Plus, RotateCcw, SearchX } from 'lucide-react'
import {
  approverSlots,
  currentVersion,
  decisionOf,
  formatBDT,
  needsActionFrom,
  roleOf,
  statusOf,
  typeById,
} from '../../board/workflow'
import { EASE } from '../ui'
import { Card, RoleBadge, StatusPill, typeIcon } from './bits'

/** Queues shown in the sidebar and as list pages. */
export const VIEWS = [
  { id: 'action', label: 'Needs my action', icon: Inbox, blurb: 'Waiting on your approval or revision.', test: (p, me) => needsActionFrom(p, me) },
  { id: 'open', label: 'In review', icon: Hourglass, blurb: 'Submitted and moving through approval.', test: (p) => !['draft', 'approved', 'rejected'].includes(statusOf(p)) },
  { id: 'mine', label: 'My submissions', icon: FilePen, blurb: 'Everything you have drafted or submitted.', test: (p, me) => p.authorId === me },
  { id: 'approved', label: 'Final approved', icon: CircleCheck, blurb: 'Every required approver signed off.', test: (p) => statusOf(p) === 'approved' },
  { id: 'rejected', label: 'Rejected', icon: CircleX, blurb: 'Closed by a rejection.', test: (p) => statusOf(p) === 'rejected' },
  { id: 'all', label: 'All proposals', icon: Files, blurb: 'Every submission on the board.', test: () => true },
]
export const viewById = (id) => VIEWS.find((v) => v.id === id) ?? VIEWS[VIEWS.length - 1]

/** Drafts are private to their author until submitted. */
export const visibleProposals = (state, me) =>
  state.proposals.filter((p) => p.authorId === me || currentVersion(p).submittedAt || p.versions.length > 1)

export default function ProposalList({ me, state, view: viewId, query = '' }) {
  const view = viewById(viewId)
  const visible = visibleProposals(state, me)
  const q = query.trim().toLowerCase()
  const rows = visible
    .filter((p) => view.test(p, me))
    .filter((p) => {
      if (!q) return true
      const v = currentVersion(p)
      return [p.ref, v.title, v.summary, typeById(p.type).label].some((s) => s?.toLowerCase().includes(q))
    })
    .sort((a, b) => lastActivity(b) - lastActivity(a))

  const unread = {}
  for (const c of state.comments) if (!c.readBy[me]) unread[c.proposalId] = (unread[c.proposalId] ?? 0) + 1

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 font-display text-3xl tracking-[-0.01em] text-ink">
            <view.icon className="h-6 w-6 text-flag" strokeWidth={1.5} aria-hidden="true" />
            {view.label}
          </h1>
          <p className="mt-1.5 text-sm text-ink/55">{view.blurb}</p>
        </div>
      </div>

      <Metrics proposals={visible} me={me} />

      {rows.length === 0 ? (
        <Empty view={view} hasAny={visible.length > 0} searching={Boolean(q)} />
      ) : (
        <>
          {/* Table — tablet and up */}
          <Card className="mt-6 hidden overflow-hidden md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="label border-b border-ink/10 bg-paper/60 text-ink/45">
                  <th className="w-44 px-5 py-3 font-medium">Reference</th>
                  <th className="px-3 py-3 font-medium">Proposal</th>
                  <th className="hidden px-3 py-3 font-medium xl:table-cell">Amount</th>
                  <th className="hidden px-3 py-3 font-medium lg:table-cell">Approvals</th>
                  <th className="px-5 py-3 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/[0.07]">
                {rows.map((p, i) => (
                  <Row key={p.id} p={p} me={me} unread={unread[p.id] ?? 0} index={i} />
                ))}
              </tbody>
            </table>
          </Card>

          {/* Cards — phones */}
          <ul className="mt-6 space-y-3 md:hidden">
            {rows.map((p) => (
              <li key={p.id}>
                <MobileRow p={p} me={me} unread={unread[p.id] ?? 0} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function lastActivity(p) {
  const v = currentVersion(p)
  const times = [v.createdAt, v.submittedAt, ...v.decisions.map((d) => d.at)].filter(Boolean)
  return Math.max(...times.map((t) => +new Date(t)))
}

const ago = (iso) => {
  const s = (Date.now() - new Date(iso)) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function Metrics({ proposals, me }) {
  const count = (fn) => proposals.filter(fn).length
  const items = [
    { label: 'Waiting on you', value: count((p) => needsActionFrom(p, me)), icon: Inbox, href: '#/list/action', alert: true },
    { label: 'In review', value: count((p) => ['submitted', 'under_review', 'partially_approved'].includes(statusOf(p))), icon: Hourglass, href: '#/list/open' },
    { label: 'Revision requested', value: count((p) => statusOf(p) === 'revision_requested'), icon: RotateCcw, href: '#/list/open' },
    { label: 'Final approved', value: count((p) => statusOf(p) === 'approved'), icon: CircleCheck, href: '#/list/approved' },
  ]
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(({ label, value, icon: Icon, href, alert }) => (
        <a key={label} href={href} className="group rounded-lg border border-ink/10 bg-white p-4 transition-colors hover:border-ink/25">
          <div className="flex items-center justify-between">
            <span className="text-[0.8125rem] text-ink/55">{label}</span>
            <Icon className={`h-4 w-4 ${alert && value ? 'text-crimson' : 'text-ink/30'}`} strokeWidth={1.75} aria-hidden="true" />
          </div>
          <p className={`mt-2 font-display text-3xl tabular ${alert && value ? 'text-crimson' : 'text-ink'}`}>{value}</p>
        </a>
      ))}
    </div>
  )
}

function Approvals({ p }) {
  const v = currentVersion(p)
  return (
    <span className="flex items-center gap-1">
      {approverSlots(p).map(({ id, recused }) => {
        const d = decisionOf(v, id)?.decision
        const ring = recused
          ? 'opacity-30'
          : d === 'approve'
            ? 'ring-2 ring-flag ring-offset-1'
            : d === 'reject'
              ? 'ring-2 ring-red-500 ring-offset-1'
              : d === 'revise'
                ? 'ring-2 ring-orange-400 ring-offset-1'
                : ''
        return <RoleBadge key={id} id={id} size="xs" className={ring} />
      })}
    </span>
  )
}

function Row({ p, me, unread, index }) {
  const v = currentVersion(p)
  const type = typeById(p.type)
  const TypeIcon = typeIcon(p.type)
  const action = needsActionFrom(p, me)
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: Math.min(index, 12) * 0.03, ease: EASE }}
      className="group relative cursor-pointer transition-colors hover:bg-paper/70"
      onClick={() => (window.location.hash = `/p/${p.id}`)}
    >
      <td className="relative whitespace-nowrap px-5 py-4 align-top">
        {action && <span className="absolute inset-y-0 left-0 w-0.5 bg-crimson" aria-hidden="true" />}
        <span className="font-mono text-xs text-ink/60">{p.ref}</span>
        {p.versions.length > 1 && <span className="ml-1.5 rounded bg-ink/[0.06] px-1 py-0.5 font-mono text-[0.625rem] text-ink/55">V{p.versions.length}</span>}
      </td>
      <td className="px-3 py-4 align-top">
        <a href={`#/p/${p.id}`} onClick={(e) => e.stopPropagation()} className="font-medium text-ink group-hover:text-flag focus:outline-none focus-visible:underline">
          {v.title}
        </a>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/50">
          <span className="inline-flex items-center gap-1.5">
            <TypeIcon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            {type.label}
          </span>
          <span>{roleOf(p.authorId)} · {ago(v.submittedAt ?? v.createdAt)}</span>
          {unread > 0 && (
            <span className="inline-flex items-center gap-1 text-sky-700">
              <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              {unread} new
            </span>
          )}
          {action && <span className="font-medium text-crimson">Waiting on you</span>}
        </div>
      </td>
      <td className="hidden whitespace-nowrap px-3 py-4 align-top font-mono text-[0.8125rem] text-ink/75 xl:table-cell">
        {v.amount != null ? formatBDT(v.amount) : <span className="text-ink/25">—</span>}
      </td>
      <td className="hidden px-3 py-4 align-top lg:table-cell">
        <Approvals p={p} />
      </td>
      <td className="px-5 py-4 text-right align-top">
        <StatusPill status={statusOf(p)} />
      </td>
    </motion.tr>
  )
}

function MobileRow({ p, me, unread }) {
  const v = currentVersion(p)
  const action = needsActionFrom(p, me)
  const TypeIcon = typeIcon(p.type)
  return (
    <a href={`#/p/${p.id}`} className={`block rounded-lg border bg-white p-4 ${action ? 'border-crimson/40' : 'border-ink/10'}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs text-ink/55">{p.ref}</span>
        <StatusPill status={statusOf(p)} />
      </div>
      <p className="mt-2.5 font-medium leading-snug text-ink">{v.title}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-ink/50">
        <span className="inline-flex items-center gap-1.5">
          <TypeIcon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
          {typeById(p.type).label}
        </span>
        {v.amount != null && <span className="font-mono text-ink/70">{formatBDT(v.amount)}</span>}
        {unread > 0 && <span className="text-sky-700">{unread} new</span>}
        <span className="ml-auto"><Approvals p={p} /></span>
      </div>
    </a>
  )
}

function Empty({ view, hasAny, searching }) {
  const Icon = searching ? SearchX : view.icon
  return (
    <div className="mt-6 flex flex-col items-center rounded-lg border border-dashed border-ink/20 bg-white/50 px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-md bg-ink/[0.04] text-ink/35">
        <Icon className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
      </span>
      <p className="mt-5 font-display text-xl text-ink">
        {searching ? 'No matches' : !hasAny ? 'Nothing on the board yet' : view.id === 'action' ? 'You’re all caught up' : 'Nothing here'}
      </p>
      <p className="mt-2 max-w-sm text-sm text-ink/55">
        {searching
          ? 'Try a different reference number or title.'
          : !hasAny
            ? 'Submit a proposal, event budget, course launch or technical requisition to start an approval cycle.'
            : view.id === 'action'
              ? 'No proposals are waiting on your approval or revision.'
              : 'No proposals match this queue.'}
      </p>
      {!hasAny && !searching && (
        <a href="#/new" className="mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-flag px-4 text-sm font-medium text-white hover:bg-leaf">
          <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          New submission
        </a>
      )}
    </div>
  )
}
