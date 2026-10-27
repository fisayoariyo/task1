/** Auth is deferred — buttons stay visible but do nothing until login ships. */
export function AuthButtons({ className = '' }) {
  return (
    <div className={`auth-buttons ${className}`.trim()}>
      <button
        type="button"
        className="btn btn--outline"
        disabled
        title="Coming soon"
        aria-disabled="true"
      >
        Sign in
      </button>
      <button
        type="button"
        className="btn btn--primary"
        disabled
        title="Coming soon"
        aria-disabled="true"
      >
        Register
      </button>
    </div>
  )
}
