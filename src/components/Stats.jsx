import { stats } from '../data/content'
import { Reveal } from './ui'

export default function Stats() {
  return (
    <section className="relative overflow-hidden bg-forest px-5 py-20 text-paper sm:px-8 md:py-24 lg:px-12">
      <div className="blueprint pointer-events-none absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute -left-32 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-flag/20 blur-3xl" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-px overflow-hidden rounded-3xl border border-mint/12 bg-mint/10 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal
            key={s.label}
            delay={i * 90}
            className="group relative bg-forest p-8 transition-colors duration-500 hover:bg-bottle"
          >
            <span className="kicker text-mint/35">{String(i + 1).padStart(2, '0')}</span>

            <p className="mt-5 font-display text-5xl font-light tracking-[-0.03em] text-paper transition-colors duration-500 group-hover:text-mint">
              {s.value}
            </p>

            <p className="mt-4 text-sm font-medium leading-snug text-paper/85">{s.label}</p>
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-mint/55">{s.note}</p>

            <span className="absolute inset-x-8 bottom-0 h-px origin-left scale-x-0 bg-vermilion transition-transform duration-500 group-hover:scale-x-100" />
          </Reveal>
        ))}
      </div>
    </section>
  )
}
