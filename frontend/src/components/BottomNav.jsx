import { NavLink } from 'react-router-dom'
import { Icon } from './Icon'
import { hasSavedLocation } from '../lib/location'

/**
 * Mobile sticky bottom nav (Noon-like).
 * Soft links: offers → discovery; orders → checkout; account → discovery#account.
 * @param {'home' | 'offers' | 'orders' | 'account'} active
 */
export function BottomNav({ active = 'home', className = '' }) {
  const homeTo = hasSavedLocation() ? '/discovery' : '/'

  const items = [
    { id: 'home', to: homeTo, label: 'Home', icon: 'home' },
    { id: 'offers', to: '/discovery?filter=offers', label: 'Offers', icon: 'percent' },
    { id: 'orders', to: '/checkout', label: 'Orders', icon: 'cart' },
    { id: 'account', to: '/discovery#account', label: 'Account', icon: 'user' },
  ]

  return (
    <nav className={`noon-bottom-nav only-mobile ${className}`.trim()} aria-label="Primary">
      {items.map((item) => {
        const isActive = active === item.id
        return (
          <NavLink
            key={item.id}
            to={item.to}
            className={`noon-bottom-nav__item ${isActive ? 'is-active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon name={item.icon} size={22} />
            <span>{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
