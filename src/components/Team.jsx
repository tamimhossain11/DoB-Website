import { Check, ClipboardList, CodeXml, Cog, Mail, Zap } from 'lucide-react'
import { divisions, join, team } from '../data/content'
import { Button, Reveal, Section, SectionHeader, Stagger, StaggerItem } from './ui'

const DIVISION_ICONS = { Mechanical: Cog, Electrical: Zap, 'Software & Autonomy': CodeXml, Operations: ClipboardList }

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
    <Section id="team" tone="surface">
      <SectionHeader
        index="04"
        label="The team"
        title="Four divisions. One machine at the end of it."
        intro="Every member belongs to a division, and every division answers to the same integration schedule."
      />

      {/* Divisions */}
      <Stagger className="mt-16 grid gap-px overflow-hidden rounded-lg border border-ink/10 bg-ink/10 sm:grid-cols-2 lg:grid-cols-4">
        {divisions.map((d) => {
          const Icon = DIVISION_ICONS[d.name] ?? Cog
          return (
            <StaggerItem key={d.name} className="flex flex-col bg-surface p-7">
              <Icon className="h-6 w-6 text-flag" strokeWidth={1.5} aria-hidden="true" />
              <h3 className="mt-6 font-display text-xl text-ink">{d.name}</h3>
              <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-ink/60">{d.body}</p>
              <ul className="mt-6 flex flex-wrap gap-1.5">
                {d.tags.map((t) => (
                  <li key={t} className="rounded border border-ink/12 px-2 py-0.5 font-mono text-[0.6875rem] text-ink/55">
                    {t}
                  </li>
                ))}
              </ul>
            </StaggerItem>
          )
        })}
      </Stagger>

      {/* Leadership */}
      <div className="mt-24 grid gap-12 lg:grid-cols-12 lg:gap-12">
        <Reveal className="lg:col-span-4">
          <p className="label text-flag">Leadership</p>
          <p className="mt-5 max-w-md text-[1.0625rem] leading-[1.75] text-ink/70">
            The team is run by its members. Leads are chosen on what they have shipped, and every lead trains a
            successor before they hand the role on.
          </p>
        </Reveal>

        {/* Roster placeholder entries live in src/data/content.js — replace with real names, roles and photos. */}
        <Stagger as="ul" className="grid border-t border-ink/10 sm:grid-cols-2 lg:col-span-8">
          {team.map((m, i) => (
            <StaggerItem
              as="li"
              key={m.name + i}
              className={`flex items-center gap-4 border-b border-ink/10 py-5 ${i % 2 === 1 ? 'sm:border-l sm:pl-6' : 'sm:pr-6'}`}
            >
              {m.photo ? (
                <img src={m.photo} alt={m.name} className="h-12 w-12 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-parchment font-display text-[0.9375rem] text-flag">
                  {initials(m.name)}
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate font-medium text-ink">{m.name}</span>
                <span className="mt-0.5 block truncate text-sm text-ink/55">{m.role}</span>
              </span>
              <span className="label ml-auto hidden shrink-0 text-ink/30 xl:block">{m.division}</span>
            </StaggerItem>
          ))}
        </Stagger>
      </div>

      {/* Join */}
      <Reveal id="join" className="mt-24 overflow-hidden rounded-lg bg-flag text-white">
        <div className="grid lg:grid-cols-12">
          <div className="p-8 sm:p-12 lg:col-span-7">
            <p className="label text-white/70">{join.kicker}</p>
            <h3 className="mt-5 font-display text-[clamp(1.85rem,3.2vw,2.6rem)] leading-[1.1] u-balance">{join.heading}</h3>
            <p className="mt-6 max-w-lg text-[1.0625rem] leading-[1.75] text-white/80">{join.body}</p>
            <Button href={join.cta.href} variant="light" icon={Mail} className="mt-9">
              {join.cta.label}
            </Button>
          </div>
          <ul className="border-t border-white/15 p-8 sm:p-12 lg:col-span-5 lg:border-l lg:border-t-0">
            {join.points.map((p) => (
              <li key={p} className="flex items-start gap-3.5 border-b border-white/15 py-4 first:pt-0 last:border-0 last:pb-0">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-white" strokeWidth={1.75} aria-hidden="true" />
                <span className="text-[0.9375rem] leading-relaxed text-white/85">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </Section>
  )
}
