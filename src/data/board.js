/**
 * Proposal Board — Internal Workstation & Board Approval (Phase 1).
 *
 * Who sits on the board, what can be submitted, and who must approve each kind of
 * submission. Change the rules here; the workflow in src/board/workflow.js reads them.
 */

export const board = {
  slug: 'board',
  label: 'Proposal Board',
}

/**
 * Board roles. Every role sees every module and every proposal; each approval is
 * recorded against the individual role and person, never pooled into a vote count.
 * Names are filled in at runtime from the board_members table in Supabase
 * (see supabase/members.sql); the role title is shown when a name is empty.
 *
 * `abbr` is the short badge text; `handle` is what follows @ in a mention.
 * Adding a role also needs board_role_ids() / board_role_label() in the database.
 */
export const members = [
  { id: 'president', role: 'President', abbr: 'PRS', handle: 'President', name: '' },
  { id: 'ceo', role: 'CEO', abbr: 'CEO', handle: 'CEO', name: '' },
  { id: 'cto', role: 'CTO', abbr: 'CTO', handle: 'CTO', name: '' },
  { id: 'cio', role: 'CIO', abbr: 'CIO', handle: 'CIO', name: '' },
  { id: 'cfo', role: 'CFO', abbr: 'CFO', handle: 'CFO', name: '' },
  { id: 'designer', role: 'Creative Designer', abbr: 'DES', handle: 'Designer', name: '' },
]

/**
 * Requisition types. `approvers` lists the roles whose approval is REQUIRED for final
 * approval — all of them, not a majority. President and CEO are on every type, so
 * they hold approve/reject authority over everything on the board.
 * `amount` shows a budget field (BDT) on the form.
 *
 * The server enforces the approvers in the board_requisition_types table and the
 * app overwrites `approvers` below with those values on load. To change who must
 * approve, update that table (and these defaults to match).
 */
export const requisitionTypes = [
  {
    id: 'proposal',
    label: 'Proposal',
    hint: 'A new initiative, partnership, policy or idea for the board to decide on.',
    approvers: ['president', 'ceo'],
    amount: false,
  },
  {
    id: 'event-budget',
    label: 'Event budget',
    hint: 'Budget for an event, competition trip, workshop or bootcamp.',
    approvers: ['president', 'ceo', 'cfo'],
    amount: true,
  },
  {
    id: 'course-launch',
    label: 'Course launch',
    hint: 'A new course, training programme or curriculum to launch.',
    approvers: ['president', 'ceo', 'cio'],
    amount: true,
  },
  {
    id: 'technical',
    label: 'Technical requisition',
    hint: 'Equipment, components, software, hosting or other technical purchases.',
    approvers: ['president', 'ceo', 'cto', 'cfo'],
    amount: true,
  },
]

/** Attachments: text, PDF and images only, up to 50 MB each (the storage bucket enforces the same). */
export const attachmentRules = {
  accept: 'text/*,.txt,.md,.csv,application/pdf,image/*',
  maxBytes: 50 * 1024 * 1024,
  maxLabel: '50 MB',
  allowed: (mime, name) =>
    mime.startsWith('text/') ||
    mime.startsWith('image/') ||
    mime === 'application/pdf' ||
    /\.(txt|md|csv)$/i.test(name),
}
