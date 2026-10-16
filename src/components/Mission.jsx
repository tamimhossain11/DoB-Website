import { GraduationCap, Trophy, Wrench } from 'lucide-react'
import { mission, site } from '../data/content'
import { Reveal, Section, SectionHeader, Stagger, StaggerItem } from './ui'

const PILLAR_ICONS = [Wrench, Trophy, GraduationCap]

export default function Mission() {
  return (
    <Section id="mission" tone="surface">
      <SectionHeader index="01" label={mission.kicker} title={mission.heading} />

      <div className="mt-16 grid gap-12 lg:grid-cols-12 lg:gap-12">
        <Reveal className="lg:col-span-3">
          <dl className="space-y-5 border-t border-ink/10 pt-5 text-sm">
            <div>
              <dt className="label text-ink/40">Founded</dt>
              <dd className="mt-1.5 font-display text-2xl text-ink">{site.founded}</dd>
            </div>
            <div>
              <dt className="label text-ink/40">Based in</dt>
              <dd className="mt-1.5 leading-relaxed text-ink/70">{site.location}</dd>
            </div>
          </dl>
        </Reveal>

        <div className="grid gap-8 lg:col-span-9 lg:grid-cols-2 lg:gap-10">
          {mission.body.map((p, i) => (
            <Reveal key={i} delay={i * 80}>
              <p className="text-[1.0625rem] leading-[1.75] text-ink/75 u-pretty">{p}</p>
            </Reveal>
          ))}
        </div>
      </div>

      <Stagger className="mt-20 grid border-t border-ink/10 md:grid-cols-3" as="ol">
        {mission.pillars.map((p, i) => {
          const Icon = PILLAR_ICONS[i] ?? Wrench
          return (
            <StaggerItem
              as="li"
              key={p.title}
              className={`py-8 md:py-10 md:pr-10 ${i > 0 ? 'border-t border-ink/10 md:border-l md:border-t-0 md:pl-10' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-flag/8 text-flag">
                  <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
                </span>
                <span className="label tabular text-ink/30">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="mt-6 font-display text-xl leading-snug text-ink">{p.title}</h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink/60">{p.body}</p>
            </StaggerItem>
          )
        })}
      </Stagger>
    </Section>
  )
}
