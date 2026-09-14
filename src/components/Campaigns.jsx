import { awards, campaigns } from '../data/content'
import { Kicker, Reveal } from './ui'

export default function Campaigns() {
  return (
    <section
      id="campaigns"
      className="relative overflow-hidden bg-forest px-5 py-24 text-paper sm:px-8 md:py-32 lg:px-12"
    >
      <div className="blueprint pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute -right-40 top-20 h-[30rem] w-[30rem] rounded-full bg-flag/25 blur-3xl" />
      <div className="pointer-events-none absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-vermilion/10 blur-3xl" />

      {/* Drifting stars */}
      <div className="pointer-events-none absolute inset-0">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-mint"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.r,
              height: s.r,
              animation: `dob-twinkle ${s.d}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl">
        <div className="max-w-2xl">
          <Reveal>
            <Kicker tone="light">Campaign history</Kicker>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-6 font-display text-[clamp(2rem,4.2vw,3.25rem)] font-light leading-[1.05] tracking-[-0.03em] u-balance">
              We take it abroad and{' '}
              <span className="italic font-normal text-mint">put it on the line</span>.
            </h2>
          </Reveal>
        </div>

        {/* Timeline */}
        <ol className="relative mt-16 border-l border-mint/15 pl-8 sm:pl-12">
          {campaigns.map((c, i) => (
            <Reveal
              key={`${c.year}-${c.name}`}
              as="li"
              delay={i * 90}
              className={`group relative ${i > 0 ? 'mt-12' : ''}`}
            >
              {/* Node */}
              <span className="absolute -left-[2.3rem] top-2 flex h-3 w-3 items-center justify-center sm:-left-[3.3rem]">
                <span className="absolute h-3 w-3 rounded-full bg-vermilion/25 transition-transform duration-500 group-hover:scale-150" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-vermilion" />
              </span>

              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:gap-6">
                <span className="font-mono text-sm text-mint/70">{c.year}</span>
                <h3 className="font-display text-xl font-normal leading-tight transition-colors duration-300 group-hover:text-mint sm:text-2xl">
                  {c.name}
                </h3>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="text-sm text-paper/50">{c.place}</span>
                <span className="kicker rounded-full border border-mint/25 bg-mint/8 px-3 py-1 text-mint/85">
                  {c.status}
                </span>
              </div>

              <p className="mt-4 max-w-2xl text-[0.9375rem] leading-relaxed text-paper/60">
                {c.body}
              </p>
            </Reveal>
          ))}
        </ol>

        {/* Awards strip */}
        <div className="mt-20 grid gap-px overflow-hidden rounded-2xl border border-mint/12 bg-mint/10 sm:grid-cols-3">
          {awards.map((a, i) => (
            <Reveal key={a.title} delay={i * 90} className="bg-forest p-7">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-vermilion" aria-hidden="true">
                <path
                  d="M12 2l2.6 5.6 6 .8-4.4 4.2 1.1 6.1L12 15.9 6.7 18.7l1.1-6.1L3.4 8.4l6-.8z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                />
              </svg>
              <h3 className="mt-4 font-display text-lg font-normal leading-snug">{a.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mint/55">{a.by}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* Deterministic star field so it does not reshuffle on every render */
const STARS = [
  { x: 8, y: 14, r: 2, d: 4.2, delay: 0 },
  { x: 22, y: 62, r: 1.5, d: 5.1, delay: 0.8 },
  { x: 37, y: 8, r: 2, d: 3.8, delay: 1.6 },
  { x: 54, y: 78, r: 1.5, d: 4.6, delay: 0.4 },
  { x: 68, y: 22, r: 2.5, d: 5.4, delay: 2.1 },
  { x: 79, y: 55, r: 1.5, d: 4.0, delay: 1.2 },
  { x: 90, y: 12, r: 2, d: 4.9, delay: 2.6 },
  { x: 94, y: 74, r: 1.5, d: 3.6, delay: 0.6 },
  { x: 15, y: 90, r: 2, d: 5.2, delay: 1.9 },
  { x: 45, y: 40, r: 1.5, d: 4.4, delay: 3.0 },
]
