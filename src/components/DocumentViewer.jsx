import { ExternalLink, FileText } from 'lucide-react'
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
        className="relative block overflow-hidden rounded-md border border-ink/15 bg-white shadow-[0_24px_50px_-28px_rgba(11,26,19,0.45)] transition-shadow duration-300 hover:shadow-[0_30px_60px_-26px_rgba(11,26,19,0.55)]"
        aria-label="Open the press release PDF in a new tab"
      >
        <img
          src={pr.pdf.preview}
          alt="Dreams of Bangladesh WICE 2026 press release, page one"
          className="block w-full"
          width="1100"
          height="1556"
        />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-ink/50 to-transparent p-5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
          <span className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-ink shadow">
            <ExternalLink className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            Open the full PDF
          </span>
        </span>
      </a>

      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="label inline-flex items-center gap-2 text-ink/40">
          <FileText className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
          {pr.pdf.sizeLabel}
        </span>
        <a
          href={pr.pdf.file}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 text-xs text-ink/55 transition-colors hover:text-flag"
        >
          Open full size
          <ExternalLink className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
        </a>
      </figcaption>
    </figure>
  )
}
