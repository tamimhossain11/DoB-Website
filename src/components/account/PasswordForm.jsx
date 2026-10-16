import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { account } from '../../lib/account'
import { Btn, PasswordField } from '../board/bits'

/** New-password form for the signed-in user. Calls onSaved once the password is changed. */
export default function PasswordForm({ onSaved, submitLabel = 'Save password' }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (password.length < 8) return setError('Use at least 8 characters.')
    if (password !== confirm) return setError('The passwords don’t match.')
    setBusy(true)
    setError('')
    try {
      await account.setPassword(password)
      onSaved()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <PasswordField
        label="New password"
        hint="At least 8 characters."
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        show={show}
        onToggle={() => setShow((s) => !s)}
      />
      <PasswordField label="Repeat new password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} show={show} />
      {error && <p role="alert" className="text-sm text-crimson">{error}</p>}
      <Btn type="submit" icon={KeyRound} className="w-full" disabled={busy}>
        {busy ? 'Saving…' : submitLabel}
      </Btn>
    </form>
  )
}
