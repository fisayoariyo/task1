import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from './Icon'
import { IMG } from '../lib/data'
import { isWishlisted } from '../lib/wishlist'

function offerShort(offer) {
  const s = String(offer || '')
  return s.length > 28 ? `${s.slice(0, 26)}…` : s
}

/** Grey shimmer shell matching RestaurantCard layout while list API is in flight. */
export function RestaurantCardShell() {
  return (
    <div className="noon-r-card noon-r-card--shell" aria-hidden="true">
      <div className="noon-r-card__media noon-r-card__media--shell" />
      <div className="noon-r-card__body">
        <div className="noon-r-card__shell-line noon-r-card__shell-line--title" />
        <div className="noon-r-card__shell-line noon-r-card__shell-line--sub" />
        <div className="noon-r-card__shell-line noon-r-card__shell-line--fee" />
      </div>
    </div>
  )
}

/** Noon chrome + Swiggy/TataEats fields (real ₹ cost for two — not Noon $$$$ tier). */
export function RestaurantCard({ restaurant: r, wishTick = 0, onWish }) {
  const imgRef = useRef(null)
  const [imgReady, setImgReady] = useState(false)
  const timeLabel = r.time && r.time !== '—' ? String(r.time).replace(/\bmin\b/, 'mins') : ''
  const costLabel = r.cost || (r.costForTwo > 0 ? `₹${Math.round(r.costForTwo)} for two` : '')

  useEffect(() => {
    setImgReady(false)
    const img = imgRef.current
    if (img?.complete && img.naturalWidth > 0) setImgReady(true)
  }, [r.img])

  return (
    <Link className="noon-r-card" to={`/restaurant/${r.id}`}>
      <div className="noon-r-card__media">
        <img
          ref={imgRef}
          src={r.img}
          alt={r.name}
          loading="lazy"
          className={imgReady ? 'is-loaded' : ''}
          onLoad={() => setImgReady(true)}
          onError={(e) => {
            e.currentTarget.onerror = null
            e.currentTarget.src = IMG.biryani
          }}
        />
        {r.offer ? (
          <span className="noon-r-card__offer">
            <Icon name="tag" size={11} />
            {offerShort(r.offer)}
          </span>
        ) : null}
        {timeLabel ? <span className="noon-r-card__eta">{timeLabel}</span> : null}
        {onWish ? (
          <button
            type="button"
            className="noon-r-card__wish"
            aria-label={isWishlisted(r.id) ? 'Remove from wishlist' : 'Save to wishlist'}
            onClick={(e) => onWish(r, e)}
            data-tick={wishTick}
          >
            <Icon name="heart" size={14} />
          </button>
        ) : null}
      </div>
      <div className="noon-r-card__body">
        <div className="noon-r-card__title-row">
          <div className="noon-r-card__name">{r.name}</div>
          {r.rating ? (
            <div
              className="noon-r-card__rating"
              title={r.ratings ? `${r.rating} (${r.ratings})` : String(r.rating)}
            >
              <Icon name="thumbsUp" size={13} />
              <span className="noon-r-card__rating-value">{r.rating}</span>
              {r.ratings ? (
                <span className="noon-r-card__rating-count">({r.ratings})</span>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="noon-r-card__sub-row">
          <div className="noon-r-card__cuisines">{r.cuisines}</div>
          {costLabel ? <div className="noon-r-card__cost">{costLabel}</div> : null}
        </div>
        {r.promo ? <div className="noon-r-card__fee">{r.promo}</div> : null}
      </div>
    </Link>
  )
}
