import { Link } from 'react-router-dom'
import { Icon } from './Icon'
import { mapRestaurantCardFromApi } from '../lib/mappers'

function etaLabel(mins) {
  const n = Number(mins) || 0
  if (n <= 0) return null
  const lo = Math.max(15, n - (n % 5 || 5))
  return `${lo}–${lo + 5} mins`
}

/**
 * Noon-style search overlay — live suggest while typing; Enter for full search.
 */
export function RestaurantSearchOverlay({
  open,
  query,
  onQueryChange,
  onSubmit,
  onPickSuggestion,
  onClose,
  loading,
  error,
  suggestions = [],
  restaurants,
}) {
  if (!open) return null

  const rows = (restaurants || []).map((r) => mapRestaurantCardFromApi(r))
  const chips = (suggestions || [])
    .map((s) => (typeof s === 'string' ? { text: s } : s))
    .filter((s) => s?.text)
  const q = query.trim()

  return (
    <div className="rest-search-overlay" role="dialog" aria-modal="true" aria-label="Search restaurants">
      <button type="button" className="rest-search-overlay__scrim" aria-label="Close search" onClick={onClose} />
      <div className="rest-search-overlay__panel">
        <form
          className="rest-search-overlay__bar"
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit?.()
          }}
        >
          <span className="rest-search-overlay__icon" aria-hidden="true">
            <Icon name="search" size={20} />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange?.(e.target.value)}
            placeholder="Search restaurants, dishes & cuisines"
            aria-label="Search restaurants"
            autoFocus
          />
          {query.trim() ? (
            <button
              type="button"
              className="rest-search-overlay__clear"
              aria-label="Clear search"
              onClick={() => onQueryChange?.('')}
            >
              <Icon name="close" size={18} />
            </button>
          ) : null}
        </form>

        <div className="rest-search-overlay__body">
          {loading && rows.length === 0 && chips.length === 0 ? (
            <p className="rest-search-overlay__status">Searching…</p>
          ) : error ? (
            <p className="rest-search-overlay__status rest-search-overlay__status--err">{error}</p>
          ) : !q ? (
            <p className="rest-search-overlay__status">
              Type at least 3 characters for restaurants, dishes, or cuisines
            </p>
          ) : (
            <>
              {chips.length > 0 ? (
                <ul className="rest-search-overlay__suggests" aria-label="Suggestions">
                  {chips.map((s) => (
                    <li key={s.text}>
                      <button
                        type="button"
                        className="rest-search-suggest"
                        onClick={() => onPickSuggestion?.(s.text)}
                      >
                        <Icon name="search" size={16} />
                        <span>{s.text}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              {rows.length === 0 && chips.length === 0 ? (
                <p className="rest-search-overlay__status">
                  {loading ? 'Searching…' : `No restaurants match “${q}”`}
                </p>
              ) : rows.length > 0 ? (
                <ul className="rest-search-overlay__list">
                  {rows.map((r) => {
                    const eta = etaLabel(r.etaMins)
                    return (
                      <li key={r.id}>
                        <Link
                          to={`/restaurant/${r.id}`}
                          className="rest-search-row"
                          onClick={onClose}
                        >
                          <div className="rest-search-row__media">
                            {r.img ? (
                              <img src={r.img} alt="" loading="lazy" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="rest-search-row__ph" aria-hidden="true" />
                            )}
                          </div>
                          <div className="rest-search-row__text">
                            <div className="rest-search-row__name">{r.name}</div>
                            <div className="rest-search-row__meta">
                              {r.rating > 0 ? (
                                <span>
                                  <span className="rest-search-row__star" aria-hidden="true">
                                    ★
                                  </span>{' '}
                                  {r.rating}
                                  {r.ratings ? ` (${r.ratings})` : ''}
                                </span>
                              ) : null}
                              {eta ? (
                                <span>
                                  <Icon name="clock" size={14} /> {eta}
                                </span>
                              ) : null}
                            </div>
                            {r.cuisines ? (
                              <div className="rest-search-row__cuisines">{r.cuisines}</div>
                            ) : null}
                            {r.offer ? (
                              <div className="rest-search-row__offer">
                                <Icon name="tag" size={14} /> {r.offer}
                              </div>
                            ) : null}
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
