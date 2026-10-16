import { useEffect, useRef, useState } from 'react'
import { FileText, FileType, LoaderCircle, Paperclip, X } from 'lucide-react'
import { attachmentRules } from '../../data/board'
import { actions, getFile, saveFile } from '../../board/store'
import { formatBytes } from '../../board/workflow'

/** File picker for text, PDF and image attachments. Calls onAdd with stored file metadata. */
export function AttachButton({ onAdd, label = 'Attach file', compact = false, className = '' }) {
  const input = useRef(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onChange(e) {
    const files = [...e.target.files]
    e.target.value = ''
    setError('')
    const bad = files.find((f) => !attachmentRules.allowed(f.type, f.name))
    if (bad) return setError(`${bad.name}: only text, PDF and image files can be attached.`)
    const big = files.find((f) => f.size > attachmentRules.maxBytes)
    if (big) return setError(`${big.name} is over ${formatBytes(attachmentRules.maxBytes)}.`)
    setBusy(true)
    try {
      onAdd(await Promise.all(files.map(saveFile)))
    } catch (err) {
      setError(`Upload failed: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  const Icon = busy ? LoaderCircle : Paperclip
  return (
    <span className={className}>
      <button
        type="button"
        onClick={() => input.current.click()}
        disabled={busy}
        title={compact ? label : undefined}
        aria-label={compact ? label : undefined}
        className={`inline-flex h-9 items-center gap-2 rounded-md text-sm text-ink/65 transition-colors hover:bg-ink/5 hover:text-ink disabled:opacity-50 ${
          compact ? 'w-9 justify-center' : 'border border-dashed border-ink/25 px-3.5 hover:border-ink/40'
        }`}
      >
        <Icon className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} strokeWidth={1.75} aria-hidden="true" />
        {!compact && (busy ? 'Uploading…' : label)}
      </button>
      <input ref={input} type="file" multiple accept={attachmentRules.accept} onChange={onChange} className="sr-only" tabIndex={-1} />
      {error && <span role="alert" className="mt-2 block text-xs text-crimson">{error}</span>}
    </span>
  )
}

/**
 * Attachment chips. Opening one is audited when `audit` is given — the thread
 * ({ kind: 'proposal' | 'task', id }) the file belongs to.
 * Images get a thumbnail; PDFs and text open in a new tab.
 */
export function AttachmentList({ files, onRemove, audit }) {
  if (!files?.length) return null
  return (
    <ul className="flex flex-wrap gap-2">
      {files.map((f) => (
        <li key={f.id}>
          <AttachmentChip file={f} onRemove={onRemove && (() => onRemove(f.id))} audit={audit} />
        </li>
      ))}
    </ul>
  )
}

function AttachmentChip({ file, onRemove, audit }) {
  const [thumb, setThumb] = useState(null)
  const isImage = file.mime.startsWith('image/')
  const isPdf = file.mime === 'application/pdf'

  useEffect(() => {
    if (!isImage) return
    let url
    let cancelled = false
    getFile(file.id)
      .then((rec) => !cancelled && setThumb((url = URL.createObjectURL(rec.blob))))
      .catch(() => {}) // fall back to the icon tile
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [file.id, isImage])

  async function open() {
    // Open the tab synchronously so pop-up blockers allow it, then point it at the blob.
    const tab = window.open('', '_blank')
    try {
      const rec = await getFile(file.id)
      const blob = file.mime.startsWith('text/') ? new Blob([rec.blob], { type: 'text/plain;charset=utf-8' }) : rec.blob
      if (tab) tab.location.href = URL.createObjectURL(blob)
      if (audit) await actions.openedAttachment(audit, file.name)
    } catch (e) {
      tab?.close()
      window.alert(`Couldn’t open ${file.name}: ${e.message}`)
    }
  }

  const Icon = isPdf ? FileType : FileText
  return (
    <span className="group inline-flex max-w-full items-center rounded-md border border-ink/12 bg-white text-sm transition-colors hover:border-ink/25">
      <button type="button" onClick={open} className="flex min-w-0 items-center gap-2.5 py-1.5 pl-1.5 pr-3 text-left" title={`Open ${file.name}`}>
        {thumb ? (
          <img src={thumb} alt="" className="h-8 w-8 shrink-0 rounded object-cover" />
        ) : (
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded ${isPdf ? 'bg-red-50 text-red-700' : 'bg-flag/8 text-flag'}`}>
            <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          </span>
        )}
        <span className="min-w-0">
          <span className="block max-w-[14rem] truncate text-ink group-hover:text-flag">{file.name}</span>
          <span className="block font-mono text-[0.6875rem] text-ink/45">{formatBytes(file.size)}</span>
        </span>
      </button>
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Remove ${file.name}`} className="mr-1.5 rounded p-1 text-ink/40 hover:bg-ink/5 hover:text-crimson">
          <X className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      )}
    </span>
  )
}
