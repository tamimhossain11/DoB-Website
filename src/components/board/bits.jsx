import { forwardRef, useId } from 'react'
import {
  CalendarRange,
  CircleCheck,
  CircleDot,
  CircleX,
  Cpu,
  Eye,
  EyeOff,
  FilePen,
  FileText,
  GraduationCap,
  RotateCcw,
  Send,
} from 'lucide-react'
import { STATUS, memberById } from '../../board/workflow'

const TYPE_ICONS = { proposal: FileText, 'event-budget': CalendarRange, 'course-launch': GraduationCap, technical: Cpu }
export const typeIcon = (id) => TYPE_ICONS[id] ?? FileText

const STATUS_STYLE = {
  draft: { icon: FilePen, cls: 'bg-ink/[0.06] text-ink/70' },
  submitted: { icon: Send, cls: 'bg-sky-50 text-sky-800 ring-1 ring-inset ring-sky-200' },
  under_review: { icon: Eye, cls: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200' },
  revision_requested: { icon: RotateCcw, cls: 'bg-orange-50 text-orange-800 ring-1 ring-inset ring-orange-200' },
  partially_approved: { icon: CircleDot, cls: 'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200' },
  approved: { icon: CircleCheck, cls: 'bg-flag text-white' },
  rejected: { icon: CircleX, cls: 'bg-red-50 text-red-800 ring-1 ring-inset ring-red-200' },
}

export function StatusPill({ status, className = '' }) {
  const { icon: Icon, cls } = STATUS_STYLE[status]
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium ${cls} ${className}`}>
      <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
      {STATUS[status].label}
    </span>
  )
}

/** Role monogram — the board has no photos. President and CEO are set dark. */
export function RoleBadge({ id, size = 'md', className = '' }) {
  const m = memberById(id)
  const sizes = { xs: 'h-6 w-6 text-[0.5625rem]', sm: 'h-7 w-7 text-[0.5625rem]', md: 'h-9 w-9 text-[0.6875rem]', lg: 'h-11 w-11 text-xs' }
  const lead = id === 'president' || id === 'ceo'
  return (
    <span
      title={m ? (m.name ? `${m.role} · ${m.name}` : m.role) : id}
      className={`inline-flex shrink-0 items-center justify-center rounded-md font-mono font-medium tracking-wide ${
        lead ? 'bg-forest text-mint' : 'bg-parchment text-flag'
      } ${sizes[size]} ${className}`}
    >
      {m?.abbr ?? m?.role ?? '?'}
    </span>
  )
}

export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-medium text-ink">{label}</span>
      {hint && <span className="mt-0.5 block text-xs text-ink/50">{hint}</span>}
      <span className="mt-2 block">{children}</span>
    </label>
  )
}

/**
 * Password input with a show/hide toggle. The toggle sits outside the <label> so the
 * field's accessible name stays just `label`.
 */
export function PasswordField({ label, hint, value, onChange, autoComplete, show, onToggle, className = '' }) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-medium text-ink">{label}</label>
      {hint && <span className="mt-0.5 block text-xs text-ink/50">{hint}</span>}
      <div className="relative mt-2">
        <input id={id} type={show ? 'text' : 'password'} required autoComplete={autoComplete} value={value} onChange={onChange} className={`${inputClass} pr-11`} />
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={show ? 'Hide password' : 'Show password'}
            aria-pressed={show}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink/40 hover:text-ink"
          >
            {show ? <EyeOff className="h-4 w-4" strokeWidth={1.75} /> : <Eye className="h-4 w-4" strokeWidth={1.75} />}
          </button>
        )}
      </div>
    </div>
  )
}

export const inputClass =
  'w-full rounded-md border border-ink/15 bg-white px-3.5 py-2.5 text-[0.9375rem] text-ink placeholder:text-ink/35 transition-[border-color,box-shadow] focus:border-flag focus:outline-none focus:ring-4 focus:ring-flag/10'

const BTN = {
  solid: 'bg-flag text-white hover:bg-leaf',
  outline: 'border border-ink/15 bg-white text-ink hover:border-ink/30 hover:bg-paper',
  danger: 'bg-crimson text-white hover:bg-red-800',
  dangerOutline: 'border border-red-200 bg-white text-red-700 hover:border-red-300 hover:bg-red-50',
  warn: 'border border-orange-200 bg-orange-50 text-orange-900 hover:border-orange-300',
  ghost: 'text-ink/65 hover:bg-ink/5 hover:text-ink',
}
const SIZE = { sm: 'h-8 px-3 text-[0.8125rem]', md: 'h-10 px-4 text-sm' }

export const Btn = forwardRef(function Btn({ children, variant = 'solid', size = 'md', icon: Icon, className = '', ...rest }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45 ${BTN[variant]} ${SIZE[size]} ${className}`}
      {...rest}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />}
      {children}
    </button>
  )
})

export function Card({ children, className = '', ...rest }) {
  return (
    <div className={`rounded-lg border border-ink/10 bg-white ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function CardHeader({ title, icon: Icon, aside, className = '' }) {
  return (
    <div className={`flex items-center justify-between gap-3 border-b border-ink/10 px-5 py-3.5 ${className}`}>
      <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
        {Icon && <Icon className="h-4 w-4 text-ink/45" strokeWidth={1.75} aria-hidden="true" />}
        {title}
      </h2>
      {aside}
    </div>
  )
}
