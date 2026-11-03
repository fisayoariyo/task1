import { useState } from 'react'
import { adminUpdateCredentials } from '../lib/api'
import { useAdminAuth } from './AdminAuthContext'

export default function AdminSettings() {
  const { admin, setAdmin } = useAdminAuth()
  const [username, setUsername] = useState(admin?.username || '')
  const [password, setPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const updated = await adminUpdateCredentials({
        username: username.trim() !== admin?.username ? username : undefined,
        password: password || undefined,
        currentPassword,
      })
      setAdmin(updated)
      setPassword('')
      setCurrentPassword('')
      setMessage('Credentials updated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="admin-main__header">
        <h1>Settings</h1>
      </div>
      <div className="admin-panel admin-settings">
        <form className="admin-form" onSubmit={onSubmit}>
          <label>
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label>
            New password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Leave blank to keep current"
            />
          </label>
          <label>
            Current password
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error ? <p className="admin-error">{error}</p> : null}
          {message ? <p className="admin-muted">{message}</p> : null}
          <button className="admin-btn" type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Update credentials'}
          </button>
        </form>
      </div>
    </>
  )
}
