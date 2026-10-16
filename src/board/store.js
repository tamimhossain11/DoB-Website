/**
 * Proposal Board storage — Supabase.
 *
 * Reads come straight from the board_* tables (row-level security limits each member
 * to what they may see). Every write is a call to a board_* Postgres function, which
 * enforces the approval workflow on the server — see
 * supabase/migrations/20261015000000_proposal_board.sql.
 *
 * Realtime pushes any change to every open tab, which then re-reads the board. The
 * board is a handful of people, so re-reading everything is simpler than patching
 * and plenty fast.
 */
import { useEffect, useSyncExternalStore } from 'react'
import { members, requisitionTypes } from '../data/board'
import { supabase } from '../lib/supabase'

const BUCKET = 'board-attachments'

/* ───────────────────────── Session + board state ───────────────────────── */

/**
 * Signing in, password resets and sign-out happen on the shared /signin/ page; this
 * store only follows the session it finds.
 *
 * status: 'unconfigured' | 'loading' | 'signed-out' | 'not-member' | 'error' | 'ready'
 * me:     the signed-in member's role id ('ceo', …) once ready
 * board:  { proposals, comments, notifications, audit } once ready
 */
let state = { status: supabase ? 'loading' : 'unconfigured' }
const listeners = new Set()

function publish(patch) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

const subscribe = (l) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

let booted = false
export function useBoard() {
  useEffect(() => {
    if (booted || !supabase) return
    booted = true
    supabase.auth.onAuthStateChange((event, session) => {
      // Supabase advises against awaiting its own calls inside this callback.
      setTimeout(() => onAuth(event, session), 0)
    })
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && state.status === 'ready') scheduleRefresh()
    })
  }, [])
  return useSyncExternalStore(subscribe, () => state)
}

let userId = null
async function onAuth(event, session) {
  const next = session?.user?.id ?? null
  if (next === userId && state.status !== 'loading') return // token refresh etc.
  userId = next
  stopRealtime()
  if (!next) return publish({ status: 'signed-out', me: null, board: null, email: null })

  try {
    const { data: m, error } = await supabase
      .from('board_members')
      .select('role_id')
      .eq('user_id', next)
      .eq('active', true)
      .maybeSingle()
    if (error) throw error
    if (!m) return publish({ status: 'not-member', email: session.user.email })
    await sweepOverdue()
    await refresh()
    publish({ status: 'ready', me: m.role_id, email: session.user.email })
    startRealtime()
  } catch (e) {
    publish({ status: 'error', error: e.message })
  }
}

/* ───────────────────────── Loading ───────────────────────── */

/** PostgREST returns at most 1000 rows per request, so page through. */
async function fetchAll(table, ...order) {
  const rows = []
  for (let from = 0; ; from += 1000) {
    let q = supabase.from(table).select('*')
    for (const col of order) q = q.order(col)
    const { data, error } = await q.range(from, from + 999)
    if (error) throw error
    rows.push(...data)
    if (data.length < 1000) return rows
  }
}

/** PostgREST's answer when a table doesn't exist (yet) in the database. */
const isMissingTable = (e) => e?.code === 'PGRST205' || e?.code === '42P01' || /schema cache|does not exist/i.test(e?.message ?? '')

/**
 * The tasks tables come from later migrations. If the site is deployed before they
 * have been run, load the rest of the board and mark tasks as unavailable rather
 * than failing the whole page.
 */
async function fetchTaskTables() {
  try {
    return {
      ready: true,
      rows: await Promise.all([
        fetchAll('board_tasks', 'created_at'),
        fetchAll('board_task_submissions', 'at'),
        fetchAll('board_task_assignees', 'added_at'),
      ]),
    }
  } catch (e) {
    if (!isMissingTable(e)) throw e
    console.warn('Tasks are not set up in the database yet:', e.message)
    return { ready: false, rows: [[], [], []] }
  }
}

