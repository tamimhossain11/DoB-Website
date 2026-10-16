/**
 * Accounts and member areas, shared by every page that needs a signed-in user.
 */
import { supabase } from './supabase'
import { SIGN_IN_PATH } from './signin'

/**
 * Member areas an account can open. After signing in, people go straight to the one
 * area they have access to, or choose when they have several.
 *
 * To add the general member area later: append an entry whose `hasAccess` checks
 * that area's own membership table (protected by row-level security, like
 * board_members).
 */
export const areas = [
  {
    id: 'board',
    label: 'Proposal Board',
    description: 'Proposals, requisitions and board approvals',
    href: '/board/',
    hasAccess: async (userId) => {
      const { data, error } = await supabase
        .from('board_members')
        .select('role_id')
        .eq('user_id', userId)
        .eq('active', true)
        .maybeSingle()
      if (error) throw error
      return Boolean(data)
    },
  },
]

export async function areasFor(userId) {
  const allowed = await Promise.all(areas.map((a) => a.hasAccess(userId)))
  return areas.filter((_, i) => allowed[i])
}

export const areaFor = (path) => areas.find((a) => path?.startsWith(a.href))

async function call(promise) {
  const { error } = await promise
  if (error) throw new Error(error.message)
}

export const account = {
  signIn: (email, password) => call(supabase.auth.signInWithPassword({ email, password })),
  signOut: () => call(supabase.auth.signOut()),
  /** Emails a link back to the sign-in page, where the member chooses a new password. */
  sendReset: (email) =>
    call(supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}${SIGN_IN_PATH}` })),
  setPassword: (password) => call(supabase.auth.updateUser({ password })),
}
