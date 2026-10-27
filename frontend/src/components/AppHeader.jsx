import { Logo } from './Logo'
import { AuthButtons } from './AuthButtons'

/**
 * Shared Noon-like chrome header.
 * @param {'landing' | 'discovery' | 'restaurant'} variant
 */
export function AppHeader({
  variant = 'discovery',
  center = null,
  right = null,
  className = '',
  logoTo = '/',
}) {
  return (
    <header className={`noon-header noon-header--${variant} ${className}`.trim()}>
      <div className="noon-header__inner">
        <div className="noon-header__left">
          <Logo className="logo--sm" to={logoTo} />
        </div>
        {center ? <div className="noon-header__center">{center}</div> : null}
        <div className="noon-header__right">{right ?? <AuthButtons />}</div>
      </div>
    </header>
  )
}