async function refresh() {
  const [roster, types, proposals, versions, decisions, views, comments, reads, rsvps, notifications, audit, taskTables] =
    await Promise.all([
      fetchAll('board_members', 'created_at'),
      fetchAll('board_requisition_types', 'id'),
      fetchAll('board_proposals', 'created_at'),
      fetchAll('board_versions', 'proposal_id', 'n'),
      fetchAll('board_decisions', 'at'),
      fetchAll('board_views', 'first_at'),
      fetchAll('board_comments', 'at'),
      fetchAll('board_comment_reads', 'at'),
      fetchAll('board_meeting_responses', 'at'),
      fetchAll('board_notifications', 'at'),
      fetchAll('board_audit', 'id'),
      fetchTaskTables(),
    ])
  const [tasks, taskSubs, taskAssignees] = taskTables.rows

  // The database is the source of truth for names and required approvers;
  // src/data/board.js keeps the labels and order.
  for (const m of members) {
    const row = roster.find((r) => r.role_id === m.id && r.active)
    if (row?.name) m.name = row.name
  }
  for (const t of requisitionTypes) {
    const row = types.find((r) => r.id === t.id)
    if (row) t.approvers = row.approvers
  }

  publish({
    board: {
      ...assemble({ proposals, versions, decisions, views, comments, reads, rsvps, notifications, audit, tasks, taskSubs, taskAssignees }),
      tasksReady: taskTables.ready,
    },
  })
}

/** Shape the rows into the structure the UI and src/board/workflow.js expect. */
function assemble({ proposals, versions, decisions, views, comments, reads, rsvps, notifications, audit, tasks = [], taskSubs = [], taskAssignees = [] }) {
  const group = (rows, keyOf) => {
    const map = new Map()
    for (const r of rows) {
      const k = keyOf(r)
      if (!map.has(k)) map.set(k, [])
      map.get(k).push(r)
    }
    return map
  }
  const versionKey = (r) => `${r.proposal_id}:${r.version ?? r.n}`
  const decisionsBy = group(decisions, versionKey)
  const viewsBy = group(views, versionKey)
  const versionsBy = group(versions, (r) => r.proposal_id)
  const readsBy = group(reads, (r) => r.comment_id)
  const rsvpsBy = group(rsvps, (r) => r.comment_id)
  const subsBy = group(taskSubs, (r) => r.task_id)
  const assigneesBy = group(taskAssignees, (r) => r.task_id)
  const roleOrder = (r) => members.findIndex((m) => m.id === r)

  return {
    proposals: proposals
      .filter((p) => versionsBy.has(p.id))
      .map((p) => ({
        id: p.id,
        ref: p.ref,
        type: p.type,
        authorId: p.author_role,
        createdAt: p.created_at,
        approvers: p.approvers,
        versions: versionsBy.get(p.id).map((v) => ({
          title: v.title,
          summary: v.summary,
          body: v.body,
          amount: v.amount == null ? null : Number(v.amount),
          attachments: v.attachments,
          createdAt: v.created_at,
          submittedAt: v.submitted_at,
          decisions: (decisionsBy.get(versionKey(v)) ?? []).map((d) => ({
            by: d.by_role,
            byName: d.by_name,
            decision: d.decision,
            note: d.note,
            at: d.at,
          })),
          views: Object.fromEntries((viewsBy.get(versionKey(v)) ?? []).map((w) => [w.role_id, w.first_at])),
        })),
      })),

    tasks: tasks.map((t) => ({
      id: t.id,
      ref: t.ref,
      title: t.title,
      description: t.description,
      attachments: t.attachments,
      priority: t.priority,
      creatorId: t.creator_role,
      // Everyone ever assigned, in board order; status 'removed' marks people taken off.
      assignees: (assigneesBy.get(t.id) ?? [])
        .map((a) => ({ role: a.role_id, status: a.status, updatedAt: a.updated_at }))
        .sort((a, b) => roleOrder(a.role) - roleOrder(b.role)),
      dueAt: t.due_at,
      lock: t.lock_on_overdue,
      status: t.status,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      closedAt: t.closed_at,
      submissions: (subsBy.get(t.id) ?? []).map((x) => ({
        id: x.id,
        kind: x.kind,
        assignee: x.assignee_role,
        by: x.by_role,
        byName: x.by_name,
        note: x.note,
        attachments: x.attachments,
        at: x.at,
      })),
    })),

    comments: comments.map((c) => ({
      id: c.id,
      proposalId: c.proposal_id,
      taskId: c.task_id,
      parentId: c.parent_id,
      correctsId: c.corrects_id,
      authorId: c.author_role,
      body: c.body,
      attachments: c.attachments,
      mentions: c.mentions,
      meeting: c.meeting && {
        ...c.meeting,
        responses: Object.fromEntries((rsvpsBy.get(c.id) ?? []).map((r) => [r.role_id, { response: r.response, at: r.at }])),
      },
      version: c.version,
      at: c.at,
      readBy: Object.fromEntries((readsBy.get(c.id) ?? []).map((r) => [r.role_id, r.at])),
    })),

    notifications: notifications.map((n) => ({
      id: n.id,
      to: n.to_role,
      at: n.at,
      proposalId: n.proposal_id,
      taskId: n.task_id,
      text: n.text,
      read: n.read,
    })),

    audit: audit.map((a) => ({
      id: a.id,
      at: a.at,
      actor: a.actor_role,
      actorName: a.actor_name,
      action: a.action,
      proposalId: a.proposal_id,
      taskId: a.task_id,
      ref: a.ref,
      version: a.version,
      detail: a.detail,
    })),
  }
}

