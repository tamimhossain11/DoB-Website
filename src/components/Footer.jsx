import { nav, site, socials } from '../data/content'
import { pressRelease } from '../data/press'

export default function Footer({ hrefBase = '' }) {
  return (
    <footer className="relative overflow-hidden bg-forest px-5 pb-10 pt-20 text-paper sm:px-8 lg:px-12">
      <div className="blueprint pointer-events-none absolute inset-0 opacity-40" />

      <div className="relative z-10 mx-auto w-full max-w-7xl">
        <div className="grid gap-12 border-b border-mint/12 pb-14 lg:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            {/* Logo sits on a paper chip so the dark artwork stays legible */}
            <div className="inline-flex rounded-2xl bg-paper px-5 py-4">
              <img src="/logo-mark.png" alt={site.name} className="h-10 w-auto" />
            </div>

            <p className="mt-7 max-w-sm text-[0.9375rem] leading-relaxed text-paper/55">
              A youth-led engineering team building rovers, autonomous vehicles and exploration
              systems — and racing them against the best on Earth.
            </p>

            <p className="kicker mt-7 text-mint/50">{site.location}</p>
          </div>

          <nav aria-label="Footer">
            <p className="kicker text-mint/45">Explore</p>
            <ul className="mt-5 space-y-3">
              {nav.map((n) => (
                <li key={n.href}>
                  <a
                    href={hrefBase + n.href}
                    className="text-sm text-paper/65 transition-colors hover:text-mint"
                  >
                    {n.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={`${hrefBase}#join`}
                  className="text-sm text-paper/65 transition-colors hover:text-mint"
                >
                  Join the team
                </a>
              </li>
              <li>
                <a
                  href={`/${pressRelease.slug}`}
                  className="text-sm text-mint/85 transition-colors hover:text-mint"
                >
                  {pressRelease.label}
                </a>
              </li>
            </ul>
          </nav>

          <div>
            <p className="kicker text-mint/45">Connect</p>
            <ul className="mt-5 space-y-3">
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target={s.href.startsWith('http') ? '_blank' : undefined}
                    rel={s.href.startsWith('http') ? 'noreferrer noopener' : undefined}
                    className="group inline-flex items-center gap-2 text-sm text-paper/65 transition-colors hover:text-mint"
                  >
                    {s.label}
                    <svg
                      viewBox="0 0 12 12"
                      className="h-2.5 w-2.5 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 9L9 3M4 3h5v5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </a>
                </li>
              ))}
              <li className="pt-2">
                <a
                  href={`mailto:${site.email}`}
                  className="font-mono text-sm text-mint transition-colors hover:text-paper"
                >
                  {site.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Oversized wordmark */}
        <div className="mask-fade-b pointer-events-none select-none pt-12">
          <p className="text-center font-display text-[clamp(2.2rem,11vw,9rem)] font-light leading-none tracking-[-0.045em] text-mint/12">
            DREAMS OF BANGLADESH
          </p>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 pt-10 sm:flex-row">
          <p className="text-xs text-paper/35">
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          <p className="kicker text-mint/30">{site.tagline}</p>
        </div>
      </div>
    </footer>
  )
}
