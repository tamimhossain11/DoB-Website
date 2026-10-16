import { ArrowLeft, ArrowUpRight, CalendarDays, Clock, Download, ExternalLink, Mail, MapPin, Phone, Quote } from 'lucide-react'
import { motion } from 'framer-motion'
import { pressRelease as pr } from '../data/press'
import { facebook, site } from '../data/content'
import { Container, EASE, Reveal, Stagger, StaggerItem } from './ui'
import DocumentViewer from './DocumentViewer'

const BRIEFING_ICONS = [MapPin, CalendarDays, Clock]

export default function PressRelease() {
  return (
    <article className="bg-paper pt-[4.5rem]">
      {/* ── Masthead ── */}
      <header className="border-b border-ink/10 bg-surface">
        <Container className="py-14 sm:py-20">
          <motion.div
            className="flex flex-wrap items-center gap-x-4 gap-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <span className="label rounded-sm bg-crimson px-2 py-1 text-white">Press release</span>
            <time dateTime={pr.isoDate} className="font-bengali text-sm text-ink/70">{pr.dateline}</time>
            <span className="label text-ink/40">{pr.datelineEn}</span>
          </motion.div>

          <div className="mt-10 grid items-start gap-12 lg:grid-cols-12 lg:gap-14">
            {/* The release itself — first on mobile, right on desktop */}
            <motion.div
              className="order-1 lg:order-2 lg:col-span-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
            >
              <DocumentViewer />
            </motion.div>

            <motion.div
              className="order-2 min-w-0 lg:order-1 lg:col-span-7"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
            >
              <h1 className="font-bengali text-[clamp(1.35rem,2.2vw,1.85rem)] font-semibold leading-[1.6] text-ink u-balance">
                {pr.headline}
              </h1>
              <p className="mt-6 border-l-2 border-flag pl-5 text-[1.0625rem] leading-relaxed text-ink/65">{pr.summaryEn}</p>

              <div className="mt-9 flex flex-wrap gap-3">
                <a
                  href={pr.pdf.file}
                  download={pr.pdf.downloadName}
                  className="inline-flex items-center gap-2.5 rounded-md bg-flag px-5 py-3 text-[0.9375rem] font-medium text-white transition-colors hover:bg-leaf"
                >
                  <Download className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  Download the PDF
                </a>
                <a
                  href={pr.pdf.file}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2.5 rounded-md border border-ink/20 bg-surface px-5 py-3 text-[0.9375rem] font-medium text-ink transition-colors hover:border-ink/40"
                >
                  <ExternalLink className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  Open in a new tab
                </a>
              </div>

              {/* Official Facebook page */}
              <a
                href={facebook.href}
                target="_blank"
                rel="noreferrer noopener"
                className="group mt-8 flex items-center gap-4 rounded-lg border border-ink/10 bg-paper p-4 transition-colors hover:border-[#1877F2]/40 sm:p-5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#1877F2] text-white">
                  {/* Facebook's own mark — Lucide no longer ships brand logos */}
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">Official updates on Facebook</span>
                  <span className="mt-0.5 block truncate font-mono text-xs text-ink/50">{facebook.handle}</span>
                </span>
                <ArrowUpRight className="h-5 w-5 shrink-0 text-ink/40 transition-colors group-hover:text-[#1877F2]" strokeWidth={1.5} aria-hidden="true" />
              </a>
            </motion.div>
          </div>
        </Container>
      </header>

      {/* ── Key facts ── */}
      <Container>
        <Stagger className="grid grid-cols-2 border-b border-ink/10 lg:grid-cols-4">
          {pr.facts.map((f, i) => (
            <StaggerItem
              key={f.label}
              className={`py-8 pr-5 ${i % 2 === 1 ? 'border-l border-ink/10 pl-5' : ''} ${i >= 2 ? 'border-t border-ink/10 lg:border-t-0' : ''} ${
                i > 0 ? 'lg:border-l lg:pl-6' : ''
              }`}
            >
              <p className="font-bengali text-3xl font-semibold leading-none text-flag">{f.value}</p>
              <p className="label mt-3 text-crimson/80">{f.valueEn}</p>
              <p className="font-bengali mt-2 text-[0.8125rem] leading-relaxed text-ink/55">{f.label}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>

      {/* ── Full text ── */}
      <Container className="py-20">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <p className="label text-flag">সম্পূর্ণ বিবরণ · Full text</p>
          </Reveal>

          <div className="mt-8 space-y-6">
            {pr.body.map((p, i) => (
              <Reveal key={i} delay={i * 50}>
                <p className="font-bengali text-[1.0625rem] leading-[2] text-ink/80">{p}</p>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-12">
            <p className="font-bengali text-[1.0625rem] font-semibold leading-[2] text-ink">{pr.quote.intro}</p>
            <blockquote className="mt-5 rounded-lg border-l-4 border-flag bg-surface p-7 sm:p-9">
              <Quote className="h-6 w-6 text-flag/40" strokeWidth={1.5} aria-hidden="true" />
              <p className="font-bengali mt-4 text-[1.0625rem] leading-[2] text-ink/85">{pr.quote.text}</p>
              <footer className="mt-6 border-t border-ink/10 pt-5">
                <p className="font-bengali font-semibold text-ink">{pr.quote.attribution}</p>
                <p className="mt-1 text-sm text-ink/55">{pr.quote.role}</p>
              </footer>
            </blockquote>
          </Reveal>

          <Reveal>
            <p className="font-bengali mt-10 text-[1.0625rem] leading-[2] text-ink/80">{pr.closing}</p>
          </Reveal>

          {/* ── Briefing + contact ── */}
          <div className="mt-16 grid gap-4 sm:grid-cols-2">
            <Reveal className="rounded-lg border border-ink/10 bg-surface p-7">
              <h2 className="font-bengali text-lg font-semibold text-ink">{pr.briefing.title}</h2>
              <dl className="mt-5 space-y-4">
                {pr.briefing.rows.map(([k, v], i) => {
                  const Icon = BRIEFING_ICONS[i] ?? MapPin
                  return (
                    <div key={k} className="flex gap-3 border-b border-ink/8 pb-4 last:border-0 last:pb-0">
                      <Icon className="mt-1 h-4 w-4 shrink-0 text-flag" strokeWidth={1.5} aria-hidden="true" />
                      <div>
                        <dt className="font-bengali text-sm text-flag">{k}</dt>
                        <dd className="font-bengali mt-1 leading-relaxed text-ink/75">{v}</dd>
                      </div>
                    </div>
                  )
                })}
              </dl>
            </Reveal>

            <Reveal delay={80} className="rounded-lg bg-forest p-7 text-paper">
              <h2 className="label text-mint/60">{pr.contact.title}</h2>
              <p className="font-bengali mt-5 text-xl font-semibold">{pr.contact.name}</p>
              <p className="mt-1 text-sm text-paper/60">{pr.contact.role}</p>
              <ul className="mt-6 space-y-3 text-sm">
                <li>
                  <a href={pr.contact.phoneHref} className="flex items-center gap-3 font-mono text-mint hover:text-paper">
                    <Phone className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                    {pr.contact.phone}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${pr.contact.email}`} className="flex items-center gap-3 break-all font-mono text-mint hover:text-paper">
                    <Mail className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                    {pr.contact.email}
                  </a>
                </li>
                <li className="flex items-start gap-3 text-paper/70">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-mint" strokeWidth={1.5} aria-hidden="true" />
                  {pr.contact.address}
                </li>
                <li>
                  <a href={facebook.href} target="_blank" rel="noreferrer noopener" className="flex items-center gap-3 break-all font-mono text-mint hover:text-paper">
                    <ArrowUpRight className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                    {facebook.handle}
                  </a>
                </li>
              </ul>
            </Reveal>
          </div>

          <Reveal className="mt-16 border-t border-ink/10 pt-8">
            <a href="/" className="group inline-flex items-center gap-2.5 text-sm text-ink/60 transition-colors hover:text-flag">
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" strokeWidth={1.75} aria-hidden="true" />
              Back to {site.name}
            </a>
          </Reveal>
        </div>
      </Container>
    </article>
  )
}