/* ───────────────────────── Realtime ───────────────────────── */

const REALTIME_TABLES = [
  'board_tasks', 'board_task_submissions', 'board_task_assignees',
  'board_proposals', 'board_versions', 'board_decisions', 'board_views', 'board_comments',
  'board_comment_reads', 'board_meeting_responses', 'board_notifications', 'board_audit',
]

let channel = null
let timer = null

function scheduleRefresh() {
  clearTimeout(timer)
  timer = setTimeout(() => refresh().catch((e) => console.error('Board refresh failed', e)), 150)
}

/**
 * Lock tasks whose due date has passed (and notify). The server also refuses late
 * submissions on its own, and supabase/cron.sql runs this every 5 minutes; calling it
 * while the board is open just makes the lock show up promptly.
 */
let sweepTimer = null
async function sweepOverdue() {
  const { error } = await supabase.rpc('board_task_sweep')
  if (error) console.warn('Task sweep failed', error.message)
}

function startRealtime() {
  clearInterval(sweepTimer)
  sweepTimer = setInterval(sweepOverdue, 60_000)
  channel = supabase.channel('board')
  for (const table of REALTIME_TABLES)
    channel.on('postgres_changes', { event: '*', schema: 'public', table }, scheduleRefresh)
  channel.subscribe()
}

function stopRealtime() {
  clearInterval(sweepTimer)
  if (channel) supabase.removeChannel(channel)
  channel = null
}

/* ───────────────────────── Actions ───────────────────────── */

/** Run a server action, then re-read so the caller sees its own change immediately. */
async function rpc(fn, args) {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw new Error(error.message)
  await refresh()
  return data
}

const fieldsJson = (f) => ({
  title: f.title,
  summary: f.summary,
  body: f.body,
  amount: f.amount === '' || f.amount == null ? null : Number(f.amount),
  attachments: f.attachments ?? [],
})

