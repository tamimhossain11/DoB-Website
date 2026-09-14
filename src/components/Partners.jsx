import { partners, site } from '../data/content'
import { Kicker, Reveal } from './ui'

export default function Partners() {
  return (
    <section
      id="partners"
      className="relative overflow-hidden bg-ink px-5 py-24 text-paper sm:px-8 md:py-32 lg:px-12"
    >
      <div className="blueprint pointer-events-none absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[28rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-flag/20 blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div>
            <Reveal>
              <Kicker tone="light">{partners.kicker}</Kicker>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="mt-6 font-display text-[clamp(2rem,4.2vw,3.25rem)] font-light leading-[1.05] tracking-[-0.03em] u-balance">
                Every bolt on our rover was paid for by someone who{' '}
                <span className="italic font-normal text-mint">believed first</span>.
              </h2>
            </Reveal>
          </div>

          <Reveal delay={140} className="lg:pt-4">
            <p className="text-[1.0625rem] leading-[1.75] text-paper/65">{partners.body}</p>
            <a
              href={`mailto:${site.email}`}
              className="group mt-8 inline-flex items-center gap-3 border-b border-mint/30 pb-1 font-mono text-sm text-mint transition-colors hover:border-mint"
            >
              {site.email}
              <svg
                viewBox="0 0 16 16"
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              >
                <path
                  d="M2 8h11M9 4l4 4-4 4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </Reveal>
        </div>

        {/* Tiers */}
        <div className="mt-16 grid gap-5 lg:grid-cols-3">
          {partners.tiers.map((t, i) => (
            <Reveal
              key={t.name}
              delay={i * 100}
              className={`group relative flex flex-col overflow-hidden rounded-3xl border p-8 transition-all duration-500 hover:-translate-y-1.5 ${
                t.featured
                  ? 'border-mint/35 bg-gradient-to-b from-flag/25 to-transparent'
                  : 'border-mint/12 bg-mint/4 hover:border-mint/30'
              }`}
            >
              {t.featured && (
                <span className="kicker absolute right-6 top-7 rounded-full bg-vermilion px-3 py-1 text-paper">
                  Flagship
                </span>
              )}

              <h3 className="font-display text-2xl font-normal leading-tight">{t.name}</h3>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-paper/60">{t.body}</p>

              <ul className="mt-7 space-y-3 border-t border-mint/12 pt-6">
                {t.perks.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-sm text-paper/75">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-vermilion" />
                    {p}
                  </li>
                ))}
              </ul>

              <a
                href={`mailto:${site.email}?subject=${encodeURIComponent(`${t.name} — Dreams of Bangladesh`)}`}
                className={`mt-8 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all duration-300 ${
                  t.featured
                    ? 'bg-mint text-forest hover:bg-paper'
                    : 'border border-mint/25 text-paper hover:border-mint hover:bg-mint/10'
                }`}
              >
                Start a conversation
              </a>
            </Reveal>
          ))}
        </div>

        {/* Partner logo slots */}
        <Reveal delay={120} className="mt-16">
          <p className="kicker text-mint/40">Supported by</p>
          <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-mint/10 bg-mint/10 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex h-24 items-center justify-center bg-ink px-4 text-center font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-paper/20"
              >
                Your logo
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
