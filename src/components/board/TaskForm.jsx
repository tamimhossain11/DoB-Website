import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Check, CircleAlert, Lock, LockOpen, Save, Send } from 'lucide-react'
import { members } from '../../data/board'
import { tasks } from '../../board/store'
import { assigneeRoles, fromLocalInput, PRIORITIES } from '../../board/tasks'
import { who } from '../../board/workflow'
import { AttachButton, AttachmentList } from './Attachments'
import { Btn, Card, Field, inputClass, RoleBadge } from './bits'
import { PriorityBadge } from './taskBits'

/** mode 'new' creates a task; 'edit' changes title, description, priority, lock rule and assignees. */
export default function TaskForm({ me, mode, task, onDone, onCancel }) {
  const [f, setF] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    assignees: task ? assigneeRoles(task) : [],
    priority: task?.priority ?? 'normal',
    due: '',
    lock: task?.lock ?? true,
    attachments: task?.attachments ?? [],
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  useEffect(() => setError(''), [f]) // a stale "fix this" message goes as soon as the form changes

  async function save() {
    if (!f.title.trim()) return setError('Give the task a title.')
    if (!f.assignees.length) return setError('Choose at least one person to assign the task to.')
    if (f.due && new Date(f.due) <= new Date()) return setError('The due date must be in the future.')
    setError('')
    setBusy(true)
    try {
      if (mode === 'new') {
        const id = await tasks.create({ ...f, due: fromLocalInput(f.due) })
        onDone(id)
      } else {
        await tasks.update(task.id, f)
        onDone(task.id)
      }
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl pb-28">
      <button type="button" onClick={onCancel} className="inline-flex items-center gap-2 text-sm text-ink/55 hover:text-ink">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> Back
      </button>
      <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="font-display text-3xl tracking-[-0.01em] text-ink">{mode === 'new' ? 'New task' : 'Edit task'}</h1>
        {task && <span className="font-mono text-sm text-ink/45">{task.ref}</span>}
      </div>
      <p className="mt-2 text-sm text-ink/55">Anyone on the board can create a task and assign it to anyone on the team.</p>

      <Card className="mt-8 divide-y divide-ink/10">
        <Section step="01" title="What needs doing">
          <div className="space-y-6">
            <Field label="Title">
              <input value={f.title} onChange={set('title')} className={inputClass} placeholder="e.g. Book flights for the WICE delegation" maxLength={160} />
            </Field>
            <Field label="Description" hint="Scope, expected result, links — everything the assignees need.">
              <textarea value={f.description} onChange={set('description')} rows={8} className={`${inputClass} resize-y leading-relaxed`} />
            </Field>
            {mode === 'new' && (
              <div>
                <p className="text-sm font-medium text-ink">Attachments</p>
                <div className="mt-2 space-y-3">
                  <AttachmentList files={f.attachments} onRemove={(id) => setF((x) => ({ ...x, attachments: x.attachments.filter((a) => a.id !== id) }))} />
                  <AttachButton onAdd={(added) => setF((x) => ({ ...x, attachments: [...x.attachments, ...added] }))} />
                </div>
              </div>
            )}
          </div>
        </Section>

        <Section step="02" title="Assign to" hint="Pick one or more people. Each hands in their own work and is reviewed on their own.">
          <div role="group" aria-label="Assign to" className="grid gap-2 sm:grid-cols-2">
            {members.map((m) => {
              const on = f.assignees.includes(m.id)
              // Someone whose work was already accepted can't be taken off the task.
              const locked = task?.assignees.some((a) => a.role === m.id && a.status === 'done')
              const toggle = () =>
                setF((x) => ({ ...x, assignees: on ? x.assignees.filter((r) => r !== m.id) : [...x.assignees, m.id] }))
              return (
                <label
                  key={m.id}
                  className={`relative flex items-center gap-3 rounded-md border p-3 transition-colors ${
                    locked ? 'cursor-not-allowed border-flag/40 bg-flag/[0.04]' : on ? 'cursor-pointer border-flag bg-flag/[0.04] ring-1 ring-flag' : 'cursor-pointer border-ink/12 hover:border-ink/30'
                  }`}
                >
                  <input type="checkbox" checked={on} disabled={locked} onChange={toggle} className="sr-only" />
                  <RoleBadge id={m.id} />
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">
                    {who(m.id)}
                    {m.id === me && <span className="text-ink/45"> (you)</span>}
                    {locked && <span className="block text-xs text-flag">Work accepted</span>}
                  </span>
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${on ? 'border-flag bg-flag text-white' : 'border-ink/25 bg-white'}`}>
                    {on && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />}
                  </span>
                </label>
              )
            })}
          </div>
          {f.assignees.length > 1 && (
            <p className="mt-3 text-xs text-ink/55">
              {f.assignees.length} people assigned. The task is done when everyone’s work is accepted; at the deadline only those who haven’t submitted are locked out.
            </p>
          )}
        </Section>

        <Section step="03" title="Priority">
          <div role="radiogroup" aria-label="Priority" className="inline-flex flex-wrap rounded-md border border-ink/12 bg-paper p-0.5">
            {PRIORITIES.map((p) => {
              const on = f.priority === p.id
              return (
                <label key={p.id} className={`relative cursor-pointer rounded px-3.5 py-1.5 ${on ? '' : 'hover:bg-white/60'}`}>
                  <input type="radio" name="priority" value={p.id} checked={on} onChange={() => setF((x) => ({ ...x, priority: p.id }))} className="sr-only" />
                  {on && <motion.span layoutId="priority-pill" className="absolute inset-0 rounded bg-white shadow-sm ring-1 ring-ink/10" transition={{ duration: 0.25 }} />}
                  <span className="relative"><PriorityBadge priority={p.id} /></span>
                </label>
              )
            })}
          </div>
        </Section>

        <Section step="04" title="Deadline" hint={mode === 'new' ? 'You set the due date. Leave it empty to let an assignee set it — once set, only you or an admin can change it.' : 'Change the due date from the task page.'}>
          <div className="space-y-5">
            {mode === 'new' && (
              <Field label="Due date (optional)" className="max-w-xs">
                <input type="datetime-local" value={f.due} onChange={set('due')} className={inputClass} />
              </Field>
            )}
            <label className="flex cursor-pointer items-start gap-4 rounded-md border border-ink/12 p-4">
              <button
                type="button"
                role="switch"
                aria-checked={f.lock}
                onClick={() => setF((x) => ({ ...x, lock: !x.lock }))}
                className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${f.lock ? 'bg-flag' : 'bg-ink/20'}`}
              >
                <motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 32 }} className={`h-5 w-5 rounded-full bg-white shadow ${f.lock ? 'ml-[1.375rem]' : 'ml-0.5'}`} />
                <span className="sr-only">Lock the task when the due date passes</span>
              </button>
              <span>
                <span className="flex items-center gap-2 text-sm font-medium text-ink">
                  {f.lock ? <Lock className="h-4 w-4 text-flag" strokeWidth={1.75} aria-hidden="true" /> : <LockOpen className="h-4 w-4 text-ink/45" strokeWidth={1.75} aria-hidden="true" />}
                  Lock the task when the due date passes
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-ink/55">
                  {f.lock
                    ? 'After the deadline, anyone who hasn’t submitted is locked out. They, you and the admins (President, CEO) are notified, naming who missed it. Moving the due date later reopens it.'
                    : 'Late submissions are still accepted. Anyone overdue, and you, are notified when the deadline passes.'}
                </span>
              </span>
            </label>
          </div>
        </Section>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-white/95 backdrop-blur lg:left-64">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-end gap-3 px-5 py-3 sm:px-8">
          <AnimatePresence>
            {error && (
              <motion.p role="alert" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="mr-auto flex items-center gap-2 text-sm text-crimson">
                <CircleAlert className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                {error}
              </motion.p>
            )}
          </AnimatePresence>
          <Btn variant="ghost" onClick={onCancel} disabled={busy}>Cancel</Btn>
          <Btn icon={mode === 'new' ? Send : Save} onClick={save} disabled={busy}>
            {mode === 'new' ? 'Create and assign' : 'Save changes'}
          </Btn>
        </div>
      </div>
    </div>
  )
}

function Section({ step, title, hint, children }) {
  return (
    <section className="grid gap-5 p-6 sm:p-8 md:grid-cols-[10rem_1fr] md:gap-8">
      <div>
        <p className="label tabular text-ink/35">{step}</p>
        <h2 className="mt-1 text-[0.9375rem] font-semibold text-ink">{title}</h2>
        {hint && <p className="mt-1 text-xs leading-relaxed text-ink/50">{hint}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  )
}
