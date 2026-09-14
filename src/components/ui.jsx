import { useEffect, useRef, useState } from 'react'

/** Adds `.is-visible` once the element scrolls into view (one-shot). */
export function Reveal({ children, delay = 0, as: Tag = 'div', className = '', ...rest }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') return setShown(true)

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -80px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      className={`reveal ${shown ? 'is-visible' : ''} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/** Small monospaced label with a rule — used above every section heading. */
export function Kicker({ children, tone = 'dark' }) {
  const color = tone === 'light' ? 'text-mint' : 'text-flag'
  const rule = tone === 'light' ? 'bg-mint/40' : 'bg-flag/30'
  return (
    <div className={`kicker flex items-center gap-3 ${color}`}>
      <span className={`h-px w-8 ${rule}`} />
      {children}
    </div>
  )
}

/** Display heading. Words wrapped in *asterisks* render in italic serif accent. */
export function Heading({ children, className = '', level: Tag = 'h2' }) {
  return (
    <Tag
      className={`font-display font-light tracking-[-0.02em] u-balance ${className}`}
    >
      {children}
    </Tag>
  )
}

/** Italic accent span for inside headings. */
export function Accent({ children, tone = 'flag' }) {
  const color = tone === 'crimson' ? 'text-vermilion' : tone === 'mint' ? 'text-mint' : 'text-flag'
  return <em className={`italic font-normal ${color}`}>{children}</em>
}

/** Primary / secondary button — renders as an anchor. */
export function Button({ href, children, variant = 'solid', className = '', ...rest }) {
  const base =
    'group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full px-7 py-3.5 text-sm font-medium transition-all duration-300'

  const styles = {
    solid: 'bg-flag text-paper hover:bg-leaf shadow-[0_10px_30px_-12px_rgba(0,106,78,0.75)] hover:shadow-[0_16px_40px_-12px_rgba(0,106,78,0.85)] hover:-translate-y-0.5',
    outline:
      'border border-ink/20 text-ink hover:border-flag hover:text-flag hover:-translate-y-0.5',
    light:
      'border border-mint/30 text-paper hover:border-mint hover:bg-mint/10 hover:-translate-y-0.5',
  }

  return (
    <a href={href} className={`${base} ${styles[variant]} ${className}`} {...rest}>
      <span className="relative z-10">{children}</span>
      <Arrow />
    </a>
  )
}

function Arrow() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="relative z-10 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
    >
      <path
        d="M2 8h11M9 4l4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Section shell with consistent rhythm and gutters. */
export function Section({ id, children, className = '', tone = 'paper' }) {
  const tones = {
    paper: 'bg-paper text-ink grain',
    parchment: 'bg-parchment text-ink grain',
    forest: 'bg-forest text-paper',
    ink: 'bg-ink text-paper',
  }
  return (
    <section
      id={id}
      className={`relative overflow-hidden px-5 py-24 sm:px-8 md:py-32 lg:px-12 ${tones[tone]} ${className}`}
    >
      <div className="relative z-10 mx-auto w-full max-w-7xl">{children}</div>
    </section>
  )
}
