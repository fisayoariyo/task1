import { Link } from 'react-router-dom'

/** TataEats wordmark — Noon-style split: name + pink FOOD-like accent. */
export function Logo({ className = '', to = '/', mark = true }) {
  return (
    <Link to={to} className={`logo ${className}`.trim()}>
      {mark ? (
        <svg className="logo-mark" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path
            fill="currentColor"
            d="M16 3.2c-5.2 0-9.4 3.5-9.4 8.6 0 6.4 7.2 12.8 9 14.1.2.2.6.2.8 0 1.8-1.3 9-7.7 9-14.1C25.4 6.7 21.2 3.2 16 3.2z"
          />
          <path
            fill="#fff"
            d="M16.2 9.2c-1.8-.9-4 .2-4.1 2.3-.1 1.4.7 2.5 1.7 3.3l.1.1c.4-1.6 1.5-2.9 3.1-3.5.6-.2 1.2-.3 1.8-.2-.3-1-.9-1.7-2.6-2z"
          />
          <path
            fill="#fff"
            opacity=".9"
            d="M19.8 12.1c-.9-.4-2-.3-2.9.2 1.4.7 2.3 2 2.4 3.5.8-.8 1.2-1.9 1.1-3.1 0-.2-.2-.5-.6-.6z"
          />
        </svg>
      ) : null}
      <span className="logo__text">
        <span className="logo__tata">Tata</span>
        <span className="logo__eats">Eats</span>
      </span>
    </Link>
  )
}
