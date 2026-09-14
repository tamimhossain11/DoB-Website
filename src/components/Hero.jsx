import { hero, marquee } from '../data/content'
import { Button, Reveal } from './ui'
import OrbitGraphic from './OrbitGraphic'

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-paper grain">
      {/* Ambient wash */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-40 -top-40 h-[38rem] w-[38rem] rounded-full bg-flag/8 blur-3xl" />
        <div className="absolute -bottom-56 -left-40 h-[32rem] w-[32rem] rounded-full bg-vermilion/6 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(6,23,15,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(6,23,15,0.045) 1px, transparent 1px)',
            backgroundSize: '88px 88px',
            maskImage: 'radial-gradient(ellipse 90% 70% at 50% 35%, #000 30%, transparent 100%)',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-16 pt-32 sm:px-8 sm:pt-36 lg:px-12 lg:pb-24 lg:pt-44">
        <div className="grid items-center gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
          {/* ── Copy ── */}
          <div className="min-w-0">
            <Reveal>
              <div className="kicker inline-flex max-w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-flag/20 bg-flag/5 px-4 py-2 text-flag sm:rounded-full">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-vermilion opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-vermilion" />
                </span>
                <span className="min-w-0 break-words">{hero.kicker}</span>
              </div>
            </Reveal>

            <Reveal delay={90}>
              <h1 className="mt-7 font-display text-[clamp(2.6rem,7.4vw,5.5rem)] font-light leading-[0.95] tracking-[-0.035em] text-ink u-balance">
                {hero.headline[0]}
                <br />
                <span className="italic font-normal text-flag">{hero.headline[1]}</span>
              </h1>
            </Reveal>

            <Reveal delay={170}>
              <p className="mt-8 max-w-xl text-[1.0625rem] leading-relaxed text-ink/70">
                {hero.lede}
              </p>
            </Reveal>

            <Reveal delay={250}>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Button href={hero.primaryCta.href}>{hero.primaryCta.label}</Button>
                <Button href={hero.secondaryCta.href} variant="outline">
                  {hero.secondaryCta.label}
                </Button>
              </div>
            </Reveal>

            <Reveal delay={330}>
              <div className="mt-14 border-t border-ink/10 pt-6">
                <p className="kicker text-ink/40">Fielded at</p>
                <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
                  {hero.badges.map((b) => (
                    <li
                      key={b}
                      className="flex items-center gap-2 text-sm text-ink/65"
                    >
                      <span className="h-1 w-1 rounded-full bg-vermilion" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>

          {/* ── Graphic ── */}
          <Reveal delay={200} className="relative mx-auto w-full min-w-0 max-w-md lg:max-w-none">
            <div className="animate-float">
              <OrbitGraphic />
            </div>

            {/* Floating telemetry chip */}
            <div className="absolute -left-2 bottom-6 hidden rounded-2xl border border-ink/10 bg-paper/80 px-5 py-4 backdrop-blur-md sm:block">
              <p className="kicker text-ink/40">Status</p>
              <p className="mt-1.5 font-mono text-sm text-flag">SYSTEMS NOMINAL</p>
            </div>
          </Reveal>
        </div>
      </div>

      {/* ── Marquee band ── */}
      <div className="relative z-10 border-y border-flag/15 bg-forest py-4">
        <div className="mask-fade-x flex overflow-hidden">
          <div className="animate-marquee flex shrink-0 items-center gap-10 pr-10">
            {[...marquee, ...marquee, ...marquee, ...marquee].map((word, i) => (
              <span key={i} className="flex shrink-0 items-center gap-10">
                <span className="kicker text-mint/70">{word}</span>
                <span className="h-1 w-1 shrink-0 rounded-full bg-vermilion/80" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
