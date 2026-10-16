import { ArrowRight, Check, Mail } from 'lucide-react'
import { partners, site } from '../data/content'
import { Reveal, Section, SectionHeader, Stagger, StaggerItem } from './ui'

export default function Partners() {
  return (
    <Section id="partners" tone="ink">
      <SectionHeader dark index="05" label={partners.kicker} title={partners.heading} intro={partners.body}>
        <a
          href={`mailto:${site.email}`}
          className="group mt-8 inline-flex items-center gap-3 border-b border-mint/30 pb-1 font-mono text-sm text-mint transition-colors hover:border-mint"
        >
          <Mail className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          {site.email}
        </a>
      </SectionHeader>

      {/* Tiers */}
      <Stagger className="mt-16 grid gap-4 lg:grid-cols-3">
        {partners.tiers.map((t) => (
          <StaggerItem
            key={t.name}
            className={`flex flex-col rounded-lg p-8 ${t.featured ? 'bg-paper text-ink' : 'border border-paper/12 text-paper'}`}
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-display text-2xl leading-tight">{t.name}</h3>
              {t.featured && <span className="label rounded-sm bg-crimson px-2 py-1 text-white">Flagship</span>}
            </div>
            <p className={`mt-4 flex-1 text-[0.9375rem] leading-relaxed ${t.featured ? 'text-ink/65' : 'text-paper/60'}`}>{t.body}</p>

            <ul className={`mt-7 space-y-3 border-t pt-6 ${t.featured ? 'border-ink/10' : 'border-paper/12'}`}>
              {t.perks.map((p) => (
                <li key={p} className={`flex items-start gap-3 text-sm ${t.featured ? 'text-ink/80' : 'text-paper/75'}`}>
                  <Check className={`mt-0.5 h-4 w-4 shrink-0 ${t.featured ? 'text-flag' : 'text-mint'}`} strokeWidth={2} aria-hidden="true" />
                  {p}
                </li>
              ))}
            </ul>

            <a
              href={`mailto:${site.email}?subject=${encodeURIComponent(`${t.name} — Dreams of Bangladesh`)}`}
              className={`group mt-8 inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-medium transition-colors ${
                t.featured ? 'bg-flag text-white hover:bg-leaf' : 'border border-paper/20 text-paper hover:border-paper/50'
              }`}
            >
              Start a conversation
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} aria-hidden="true" />
            </a>
          </StaggerItem>
        ))}
      </Stagger>

      {/* Partner logo slots — replace with real sponsor logos */}
      <Reveal className="mt-20">
        <p className="label text-paper/40">Supported by</p>
        <div className="mt-6 grid grid-cols-2 border-l border-t border-paper/10 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex h-24 items-center justify-center border-b border-r border-paper/10 px-4 text-center label text-paper/20"
            >
              Partner logo
            </div>
          ))}
        </div>
      </Reveal>
    </Section>
  )
}
