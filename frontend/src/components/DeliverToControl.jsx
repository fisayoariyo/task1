import { Icon } from './Icon'

/** Editable “Deliver to” control for Discovery / Restaurant headers. */
export function DeliverToControl({
  label,
  onEdit,
  editing = false,
  children = null,
  className = '',
  variant = 'default',
}) {
  if (editing) {
    return (
      <div
        className={`noon-deliver noon-deliver--editing ${variant === 'sidebar' ? 'noon-deliver--sidebar' : ''} ${className}`.trim()}
      >
        {children}
      </div>
    )
  }

  const isSidebar = variant === 'sidebar'

  return (
    <button
      type="button"
      className={`noon-deliver ${isSidebar ? 'noon-deliver--sidebar' : ''} ${className}`.trim()}
      onClick={onEdit}
      aria-label={`Deliver to ${label}. Edit location.`}
    >
      <span className="noon-deliver__pin" aria-hidden="true">
        <Icon name="pin" size={16} />
      </span>
      {isSidebar ? (
        <span className="noon-deliver__meta noon-deliver__meta--inline">
          <span className="noon-deliver__eyebrow">Deliver to:</span>{' '}
          <span className="noon-deliver__label">{label || 'Add address'}</span>
        </span>
      ) : (
        <span className="noon-deliver__meta">
          <span className="noon-deliver__eyebrow">Deliver to</span>
          <span className="noon-deliver__label">{label}</span>
        </span>
      )}
      <span className="noon-deliver__edit" aria-hidden="true">
        {isSidebar ? <Icon name="edit" size={15} /> : '▾'}
      </span>
    </button>
  )
}
