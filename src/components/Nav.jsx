import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Menu, Newspaper, UserRound, X } from 'lucide-react'
import { nav, site } from '../data/content'
import { pressRelease } from '../data/press'
import { hasStoredSession, SIGN_IN_PATH } from '../lib/signin'
import { EASE } from './ui'

/**
 * `hrefBase` prefixes the in-page anchors so the same nav works on sub-pages:
 * '' on the home page (#mission), '/' elsewhere (/#mission).
 * `page` marks the current sub-page ('press' | 'signin').
 */
export default function Nav({ hrefBase = '', page = '' }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('')
  const [signedIn] = useState(hasStoredSession)

  const onSubPage = hrefBase !== ''
  const accountLabel = signedIn ? 'Account' : 'Sign in'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Highlight the section in the middle of the viewport (home page only)
  useEffect(() => {
    if (onSubPage) return
    const io = new IntersectionObserver(
      // Clear the highlight when its section leaves the middle band (e.g. back at the hero)
      (entries) =>
        entries.forEach((e) => setActive((a) => (e.isIntersecting ? e.target.id : a === e.target.id ? '' : a))),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    nav.forEach((n) => {
      const el = document.getElementById(n.href.slice(1))
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [onSubPage])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-300 ${
          scrolled || onSubPage || open ? 'border-b border-ink/10 bg-paper/95 backdrop-blur' : 'border-b border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-[4.5rem] w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 xl:px-12">
          <a href={onSubPage ? '/' : '#top'} className="flex shrink-0 items-center" aria-label={`${site.name} — home`}>
            <img src="/logo-mark.png" alt="" className="h-9 w-auto sm:h-10" />
          </a>

          <nav className="hidden items-center lg:flex" aria-label="Main">
            {nav.map((item) => {
              const isActive = active === item.href.slice(1)
              return (
                <a
                  key={item.href}
                  href={hrefBase + item.href}
                  className={`relative px-3 py-2 text-[0.9rem] transition-colors duration-200 xl:px-3.5 ${
                    isActive ? 'text-ink' : 'text-ink/60 hover:text-ink'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-x-3 -bottom-[1.05rem] h-0.5 bg-flag xl:inset-x-3.5"
                      transition={{ duration: 0.4, ease: EASE }}
                    />
                  )}
                </a>
              )
            })}
            <span className="mx-2 h-4 w-px bg-ink/15" aria-hidden="true" />
            <a
              href={`/${pressRelease.slug}`}
              aria-current={page === 'press' ? 'page' : undefined}
              className={`inline-flex items-center gap-2 px-3 py-2 text-[0.9rem] transition-colors duration-200 ${
                page === 'press' ? 'text-flag' : 'text-ink/60 hover:text-ink'
              }`}
            >
              <Newspaper className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              Press
            </a>
          </nav>

          <div className="flex items-center gap-2">
            {/* Icon-only between lg and xl, where the link row leaves no room for text */}
            <a
              href={SIGN_IN_PATH}
              aria-current={page === 'signin' ? 'page' : undefined}
              aria-label={accountLabel}
              title={accountLabel}
              className={`hidden items-center gap-2 rounded-md border px-3.5 py-2 text-[0.9rem] transition-colors duration-200 sm:inline-flex lg:px-2.5 xl:px-3.5 ${
                page === 'signin'
                  ? 'border-flag/40 bg-flag/5 text-flag'
                  : 'border-ink/15 text-ink/75 hover:border-ink/35 hover:text-ink'
              }`}
            >
              <UserRound className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span className="lg:hidden xl:inline">{accountLabel}</span>
            </a>

            <a
              href={`${hrefBase}#join`}
              className="hidden items-center gap-2 whitespace-nowrap rounded-md bg-flag px-4 py-2 text-[0.9rem] font-medium text-white transition-colors duration-200 hover:bg-leaf sm:inline-flex"
            >
              Join the team
            </a>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-ink/15 text-ink transition-colors hover:border-ink/35 lg:hidden"
            >
              {open ? <X className="h-5 w-5" strokeWidth={1.75} /> : <Menu className="h-5 w-5" strokeWidth={1.75} />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 z-40 flex flex-col bg-paper pt-[4.5rem] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <motion.nav
              className="flex flex-1 flex-col overflow-y-auto px-5 pb-8 pt-4 sm:px-8"
              aria-label="Mobile"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } } }}
            >
              <ul>
                {[...nav, { label: pressRelease.label, href: `/${pressRelease.slug}`, absolute: true }].map((item, i) => (
                  <motion.li
                    key={item.href}
                    variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } } }}
                    className="border-b border-ink/10"
                  >
                    <a
                      href={item.absolute ? item.href : hrefBase + item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between py-4 font-display text-2xl text-ink"
                    >
                      <span className="flex items-baseline gap-4">
                        <span className="label tabular text-ink/35">{String(i + 1).padStart(2, '0')}</span>
                        {item.label}
                      </span>
                      <ArrowRight className="h-5 w-5 text-ink/30" strokeWidth={1.5} aria-hidden="true" />
                    </a>
                  </motion.li>
                ))}
              </ul>

              <motion.div
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.4 } } }}
                className="mt-auto grid gap-3 pt-8"
              >
                <a
                  href={`${hrefBase}#join`}
                  onClick={() => setOpen(false)}
                  className="rounded-md bg-flag px-6 py-3.5 text-center text-[0.9375rem] font-medium text-white"
                >
                  Join the team
                </a>
                <a
                  href={SIGN_IN_PATH}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-md border border-ink/20 px-6 py-3.5 text-[0.9375rem] font-medium text-ink"
                >
                  <UserRound className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  {signedIn ? 'Account' : 'Member sign in'}
                </a>
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