export const actions = {
  /** Create a proposal (V1). Returns its id. */
  create: (typeId, fields, submit) => rpc('board_create', { p_type: typeId, p_fields: fieldsJson(fields), p_submit: submit }),
  editDraft: (id, fields, submit) => rpc('board_edit_draft', { p_id: id, p_fields: fieldsJson(fields), p_submit: submit }),
  /** Revise a submitted proposal into a new version with a fresh approval cycle. */
  revise: (id, fields, submit) => rpc('board_revise', { p_id: id, p_fields: fieldsJson(fields), p_submit: submit }),
  submit: (id) => rpc('board_submit', { p_id: id }),
  view: (id) => rpc('board_view', { p_id: id }),
  decide: (id, decision, note) => rpc('board_decide', { p_id: id, p_decision: decision, p_note: note }),
  /** Post to a discussion thread — `thread` is { kind: 'proposal' | 'task', id }. */
  comment: (thread, { body, parentId = null, attachments = [], meeting = null, correctsId = null, mentions = [] }) =>
    rpc(thread.kind === 'task' ? 'board_task_comment' : 'board_comment', {
      [thread.kind === 'task' ? 'p_task' : 'p_proposal']: thread.id,
      p_body: body,
      p_parent: parentId,
      p_corrects: correctsId,
      p_attachments: attachments,
      p_mentions: mentions,
      p_meeting: meeting,
    }),
  respondToMeeting: (commentId, response) => rpc('board_respond_meeting', { p_comment: commentId, p_response: response }),
  markThreadRead: (thread) =>
    thread.kind === 'task'
      ? rpc('board_task_mark_read', { p_task: thread.id })
      : rpc('board_mark_thread_read', { p_proposal: thread.id }),
  markNotificationsRead: (proposalId = null) => rpc('board_mark_notifications_read', { p_proposal: proposalId }),
  openedAttachment: (thread, name) =>
    thread.kind === 'task'
      ? rpc('board_task_opened_attachment', { p_task: thread.id, p_name: name })
      : rpc('board_opened_attachment', { p_proposal: thread.id, p_name: name }),
}

/** Task actions. Every rule (who may do what, the lock) is enforced by the server. */
export const tasks = {
  /** Returns the new task's id. */
  create: ({ title, description, assignees, due, lock, priority, attachments }) =>
    rpc('board_task_create', {
      p_title: title,
      p_description: description,
      p_assignees: assignees,
      p_due: due || null,
      p_lock: lock,
      p_priority: priority,
      p_attachments: attachments ?? [],
    }),
  setDue: (id, due) => rpc('board_task_set_due', { p_task: id, p_due: due }),
  update: (id, { title, description, priority, lock, assignees }) =>
    rpc('board_task_update', { p_task: id, p_title: title, p_description: description, p_priority: priority, p_lock: lock, p_assignees: assignees }),
  /** The signed-in assignee's own submission. Resolves to 'submitted', or 'locked' when the due date had already passed. */
  submit: (id, note, attachments) => rpc('board_task_submit', { p_task: id, p_note: note, p_attachments: attachments ?? [] }),
  /** Review one assignee's submission: decision 'accept' | 'changes'. */
  review: (id, assignee, decision, note, newDue) =>
    rpc('board_task_review', { p_task: id, p_assignee: assignee, p_decision: decision, p_note: note, p_new_due: newDue || null }),
  cancel: (id, reason) => rpc('board_task_cancel', { p_task: id, p_reason: reason }),
  view: (id) => rpc('board_task_view', { p_task: id }),
}

/* ───────────────────────── Attachments (Supabase Storage) ───────────────────────── */

/** Upload to the private bucket under the uploader's folder. Returns metadata to store on the record. */
export async function saveFile(file) {
  const mime = file.type || 'text/plain'
  const safe = file.name.replace(/[^\w.-]+/g, '_').slice(-120) || 'file'
  const path = `${userId}/${crypto.randomUUID()}/${safe}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: mime, upsert: false })
  if (error) throw new Error(error.message)
  return { id: path, name: file.name, mime, size: file.size }
}

export async function getFile(id) {
  const { data, error } = await supabase.storage.from(BUCKET).download(id)
  if (error) throw new Error(error.message)
  return { blob: data, mime: data.type }
}
