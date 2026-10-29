import { useEffect, useId, useRef, useState } from 'react'
import { useAuth } from '../auth/auth.js'
import { passwordValidationMessage } from '../lib/authValidation.js'
import { privacyPolicyUrl } from '../lib/legalLinks.js'
import { Icon } from './Icon'

export function AuthDialog({ open, mode, onClose }) {
  const { error: sessionError, refreshSession, signIn, signUp, openAuth } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [pending, setPending] = useState(false)
  const dialogRef = useRef(null)
  const firstFieldRef = useRef(null)
  const returnFocusRef = useRef(null)
  const id = useId()
  const formId = `${id}-form`

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      if (!dialog.open) {
        returnFocusRef.current = document.activeElement
        dialog.showModal()
      }
      firstFieldRef.current?.focus()
    } else if (dialog.open) {
      dialog.close()
    }
  }, [open, mode])

  function closeDialog() {
    setFieldErrors({})
    setFormError('')
    setPassword('')
    setMarketingConsent(false)
    onClose()
    const target = returnFocusRef.current
    if (target instanceof HTMLElement) {
      requestAnimationFrame(() => target.focus())
    }
  }

  function switchMode(nextMode) {
    if (pending) return
    setFieldErrors({})
    setFormError('')
    openAuth(nextMode)
  }

  function handleTabKeyDown(event) {
    const nextMode =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? mode === 'login'
          ? 'register'
          : 'login'
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? mode === 'register'
            ? 'login'
            : 'register'
          : null
    if (nextMode) {
      event.preventDefault()
      switchMode(nextMode)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (pending) return

    const form = event.currentTarget
    const nextErrors = {}
    if (mode === 'register' && !fullName.trim()) {
      nextErrors.fullName = 'Enter your full name.'
    }

    const emailInput = form.elements.namedItem('email')
    if (!emailInput?.validity.valid) {
      nextErrors.email = 'Enter a valid email address.'
    }

    const passwordError = passwordValidationMessage(password)
    if (passwordError) {
      nextErrors.password = passwordError
    }

    setFieldErrors(nextErrors)
    setFormError('')
    if (Object.keys(nextErrors).length > 0) return

    setPending(true)
    try {
      if (mode === 'register') {
        await signUp({ fullName: fullName.trim(), email: email.trim(), password })
      } else {
        await signIn({ email: email.trim(), password })
      }
      closeDialog()
    } catch (error) {
      setFormError(
        error instanceof Error && error.message
          ? error.message
          : 'We could not complete your request. Please try again.',
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="auth-dialog"
      aria-labelledby={`${id}-title`}
      onClose={closeDialog}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          if (!pending) closeDialog()
        }
      }}
      onCancel={(event) => {
        if (pending) event.preventDefault()
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current && !pending) closeDialog()
      }}
    >
      <div className="auth-dialog__panel">
        <div className="auth-dialog__hero" aria-hidden="true">
          <img src="/assets/hero-bg.jpg" alt="" />
          <div className="auth-dialog__hero-wash" />
          <button
            type="button"
            className="auth-dialog__close"
            aria-label="Close sign in"
            onClick={closeDialog}
            disabled={pending}
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="auth-dialog__content">
          <p className="auth-dialog__eyebrow">WELCOME TO TATAEATS</p>
          <h2 id={`${id}-title`} className="auth-dialog__title">
            Get started
          </h2>

          <div
            className="auth-dialog__tabs"
            role="tablist"
            aria-label="Account access"
            onKeyDown={handleTabKeyDown}
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              aria-controls={formId}
              tabIndex={mode === 'login' ? 0 : -1}
              onClick={() => switchMode('login')}
              disabled={pending}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              aria-controls={formId}
              tabIndex={mode === 'register' ? 0 : -1}
              onClick={() => switchMode('register')}
              disabled={pending}
            >
              Register
            </button>
          </div>

          {sessionError ? (
            <div className="auth-dialog__notice" role="alert">
              <span>{sessionError.message || 'We could not check your session.'}</span>
              <button
                type="button"
                onClick={() => void refreshSession()}
                disabled={pending}
              >
                Try again
              </button>
            </div>
          ) : null}

          <form
            id={formId}
            className="auth-dialog__form"
            onSubmit={handleSubmit}
            noValidate
            aria-busy={pending}
          >
            {mode === 'register' ? (
              <div className="auth-dialog__field">
                <label htmlFor={`${id}-full-name`}>Full name</label>
                <input
                  ref={firstFieldRef}
                  id={`${id}-full-name`}
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  aria-invalid={Boolean(fieldErrors.fullName)}
                  aria-describedby={fieldErrors.fullName ? `${id}-full-name-error` : undefined}
                  required
                />
                {fieldErrors.fullName ? (
                  <p className="auth-dialog__field-error" id={`${id}-full-name-error`}>
                    {fieldErrors.fullName}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="auth-dialog__field">
              <label htmlFor={`${id}-email`}>Email address</label>
              <input
                ref={mode === 'login' ? firstFieldRef : undefined}
                id={`${id}-email`}
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? `${id}-email-error` : undefined}
                required
              />
              {fieldErrors.email ? (
                <p className="auth-dialog__field-error" id={`${id}-email-error`}>
                  {fieldErrors.email}
                </p>
              ) : null}
            </div>

            <div className="auth-dialog__field">
              <label htmlFor={`${id}-password`}>Password</label>
              <input
                id={`${id}-password`}
                name="password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                maxLength={72}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? `${id}-password-error` : undefined}
                required
              />
              {fieldErrors.password ? (
                <p className="auth-dialog__field-error" id={`${id}-password-error`}>
                  {fieldErrors.password}
                </p>
              ) : null}
            </div>

            {mode === 'register' ? (
              <label className="auth-dialog__consent">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(event) => setMarketingConsent(event.target.checked)}
                />
                <span>Send me occasional updates about restaurants and offers</span>
              </label>
            ) : null}

            {formError ? (
              <p className="auth-dialog__form-error" role="alert">
                {formError}
              </p>
            ) : null}
          </form>
        </div>

        <footer className="auth-dialog__footer">
          <button
            className="auth-dialog__continue"
            type="submit"
            form={formId}
            disabled={pending}
          >
            {pending ? 'Please wait…' : 'Continue'}
          </button>
          <p className="auth-dialog__privacy">
            By continuing, I confirm that I have read the{' '}
            {privacyPolicyUrl ? (
              <a href={privacyPolicyUrl}>Privacy Policy</a>
            ) : (
              <span>Privacy Policy</span>
            )}
          </p>
        </footer>
      </div>
    </dialog>
  )
}
