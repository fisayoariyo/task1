import { Link } from 'react-router-dom'
import { Icon } from './Icon'
import { IMG } from '../lib/data'
import { isWishlisted } from '../lib/wishlist'

function offerShort(offer) {
  const s = String(offer || '')
  return s.length > 28 ? `${s.slice(0, 26)}…` : s
}

/** Noon-like restaurant card — TataEats mapped fields only. */
export function RestaurantCard({ restaurant: r, wishTick = 0, onWish }) {
  return (
    <Link className="noon-r-card" to={`/restaurant/${r.id}`}>
      <div className="noon-r-card__media">
        <img
          src={r.img}
          alt={r.name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null
            e.currentTarget.src = IMG.biryani
          }}
        />
        {r.offer ? <span className="noon-r-card__offer">{offerShort(r.offer)}</span> : null}
        {onWish ? (
          <button
            type="button"
            className="r-card__wish"
            aria-label={isWishlisted(r.id) ? 'Remove from wishlist' : 'Save to wishlist'}
            onClick={(e) => onWish(r, e)}
            style={{
              position: 'absolute',
              right: 8,
              top: 8,
              border: 'none',
              cursor: 'pointer',
              background: 'rgba(255,255,255,.92)',
              borderRadius: '999px',
              width: 32,
              height: 32,
              display: 'grid',
              placeItems: 'center',
              color: isWishlisted(r.id) ? 'var(--color-primary)' : 'var(--color-text-muted)',
            }}
            data-tick={wishTick}
          >
            <Icon name="heart" size={14} />
          </button>
        ) : null}
      </div>
      <div className="noon-r-card__body">
        <div className="noon-r-card__name">{r.name}</div>
        <div className="noon-r-card__rating">
          <Icon name="star" size={12} /> {r.rating}
          {r.ratings ? <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}> ({r.ratings})</span> : null}
        </div>
        <div className="noon-r-card__cuisines">{r.cuisines}</div>
        <div className="noon-r-card__meta">
          <span>
            <Icon name="clock" size={12} /> {r.time}
          </span>
          <span className="noon-r-card__fee">{r.promo}</span>
        </div>
      </div>
    </Link>
  )
}
