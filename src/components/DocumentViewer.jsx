import { pressRelease as pr } from '../data/press'

/**
 * The press release, shown as the document it is.
 *
 * This renders a high-resolution image of the page rather than embedding the PDF.
 * The release is a single page, so the image is the complete document — and unlike
 * an <object>/<iframe> embed it displays reliably everywhere. Inline PDF embeds
 * paint their own opaque viewer background and frequently render nothing at small
 * sizes, show an empty box on most mobile browsers, and can be suppressed by
 * extensions or PDF-handler settings. The real PDF is one click away.
 */
export default function DocumentViewer({ className = '' }) {
  return (
    <figure className={`group ${className}`}>
      <a
        href={pr.pdf.file}
        target="_blank"
        rel="noreferrer noopener"
        className="relative block overflow-hidden rounded-2xl border border-ink/12 bg-white shadow-[0_30px_70px_-30px_rgba(6,23,15,0.45)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_40px_90px_-30px_rgba(6,23,15,0.55)]"
        aria-label="Open the press release PDF in a new tab"
      >
        <img
          src={pr.pdf.preview}
          alt="Dreams of Bangladesh WICE 2026 press release, page one"
          className="block w-full"
          width="1100"
          height="1556"
        />

        {/* Hover/focus affordance */}
        <span className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-ink/55 via-transparent to-transparent p-5 opacity-0 transition-opacity duration-400 group-hover:opacity-100 group-focus-within:opacity-100">
          <span className="inline-flex items-center gap-2 rounded-full bg-paper px-5 py-2.5 text-sm font-medium text-ink shadow-lg">
            Open the full PDF
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
          </span>
        </span>
      </a>

      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="kicker text-ink/35">{pr.pdf.sizeLabel}</span>
        <a
          href={pr.pdf.file}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 text-xs text-ink/50 transition-colors hover:text-flag"
        >
          Open full size
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" aria-hidden="true">
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
      </figcaption>
    </figure>
  )
}
