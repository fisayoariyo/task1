export function PlaceSuggestList({ suggestions, onSelect }) {
  if (!suggestions?.length) return null
  return (
    <ul
      className="place-suggest"
      role="listbox"
      style={{
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
        zIndex: 20,
        maxHeight: 240,
        overflow: 'auto',
      }}
    >
      {suggestions.map((s) => (
        <li key={s.placeId} role="option">
          <button
            type="button"
            onClick={() => onSelect(s)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '10px 14px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              font: 'inherit',
            }}
          >
            {s.description}
          </button>
        </li>
      ))}
    </ul>
  )
}
