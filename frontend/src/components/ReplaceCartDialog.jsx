import { useEffect } from 'react'

/**
 * Shown when ADD is pressed while the cart already has items from another restaurant.
 * NO → keep existing cart. YES, START AFRESH → caller clears & adds.
 */
export function ReplaceCartDialog({ open, onNo, onYes }) {
  useEffect(() => {
    if (!open) return undefined
    function onKey(e) {
      if (e.key === 'Escape') onNo?.()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onNo])

  if (!open) return null

  return (
    <div className="replace-cart" role="presentation">
      <button
        type="button"
        className="replace-cart__backdrop"
        aria-label="Dismiss"
        onClick={onNo}
      />
      <div
        className="replace-cart__dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="replace-cart-title"
        aria-describedby="replace-cart-desc"
      >
        <h2 id="replace-cart-title" className="replace-cart__title">
          Items already in cart
        </h2>
        <p id="replace-cart-desc" className="replace-cart__body">
          Your cart contains items from other restaurant. Would you like to reset your cart for
          adding items from this restaurant?
        </p>
        <div className="replace-cart__actions">
          <button type="button" className="replace-cart__no" onClick={onNo}>
            NO
          </button>
          <button type="button" className="replace-cart__yes" onClick={onYes}>
            YES, START AFRESH
          </button>
        </div>
      </div>
    </div>
  )
}
