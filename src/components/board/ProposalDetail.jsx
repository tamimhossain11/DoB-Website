import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleMinus,
  CircleX,
  Clock,
  Eye,
  FileCheck2,
  FilePen,
  FileX2,
  GitBranch,
  History,
  Lock,
  MessageSquare,
  Paperclip,
  RotateCcw,
  Send,
  ShieldCheck,
} from 'lucide-react'
import { actions } from '../../board/store'
import {
  approverSlots,
  can,
  currentVersion,
  DECISION,
  decisionOf,
  formatBDT,
  formatWhen,
  isLocked,
  memberById,
  statusOf,
  typeById,
  who,
} from '../../board/workflow'
import { EASE } from '../ui'
import { AttachmentList } from './Attachments'
import AuditTrail from './AuditTrail'
import Discussion from './Discussion'
import { Btn, Card, CardHeader, inputClass, RoleBadge, StatusPill, typeIcon } from './bits'

export default function ProposalDetail({ me, state, id }) {
  const p = state.proposals.find((x) => x.id === id)
  const [shown, setShown] = useState(null) // version number being viewed; null = current
  const [tab, setTab] = useState('discussion')

  // Every open is audited (the ref keeps StrictMode's double effect from logging twice).
  const logged = useRef(null)
  useEffect(() => {
    if (!p || logged.current === id) return
    logged.current = id
    actions.view(id).catch((e) => console.error('Could not record view', e))
    actions.markNotificationsRead(id).catch(() => {})
  }, [p, id, me])

  if (!p) {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <FileX2 className="h-8 w-8 text-ink/25" strokeWidth={1.5} aria-hidden="true" />
        <p className="mt-4 font-display text-2xl text-ink">Proposal not found</p>
        <p className="mt-2 text-sm text-ink/55">It may be a draft you can’t see, or the link is wrong.</p>
        <a href="#/" className="mt-6 inline-flex h-10 items-center rounded-md border border-ink/15 bg-white px-4 text-sm font-medium hover:border-ink/30">
          Back to the board
        </a>
      </div>
    )
  }

  const status = statusOf(p)
  const vNum = shown ?? p.versions.length
  const v = p.versions[vNum - 1]
  const isCurrent = vNum === p.versions.length
  const type = typeById(p.type)
  const TypeIcon = typeIcon(p.type)
  const audit = state.audit.filter((a) => a.proposalId === p.id)
  const unread = state.comments.filter((c) => c.proposalId === p.id && !c.readBy[me]).length
  const tabs = [
    { id: 'discussion', label: 'Discussion', icon: MessageSquare, badge: unread || null },
    { id: 'audit', label: 'Audit trail', icon: History, badge: null },
  ]

  return (
    <div>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-ink/50">
        <a href="#/" className="hover:text-ink">Proposals</a>
        <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
        <span className="font-mono text-ink/70">{p.ref}</span>
      </nav>

      {/* ── Header ── */}
      <header className="mt-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-flag">
            <TypeIcon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            {type.label}
          </span>
          <StatusPill status={status} />
        </div>
        <h1 className="mt-3 max-w-4xl font-display text-[clamp(1.75rem,3vw,2.4rem)] leading-tight tracking-[-0.015em] text-ink u-balance">{v.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink/55">
          <span className="inline-flex items-center gap-2">
            <RoleBadge id={p.authorId} size="xs" />
            {who(p.authorId)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            {v.submittedAt ? `Submitted ${formatWhen(v.submittedAt)}` : 'Not yet submitted'}
          </span>
          {p.versions.length > 1 && (
            <span className="inline-flex items-center gap-1.5">
              <GitBranch className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              {p.versions.length} versions
            </span>
          )}
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-8">
        {/* ── Main column ── */}
        <div className="min-w-0">
          {p.versions.length > 1 && (
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div role="tablist" aria-label="Versions" className="inline-flex rounded-md border border-ink/12 bg-white p-0.5">
                {p.versions.map((_, i) => {
                  const n = i + 1
                  const on = vNum === n
                  return (
                    <button
                      key={n}
                      role="tab"
                      aria-selected={on}
                      type="button"
                      onClick={() => setShown(n === p.versions.length ? null : n)}
                      className={`relative rounded px-3 py-1 font-mono text-xs transition-colors ${on ? 'text-white' : 'text-ink/60 hover:text-ink'}`}
                    >
                      {on && <motion.span layoutId="version-pill" className="absolute inset-0 rounded bg-ink" transition={{ duration: 0.3, ease: EASE }} />}
                      <span className="relative">V{n}{n === p.versions.length ? ' · current' : ''}</span>
                    </button>
                  )
                })}
              </div>
              {!isCurrent && <span className="text-xs text-ink/50">Superseded version — read-only, approval record preserved.</span>}
            </div>
          )}

          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={vNum} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: EASE }}>
              <Card>
                {isLocked(v) && (
                  <p className="flex items-center gap-2 border-b border-ink/10 bg-forest px-5 py-2.5 text-xs text-mint">
                    <Lock className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                    V{vNum} is locked — it carries an approval. Changes create a new version.
                  </p>
                )}
                <div className="p-6 sm:p-8">
                  {v.summary && <p className="text-lg leading-relaxed text-ink u-pretty">{v.summary}</p>}
                  {v.amount != null && (
                    <dl className="mt-6 inline-flex items-baseline gap-4 rounded-md border border-ink/10 bg-paper px-4 py-3">
                      <dt className="label text-ink/45">Amount requested</dt>
                      <dd className="font-mono text-xl font-medium text-ink tabular">{formatBDT(v.amount)}</dd>
                    </dl>
                  )}
                  {v.body && <div className="mt-6 whitespace-pre-wrap border-t border-ink/10 pt-6 text-[0.9375rem] leading-[1.8] text-ink/80">{v.body}</div>}
                </div>
                {v.attachments.length > 0 && (
                  <div className="border-t border-ink/10 px-6 py-5 sm:px-8">
                    <p className="label mb-3 flex items-center gap-2 text-ink/45">
                      <Paperclip className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                      Attachments · {v.attachments.length}
                    </p>
                    <AttachmentList files={v.attachments} audit={{ kind: 'proposal', id: p.id }} />
                  </div>
                )}
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* On phones, decisions and approvals come right after the content, not below the thread */}
          <div className="mt-6 space-y-4 lg:hidden">
            {isCurrent && <Actions me={me} p={p} />}
            <Approvals p={p} v={v} vNum={vNum} />
          </div>

          {/* Tabs */}
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
                {tab === key && <motion.span layoutId="detail-tab" className="absolute inset-x-0 bottom-0 h-0.5 bg-flag" transition={{ duration: 0.3, ease: EASE }} />}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={tab} className="mt-6" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {tab === 'discussion' ? <Discussion me={me} target={{ kind: 'proposal', id: p.id, participants: [...p.approvers, p.authorId] }} comments={state.comments} /> : <AuditTrail entries={audit} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Side column: approvals + actions ── */}
        <aside className="hidden space-y-4 lg:sticky lg:top-24 lg:block lg:self-start">
          {isCurrent && <Actions me={me} p={p} />}
          <Approvals p={p} v={v} vNum={vNum} />
        </aside>
      </div>
    </div>
  )
}

