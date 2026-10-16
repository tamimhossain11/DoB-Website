import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Cpu, Mountain, RadioTower, Ship, Waves } from 'lucide-react'
import { projects } from '../data/content'
import { EASE, Reveal, Section, SectionHeader } from './ui'

const ICONS = { 'DOB-R1': Mountain, 'DOB-A1': Waves, 'DOB-S1': Ship, 'DOB-X': RadioTower }
export const programmeIcon = (code) => ICONS[code] ?? Cpu

export default function Projects() {
  const [index, setIndex] = useState(0)
  const p = projects[index]
  const Icon = programmeIcon(p.code)

  function onKeyDown(e) {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]
    if (!step) return
    e.preventDefault()
    const next = (index + step + projects.length) % projects.length
    setIndex(next)
    document.getElementById(`programme-tab-${next}`)?.focus()
  }

  return (
    <Section id="projects" tone="paper">
      <SectionHeader
        index="02"
        label="The machines"
        title="Four programmes, one engineering standard."
        intro="Land, surface and subsea. Each programme runs a full design cycle every season — requirements, review, build, test, compete."
      />

      <Reveal className="mt-16 grid overflow-hidden rounded-lg border border-ink/10 bg-surface lg:grid-cols-12">
        {/* Programme list */}
        <div
          role="tablist"
          aria-label="Programmes"
          aria-orientation="vertical"
          onKeyDown={onKeyDown}
          className="scrollbar-none flex overflow-x-auto border-b border-ink/10 lg:col-span-4 lg:flex-col lg:overflow-visible lg:border-b-0 lg:border-r"
        >
          {projects.map((item, i) => {
            const ItemIcon = programmeIcon(item.code)
            const selected = i === index
            return (
              <button
                key={item.code}
                id={`programme-tab-${i}`}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-controls="programme-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => setIndex(i)}
                className={`relative flex shrink-0 items-center gap-4 px-5 py-4 text-left transition-colors duration-200 lg:px-6 lg:py-5 ${
                  i > 0 ? 'lg:border-t lg:border-ink/10' : ''
                } ${selected ? 'bg-paper' : 'hover:bg-paper/60'}`}
              >
                {selected && (
                  <motion.span
                    layoutId="programme-indicator"
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-flag lg:inset-y-0 lg:left-0 lg:right-auto lg:h-auto lg:w-0.5"
                    transition={{ duration: 0.45, ease: EASE }}
                  />
                )}
                <ItemIcon className={`h-5 w-5 shrink-0 ${selected ? 'text-flag' : 'text-ink/40'}`} strokeWidth={1.5} aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block font-mono text-[0.6875rem] text-ink/40">{item.code}</span>
                  <span className={`mt-0.5 block whitespace-nowrap text-[0.9375rem] font-medium ${selected ? 'text-ink' : 'text-ink/65'}`}>
                    {item.name}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        {/* Spec sheet */}
        <div id="programme-panel" role="tabpanel" aria-labelledby={`programme-tab-${index}`} className="relative min-h-[26rem] lg:col-span-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={p.code}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="p-6 sm:p-10"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="label text-flag">{p.domain}</p>
                <span className="inline-flex items-center gap-2 rounded-full border border-flag/25 px-3 py-1 text-xs text-flag">
                  <span className="h-1.5 w-1.5 rounded-full bg-flag" aria-hidden="true" />
                  {p.year}
                </span>
              </div>

              <div className="mt-6 flex items-start gap-5">
                <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-forest text-mint sm:flex">
                  <Icon className="h-7 w-7" strokeWidth={1.25} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-display text-3xl leading-tight text-ink">{p.name}</h3>
                  <p className="mt-4 max-w-2xl text-[1.0625rem] leading-[1.7] text-ink/70 u-pretty">{p.summary}</p>
                </div>
              </div>

              <dl className="mt-10 border-t border-ink/10">
                {p.specs.map(([k, v], i) => (
                  <motion.div
                    key={k}
                    className="grid grid-cols-[7rem_1fr] gap-4 border-b border-ink/10 py-3.5 sm:grid-cols-[9rem_1fr]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.08 + i * 0.05 }}
                  >
                    <dt className="label pt-0.5 text-ink/40">{k}</dt>
                    <dd className="text-[0.9375rem] text-ink/85">{v}</dd>
                  </motion.div>
                ))}
              </dl>
            </motion.div>
          </AnimatePresence>
        </div>
      </Reveal>
    </Section>
  )
}
