import { useEffect, useRef, useState } from 'react'
import { animate, motion, useInView } from 'framer-motion'
import { MapPin } from 'lucide-react'
import { hero, projects, stats } from '../data/content'
import { Button, Container, EASE } from './ui'
import { programmeIcon } from './Projects'

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-paper pt-[4.5rem]">
      <Container className="pb-16 pt-14 sm:pt-20 lg:pb-20 lg:pt-24">
        <div className="grid items-start gap-14 lg:grid-cols-12 lg:gap-12">
          {/* ── Copy ── */}
          <div className="min-w-0 lg:col-span-7">
            <motion.p
              className="label flex items-center gap-2 text-flag"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <MapPin className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
              {hero.kicker}
            </motion.p>

            <h1 className="mt-7 font-display text-[clamp(2.75rem,6.2vw,5.4rem)] font-normal leading-[1.02] tracking-[-0.025em] text-ink">
              {hero.headline.map((line, i) => (
                <span key={line} className="block overflow-hidden pb-[0.08em]">
                  <motion.span
                    className="block"
                    initial={{ y: '105%' }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.9, ease: EASE, delay: 0.1 + i * 0.12 }}
                  >
                    {line}
                    {i === hero.headline.length - 1 && <span className="text-crimson">.</span>}
                  </motion.span>
                </span>
              ))}
            </h1>

            <motion.p
              className="mt-8 max-w-xl text-lg leading-relaxed text-ink/70 u-pretty"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.4 }}
            >
              {hero.lede}
            </motion.p>

            <motion.div
              className="mt-10 flex flex-wrap items-center gap-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.5 }}
            >
              <Button href={hero.primaryCta.href}>{hero.primaryCta.label}</Button>
              <Button href={hero.secondaryCta.href} variant="secondary" icon={null}>
                {hero.secondaryCta.label}
              </Button>
            </motion.div>
          </div>

          {/* ── Mission panel ── */}
          <motion.aside
            className="relative overflow-hidden rounded-lg bg-forest text-paper shadow-[0_30px_60px_-30px_rgba(6,33,24,0.55)] lg:col-span-5"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.3 }}
            aria-label="Our programmes"
          >
            <Contours />

            <div className="relative flex items-center justify-between border-b border-mint/12 px-6 py-4">
              <p className="label text-mint/70">The machines</p>
              <p className="label tabular text-paper/40">{String(projects.length).padStart(2, '0')} programmes</p>
            </div>

            <ul className="relative p-3">
              {projects.map((p, i) => {
                const Icon = programmeIcon(p.code)
                return (
                  <motion.li
                    key={p.code}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, ease: EASE, delay: 0.5 + i * 0.08 }}
                  >
                    <a href="#projects" className="group flex items-center gap-4 rounded-md px-3 py-3.5 transition-colors hover:bg-bottle">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-mint/15 text-mint">
                        <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.9375rem]">{p.name}</span>
                        <span className="mt-0.5 block truncate text-xs text-paper/45">{p.domain}</span>
                      </span>
                      <span className="font-mono text-xs text-paper/40 transition-colors group-hover:text-mint">{p.code}</span>
                    </a>
                  </motion.li>
                )
              })}
            </ul>
          </motion.aside>
        </div>
      </Container>

      {/* ── Record ── */}
      <div className="border-t border-ink/10 bg-surface">
        <Container>
          <dl className="grid grid-cols-2 lg:grid-cols-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`py-8 pr-6 lg:py-10 ${i % 2 === 1 ? 'pl-6 border-l border-ink/10' : ''} ${
                  i >= 2 ? 'border-t border-ink/10 lg:border-t-0' : ''
                } ${i > 0 ? 'lg:border-l lg:border-ink/10 lg:pl-8' : ''}`}
              >
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <CountUp value={s.value} className="font-display text-[2.6rem] leading-none tracking-[-0.02em] text-ink sm:text-5xl" />
                  <p className="mt-4 text-sm font-medium leading-snug text-ink/80">{s.label}</p>
                  <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink/50">{s.note}</p>
                </dd>
              </div>
            ))}
          </dl>
        </Container>
        <div className="border-t border-ink/10">
          <Container className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:gap-8">
            <p className="label shrink-0 text-ink/40">Fielded at</p>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink/65">
              {hero.badges.map((b) => (
                <li key={b} className="flex items-center gap-2.5">
                  <span className="h-px w-3 bg-crimson" aria-hidden="true" />
                  {b}
                </li>
              ))}
            </ul>
          </Container>
        </div>
      </div>
    </section>
  )
}

/** Counts the numeric part of a stat ("60+", "Top 10") up from zero once it is on screen. */
function CountUp({ value, className }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' })
  const match = /^(\D*)(\d+)(.*)$/.exec(value)
  const [n, setN] = useState(match ? 0 : null)

  useEffect(() => {
    if (!match || !inView) return
    const controls = animate(0, Number(match[2]), {
      duration: 1.2,
      ease: EASE,
      onUpdate: (v) => setN(Math.round(v)),
    })
    return () => controls.stop()
  }, [inView]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <p ref={ref} className={`tabular ${className}`} aria-label={value}>
      {match ? `${match[1]}${n}${match[3]}` : value}
    </p>
  )
}

/** Topographic survey lines — an engineering motif drawn behind the panel. */
function Contours() {
  const lines = Array.from({ length: 11 }, (_, i) => {
    const y = 40 + i * 34
    const a = 14 + (i % 4) * 6
    return `M -20 ${y} C 80 ${y - a}, 160 ${y + a}, 260 ${y - a * 0.5} S 420 ${y + a}, 520 ${y - a * 0.3}`
  })
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 500 420"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {lines.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          fill="none"
          stroke="var(--color-mint)"
          strokeOpacity={0.07 + (i % 3) * 0.02}
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.2, ease: EASE, delay: 0.3 + i * 0.06 }}
        />
      ))}
    </svg>
  )
}
