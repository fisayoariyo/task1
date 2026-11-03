import { Icon } from './Icon'

function suggestKind(kind) {
  return String(kind || '').toLowerCase() === 'restaurant' ? 'restaurant' : 'dish'
}

function kindLabel(kind) {
  return suggestKind(kind) === 'restaurant' ? 'Restaurant' : 'Dish'
}

/**
 * Swiggy-style suggest overlay — typed Dish / Restaurant rows while typing.
 * Rows are buttons only. Dish rows must not link to /restaurant/:id;
 * restaurant rows also stay on the results route (parent navigates).
 */
export function RestaurantSearchOverlay({
  open,
  query,
  onQueryChange,
  onSubmit,
  onPickItem,
  onSeeAll,
  onClose,
  loading,
  error,
  items = [],
}) {
  if (!open) return null

  const q = String(query || '').trim()
  const ready = q.length >= 3
  const rows = (Array.isArray(items) ? items : [])
    .map((item) => {
      const text = String(item?.text || '').trim()
      if (!text) return null
      const kind = suggestKind(item?.kind)
      const imageUrl = item?.imageUrl ? String(item.imageUrl) : ''
      return { kind, text, imageUrl }
    })
    .filter(Boolean)

  return (
    <div className="rest-search-overlay" role="dialog" aria-modal="true" aria-label="Search">
      <button type="button" className="rest-search-overlay__scrim" aria-label="Close search" onClick={onClose} />
      <div className="rest-search-overlay__panel">
        <form
          className="rest-search-overlay__bar"
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit?.(q)
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
            aria-label="Search restaurants, dishes and cuisines"
            autoFocus
          />
          {q ? (
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
          {!ready ? (
            <p
              className={`rest-search-overlay__status${error ? ' rest-search-overlay__status--err' : ''}`}
            >
              {error || 'Type at least 3 characters for restaurants, dishes, or cuisines'}
            </p>
          ) : error ? (
            <p className="rest-search-overlay__status rest-search-overlay__status--err">{error}</p>
          ) : loading && rows.length === 0 ? (
            <p className="rest-search-overlay__status">Searching…</p>
          ) : rows.length === 0 ? (
            <p className="rest-search-overlay__status">No suggestions for “{q}”</p>
          ) : (
            <ul className="rest-search-overlay__list" aria-label="Suggestions">
              {rows.map((row, index) => (
                <li key={`${row.kind}-${row.text}-${index}`}>
                  <button
                    type="button"
                    className="rest-search-row rest-search-row--suggest"
                    onClick={() => onPickItem?.({ kind: row.kind, text: row.text })}
                  >
                    <div className="rest-search-row__media">
                      {row.imageUrl ? (
                        <img src={row.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="rest-search-row__ph" aria-hidden="true" />
                      )}
                    </div>
                    <div className="rest-search-row__text">
                      <div className="rest-search-row__name">{row.text}</div>
                      <div className="rest-search-row__kind">{kindLabel(row.kind)}</div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {ready ? (
          <button type="button" className="rest-search-overlay__see-all" onClick={() => onSeeAll?.(q)}>
            See all results for '{q}'
          </button>
        ) : null}
      </div>
    </div>
  )
}
