import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AtSign, CalendarClock, CalendarPlus, Check, CheckCheck, CircleAlert, MapPin, MessageSquare, PenLine, Reply, Send, X } from 'lucide-react'
import { members } from '../../data/board'
import { actions } from '../../board/store'
import { formatWhen, parseMentions, roleOf, who } from '../../board/workflow'
import { EASE } from '../ui'
import { AttachButton, AttachmentList } from './Attachments'
import { Btn, inputClass, RoleBadge } from './bits'

/**
 * Discussion thread for a proposal or a task.
 * target: { kind: 'proposal' | 'task', id, participants: [role ids] } — participants are
 * the default meeting invitees.
 */
export default function Discussion({ me, target, comments }) {
  const thread = comments.filter((c) => (target.kind === 'task' ? c.taskId === target.id : c.proposalId === target.id))
  const roots = thread.filter((c) => !c.parentId)
  const repliesTo = (id) => thread.filter((c) => c.parentId === id)

  // Read receipts: messages count as read once they're on screen in a visible tab —
  // not when they sync into a background tab.
  const visible = usePageVisible()
  const hasUnread = thread.some((c) => !c.readBy[me])
  useEffect(() => {
    if (hasUnread && visible) actions.markThreadRead(target).catch(() => {})
  }, [hasUnread, visible, me, target.kind, target.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <Composer me={me} target={target} />

      {roots.length === 0 ? (
        <div className="mt-8 flex flex-col items-center py-8 text-center">
          <MessageSquare className="h-7 w-7 text-ink/20" strokeWidth={1.5} aria-hidden="true" />
          <p className="mt-3 text-sm text-ink/45">No discussion yet. Questions, context and meeting requests go here.</p>
        </div>
      ) : (
        <ol className="mt-8 space-y-6">
          <AnimatePresence initial={false}>
            {roots.map((c) => (
              <motion.li key={c.id} layout="position" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE }}>
                <Message me={me} target={target} c={c} thread={thread} />
                {repliesTo(c.id).length > 0 && (
                  <ol className="ml-4 mt-4 space-y-4 border-l border-ink/12 pl-5 sm:ml-[1.125rem] sm:pl-7">
                    {repliesTo(c.id).map((r) => (
                      <motion.li key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE }}>
                        <Message me={me} target={target} c={r} thread={thread} reply />
                      </motion.li>
                    ))}
                  </ol>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      )}
    </div>
  )
}

const jumpTo = (id) => (e) => {
  e.preventDefault()
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function Message({ me, target, c, thread, reply = false }) {
  const [mode, setMode] = useState(null) // 'reply' | 'correct'
  const corrected = thread.find((x) => x.id === c.correctsId)
  const correctedBy = thread.filter((x) => x.correctsId === c.id)
  const seenBy = Object.keys(c.readBy).filter((id) => id !== c.authorId)

  return (
    <article id={c.id} className="flex gap-3.5 scroll-mt-28">
      <RoleBadge id={c.authorId} size={reply ? 'sm' : 'md'} />
      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="text-sm font-semibold text-ink">{who(c.authorId)}</span>
          <time dateTime={c.at} className="text-xs text-ink/45">{formatWhen(c.at)}</time>
          {c.version != null && <span className="rounded bg-ink/[0.05] px-1.5 py-0.5 font-mono text-[0.625rem] text-ink/50">V{c.version}</span>}
          {c.meeting && <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[0.6875rem] font-medium text-sky-800">Meeting request</span>}
          {corrected && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[0.6875rem] font-medium text-amber-900">Correction</span>}
        </header>

        <div className="mt-2 rounded-lg border border-ink/10 bg-white px-4 py-3">
          {corrected && (
            <a href={`#${corrected.id}`} onClick={jumpTo(corrected.id)} className="mb-2.5 block border-l-2 border-amber-300 pl-3 text-xs text-ink/50 hover:text-ink/70">
              Corrects their message of {formatWhen(corrected.at)}: “{corrected.body.slice(0, 90)}{corrected.body.length > 90 ? '…' : ''}”
            </a>
          )}

          {c.body && <p className="whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-ink/85">{highlightMentions(c.body)}</p>}
          {c.meeting && <Meeting me={me} c={c} />}
          {c.attachments.length > 0 && (
            <div className="mt-3">
              <AttachmentList files={c.attachments} audit={target} />
            </div>
          )}

          {correctedBy.length > 0 && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-amber-800">
              <PenLine className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              Corrected later by the author —
              {correctedBy.map((x, i) => (
                <a key={x.id} href={`#${x.id}`} onClick={jumpTo(x.id)} className="underline underline-offset-2">
                  {i ? ', ' : ''}see correction
                </a>
              ))}
            </p>
          )}
        </div>

        <footer className="mt-1.5 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs">
          {!reply && (
            <button type="button" onClick={() => setMode(mode === 'reply' ? null : 'reply')} className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-ink/55 hover:bg-ink/5 hover:text-ink">
              <Reply className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" /> Reply
            </button>
          )}
          {c.authorId === me && (
            <button type="button" onClick={() => setMode(mode === 'correct' ? null : 'correct')} className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-ink/55 hover:bg-ink/5 hover:text-ink">
              <PenLine className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" /> Post a correction
            </button>
          )}
          <span
            className="ml-auto inline-flex items-center gap-1.5 text-ink/40"
            title={seenBy.map((id) => `${roleOf(id)} — ${formatWhen(c.readBy[id])}`).join('\n')}
          >
            <CheckCheck className={`h-3.5 w-3.5 ${seenBy.length ? 'text-flag' : ''}`} strokeWidth={1.75} aria-hidden="true" />
            {seenBy.length ? `Seen by ${seenBy.map(roleOf).join(', ')}` : 'Not seen yet'}
          </span>
        </footer>

        <AnimatePresence initial={false}>
          {mode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="overflow-hidden"
            >
              <div className="pt-3">
                <Composer
                  me={me}
                  target={target}
                  parentId={mode === 'reply' ? c.id : c.parentId}
                  correctsId={mode === 'correct' ? c.id : null}
                  onDone={() => setMode(null)}
                  compact
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </article>
  )
}

function Meeting({ me, c }) {
  const m = c.meeting
  const mine = m.responses[me]?.response
  const invited = m.invitees.includes(me)
  const respond = (r) => actions.respondToMeeting(c.id, r).catch((e) => window.alert(e.message))
  return (
    <div className="mt-3 rounded-md border border-sky-200 bg-sky-50/60 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-sky-950">
        <CalendarClock className="h-4 w-4 text-sky-700" strokeWidth={1.75} aria-hidden="true" />
        {formatWhen(m.when)} · {m.duration} min
      </p>
      {m.where && (
        <p className="mt-1.5 flex items-start gap-2 break-words text-sm text-sky-950/70">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          {m.where}
        </p>
      )}
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {m.invitees.map((id) => {
          const r = m.responses[id]?.response
          return (
            <li
              key={id}
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs ${
                r === 'accept' ? 'bg-flag/10 text-flag' : r === 'decline' ? 'bg-red-50 text-red-700 line-through' : 'bg-white text-ink/55 ring-1 ring-inset ring-sky-200'
              }`}
            >
              {r === 'accept' && <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />}
              {roleOf(id)}
              {!r && <span className="text-ink/35">· pending</span>}
            </li>
          )
        })}
      </ul>
      {invited && (
        <div className="mt-3 flex gap-2">
          <Btn size="sm" variant={mine === 'accept' ? 'solid' : 'outline'} icon={Check} onClick={() => respond('accept')} disabled={mine === 'accept'}>
            Accept
          </Btn>
          <Btn size="sm" variant="outline" icon={X} onClick={() => respond('decline')} disabled={mine === 'decline'}>
            Decline
          </Btn>
        </div>
      )}
    </div>
  )
}

function Composer({ me, target, parentId = null, correctsId = null, onDone, compact = false }) {
  const [body, setBody] = useState('')
  const [files, setFiles] = useState([])
  const [meeting, setMeeting] = useState(null)
  const [mentionOpen, setMentionOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const box = useRef(null)

  const others = members.filter((m) => m.id !== me)
  const mentions = parseMentions(body).filter((id) => id !== me)
  const meetingValid = !meeting || (meeting.when && meeting.invitees.length)
  const canSend = (body.trim() || files.length || meeting) && meetingValid && !busy

  function mention(m) {
    const tag = `@${m.role} `
    setBody((b) => (b && !b.endsWith(' ') ? `${b} ${tag}` : b + tag))
    setMentionOpen(false)
    box.current?.focus()
  }

  async function send() {
    setBusy(true)
    setError('')
    try {
      await actions.comment(target, {
        body,
        parentId,
        correctsId,
        attachments: files,
        mentions,
        meeting: meeting && { ...meeting, when: new Date(meeting.when).toISOString() },
      })
    } catch (e) {
      setError(e.message)
      setBusy(false)
      return
    }
    setBody('')
    setFiles([])
    setMeeting(null)
    setBusy(false)
    onDone?.()
  }

  const toggleMeeting = () =>
    setMeeting(
      meeting
        ? null
        : { when: '', duration: 30, where: '', invitees: target.participants.filter((id, i, a) => id !== me && a.indexOf(id) === i) },
    )

  return (
    <div className="rounded-lg border border-ink/15 bg-white transition-shadow focus-within:border-flag focus-within:ring-4 focus-within:ring-flag/10">
      <textarea
        ref={box}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={compact ? 2 : 3}
        placeholder={correctsId ? 'What should it have said? The original stays visible.' : parentId ? 'Write a reply…' : 'Comment, ask a question, or @mention someone…'}
        className="block w-full resize-y rounded-t-lg border-0 bg-transparent px-4 py-3 text-[0.9375rem] text-ink placeholder:text-ink/35 focus:outline-none"
        onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && canSend && send()}
      />

      <AnimatePresence initial={false}>
        {meeting && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="mx-3 mb-3 grid gap-3 rounded-md border border-sky-200 bg-sky-50/60 p-4 sm:grid-cols-[1fr_7rem]">
              <label className="text-xs font-medium text-sky-950">
                When
                <input type="datetime-local" value={meeting.when} onChange={(e) => setMeeting({ ...meeting, when: e.target.value })} className={`${inputClass} mt-1 !py-2 text-sm`} />
              </label>
              <label className="text-xs font-medium text-sky-950">
                Minutes
                <input type="number" min="5" step="5" value={meeting.duration} onChange={(e) => setMeeting({ ...meeting, duration: e.target.value })} className={`${inputClass} mt-1 !py-2 text-sm`} />
              </label>
              <label className="text-xs font-medium text-sky-950 sm:col-span-2">
                Where (room or call link)
                <input value={meeting.where} onChange={(e) => setMeeting({ ...meeting, where: e.target.value })} className={`${inputClass} mt-1 !py-2 text-sm`} placeholder="Optional" />
              </label>
              <fieldset className="sm:col-span-2">
                <legend className="text-xs font-medium text-sky-950">Invite</legend>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {others.map((m) => {
                    const on = meeting.invitees.includes(m.id)
                    return (
                      <button
                        key={m.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setMeeting({ ...meeting, invitees: on ? meeting.invitees.filter((x) => x !== m.id) : [...meeting.invitees, m.id] })}
                        className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs ${on ? 'bg-sky-800 text-white' : 'bg-white text-ink/60 ring-1 ring-inset ring-sky-200'}`}
                      >
                        {on && <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />}
                        {m.role}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {files.length > 0 && (
        <div className="px-3 pb-3">
          <AttachmentList files={files} onRemove={(id) => setFiles((f) => f.filter((x) => x.id !== id))} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1 border-t border-ink/10 px-2 py-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setMentionOpen((o) => !o)}
            aria-expanded={mentionOpen}
            title="Mention someone"
            aria-label="Mention someone"
            className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-ink/5 hover:text-ink ${mentions.length ? 'text-flag' : 'text-ink/60'}`}
          >
            <AtSign className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <AnimatePresence>
            {mentionOpen && (
              <motion.ul
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-11 left-0 z-20 w-56 overflow-hidden rounded-md border border-ink/10 bg-white py-1 shadow-lg"
              >
                {others.map((m) => (
                  <li key={m.id}>
                    <button type="button" onClick={() => mention(m)} className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-paper">
                      <RoleBadge id={m.id} size="xs" />
                      <span className="min-w-0 truncate text-ink">{who(m.id)}</span>
                      {mentions.includes(m.id) && <Check className="ml-auto h-3.5 w-3.5 text-flag" strokeWidth={2} aria-hidden="true" />}
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
        <AttachButton compact label="Attach file" onAdd={(added) => setFiles((f) => [...f, ...added])} />
        {!correctsId && (
          <button
            type="button"
            onClick={toggleMeeting}
            aria-pressed={Boolean(meeting)}
            title={meeting ? 'Remove meeting request' : 'Request a meeting'}
            aria-label={meeting ? 'Remove meeting request' : 'Request a meeting'}
            className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-ink/5 ${meeting ? 'bg-sky-50 text-sky-800' : 'text-ink/60 hover:text-ink'}`}
          >
            <CalendarPlus className="h-4 w-4" strokeWidth={1.75} />
          </button>
        )}
        {mentions.length > 0 && (
          <span className="ml-1 hidden text-xs text-ink/50 sm:inline">Notifies {mentions.map(roleOf).join(', ')}</span>
        )}
        <span className="ml-auto flex items-center gap-2">
          {onDone && <Btn size="sm" variant="ghost" onClick={onDone}>Cancel</Btn>}
          <Btn size="sm" icon={correctsId ? PenLine : meeting ? CalendarPlus : Send} onClick={send} disabled={!canSend}>
            {correctsId ? 'Post correction' : parentId ? 'Reply' : meeting ? 'Send request' : 'Post'}
          </Btn>
        </span>
      </div>
      {error && (
        <p role="alert" className="flex items-center gap-2 border-t border-ink/10 px-4 py-2 text-xs text-crimson">
          <CircleAlert className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  )
}

function usePageVisible() {
  const [visible, setVisible] = useState(() => document.visibilityState === 'visible')
  useEffect(() => {
    const on = () => setVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', on)
    return () => document.removeEventListener('visibilitychange', on)
  }, [])
  return visible
}

function highlightMentions(text) {
  const roles = members.map((m) => m.role).join('|')
  const parts = text.split(new RegExp(`(@(?:${roles})\\b)`, 'gi'))
  return parts.map((part, i) => (i % 2 ? <span key={i} className="rounded bg-flag/10 px-1 font-medium text-flag">{part}</span> : part))
}
