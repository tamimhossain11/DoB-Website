import { divisions, join, team } from '../data/content'
import { Button, Kicker, Reveal, Section } from './ui'

const initials = (name) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

export default function Team() {
  return (
    <Section id="team" tone="paper">
      <div className="max-w-2xl">
        <Reveal>
          <Kicker>The team</Kicker>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="mt-6 font-display text-[clamp(2rem,4.2vw,3.25rem)] font-light leading-[1.05] tracking-[-0.03em] text-ink u-balance">
            Four divisions.{' '}
            <span className="italic font-normal text-flag">One machine</span> at the end of it.
          </h2>
        </Reveal>
      </div>

      {/* Divisions */}
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {divisions.map((d, i) => (
          <Reveal
            key={d.name}
            delay={i * 90}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-parchment/60 p-7 transition-all duration-500 hover:-translate-y-1 hover:border-flag/30 hover:bg-paper hover:shadow-[0_24px_60px_-30px_rgba(6,23,15,0.35)]"
          >
            <span className="absolute right-6 top-6 font-mono text-xs text-ink/20">
              {String(i + 1).padStart(2, '0')}
            </span>

            <h3 className="font-display text-xl font-normal leading-snug text-ink">{d.name}</h3>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-ink/60">{d.body}</p>

            <ul className="mt-6 flex flex-wrap gap-1.5">
              {d.tags.map((t) => (
                <li
                  key={t}
                  className="rounded-full border border-ink/12 px-2.5 py-1 font-mono text-[0.6875rem] text-ink/55 transition-colors duration-300 group-hover:border-flag/25 group-hover:text-flag"
                >
                  {t}
                </li>
              ))}
            </ul>

            <span className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-flag to-vermilion transition-transform duration-500 group-hover:scale-x-100" />
          </Reveal>
        ))}
      </div>

      {/* Roster */}
      <div className="mt-20 grid gap-14 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
        <div>
          <Reveal>
            <Kicker>Leadership</Kicker>
            <p className="mt-5 max-w-md text-[1.0625rem] leading-[1.75] text-ink/70">
              The team is run by its members. Leads are chosen on what they have shipped, and every
              lead trains a successor before they hand the role on.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <div className="mt-8 rounded-2xl border border-dashed border-flag/25 bg-flag/4 p-5">
              <p className="kicker text-flag/70">Editing note</p>
              <p className="mt-2 text-sm leading-relaxed text-ink/60">
                Replace the placeholder roster in{' '}
                <code className="rounded bg-ink/8 px-1.5 py-0.5 font-mono text-[0.8125rem]">
                  src/data/content.js
                </code>{' '}
                with real names, roles and photos.
              </p>
            </div>
          </Reveal>
        </div>

        <div className="grid gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10 sm:grid-cols-2">
          {team.map((m, i) => (
            <Reveal
              key={m.name + i}
              delay={i * 70}
              className="group flex items-center gap-4 bg-paper p-5 transition-colors duration-400 hover:bg-parchment"
            >
              {m.photo ? (
                <img
                  src={m.photo}
                  alt={m.name}
                  className="h-14 w-14 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-flag/20 bg-flag/8 font-display text-base text-flag transition-colors duration-400 group-hover:border-flag/40 group-hover:bg-flag group-hover:text-paper">
                  {initials(m.name)}
                </span>
              )}

              <span className="min-w-0">
                <span className="block truncate font-medium text-ink">{m.name}</span>
                <span className="mt-0.5 block truncate text-[0.8125rem] text-ink/55">
                  {m.role}
                </span>
                <span className="kicker mt-1.5 block text-ink/30">{m.division}</span>
              </span>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Join */}
      <div
        id="join"
        className="mt-24 grid gap-10 overflow-hidden rounded-3xl border border-ink/10 bg-parchment/70 p-8 sm:p-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16"
      >
        <Reveal>
          <Kicker>{join.kicker}</Kicker>
          <h3 className="mt-5 font-display text-[clamp(1.75rem,3.2vw,2.5rem)] font-light leading-[1.1] tracking-[-0.03em] text-ink u-balance">
            We are looking for people who{' '}
            <span className="italic font-normal text-vermilion">finish things</span>.
          </h3>
          <p className="mt-6 max-w-lg text-[1.0625rem] leading-[1.75] text-ink/70">{join.body}</p>
          <div className="mt-9">
            <Button href={join.cta.href}>{join.cta.label}</Button>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <ul className="space-y-4">
            {join.points.map((p) => (
              <li key={p} className="flex items-start gap-3.5 border-b border-ink/8 pb-4">
                <svg
                  viewBox="0 0 16 16"
                  className="mt-1 h-4 w-4 shrink-0 text-flag"
                  aria-hidden="true"
                >
                  <path
                    d="M3 8.5l3.2 3.2L13 5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-[0.9375rem] leading-relaxed text-ink/70">{p}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </Section>
  )
}
