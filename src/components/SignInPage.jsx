import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  FilePen,
  LoaderCircle,
  LogIn,
  LogOut,
  Mail,
  MailCheck,
  MessagesSquare,
  ShieldCheck,
} from 'lucide-react'
import { arrivedFromResetLink, supabase } from '../lib/supabase'
import { account, areaFor, areasFor } from '../lib/account'
import { safeNext } from '../lib/signin'
import PasswordForm from './account/PasswordForm'
import { Btn, Field, inputClass, PasswordField } from './board/bits'
import { EASE } from './ui'

/**
 * One sign-in page for every member area. After signing in, people go to `?next=`
 * when they have access to it, otherwise to their only area, otherwise they choose.
 *
 * phase: 'unconfigured' | 'loading' | 'signed-out' | 'checking' | 'recovery' | 'signed-in' | 'error'
 */
export default function SignInPage() {
  const [phase, setPhase] = useState(supabase ? 'loading' : 'unconfigured')
  const [email, setEmail] = useState('')
  const [access, setAccess] = useState([])
  const [error, setError] = useState('')

  const next = safeNext(new URLSearchParams(window.location.search).get('next'))
  const recovering = useRef(arrivedFromResetLink)
  const justSignedIn = useRef(false) // redirect after a fresh sign-in, not when merely visiting
  const handledUser = useRef(null)

  useEffect(() => {
    if (!supabase) return
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      // Supabase advises against awaiting its own calls inside this callback.
      setTimeout(() => handle(event, session), 0)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  async function handle(event, session) {
    if (event === 'PASSWORD_RECOVERY') recovering.current = true
    if (!session) {
      handledUser.current = null
      return setPhase('signed-out')
    }
    setEmail(session.user.email)
    if (recovering.current) return setPhase('recovery')
    if (handledUser.current === session.user.id && !justSignedIn.current) return // token refresh etc.
    handledUser.current = session.user.id

    setPhase('checking')
    try {
      const list = await areasFor(session.user.id)
      const target = next && list.some((a) => next.startsWith(a.href)) ? next : list.length === 1 ? list[0].href : null
      if (target && (justSignedIn.current || next)) return window.location.replace(target)
      setAccess(list)
      setPhase('signed-in')
    } catch (e) {
      setError(e.message)
      setPhase('error')
    } finally {
      justSignedIn.current = false
    }
  }

  async function finishRecovery() {
    recovering.current = false
    justSignedIn.current = true
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
    const { data } = await supabase.auth.getSession()
    handle('SIGNED_IN', data.session)
  }

  async function signOut() {
    await account.signOut().catch(() => {})
    setAccess([])
  }

  const destination = areaFor(next)

  return (
    <section className="bg-paper pt-[4.5rem]">
      <div className="grid min-h-[calc(100svh-4.5rem)] w-full lg:grid-cols-12">
        <MembersPanel />

        <div className="flex items-center px-5 py-16 sm:px-8 lg:col-span-7 lg:px-16">
          <div className="mx-auto w-full max-w-md">
            <AnimatePresence mode="wait">
              <motion.div
                key={phase}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: EASE }}
              >
                {phase === 'unconfigured' ? (
                  <Message icon={CircleAlert} title="Sign-in isn’t available yet">
                    Member accounts haven’t been connected to this site.
                  </Message>
                ) : phase === 'loading' || phase === 'checking' ? (
                  <p className="flex items-center gap-3 text-sm text-ink/55">
                    <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={1.75} aria-hidden="true" />
                    {phase === 'checking' ? 'Signing you in…' : 'Loading…'}
                  </p>
                ) : phase === 'recovery' ? (
                  <>
                    <Heading eyebrow="Password reset" title="Choose a new password" sub={email} />
                    <div className="mt-8">
                      <PasswordForm onSaved={finishRecovery} submitLabel="Save and continue" />
                    </div>
                  </>
                ) : phase === 'signed-in' ? (
                  <SignedIn email={email} access={access} next={next} onSignOut={signOut} />
                ) : phase === 'error' ? (
                  <Message icon={CircleAlert} title="Something went wrong">
                    {error}
                    <Btn variant="outline" className="mt-6" onClick={() => window.location.reload()}>Try again</Btn>
                  </Message>
                ) : (
                  <SignInForm destination={destination} onSigningIn={() => (justSignedIn.current = true)} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}

const FEATURES = [
  { icon: FilePen, title: 'Submit', body: 'Proposals, event budgets, course launches and technical requisitions.' },
  { icon: ShieldCheck, title: 'Approve', body: 'Every required approval recorded by name, with a permanent audit trail.' },
  { icon: MessagesSquare, title: 'Discuss', body: 'Threaded discussion, mentions, attachments and meeting requests.' },
]

function MembersPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-forest px-12 py-16 text-paper lg:col-span-5 lg:flex lg:flex-col lg:justify-between xl:pl-[max(3rem,calc((100vw-80rem)/2+3rem))]">
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="relative">
        <p className="label text-mint/70">Members’ area</p>
        <h2 className="mt-5 font-display text-4xl leading-[1.1]">The board’s working room.</h2>
        <p className="mt-5 max-w-sm text-[0.9375rem] leading-relaxed text-paper/60">
          Where Dreams of Bangladesh decides what to build, fund and enter next.
        </p>
      </div>
      <ul className="relative mt-12 space-y-7">
        {FEATURES.map(({ icon: Icon, title, body }, i) => (
          <motion.li
            key={title}
            className="flex gap-4"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.2 + i * 0.1 }}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-mint/20 text-mint">
              <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
            </span>
            <span>
              <span className="block font-medium">{title}</span>
              <span className="mt-1 block text-sm leading-relaxed text-paper/55">{body}</span>
            </span>
          </motion.li>
        ))}
      </ul>
      <p className="relative mt-12 text-xs text-paper/40">Accounts are issued by the administrator. There is no public sign-up.</p>
    </aside>
  )
}

