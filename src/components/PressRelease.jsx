import { pressRelease as pr } from '../data/press'
import { site } from '../data/content'
import { Kicker, Reveal } from './ui'
import DocumentViewer from './DocumentViewer'

export default function PressRelease() {
  return (
    <article className="relative overflow-hidden bg-paper grain">
      {/* Ambient wash, matched to the home hero */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-flag/8 blur-3xl" />
        <div className="absolute -left-40 top-[40rem] h-[26rem] w-[26rem] rounded-full bg-vermilion/6 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
        {/* ── Masthead: the document leads, metadata sits beside it ── */}
        <Reveal>
          <Kicker>{pr.kicker}</Kicker>
        </Reveal>

        <div className="mt-7 grid items-start gap-10 lg:grid-cols-[1fr_0.88fr] lg:gap-14">
          {/* The release itself — first thing on the page, and first on mobile */}
          <Reveal delay={60} className="order-1 lg:order-2">
            <DocumentViewer />
          </Reveal>

          <div className="order-2 min-w-0 lg:order-1">
            <Reveal delay={120}>
              <h1 className="font-bengali text-[clamp(1.25rem,2.1vw,1.7rem)] font-semibold leading-[1.6] tracking-tight text-ink u-balance">
                {pr.headline}
              </h1>
            </Reveal>

            <Reveal delay={170}>
              <p className="mt-6 border-l-2 border-flag/30 pl-5 text-[0.9375rem] leading-relaxed text-ink/60">
                {pr.summaryEn}
              </p>
            </Reveal>

            <Reveal delay={210}>
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-ink/10 py-4">
                <time dateTime={pr.isoDate} className="font-bengali text-sm text-ink/70">
                  {pr.dateline}
                </time>
                <span className="h-1 w-1 rounded-full bg-vermilion" />
                <span className="kicker text-ink/40">{pr.datelineEn}</span>
              </div>
            </Reveal>

            {/* ── Download actions ── */}
            <Reveal delay={250}>
              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href={pr.pdf.file}
                  download={pr.pdf.downloadName}
                  className="group inline-flex items-center gap-2.5 rounded-full bg-flag px-6 py-3.5 text-sm font-medium text-paper shadow-[0_10px_30px_-12px_rgba(0,106,78,0.75)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-leaf"
                >
                  <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
                    <path
                      d="M8 1.5v9m0 0L4.5 7M8 10.5L11.5 7M2 13.5h12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Download the PDF
                </a>

                <a
                  href={pr.pdf.file}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group inline-flex items-center gap-2.5 rounded-full border border-ink/20 px-6 py-3.5 text-sm font-medium text-ink transition-all duration-300 hover:-translate-y-0.5 hover:border-flag hover:text-flag"
                >
                  Open in a new tab
                  <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden="true">
                    <path
                      d="M3 9L9 3M4 3h5v5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              </div>
            </Reveal>
          </div>
        </div>

        {/* ── Key facts ── */}
        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10 sm:grid-cols-2 lg:grid-cols-4">
          {pr.facts.map((f, i) => (
            <Reveal key={f.label} delay={i * 80} className="bg-paper p-6">
              <p className="font-bengali text-3xl font-semibold leading-none text-flag">
                {f.value}
              </p>
              <p className="kicker mt-3 text-vermilion/80">{f.valueEn}</p>
              <p className="font-bengali mt-2 text-[0.8125rem] leading-relaxed text-ink/55">
                {f.label}
              </p>
            </Reveal>
          ))}
        </div>

        {/* ── Full text ── */}
        <div className="mx-auto mt-4 w-full max-w-3xl">
        <Reveal delay={100} className="mt-16">
          <Kicker>সম্পূর্ণ বিবরণ · Full text</Kicker>
        </Reveal>

        <div className="mt-8 space-y-6">
          {pr.body.map((p, i) => (
            <Reveal key={i} delay={i * 60}>
              <p className="font-bengali text-[1.0625rem] leading-[2] text-ink/75">{p}</p>
            </Reveal>
          ))}
        </div>

        {/* ── Quote ── */}
        <Reveal delay={80} className="mt-12">
          <p className="font-bengali text-[1.0625rem] font-semibold leading-[2] text-ink">
            {pr.quote.intro}
          </p>

          <blockquote className="relative mt-6 overflow-hidden rounded-2xl border border-flag/20 bg-flag/5 p-7 sm:p-9">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-2 -top-8 font-display text-[9rem] leading-none text-flag/10"
            >
              &rdquo;
            </span>
            <p className="font-bengali relative text-[1.0625rem] leading-[2] text-ink/80">
              {pr.quote.text}
            </p>
            <footer className="relative mt-6 border-t border-flag/15 pt-5">
              <p className="font-bengali font-semibold text-ink">{pr.quote.attribution}</p>
              <p className="mt-1 text-sm text-ink/55">{pr.quote.role}</p>
            </footer>
          </blockquote>
        </Reveal>

        <Reveal delay={80}>
          <p className="font-bengali mt-10 text-[1.0625rem] leading-[2] text-ink/75">{pr.closing}</p>
        </Reveal>

        {/* ── Briefing + contact ── */}
        <div className="mt-16 grid gap-5 sm:grid-cols-2">
          <Reveal className="rounded-2xl border border-ink/10 bg-parchment/60 p-7">
            <h2 className="font-bengali text-lg font-semibold text-ink">{pr.briefing.title}</h2>
            <dl className="mt-5 space-y-4">
              {pr.briefing.rows.map(([k, v]) => (
                <div key={k} className="border-b border-ink/8 pb-4 last:border-0 last:pb-0">
                  <dt className="font-bengali text-sm text-flag">{k}</dt>
                  <dd className="font-bengali mt-1.5 leading-relaxed text-ink/75">{v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal
            delay={90}
            className="relative overflow-hidden rounded-2xl border border-mint/15 bg-forest p-7 text-paper"
          >
            <div className="blueprint pointer-events-none absolute inset-0 opacity-60" />
            <div className="relative">
              <h2 className="kicker text-mint/60">{pr.contact.title}</h2>

              <p className="font-bengali mt-5 text-xl font-semibold">{pr.contact.name}</p>
              <p className="mt-1 text-sm text-paper/60">{pr.contact.role}</p>

              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex gap-3">
                  <dt className="w-16 shrink-0 text-mint/50">Phone</dt>
                  <dd>
                    <a href={pr.contact.phoneHref} className="font-mono text-mint hover:text-paper">
                      {pr.contact.phone}
                    </a>
                  </dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-16 shrink-0 text-mint/50">Email</dt>
                  <dd className="min-w-0">
                    <a
                      href={`mailto:${pr.contact.email}`}
                      className="break-all font-mono text-mint hover:text-paper"
                    >
                      {pr.contact.email}
                    </a>
                  </dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-16 shrink-0 text-mint/50">Office</dt>
                  <dd className="text-paper/70">{pr.contact.address}</dd>
                </div>
              </dl>
            </div>
          </Reveal>
        </div>

        </div>

        {/* ── Back ── */}
        <Reveal delay={80} className="mt-16 border-t border-ink/10 pt-8">
          <a
            href="/"
            className="group inline-flex items-center gap-2.5 text-sm text-ink/60 transition-colors hover:text-flag"
          >
            <svg
              viewBox="0 0 16 16"
              className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-1"
              aria-hidden="true"
            >
              <path
                d="M14 8H3m4 4L3 8l4-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to {site.name}
          </a>
        </Reveal>
      </div>
    </article>
  )
}
