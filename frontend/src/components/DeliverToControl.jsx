import { Icon } from './Icon'

/** Editable “Deliver to” control for Discovery / Restaurant headers. */
export function DeliverToControl({
  label,
  onEdit,
  editing = false,
  children = null,
  className = '',
}) {
  if (editing) {
    return <div className={`noon-deliver noon-deliver--editing ${className}`.trim()}>{children}</div>
  }

  return (
    <button
      type="button"
      className={`noon-deliver ${className}`.trim()}
      onClick={onEdit}
      aria-label={`Deliver to ${label}. Edit location.`}
    >
      <span className="noon-deliver__pin" aria-hidden="true">
        <Icon name="pin" size={16} />
      </span>
      <span className="noon-deliver__meta">
        <span className="noon-deliver__eyebrow">Deliver to</span>
        <span className="noon-deliver__label">{label}</span>
      </span>
      <span className="noon-deliver__chev" aria-hidden="true">
        ▾
      </span>
    </button>
  )
}
