import { mission } from '../data/content'
import { Kicker, Reveal, Section } from './ui'

export default function Mission() {
  return (
    <Section id="mission" tone="paper">
      <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <Kicker>{mission.kicker}</Kicker>
          </Reveal>

          <Reveal delay={80}>
            <h2 className="mt-6 font-display text-[clamp(2rem,4.2vw,3.25rem)] font-light leading-[1.05] tracking-[-0.03em] text-ink u-balance">
              A country of{' '}
              <span className="italic font-normal text-vermilion">170 million</span> deserves a
              seat at the engineering table.
            </h2>
          </Reveal>

          <Reveal delay={160}>
            <div className="mt-10 flex items-center gap-4">
              <img src="/logo-mark.png" alt="" className="h-12 w-auto opacity-90" />
            </div>
          </Reveal>
        </div>

        <div>
          {mission.body.map((p, i) => (
            <Reveal key={i} delay={i * 90}>
              <p
                className={`text-[1.0625rem] leading-[1.75] text-ink/70 ${i > 0 ? 'mt-6' : ''} ${
                  i === 0 ? 'first-letter:float-left first-letter:mr-3 first-letter:font-display first-letter:text-[3.6rem] first-letter:font-normal first-letter:leading-[0.8] first-letter:text-flag' : ''
                }`}
              >
                {p}
              </p>
            </Reveal>
          ))}

          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10 sm:grid-cols-3">
            {mission.pillars.map((p, i) => (
              <Reveal
                key={p.title}
                delay={i * 100}
                className="group bg-paper p-7 transition-colors duration-500 hover:bg-parchment"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-flag/25 font-mono text-xs text-flag transition-colors duration-500 group-hover:border-flag group-hover:bg-flag group-hover:text-paper">
                  {i + 1}
                </span>
                <h3 className="mt-5 font-display text-lg font-normal leading-snug text-ink">
                  {p.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/60">{p.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </Section>
  )
}
