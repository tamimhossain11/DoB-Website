import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, CircleAlert, Lock, Save, Send } from 'lucide-react'
import { attachmentRules, requisitionTypes } from '../../data/board'
import { actions } from '../../board/store'
import { currentVersion, isLocked, roleOf, typeById } from '../../board/workflow'
import { AttachButton, AttachmentList } from './Attachments'
import { Btn, Card, Field, inputClass, RoleBadge, typeIcon } from './bits'

/**
 * mode: 'new'    — create V1
 *       'edit'   — change the current version while it is still an unsubmitted draft
 *       'revise' — the current version is submitted; changes become a new version
 */
export default function ProposalForm({ me, mode, proposal, onDone, onCancel }) {
  const base = proposal ? currentVersion(proposal) : null
  const [typeId, setTypeId] = useState(proposal?.type ?? requisitionTypes[0].id)
  const [fields, setFields] = useState({
    title: base?.title ?? '',
    summary: base?.summary ?? '',
    body: base?.body ?? '',
    amount: base?.amount ?? '',
    attachments: base?.attachments ?? [],
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const type = typeById(typeId)
  const set = (k) => (e) => setFields((f) => ({ ...f, [k]: e.target.value }))
  const nextVersion = proposal ? proposal.versions.length + 1 : 1

  async function save(submit) {
    if (!fields.title.trim()) return setError('Give the proposal a title.')
    if (submit && !fields.summary.trim()) return setError('Add a short summary before submitting.')
    setError('')
    setBusy(true)
    try {
      let id = proposal?.id
      if (mode === 'new') id = await actions.create(typeId, fields, submit)
      else if (mode === 'edit') await actions.editDraft(id, fields, submit)
      else await actions.revise(id, fields, submit)
      onDone(id)
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  const heading = mode === 'new' ? 'New submission' : mode === 'edit' ? 'Edit draft' : 'Revise proposal'
  let step = 0
  const nextStep = () => String(++step).padStart(2, '0')

  return (
    <div className="mx-auto w-full max-w-3xl pb-28">
      <button type="button" onClick={onCancel} className="inline-flex items-center gap-2 text-sm text-ink/55 hover:text-ink">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> Back
      </button>

      <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="font-display text-3xl tracking-[-0.01em] text-ink">{heading}</h1>
        {proposal && (
          <span className="font-mono text-sm text-ink/45">
            {proposal.ref} · {mode === 'edit' ? `V${proposal.versions.length} draft` : `creates V${nextVersion}`}
          </span>
        )}
      </div>

      {mode === 'revise' && (
        <div className="mt-6 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <p>
            V{proposal.versions.length} stays exactly as submitted
            {isLocked(base) ? ', including the approvals already given' : ''}. Your changes become <strong>V{nextVersion}</strong>, and every
            required approver reviews it again from scratch.
          </p>
        </div>
      )}

      <Card className="mt-8 divide-y divide-ink/10">
        {/* Type */}
        <Section step={nextStep()} title="Type">
          {mode === 'new' ? (
            <div role="radiogroup" aria-label="Type" className="grid gap-3 sm:grid-cols-2">
              {requisitionTypes.map((t) => {
                const Icon = typeIcon(t.id)
                const on = typeId === t.id
                return (
                  <label
                    key={t.id}
                    className={`relative flex cursor-pointer gap-3.5 rounded-md border p-4 transition-colors ${
                      on ? 'border-flag bg-flag/[0.04]' : 'border-ink/12 hover:border-ink/30'
                    }`}
                  >
                    <input type="radio" name="type" value={t.id} checked={on} onChange={() => setTypeId(t.id)} className="sr-only" />
                    <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${on ? 'text-flag' : 'text-ink/40'}`} strokeWidth={1.5} aria-hidden="true" />
                    <span>
                      <span className="block text-sm font-medium text-ink">{t.label}</span>
                      <span className="mt-1 block text-xs leading-relaxed text-ink/55">{t.hint}</span>
                    </span>
                    {on && <motion.span layoutId="type-ring" className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-flag" transition={{ duration: 0.3 }} />}
                  </label>
                )
              })}
            </div>
          ) : (
            <p className="flex items-center gap-2.5 text-sm text-ink">
              {(() => {
                const Icon = typeIcon(type.id)
                return <Icon className="h-4 w-4 text-flag" strokeWidth={1.75} aria-hidden="true" />
              })()}
              {type.label}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-md bg-paper px-4 py-3">
            <span className="text-xs font-medium text-ink/70">Required approvals</span>
            <span className="flex items-center gap-1.5">
              {type.approvers.map((id) => (
                <RoleBadge key={id} id={id} size="sm" className={id === me ? 'opacity-30' : ''} />
              ))}
            </span>
            <span className="text-xs text-ink/50">
              All must approve.{type.approvers.includes(me) && ` Your own slot (${roleOf(me)}) is recused.`}
            </span>
          </div>
        </Section>

        {/* Details */}
        <Section step={nextStep()} title="Details">
          <div className="space-y-6">
            <Field label="Title">
              <input value={fields.title} onChange={set('title')} className={inputClass} placeholder="e.g. Rover drivetrain motor replacement" maxLength={160} />
            </Field>
            <Field label="Summary" hint="One or two sentences the board sees in the list.">
              <textarea value={fields.summary} onChange={set('summary')} rows={2} className={`${inputClass} resize-y`} maxLength={400} />
            </Field>
            <Field label="Details" hint="Rationale, scope, timeline, risks — whatever the approvers need to decide.">
              <textarea value={fields.body} onChange={set('body')} rows={9} className={`${inputClass} resize-y leading-relaxed`} />
            </Field>
          </div>
        </Section>

        {type.amount && (
          <Section step={nextStep()} title="Budget">
            <Field label="Amount requested" className="max-w-xs">
              <span className="relative block">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex w-14 items-center justify-center border-r border-ink/10 font-mono text-xs text-ink/50">BDT</span>
                <input type="number" min="0" step="any" inputMode="decimal" value={fields.amount} onChange={set('amount')} className={`${inputClass} pl-[4.25rem] font-mono`} placeholder="0" />
              </span>
            </Field>
          </Section>
        )}

        <Section step={nextStep()} title="Attachments" hint={`Text, PDF and image files, up to ${attachmentRules.maxLabel} each.`}>
          <div className="space-y-3">
            <AttachmentList files={fields.attachments} onRemove={(id) => setFields((f) => ({ ...f, attachments: f.attachments.filter((a) => a.id !== id) }))} />
            <AttachButton onAdd={(added) => setFields((f) => ({ ...f, attachments: [...f.attachments, ...added] }))} />
          </div>
        </Section>
      </Card>

      {/* Action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-white/95 backdrop-blur lg:left-64">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-end gap-3 px-5 py-3 sm:px-8">
          <AnimatePresence>
            {error && (
              <motion.p
                role="alert"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="mr-auto flex items-center gap-2 text-sm text-crimson"
              >
                <CircleAlert className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                {error}
              </motion.p>
            )}
          </AnimatePresence>
          <Btn variant="ghost" onClick={onCancel} disabled={busy}>Cancel</Btn>
          <Btn variant="outline" icon={Save} onClick={() => save(false)} disabled={busy}>Save as draft</Btn>
          <Btn icon={Send} onClick={() => save(true)} disabled={busy}>
            {mode === 'revise' ? `Submit V${nextVersion} for approval` : 'Submit for approval'}
          </Btn>
        </div>
      </div>
    </div>
  )
}

function Section({ step, title, hint, children }) {
  return (
    <section className="grid gap-5 p-6 sm:p-8 md:grid-cols-[9rem_1fr] md:gap-8">
      <div>
        <p className="label tabular text-ink/35">{step}</p>
        <h2 className="mt-1 text-[0.9375rem] font-semibold text-ink">{title}</h2>
        {hint && <p className="mt-1 text-xs leading-relaxed text-ink/50">{hint}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  )
}