const DECISION_STYLE = {
  approve: { icon: CircleCheck, cls: 'text-flag' },
  reject: { icon: CircleX, cls: 'text-red-700' },
  revise: { icon: RotateCcw, cls: 'text-orange-700' },
}

function Approvals({ p, v, vNum }) {
  const slots = approverSlots(p)
  const active = slots.filter((s) => !s.recused)
  const approved = active.filter((s) => decisionOf(v, s.id)?.decision === 'approve').length
  const pct = (approved / active.length) * 100

  return (
    <Card>
      <CardHeader
        title={`Approvals · V${vNum}`}
        icon={ShieldCheck}
        aside={<span className="font-mono text-xs text-ink/55 tabular">{approved}/{active.length}</span>}
      />
      <div className="px-5 pt-4">
        <div className="h-1.5 overflow-hidden rounded-full bg-ink/[0.07]">
          <motion.div className="h-full rounded-full bg-flag" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: EASE }} />
        </div>
        <p className="mt-2 text-xs text-ink/50">Every required approver must approve. One rejection closes it.</p>
      </div>

      <ol className="px-5 pb-5 pt-4">
        {slots.map(({ id, recused }, i) => {
          const d = decisionOf(v, id)
          const seen = v.views?.[id]
          const style = d ? DECISION_STYLE[d.decision] : null
          const StateIcon = recused ? CircleMinus : style ? style.icon : Clock
          return (
            <li key={id} className="relative flex gap-3 pb-5 last:pb-0">
              {i < slots.length - 1 && <span className="absolute left-[1.125rem] top-10 bottom-1 w-px bg-ink/10" aria-hidden="true" />}
              <span className="relative self-start">
                <RoleBadge id={id} className={recused ? 'opacity-40' : ''} />
                <span className="absolute -bottom-1 -right-1 rounded-full bg-white">
                  <StateIcon className={`h-4 w-4 ${recused ? 'text-ink/30' : style ? style.cls : 'text-ink/30'}`} strokeWidth={2} aria-hidden="true" />
                </span>
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="truncate text-sm font-medium text-ink">{who(id)}</p>
                {recused ? (
                  <p className="text-xs text-ink/45">Recused — author of this submission</p>
                ) : d ? (
                  <>
                    <p className={`text-xs font-medium ${style.cls}`}>
                      {DECISION[d.decision].label} · {formatWhen(d.at)}
                    </p>
                    {/* Who decided, as recorded at the time — shown when the role has since changed hands. */}
                    {d.byName && d.byName !== memberById(id)?.name && <p className="text-xs text-ink/45">by {d.byName}</p>}
                    {d.note && <p className="mt-2 whitespace-pre-wrap rounded-md bg-paper px-3 py-2 text-xs leading-relaxed text-ink/70">{d.note}</p>}
                  </>
                ) : (
                  <p className="flex items-center gap-1 text-xs text-ink/45">
                    {!v.submittedAt ? 'Not submitted' : seen ? <><Eye className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" /> Viewed {formatWhen(seen)}</> : 'Pending · not opened yet'}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}

function Actions({ me, p }) {
  const [decision, setDecision] = useState(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const status = statusOf(p)

  const needsNote = decision === 'reject' || decision === 'revise'

  async function run(fn) {
    setBusy(true)
    setError('')
    try {
      await fn()
      return true
    } catch (e) {
      setError(e.message)
      return false
    } finally {
      setBusy(false)
    }
  }

  async function confirm() {
    if (await run(() => actions.decide(p.id, decision, note))) {
      setDecision(null)
      setNote('')
    }
  }

  const errorLine = error && (
    <p role="alert" className="mt-3 flex items-start gap-2 text-xs text-crimson">
      <CircleAlert className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      {error}
    </p>
  )

  if (can.decide(p, me)) {
    return (
      <Card className="border-flag/40 shadow-[0_12px_30px_-20px_rgba(0,106,78,0.45)]">
        <CardHeader title={`Your decision on V${p.versions.length}`} icon={ShieldCheck} />
        <div className="p-5">
          <p className="text-xs leading-relaxed text-ink/55">Recorded under your role and name with a timestamp. It can’t be changed afterwards.</p>
          <AnimatePresence mode="wait" initial={false}>
            {!decision ? (
              <motion.div key="choose" className="mt-4 grid gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <Btn icon={CircleCheck} onClick={() => setDecision('approve')}>Approve</Btn>
                <Btn variant="warn" icon={RotateCcw} onClick={() => setDecision('revise')}>Request revision</Btn>
                <Btn variant="dangerOutline" icon={CircleX} onClick={() => setDecision('reject')}>Reject</Btn>
              </motion.div>
            ) : (
              <motion.div key="confirm" className="mt-4" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: EASE }}>
                <p className="text-sm font-medium text-ink">{DECISION[decision].verb}</p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  autoFocus
                  placeholder={needsNote ? 'Reason (required)' : 'Note (optional)'}
                  className={`${inputClass} mt-2 text-sm`}
                />
                {decision === 'reject' && <p className="mt-2 text-xs text-red-700">Rejection is final and closes this submission.</p>}
                <div className="mt-3 flex justify-end gap-2">
                  <Btn variant="ghost" size="sm" onClick={() => setDecision(null)} disabled={busy}>Cancel</Btn>
                  <Btn
                    size="sm"
                    variant={decision === 'reject' ? 'danger' : decision === 'revise' ? 'warn' : 'solid'}
                    onClick={confirm}
                    disabled={busy || (needsNote && !note.trim())}
                  >
                    Confirm
                  </Btn>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {errorLine}
        </div>
      </Card>
    )
  }

  if (can.editDraft(p, me)) {
    return (
      <Card>
        <CardHeader title={`Draft · V${p.versions.length}`} icon={FilePen} />
        <div className="p-5">
          <p className="text-xs text-ink/55">Only you can see this draft until it’s submitted.</p>
          <div className="mt-4 grid gap-2">
            <Btn icon={Send} onClick={() => run(() => actions.submit(p.id))} disabled={busy}>Submit for approval</Btn>
            <a href={`#/p/${p.id}/edit`} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-ink/15 bg-white text-sm font-medium text-ink hover:border-ink/30">
              <FilePen className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> Edit draft
            </a>
          </div>
          {errorLine}
        </div>
      </Card>
    )
  }

  if (can.revise(p, me)) {
    const requested = status === 'revision_requested'
    return (
      <Card className={requested ? 'border-orange-300' : ''}>
        <CardHeader title={requested ? 'Revision requested' : 'Need to change something?'} icon={RotateCcw} />
        <div className="p-5">
          <p className="text-xs leading-relaxed text-ink/55">
            V{p.versions.length} can’t be edited once submitted. Revising creates V{p.versions.length + 1} and restarts approval with every required approver.
          </p>
          <a
            href={`#/p/${p.id}/revise`}
            className={`mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md text-sm font-medium ${
              requested ? 'bg-flag text-white hover:bg-leaf' : 'border border-ink/15 bg-white text-ink hover:border-ink/30'
            }`}
          >
            <GitBranch className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            Revise → V{p.versions.length + 1}
          </a>
        </div>
      </Card>
    )
  }

  if (status === 'approved' || status === 'rejected') {
    const ok = status === 'approved'
    const Icon = ok ? FileCheck2 : FileX2
    return (
      <Card className={ok ? 'border-flag/40 bg-flag/[0.04]' : 'border-red-200 bg-red-50/50'}>
        <div className="flex gap-3 p-5">
          <Icon className={`h-6 w-6 shrink-0 ${ok ? 'text-flag' : 'text-red-700'}`} strokeWidth={1.5} aria-hidden="true" />
          <div>
            <p className={`text-sm font-semibold ${ok ? 'text-flag' : 'text-red-800'}`}>{ok ? 'Final approved — locked' : 'Rejected — closed'}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink/55">This record is permanent. Discussion stays open for follow-up.</p>
          </div>
        </div>
      </Card>
    )
  }

  return null
}
