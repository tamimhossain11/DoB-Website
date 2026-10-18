/**
 * Approval workflow rules. Pure functions only — no storage, no React.
 *
 *   Draft → Submitted → Under Review → Revision Requested / Partially Approved
 *         → Final Approved / Rejected
 *
 * Status is derived from the current (latest) version rather than stored, so it can
 * never drift out of step with the decisions that produced it.
 */
import { members, requisitionTypes } from '../data/board'

export const STATUS = {
  draft: { label: 'Draft' },
  submitted: { label: 'Submitted' },
  under_review: { label: 'Under review' },
  revision_requested: { label: 'Revision requested' },
  partially_approved: { label: 'Partially approved' },
  approved: { label: 'Final approved' },
  rejected: { label: 'Rejected' },
}

export const DECISION = {
  approve: { label: 'Approved', verb: 'Approve' },
  revise: { label: 'Revision requested', verb: 'Request revision' },
  reject: { label: 'Rejected', verb: 'Reject' },
}

export const memberById = (id) => members.find((m) => m.id === id)
export const typeById = (id) => requisitionTypes.find((t) => t.id === id)

/** "CEO · Mahadir Islam" or just "CFO" when no name is set. */
export const who = (id) => {
  const m = memberById(id)
  if (!m) return id
  return m.name ? `${m.role} · ${m.name}` : m.role
}
export const roleOf = (id) => memberById(id)?.role ?? (id === 'system' ? 'System' : id)

export const currentVersion = (p) => p.versions[p.versions.length - 1]

/**
 * Required approvers for a proposal. The author never reviews their own submission:
 * if they are a required approver, their slot is recused and the rest must approve.
 */
export function approverSlots(p) {
  return p.approvers.map((id) => ({ id, recused: id === p.authorId }))
}
export const activeApprovers = (p) =>
  approverSlots(p)
    .filter((s) => !s.recused)
    .map((s) => s.id)

export function decisionOf(version, memberId) {
  return version.decisions.find((d) => d.by === memberId)
}

export function statusOf(p) {
  const v = currentVersion(p)
  if (!v.submittedAt) return 'draft'
  if (v.decisions.some((d) => d.decision === 'reject')) return 'rejected'
  if (v.decisions.some((d) => d.decision === 'revise')) return 'revision_requested'

  const required = activeApprovers(p)
  const approved = required.filter((id) => decisionOf(v, id)?.decision === 'approve')
  if (approved.length === required.length) return 'approved'
  if (approved.length > 0) return 'partially_approved'

  const viewedByReviewer = required.some((id) => v.views?.[id])
  return viewedByReviewer ? 'under_review' : 'submitted'
}

const OPEN_FOR_REVIEW = ['submitted', 'under_review', 'partially_approved']
const TERMINAL = ['approved', 'rejected']

/** Approved content is locked: once any reviewer approves a version, it can't change. */
export const isLocked = (version) => version.decisions.some((d) => d.decision === 'approve')

export const can = {
  /** Edit the draft in place — only before it has ever been submitted. */
  editDraft: (p, me) => p.authorId === me && statusOf(p) === 'draft',

  /** Start a new version (V2, V3 …) with a fresh approval cycle. */
  revise: (p, me) => {
    const s = statusOf(p)
    return p.authorId === me && s !== 'draft' && !TERMINAL.includes(s)
  },

  decide: (p, me) => {
    const v = currentVersion(p)
    return (
      OPEN_FOR_REVIEW.includes(statusOf(p)) &&
      activeApprovers(p).includes(me) &&
      !decisionOf(v, me)
    )
  },
}

/** Proposals waiting on this member, for the "Needs my approval" view and badges. */
export const needsActionFrom = (p, me) =>
  can.decide(p, me) || (p.authorId === me && statusOf(p) === 'revision_requested')

/** Pull @CEO, @President, … out of a comment. Matches role titles, case-insensitive. */
export function parseMentions(text) {
  const found = new Set()
  for (const m of members) {
    const re = new RegExp(`(^|[^\\w])@${m.handle ?? m.role}\\b`, 'i')
    if (re.test(text)) found.add(m.id)
  }
  return [...found]
}

export const formatBDT = (n) =>
  n == null || n === ''
    ? ''
    : `৳ ${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

export const formatWhen = (iso) =>
  new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

export const formatBytes = (b) =>
  b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`
