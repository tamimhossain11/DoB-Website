import { useState } from 'react'
import { projects } from '../data/content'
import { Kicker, Reveal, Section } from './ui'

export default function Projects() {
  const [open, setOpen] = useState(0)

  return (
    <Section id="projects" tone="parchment">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <Reveal className="max-w-2xl">
          <Kicker>The machines</Kicker>
          <h2 className="mt-6 font-display text-[clamp(2rem,4.2vw,3.25rem)] font-light leading-[1.05] tracking-[-0.03em] text-ink u-balance">
            Four programmes, one{' '}
            <span className="italic font-normal text-flag">engineering standard</span>.
          </h2>
        </Reveal>

        <Reveal delay={120}>
          <p className="max-w-sm text-sm leading-relaxed text-ink/55">
            Land, surface and subsea. Each programme runs a full design cycle every season —
            requirements, review, build, test, compete.
          </p>
        </Reveal>
      </div>

      {/* Accordion — one row per programme */}
      <div className="mt-14 overflow-hidden rounded-3xl border border-ink/10 bg-paper">
        {projects.map((p, i) => {
          const isOpen = open === i
          const accent = p.accent === 'crimson' ? 'text-vermilion' : 'text-flag'
          const accentBg = p.accent === 'crimson' ? 'bg-vermilion' : 'bg-flag'

          return (
            <Reveal
              key={p.code}
              delay={i * 70}
              className={`border-ink/10 ${i > 0 ? 'border-t' : ''}`}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                className="group flex w-full items-center gap-5 px-6 py-7 text-left transition-colors duration-400 hover:bg-parchment/60 sm:gap-8 sm:px-10"
              >
                <span className={`kicker shrink-0 ${accent} opacity-70`}>{p.code}</span>

                <span className="min-w-0 flex-1">
                  <span className="block font-display text-xl font-normal leading-tight text-ink transition-colors duration-300 group-hover:text-flag sm:text-2xl">
                    {p.name}
                  </span>
                  <span className="mt-1.5 block text-xs text-ink/45 sm:text-[0.8125rem]">
                    {p.domain}
                  </span>
                </span>

                <span
                  className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-400 ${
                    isOpen
                      ? `${accentBg} border-transparent text-paper rotate-45`
                      : 'border-ink/20 text-ink/50 group-hover:border-flag group-hover:text-flag'
                  }`}
                >
                  <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" aria-hidden="true">
                    <path
                      d="M7 1v12M1 7h12"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </button>

              <div
                className="grid transition-all duration-600 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
              >
                <div className="overflow-hidden">
                  <div className="grid gap-8 px-6 pb-10 sm:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
                    <p className="max-w-xl text-[1.0625rem] leading-[1.75] text-ink/70">
                      {p.summary}
                    </p>

                    <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-ink/10 bg-ink/10 sm:grid-cols-2">
                      {p.specs.map(([k, v]) => (
                        <div key={k} className="bg-paper px-5 py-4">
                          <dt className="kicker text-ink/35">{k}</dt>
                          <dd className="mt-1.5 text-sm leading-snug text-ink/80">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              </div>
            </Reveal>
          )
        })}
      </div>
    </Section>
  )
}
