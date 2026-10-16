/**
 * The one Supabase client for the whole site — the sign-in page, the Proposal Board,
 * and later the general member area. Pages on the same domain share the session
 * through localStorage, so signing in on /signin/ signs you in everywhere.
 */
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// A password-reset email links back with "type=recovery" in the URL hash. Read it
// before createClient consumes and clears the hash.
export const arrivedFromResetLink = /type=recovery/.test(window.location.hash)

export const supabase = url && key ? createClient(url, key) : null
