/**
 * Sign-in links and a "signed in?" hint. Deliberately does NOT import Supabase, so
 * the public pages (home, press release) can show the right nav link without
 * loading the client library.
 */

export const SIGN_IN_PATH = '/signin/'

/** Link to the sign-in page that returns to `next` (a path on this site) afterwards. */
export const signInUrl = (next) => (next ? `${SIGN_IN_PATH}?next=${encodeURIComponent(next)}` : SIGN_IN_PATH)

/** Accept only paths on this site, so ?next= can't send anyone to another website. */
export function safeNext(raw) {
  if (!raw) return null
  try {
    const u = new URL(raw, window.location.origin)
    return u.origin === window.location.origin ? u.pathname + u.search + u.hash : null
  } catch {
    return null
  }
}

/**
 * True when a Supabase session is stored in this browser. It can be stale (an
 * expired session still counts) — it only picks the nav label; the sign-in page
 * shows the real state.
 */
export function hasStoredSession() {
  try {
    return Object.keys(localStorage).some((k) => /^sb-.+-auth-token$/.test(k))
  } catch {
    return false
  }
}
