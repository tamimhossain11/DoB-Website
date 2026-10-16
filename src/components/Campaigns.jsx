import { Award, Medal, MapPin, Trophy } from 'lucide-react'
import { awards, campaigns } from '../data/content'
import { Section, SectionHeader, Stagger, StaggerItem } from './ui'

const AWARD_ICONS = [Award, Trophy, Medal]

export default function Campaigns() {
  return (
    <Section id="campaigns" tone="forest">
      <SectionHeader
        dark
        index="03"
        label="Campaign history"
        title="We take it abroad and put it on the line."
        intro="Scored runs against university teams from around the world — the only review that counts."
      />

      {/* Ledger */}
      <div className="mt-16">
        <div className="label hidden grid-cols-12 gap-6 border-b border-mint/15 pb-3 text-mint/50 md:grid">
          <span className="col-span-1">Year</span>
          <span className="col-span-6">Competition</span>
          <span className="col-span-3">Location</span>
          <span className="col-span-2 text-right">Result</span>
        </div>

        <Stagger as="ol">
          {campaigns.map((c) => (
            <StaggerItem
              as="li"
              key={`${c.year}-${c.name}`}
              className="group grid gap-3 border-b border-mint/12 py-7 md:grid-cols-12 md:gap-6"
            >
              <span className="font-mono text-sm text-mint md:col-span-1 md:pt-1.5">{c.year}</span>
              <div className="md:col-span-6">
                <h3 className="font-display text-2xl leading-tight text-paper">{c.name}</h3>
                <p className="mt-2 max-w-xl text-[0.9375rem] leading-relaxed text-paper/55">{c.body}</p>
              </div>
              <span className="flex items-start gap-2 text-sm text-paper/70 md:col-span-3 md:pt-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-mint/60" strokeWidth={1.5} aria-hidden="true" />
                {c.place}
              </span>
              <span className="md:col-span-2 md:pt-1.5 md:text-right">
                <span className="inline-block rounded-full border border-mint/30 px-3 py-1 text-xs text-mint">{c.status}</span>
              </span>
            </StaggerItem>
          ))}
        </Stagger>
      </div>

      {/* Recognition */}
      <Stagger className="mt-20 grid overflow-hidden rounded-lg border border-mint/12 md:grid-cols-3">
        {awards.map((a, i) => {
          const Icon = AWARD_ICONS[i] ?? Award
          return (
            <StaggerItem
              key={a.title}
              className={`bg-bottle/60 p-7 ${i > 0 ? 'border-t border-mint/12 md:border-l md:border-t-0' : ''}`}
            >
              <div className="flex items-center justify-between">
                <Icon className="h-6 w-6 text-mint" strokeWidth={1.25} aria-hidden="true" />
                {a.year !== '—' && <span className="font-mono text-xs text-paper/40">{a.year}</span>}
              </div>
              <h3 className="mt-6 font-display text-xl leading-snug text-paper">{a.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-paper/55">{a.by}</p>
            </StaggerItem>
          )
        })}
      </Stagger>
    </Section>
  )
}
