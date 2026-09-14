import { useEffect, useState } from 'react'
import { nav, site } from '../data/content'
import { pressRelease } from '../data/press'

/**
 * `hrefBase` prefixes the in-page anchors so the same nav works on sub-pages:
 * '' on the home page (#mission), '/' on the press page (/#mission).
 * `solid` opts out of the transparent-over-hero state.
 */
export default function Nav({ hrefBase = '', solid = false }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('')

  const onSubPage = hrefBase !== ''
  const opaque = solid || scrolled

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Highlight the section currently in the middle of the viewport
  useEffect(() => {
    if (onSubPage) return
    const ids = nav.map((n) => n.href.slice(1))
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id)
        })
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [onSubPage])

  // Lock body scroll while the mobile sheet is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          opaque
            ? 'border-b border-ink/8 bg-paper/85 backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
          <a
            href={onSubPage ? '/' : '#top'}
            className="group flex shrink-0 items-center gap-3"
            aria-label={site.name}
          >
            <img
              src="/logo-mark.png"
              alt=""
              className="h-11 w-auto transition-transform duration-500 group-hover:scale-[1.04] sm:h-12"
            />
            <span className="sr-only">{site.name}</span>
          </a>

          <nav className="hidden items-center gap-1 lg:flex">
            {nav.map((item) => {
              const isActive = active === item.href.slice(1)
              return (
                <a
                  key={item.href}
                  href={hrefBase + item.href}
                  className={`relative whitespace-nowrap rounded-full px-3 py-2 text-sm transition-colors duration-300 xl:px-4 ${
                    isActive ? 'text-flag' : 'text-ink/65 hover:text-ink'
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute inset-x-3 -bottom-0.5 h-px origin-left bg-flag transition-transform duration-300 xl:inset-x-4 ${
                      isActive ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />
                </a>
              )
            })}

            <a
              href={`/${pressRelease.slug}`}
              aria-current={onSubPage ? 'page' : undefined}
              className={`relative ml-1 whitespace-nowrap rounded-full border px-3.5 py-2 text-sm transition-colors duration-300 xl:px-4 ${
                onSubPage
                  ? 'border-flag/40 bg-flag/8 text-flag'
                  : 'border-ink/12 text-ink/65 hover:border-flag/40 hover:text-flag'
              }`}
            >
              {pressRelease.label}
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={`${hrefBase}#join`}
              className="hidden whitespace-nowrap rounded-full bg-flag px-5 py-2.5 text-sm font-medium text-paper shadow-[0_8px_24px_-12px_rgba(0,106,78,0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-leaf sm:inline-block"
            >
              Join the team
            </a>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? 'Close menu' : 'Open menu'}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-flag hover:text-flag lg:hidden"
            >
              <span className="relative block h-3 w-5">
                <span
                  className={`absolute left-0 block h-px w-5 bg-current transition-all duration-300 ${
                    open ? 'top-1.5 rotate-45' : 'top-0'
                  }`}
                />
                <span
                  className={`absolute left-0 top-1.5 block h-px w-5 bg-current transition-all duration-300 ${
                    open ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`absolute left-0 block h-px w-5 bg-current transition-all duration-300 ${
                    open ? 'top-1.5 -rotate-45' : 'top-3'
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile sheet */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-400 ${
            open ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <nav
          className={`absolute inset-x-0 top-0 origin-top bg-paper px-5 pb-10 pt-24 transition-all duration-500 sm:px-8 ${
            open ? 'translate-y-0 opacity-100' : '-translate-y-6 opacity-0'
          }`}
        >
          <ul className="flex flex-col">
            {nav.map((item, i) => (
              <li key={item.href} className="border-b border-ink/8">
                <a
                  href={hrefBase + item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-baseline gap-4 py-4 font-display text-3xl font-light text-ink transition-colors hover:text-flag"
                >
                  <span className="kicker text-flag/50">{String(i + 1).padStart(2, '0')}</span>
                  {item.label}
                </a>
              </li>
            ))}
            <li className="border-b border-ink/8">
              <a
                href={`/${pressRelease.slug}`}
                onClick={() => setOpen(false)}
                className="flex items-baseline gap-4 py-4 font-display text-2xl font-light text-flag transition-colors hover:text-leaf"
              >
                <span className="kicker text-flag/50">
                  {String(nav.length + 1).padStart(2, '0')}
                </span>
                {pressRelease.label}
              </a>
            </li>
          </ul>
          <a
            href={`${hrefBase}#join`}
            onClick={() => setOpen(false)}
            className="mt-8 block rounded-full bg-flag px-6 py-4 text-center text-sm font-medium text-paper"
          >
            Join the team
          </a>
        </nav>
      </div>
    </>
  )
}
