import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { Logo } from '../components/Logo'
import { DISCOVERY_CATS, MOBILE_CATS, RESTAURANTS } from '../lib/data'
import { useCart } from '../lib/cart'

const filters = [
  { label: 'Filters', ic: 'filter' },
  { label: 'Sort: Recommended', ic: 'chevronDown' },
  { label: 'Offers', ic: 'percent' },
  { label: 'Rating 4.0+', ic: 'star' },
  { label: 'Pure Veg', ic: 'leaf' },
  { label: 'Fast delivery', ic: 'bolt' },
  { label: 'Price', ic: 'chevronDown' },
]

const mFilters = [
  { label: 'Filters', ic: 'settings2', color: 'chip--filters' },
  { label: 'Rating 4.0+', ic: 'star', color: 'chip--star' },
  { label: 'Offers', ic: 'percent', color: 'chip--offer' },
  { label: 'Pure Veg', ic: 'leaf', color: 'chip--veg' },
  { label: 'Fast Delivery', ic: 'clock', color: 'chip--fast' },
]

function offerShort(o) {
  if (/^\d+%\s*OFF/i.test(o)) return o.replace(/\s+up to.*/i, '').trim()
  return o
}

export default function Discovery() {
  const { count } = useCart()

  return (
    <div style={{ background: 'var(--color-bg)' }}>
      <div className="only-desktop">
        <div className="promo-bar">
          <Icon name="gift" size={18} />
          Welcome treat! Get ₹50 off your first order.
        </div>

        <header className="web-header">
          <Logo />
          <div className="web-header__center">
            <button className="location-pill" type="button">
              <span className="pin">
                <Icon name="pin" size={16} />
              </span>
              Delivering to Koramangala, Bengaluru
              <Icon name="chevronDown" size={14} />
            </button>
            <label className="field" style={{ flex: 1, minHeight: 44 }}>
              <span className="field__icon">
                <Icon name="search" size={18} />
              </span>
              <input type="search" placeholder="Search for restaurants, cuisines or dishes" aria-label="Search" />
            </label>
          </div>
          <div className="web-header__right">
            <a className="btn btn--outline" href="#">
              Log in
            </a>
            <a className="btn btn--primary" href="#">
              Sign up
            </a>
            <Link className="cart-btn" to="/restaurant" aria-label="Cart">
              <Icon name="cart" size={20} />
              <span className="cart-btn__badge">{count}</span>
            </Link>
          </div>
        </header>

        <main className="container" style={{ padding: '0 24px' }}>
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link> / Bengaluru / Restaurants
          </nav>

          <div className="discovery-head">
            <div>
              <h1>Restaurants near you</h1>
              <p>Discover great food for every craving.</p>
            </div>
            <button className="location-pill" type="button">
              <span className="pin">
                <Icon name="pin" size={16} />
              </span>
              Koramangala, Bengaluru
              <a className="btn btn--ghost" href="#">
                Change
              </a>
            </button>
          </div>

          <div className="cat-scroll" role="list">
            {DISCOVERY_CATS.map((c, i) => (
              <button key={c.name} className={`cat-item ${i === 0 ? 'is-active' : ''}`} type="button" role="listitem">
                <div className="cat-item__circle">
                  {c.icon ? <Icon name="grid" size={28} /> : <img src={c.img} alt="" loading="lazy" />}
                </div>
                <span>{c.name}</span>
              </button>
            ))}
          </div>

          <div className="filters-row">
            {filters.map((f) => (
              <button key={f.label} className="chip" type="button">
                <Icon name={f.ic} size={14} /> {f.label}
              </button>
            ))}
          </div>

          <div className="restaurant-grid">
            {RESTAURANTS.map((r) => (
              <Link key={r.id} className="r-card" to="/restaurant">
                <div className="r-card__img">
                  <img src={r.img} alt={r.name} loading="lazy" />
                  <span className="badge r-card__offer">{r.offer}</span>
                  <span className="r-card__wish" aria-hidden="true">
                    <Icon name="heart" size={14} />
                  </span>
                </div>
                <div className="r-card__body">
                  <div className="r-card__top">
                    <div className="r-card__name">{r.name}</div>
                    <div className="r-card__rating">
                      <span className="star">
                        <Icon name="star" size={12} />
                      </span>{' '}
                      {r.rating}
                    </div>
                  </div>
                  <div className="r-card__meta">
                    <Icon name="clock" size={12} /> {r.time}
                  </div>
                  <div className="r-card__cuisines">{r.cuisines.replace(/•/g, ',')}</div>
                  <div className="r-card__foot">
                    <span>
                      <Icon name="bike" size={14} /> {r.promo}
                    </span>
                    {r.tag ? <span className={`r-card__tag r-card__tag--${r.tagType}`}>{r.tag}</span> : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="pagination">
            <div className="pagination__pages">
              <button type="button" aria-label="Previous">
                ‹
              </button>
              <button type="button" className="is-active">
                1
              </button>
              <button type="button">2</button>
              <button type="button">3</button>
              <button type="button">4</button>
              <button type="button">5</button>
              <button type="button" aria-label="Next">
                ›
              </button>
            </div>
            <span className="pagination__info">Showing 1–8 of 240 restaurants</span>
          </div>
        </main>
      </div>

      <div className="only-mobile m-page m-page--discovery">
        <header className="m-header">
          <Logo className="logo--sm" />
          <div className="m-header__actions">
            <button className="m-icon-btn" type="button" aria-label="Wishlist">
              <Icon name="heart" size={22} />
            </button>
            <Link className="m-icon-btn" to="/restaurant" aria-label="Cart">
              <Icon name="cart" size={22} />
              <span className="m-badge">{count}</span>
            </Link>
          </div>
        </header>

        <div className="m-loc-row">
          <div className="m-loc-row__left">
            <Icon name="pin" size={16} />
            <span>Koramangala, Bengaluru</span>
            <Icon name="chevronDown" size={14} />
          </div>
          <a className="m-change" href="#">
            Change
          </a>
        </div>

        <div className="m-search-wrap">
          <label className="field m-search-field">
            <span className="field__icon">
              <Icon name="search" size={18} />
            </span>
            <input type="search" placeholder="Search for restaurants, cuisines or dishes" aria-label="Search" />
          </label>
        </div>

        <div className="cat-scroll m-cat-scroll">
          {MOBILE_CATS.map((c, i) => (
            <button
              key={c.name}
              className={`cat-item ${i === 0 ? 'is-active' : ''} ${c.icon ? 'cat-item--all' : ''}`}
              type="button"
            >
              <div className="cat-item__shape">
                {c.icon ? <Icon name="grid" size={18} /> : <img src={c.img} alt="" loading="lazy" />}
              </div>
              <span>{c.name}</span>
            </button>
          ))}
        </div>

        <div className="m-filters">
          {mFilters.map((f) => (
            <button key={f.label} className={`chip m-filter-chip ${f.color}`} type="button">
              <Icon name={f.ic} size={14} /> {f.label}
            </button>
          ))}
        </div>

        <div className="m-list-head">
          <h2>Restaurants near you</h2>
          <span>240 restaurants</span>
        </div>

        <div>
          {RESTAURANTS.slice(0, 5).map((r) => (
            <Link key={r.id} className="m-r-card" to="/restaurant">
              <div className="m-r-card__img">
                <img src={r.img} alt={r.name} loading="lazy" />
                <span className="badge m-r-card__offer">{offerShort(r.offer)}</span>
                <span className="m-r-card__wish">
                  <Icon name="heart" size={14} />
                </span>
              </div>
              <div className="m-r-card__body">
                <div className="m-r-card__name">{r.name}</div>
                <div className="m-r-card__rating">
                  <span className="star">
                    <Icon name="star" size={12} />
                  </span>
                  {r.rating}
                  <span className="m-r-card__reviews">({r.ratings})</span>
                </div>
                <div className="m-r-card__meta">
                  <Icon name="clock" size={12} /> {r.time} · {r.cost}
                </div>
                <div className="m-r-card__cuisines">{r.cuisines}</div>
                <div className="m-r-card__foot">
                  <span className="m-r-card__promo">
                    <Icon name="bike" size={13} /> {r.promo}
                  </span>
                  {r.tag ? (
                    <span className={`r-card__tag r-card__tag--${r.tagType}`}>
                      {r.tagType === 'veg' ? <Icon name="leaf" size={10} /> : null}
                      {r.tagType === 'best' ? <Icon name="bolt" size={10} /> : null} {r.tag}
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <nav className="mobile-tabbar" aria-label="Primary">
          <Link to="/discovery" className="is-active">
            <Icon name="store" size={20} />
            <span>Restaurants</span>
          </Link>
          <a href="#">
            <Icon name="bag" size={20} />
            <span>Offers</span>
          </a>
          <a href="#">
            <Icon name="clipboardList" size={20} />
            <span>Orders</span>
          </a>
          <a href="#">
            <Icon name="user" size={20} />
            <span>Account</span>
          </a>
        </nav>
      </div>
    </div>
  )
}
