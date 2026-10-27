/** Swiggy-style: bold short title + muted secondary line (never one mega-string). */
function splitSuggestionLines(s) {
  const main = String(s.mainText || '').trim()
  const secondary = String(s.secondaryText || '').trim()
  const full = String(s.description || '').trim()

  if (main) {
    let sub = secondary
    if (!sub && full) {
      const stripped = full.startsWith(main)
        ? full.slice(main.length).replace(/^,\s*/, '')
        : full
      sub = stripped && stripped !== main ? stripped : ''
    }
    return { title: main, subtitle: sub || null }
  }

  if (!full) return { title: 'Unknown place', subtitle: null }
  const parts = full.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length <= 1) return { title: full, subtitle: null }
  return { title: parts[0], subtitle: parts.slice(1).join(', ') }
}

export function PlaceSuggestList({ suggestions, onSelect, loading, emptyHint }) {
  if (loading) {
    return (
      <div
        className="place-suggest place-suggest--status"
        role="status"
        style={{ ...panelStyle, padding: '12px 14px', color: '#686b78' }}
      >
        Searching addresses…
      </div>
    )
  }

  if (!suggestions?.length) {
    if (!emptyHint) return null
    return (
      <div
        className="place-suggest place-suggest--status"
        role="status"
        style={{ ...panelStyle, padding: '12px 14px', color: '#686b78' }}
      >
        {emptyHint}
      </div>
    )
  }

  return (
    <ul className="place-suggest" role="listbox" style={panelStyle}>
      {suggestions.map((s) => {
        const { title, subtitle } = splitSuggestionLines(s)
        return (
          <li key={s.placeId} role="option">
            <button
              type="button"
              className="place-suggest__btn"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelect(s)}
            >
              <span className="place-suggest__pin" aria-hidden="true">
                ⌖
              </span>
              <span className="place-suggest__text">
                <span className="place-suggest__main">{title}</span>
                {subtitle ? <span className="place-suggest__sub">{subtitle}</span> : null}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

const panelStyle = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: '100%',
  margin: 0,
  padding: 0,
  listStyle: 'none',
  background: '#fff',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  boxShadow: '0 8px 24px rgba(0,0,0,.08)',
  zIndex: 40,
  maxHeight: 280,
  overflow: 'auto',
}
