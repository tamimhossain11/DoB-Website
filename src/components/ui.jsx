import { motion, MotionConfig } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export const EASE = [0.16, 1, 0.3, 1]

/** Wrap each page once. Honours the visitor's "reduce motion" setting everywhere. */
export function MotionRoot({ children }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}

/** Fades content up as it scrolls into view (once). `delay` is in milliseconds. */
export function Reveal({ children, delay = 0, as = 'div', y = 18, className = '', ...rest }) {
  const Tag = motion[as]
  return (
    <Tag
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -60px 0px' }}
      transition={{ duration: 0.7, ease: EASE, delay: delay / 1000 }}
      className={className}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/** Parent for staggered children: wrap items in <StaggerItem>. */
export function Stagger({ children, as = 'div', gap = 0.07, className = '', ...rest }) {
  const Tag = motion[as]
  return (
    <Tag
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -60px 0px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
      className={className}
      {...rest}
    >
      {children}
    </Tag>
  )
}

export function StaggerItem({ children, as = 'div', className = '', ...rest }) {
  const Tag = motion[as]
  return (
    <Tag
      variants={{
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
      }}
      className={className}
      {...rest}
    >
      {children}
    </Tag>
  )
}

export function Container({ children, className = '' }) {
  return <div className={`mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12 ${className}`}>{children}</div>
}

const TONES = {
  paper: 'bg-paper text-ink',
  surface: 'bg-surface text-ink',
  parchment: 'bg-parchment text-ink',
  forest: 'bg-forest text-paper',
  ink: 'bg-ink text-paper',
}

/** Page section with consistent vertical rhythm. */
export function Section({ id, children, className = '', tone = 'paper', bordered = true }) {
  return (
    <section
      id={id}
      className={`relative py-24 md:py-32 ${TONES[tone]} ${bordered && (tone === 'paper' || tone === 'surface') ? 'border-t border-ink/10' : ''} ${className}`}
    >
      <Container>{children}</Container>
    </section>
  )
}

/**
 * Report-style section heading: a numbered index on the left, the headline on the
 * right. `dark` switches colours for forest/ink sections.
 */
export function SectionHeader({ index, label, title, intro, dark = false, className = '', children }) {
  return (
    <div className={`grid gap-6 lg:grid-cols-12 lg:gap-12 ${className}`}>
      <Reveal className="lg:col-span-3">
        <p className={`label flex items-center gap-3 ${dark ? 'text-mint/70' : 'text-flag'}`}>
          <span className="tabular">{index}</span>
          <span className={`h-px w-6 ${dark ? 'bg-mint/30' : 'bg-flag/30'}`} />
          <span>{label}</span>
        </p>
      </Reveal>
      <div className="lg:col-span-9">
        <Reveal delay={60}>
          <h2 className={`font-display text-[clamp(2rem,3.6vw,3rem)] font-normal leading-[1.08] tracking-[-0.015em] u-balance ${dark ? 'text-paper' : 'text-ink'}`}>
            {title}
          </h2>
        </Reveal>
        {intro && (
          <Reveal delay={120}>
            <p className={`mt-5 max-w-2xl text-[1.0625rem] leading-relaxed u-pretty ${dark ? 'text-paper/65' : 'text-ink/65'}`}>
              {intro}
            </p>
          </Reveal>
        )}
        {children && <Reveal delay={160}>{children}</Reveal>}
      </div>
    </div>
  )
}

const BUTTON = {
  primary: 'bg-flag text-white hover:bg-leaf',
  secondary: 'border border-ink/20 bg-surface text-ink hover:border-ink/40',
  light: 'bg-paper text-forest hover:bg-white',
  outlineLight: 'border border-paper/25 text-paper hover:border-paper/60 hover:bg-paper/5',
  dark: 'bg-ink text-paper hover:bg-forest',
}

/** Link styled as a button. Pass `icon={null}` to drop the trailing arrow. */
export function Button({ href, children, variant = 'primary', icon: Icon = ArrowRight, className = '', ...rest }) {
  return (
    <a
      href={href}
      className={`group inline-flex items-center justify-center gap-2.5 rounded-md px-5 py-3 text-[0.9375rem] font-medium transition-colors duration-200 ${BUTTON[variant]} ${className}`}
      {...rest}
    >
      {children}
      {Icon && <Icon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={1.75} aria-hidden="true" />}
    </a>
  )
}
