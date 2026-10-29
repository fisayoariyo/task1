import { useState } from 'react'
import { useAuth } from '../auth/auth.js'

export function AuthButtons({ className = '', variant = 'buttons' }) {
  const { user, openAuth, signOut } = useAuth()
  const [logoutError, setLogoutError] = useState('')
  const [logoutPending, setLogoutPending] = useState(false)
  const variantClass =
    variant === 'links' ? 'auth-buttons--links' : variant === 'drawer' ? 'auth-buttons--drawer' : ''
  const classes = `auth-buttons ${variantClass} ${className}`.trim()

  async function handleLogout() {
    setLogoutError('')
    setLogoutPending(true)
    try {
      await signOut()
    } catch (error) {
      setLogoutError(
        error instanceof Error && error.message
          ? error.message
          : 'We could not sign you out. Please try again.',
      )
    } finally {
      setLogoutPending(false)
    }
  }

  if (user) {
    const logoutClass =
      variant === 'drawer'
        ? 'nl-drawer__signup'
        : variant === 'links'
          ? 'auth-buttons__logout auth-buttons__logout--links'
          : 'btn btn--outline auth-buttons__logout'
    return (
      <div className={classes}>
        <span className="auth-buttons__user">{user.fullName}</span>
        <button
          type="button"
          className={logoutClass}
          onClick={handleLogout}
          disabled={logoutPending}
        >
          {logoutPending ? 'Signing out…' : 'Log out'}
        </button>
        {logoutError ? (
          <span className="auth-buttons__error" role="alert">
            {logoutError}
          </span>
        ) : null}
      </div>
    )
  }

  if (variant === 'links') {
    return (
      <div className={classes}>
        <button type="button" onClick={() => openAuth('login')}>
          Sign in
        </button>
        <span className="auth-buttons__or">or</span>
        <button type="button" onClick={() => openAuth('register')}>
          Register
        </button>
      </div>
    )
  }

  if (variant === 'drawer') {
    return (
      <div className={classes}>
        <button
          type="button"
          className="nl-drawer__signin"
          onClick={() => openAuth('login')}
        >
          Sign in
        </button>
        <button
          type="button"
          className="nl-drawer__signup"
          onClick={() => openAuth('register')}
        >
          Sign Up
        </button>
      </div>
    )
  }

  return (
    <div className={classes}>
      <button
        type="button"
        className="btn btn--outline"
        onClick={() => openAuth('login')}
      >
        Sign in
      </button>
      <button
        type="button"
        className="btn btn--primary"
        onClick={() => openAuth('register')}
      >
        Register
      </button>
    </div>
  )
}