function SignInForm({ destination, onSigningIn }) {
  const [mode, setMode] = useState('signin') // 'signin' | 'reset' | 'sent'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (mode === 'signin') {
        onSigningIn()
        await account.signIn(email.trim(), password)
      } else {
        await account.sendReset(email.trim())
        setMode('sent')
        setBusy(false)
      }
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  if (mode === 'sent')
    return (
      <>
        <span className="flex h-12 w-12 items-center justify-center rounded-md bg-flag/10 text-flag">
          <MailCheck className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
        </span>
        <Heading title="Check your email" />
        <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink/65">
          If <strong className="font-medium text-ink">{email}</strong> has a member account, a reset link is on its way. Open it on this device to choose a new password.
        </p>
        <Btn variant="outline" icon={ArrowLeft} className="mt-8" onClick={() => setMode('signin')}>Back to sign in</Btn>
      </>
    )

  return (
    <>
      <Heading
        eyebrow={mode === 'signin' ? 'Members' : 'Password reset'}
        title={mode === 'signin' ? 'Sign in' : 'Reset your password'}
        sub={
          mode === 'reset'
            ? 'Enter your account email and we’ll send you a link to choose a new password.'
            : destination
              ? `Sign in to continue to the ${destination.label}.`
              : 'For board members. Accounts are created by the administrator.'
        }
      />

      <form onSubmit={submit} className="mt-9 space-y-5">
        <Field label="Email">
          <span className="relative block">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" strokeWidth={1.75} aria-hidden="true" />
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClass} pl-10`} />
          </span>
        </Field>

        {mode === 'signin' && (
          <PasswordField
            label="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            show={show}
            onToggle={() => setShow((s) => !s)}
          />
        )}

        <AnimatePresence>
          {error && (
            <motion.p
              role="alert"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 overflow-hidden text-sm text-crimson"
            >
              <CircleAlert className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <Btn type="submit" icon={busy ? LoaderCircle : mode === 'signin' ? LogIn : Mail} className={`w-full ${busy ? '[&>svg]:animate-spin' : ''}`} disabled={busy}>
          {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Email me a reset link'}
        </Btn>
      </form>

      <button type="button" onClick={() => (setMode(mode === 'signin' ? 'reset' : 'signin'), setError(''))}
        className="mt-5 text-sm text-ink/55 underline-offset-4 hover:text-flag hover:underline">
        {mode === 'signin' ? 'Forgot your password?' : 'Back to sign in'}
      </button>
    </>
  )
}

function SignedIn({ email, access, next, onSignOut }) {
  const blocked = next && !access.some((a) => next.startsWith(a.href)) ? areaFor(next) : null
  return (
    <>
      <Heading eyebrow="Account" title="You’re signed in" sub={email} />

      {blocked && (
        <p className="mt-6 flex gap-2.5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          This account doesn’t have access to the {blocked.label}.
        </p>
      )}

      {access.length ? (
        <ul className="mt-8 space-y-3">
          {access.map((a) => (
            <li key={a.id}>
              <a href={a.href} className="group flex items-center justify-between gap-4 rounded-lg border border-ink/10 bg-white p-5 transition-colors hover:border-flag/50">
                <span>
                  <span className="block font-medium text-ink">{a.label}</span>
                  <span className="mt-0.5 block text-sm text-ink/55">{a.description}</span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 text-flag transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 rounded-lg border border-ink/10 bg-white p-5 text-sm leading-relaxed text-ink/65">
          This account doesn’t have access to a member area yet. If you’re a board member, ask the administrator to add you.
        </p>
      )}

      <Btn variant="outline" icon={LogOut} className="mt-6" onClick={onSignOut}>Sign out</Btn>
    </>
  )
}

function Heading({ eyebrow, title, sub }) {
  return (
    <div className="mt-6 first:mt-0">
      {eyebrow && <p className="label text-flag">{eyebrow}</p>}
      <h1 className="mt-3 font-display text-4xl leading-tight tracking-[-0.015em] text-ink">{title}</h1>
      {sub && <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink/60">{sub}</p>}
    </div>
  )
}

function Message({ icon: Icon, title, children }) {
  return (
    <>
      <Icon className="h-8 w-8 text-ink/30" strokeWidth={1.5} aria-hidden="true" />
      <Heading title={title} />
      <div className="mt-4 text-[0.9375rem] leading-relaxed text-ink/60">{children}</div>
    </>
  )
}
