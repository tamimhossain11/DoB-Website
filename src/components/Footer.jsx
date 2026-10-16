import { ArrowUpRight, Mail, MapPin, Phone, UserRound } from 'lucide-react'
import { nav, site, socials } from '../data/content'
import { pressRelease } from '../data/press'
import { SIGN_IN_PATH } from '../lib/signin'

export default function Footer({ hrefBase = '' }) {
  const linkClass = 'text-sm text-paper/65 transition-colors hover:text-paper'

  return (
    <footer className="bg-forest text-paper">
      <div className="mx-auto w-full max-w-7xl px-5 pb-10 pt-20 sm:px-8 lg:px-12">
        <div className="grid gap-12 border-b border-paper/10 pb-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            {/* Logo sits on a light plate so the dark artwork stays legible */}
            <div className="inline-flex rounded-md bg-paper px-4 py-3">
              <img src="/logo-mark.png" alt={site.name} className="h-9 w-auto" />
            </div>
            <p className="mt-7 max-w-sm text-[0.9375rem] leading-relaxed text-paper/60">
              A youth-led engineering team building rovers, autonomous vehicles and exploration systems — and racing
              them against the best on Earth.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-paper/65">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-mint/70" strokeWidth={1.5} aria-hidden="true" />
                {site.location}
              </li>
              <li>
                <a href={`mailto:${site.email}`} className="flex items-center gap-3 transition-colors hover:text-paper">
                  <Mail className="h-4 w-4 shrink-0 text-mint/70" strokeWidth={1.5} aria-hidden="true" />
                  {site.email}
                </a>
              </li>
              <li>
                <a href={`tel:${site.phone.replace(/[^\d+]/g, '')}`} className="flex items-center gap-3 transition-colors hover:text-paper">
                  <Phone className="h-4 w-4 shrink-0 text-mint/70" strokeWidth={1.5} aria-hidden="true" />
                  {site.phone}
                </a>
              </li>
            </ul>
          </div>

          <nav aria-label="Footer" className="lg:col-span-2">
            <p className="label text-paper/40">Explore</p>
            <ul className="mt-5 space-y-3">
              {nav.map((n) => (
                <li key={n.href}>
                  <a href={hrefBase + n.href} className={linkClass}>{n.label}</a>
                </li>
              ))}
              <li>
                <a href={`${hrefBase}#join`} className={linkClass}>Join the team</a>
              </li>
            </ul>
          </nav>

          <div className="lg:col-span-2">
            <p className="label text-paper/40">Connect</p>
            <ul className="mt-5 space-y-3">
              {socials.map((s) => {
                const external = s.href.startsWith('http')
                return (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target={external ? '_blank' : undefined}
                      rel={external ? 'noreferrer noopener' : undefined}
                      className={`group inline-flex items-center gap-1.5 ${linkClass}`}
                    >
                      {s.label}
                      <ArrowUpRight className="h-3.5 w-3.5 opacity-50 transition-opacity group-hover:opacity-100" strokeWidth={1.75} aria-hidden="true" />
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <p className="label text-paper/40">Newsroom &amp; members</p>
            <ul className="mt-5 space-y-3">
              <li>
                <a href={`/${pressRelease.slug}`} className={linkClass}>{pressRelease.label}</a>
              </li>
              <li>
                <a href={SIGN_IN_PATH} className={`inline-flex items-center gap-2 ${linkClass}`}>
                  <UserRound className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                  Member sign in
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-8 text-xs text-paper/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <p className="label text-paper/30">{site.tagline}</p>
        </div>
      </div>
    </footer>
  )
}
