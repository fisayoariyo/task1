import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { Logo } from '../components/Logo'
import { getMenu } from '../lib/api'
import { useCart } from '../lib/cart'
import { IMG, MENU } from '../lib/data'
import { getLocation } from '../lib/location'
import { flattenMenuDto, setMenuItems } from '../lib/menuCache'
import { mapMenuItemFromApi } from '../lib/mappers'

export default function Restaurant() {
  const navigate = useNavigate()
  const { id: routeId } = useParams()
  const restaurantId = routeId || 'royal'
  const { lines, itemTotal, count, addItem, changeQty, clear } = useCart()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [placeLabel, setPlaceLabel] = useState(() => getLocation().label)
  const [restaurantName, setRestaurantName] = useState('Royal Biryani House')
  const [heroImg, setHeroImg] = useState(IMG.biryani)
  const [menuItems, setMenuItemsState] = useState(MENU)
  const [categoryNav, setCategoryNav] = useState([['Recommended', MENU.length]])

  useEffect(() => {
    const { lat, lng, label } = getLocation()
    setPlaceLabel(label)
    let cancelled = false
    ;(async () => {
      try {
        const menuDto = await getMenu(restaurantId, lat, lng)
        if (cancelled) return
        const mapped = flattenMenuDto(menuDto, mapMenuItemFromApi)
        if (mapped.length) {
          setMenuItems(mapped)
          setMenuItemsState(mapped)
          if (menuDto.restaurantName) setRestaurantName(menuDto.restaurantName)
          const firstImg = mapped.find((d) => d.img)?.img
          if (firstImg) setHeroImg(firstImg)
          setCategoryNav(
            (menuDto.categories ?? []).map((c) => [c.name, c.items?.length ?? 0]),
          )
        }
      } catch {
        if (!cancelled) {
          setMenuItemsState(MENU)
          setCategoryNav([['Recommended', MENU.length]])
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [restaurantId])

  const displayMenu = useMemo(() => {
    const rec = menuItems.filter((d) => d.cat === 'Recommended')
    return rec.length ? rec : menuItems
  }, [menuItems])
  const platform = 5
  const grand = count ? itemTotal + platform : 0
  const need = Math.max(0, 199 - itemTotal)

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
              {placeLabel}
              <Icon name="chevronDown" size={14} />
            </button>
            <label className="field" style={{ flex: 1, minHeight: 44 }}>
              <span className="field__icon">
                <Icon name="search" size={18} />
              </span>
              <input type="search" placeholder="Search for restaurants, cuisines or dishes..." aria-label="Search" />
            </label>
          </div>
          <div className="web-header__right">
            <a className="btn btn--outline" href="#">
              Log in
            </a>
            <a className="btn btn--primary" href="#">
              Sign up
            </a>
            <Link className="cart-btn" to="/checkout" aria-label="Cart">
              <Icon name="cart" size={20} />
              <span className="cart-btn__badge">{count}</span>
            </Link>
          </div>
        </header>

        <main className="container" style={{ padding: '0 24px' }}>
          <nav className="breadcrumb">
            <Link to="/">Home</Link> / <Link to="/discovery">Restaurants</Link> / {restaurantName}
          </nav>

          <section className="rest-hero">
            <div className="rest-hero__main">
              <img src={heroImg} alt={restaurantName} />
              <span className="rest-hero__badge">
                <Icon name="star" size={11} /> Bestseller
              </span>
            </div>
            <div className="rest-hero__info">
              <h1>{restaurantName}</h1>
              <p className="rest-hero__cuisines">Biryani • Mughlai • North Indian • Chinese</p>
              <div className="rest-meta">
                <span className="rest-meta__item">
                  <span className="star">
                    <Icon name="star" size={14} />
                  </span>
                  <strong>4.5</strong> (2.8K+ ratings)
                </span>
                <span className="rest-meta__divider" aria-hidden="true" />
                <span className="rest-meta__item">
                  <Icon name="clock" size={14} /> 25–30 mins
                </span>
                <span className="rest-meta__divider" aria-hidden="true" />
                <span className="rest-meta__item">₹199 for two</span>
              </div>
              <div className="rest-tags">
                <span className="rest-tags__item rest-tags__item--delivery">
                  <Icon name="bike" size={14} /> Free delivery on orders ₹199+
                </span>
                <span className="rest-tags__item rest-tags__item--veg">
                  <Icon name="leaf" size={14} /> Pure Veg options
                </span>
                <span className="rest-tags__item rest-tags__item--offer">
                  <Icon name="tag" size={14} /> 20% OFF up to ₹100
                </span>
              </div>
            </div>
            <div className="rest-hero__side">
              <div className="rest-actions">
                <button className="m-icon-btn" type="button" aria-label="Favourite">
                  <Icon name="heart" size={18} />
                </button>
                <button className="m-icon-btn" type="button" aria-label="Share">
                  <Icon name="share" size={18} />
                </button>
              </div>
              <div className="rest-hero__thumbs">
                <div>
                  <img src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80" alt="" />
                </div>
                <div>
                  <img src="https://images.unsplash.com/photo-1630383249896-424e482df921?w=300&q=80" alt="" />
                </div>
                <div>
                  <img src="https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&q=80" alt="" />
                </div>
                <button className="rest-hero__photos" type="button">
                  <Icon name="image" size={18} /> View photos (124)
                </button>
              </div>
            </div>
          </section>

          <nav className="rest-tabs" aria-label="Restaurant sections">
            <a href="#" className="is-active">
              Order Online
            </a>
            <a href="#">Reviews (2.8K+)</a>
            <a href="#">Photos (1.2K+)</a>
            <a href="#">About</a>
          </nav>

          <div className="menu-layout">
            <aside className="menu-nav" aria-label="Menu categories">
              <label className="field">
                <span className="field__icon">
                  <Icon name="search" size={16} />
                </span>
                <input type="search" placeholder="Search for a dish..." aria-label="Search menu" />
              </label>
              {categoryNav.map(([label, n], i) => (
                <button key={label} type="button" className={i === 0 ? 'is-active' : undefined}>
                  {label} <span className="menu-nav__count">{n}</span>
                </button>
              ))}
            </aside>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 4 }}>
                Recommended ({displayMenu.length})
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '.875rem', marginBottom: 8 }}>
                Our chef’s special dishes, loved by customers.
              </p>
              <div>
                {displayMenu.map((d) => (
                  <article key={d.id} className="dish-card">
                    <div className="dish-card__img">
                      <img src={d.img} alt={d.name} loading="lazy" />
                    </div>
                    <div className="dish-card__body">
                      <div className="dish-card__name">
                        {d.veg ? <span className="veg-dot" aria-label="Veg" /> : <span className="nonveg-dot" aria-label="Non-veg" />}
                        {d.name}
                        {d.bestseller ? (
                          <span className="badge" style={{ fontSize: '.625rem' }}>
                            Bestseller
                          </span>
                        ) : null}
                      </div>
                      <p className="dish-card__desc">{d.desc}</p>
                      <div className="dish-card__row">
                        <div className="price-row">
                          <span className="price">₹{d.price}</span>
                          {d.was > d.price ? (
                            <>
                              <span className="price--strike">₹{d.was}</span>
                              <span className="price--off">{d.off}</span>
                            </>
                          ) : null}
                        </div>
                        <button className="btn-add" type="button" onClick={() => addItem(d.id)}>
                          ADD +
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <aside className="cart-panel">
              <div className="cart-box">
                <h3>Your Cart</h3>
                <div className={count ? undefined : 'cart-empty'}>
                  {!count ? (
                    <div className="cart-empty">
                      <div className="cart-empty__art" aria-hidden="true">
                        <Icon name="bag" size={32} />
                      </div>
                      <p>Add items to get started.</p>
                    </div>
                  ) : (
                    <>
                      {lines.map((l) => (
                        <div
                          key={l.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 8,
                            padding: '8px 0',
                            borderBottom: '1px solid var(--color-border)',
                            fontSize: '.8125rem',
                          }}
                        >
                          <span>
                            {l.veg ? <span className="veg-dot" /> : <span className="nonveg-dot" />} {l.name} × {l.qty}
                          </span>
                          <strong>₹{l.price * l.qty}</strong>
                        </div>
                      ))}
                      <p style={{ marginTop: 12, fontWeight: 800 }}>Item total · ₹{itemTotal}</p>
                    </>
                  )}
                </div>
              </div>
              <div className="cart-box delivery-box">
                <h3 style={{ fontSize: '.9375rem' }}>Delivery details</h3>
                <p style={{ fontSize: '.8125rem', marginBottom: 12 }}>
                  {placeLabel}{' '}
                  <a className="btn btn--ghost" href="#" style={{ display: 'inline', padding: 0, minHeight: 'auto' }}>
                    Change
                  </a>
                </p>
                <dl>
                  <div>
                    <dt>Delivery</dt>
                    <dd>25–30 mins</dd>
                  </div>
                  <div>
                    <dt>Minimum order</dt>
                    <dd>₹199</dd>
                  </div>
                  <div>
                    <dt>Delivery fee</dt>
                    <dd>Free on ₹199+</dd>
                  </div>
                </dl>
              </div>
              <button
                className={`btn btn--block btn--lg ${count ? 'btn--primary' : 'btn--disabled'}`}
                type="button"
                disabled={!count}
                onClick={() => navigate('/checkout')}
              >
                View cart | ₹{itemTotal}
              </button>
            </aside>
          </div>
        </main>
      </div>

      <div className="only-mobile m-page m-page--menu" style={{ background: '#fff' }}>
        <header className="m-header m-header--menu">
          <button className="m-icon-btn" type="button" aria-label="Back" onClick={() => navigate('/discovery')}>
            <Icon name="back" size={22} />
          </button>
          <div className="m-header__brand">
            <Logo className="logo--sm" />
          </div>
          <div className="m-header__actions">
            <button className="m-icon-btn" type="button" aria-label="Search">
              <Icon name="search" size={20} />
            </button>
            <button className="m-icon-btn" type="button" aria-label="Wishlist">
              <Icon name="heart" size={20} />
            </button>
            <button className="m-icon-btn" type="button" aria-label="Cart" onClick={() => setSheetOpen(true)}>
              <Icon name="cart" size={20} />
              <span className="m-badge">{count}</span>
            </button>
          </div>
        </header>

        <div className="m-menu-hero">
          <div className="m-menu-hero__top">
            <div className="m-menu-hero__media">
              <img src={heroImg} alt={restaurantName} />
              <span className="m-menu-hero__badge">
                <Icon name="star" size={11} /> Bestseller
              </span>
              <button className="m-menu-hero__fav" type="button" aria-label="Favourite">
                <Icon name="heart" size={16} />
              </button>
              <span className="m-menu-hero__count">1/8</span>
            </div>
            <div className="m-menu-hero__info">
              <h1>{restaurantName}</h1>
              <p className="m-menu-hero__cuisines">Biryani • Mughlai • North Indian</p>
              <div className="m-menu-hero__rating">
                <span className="star">
                  <Icon name="star" size={14} />
                </span>
                <strong>4.5</strong>
                <span>(2.8K+ ratings)</span>
              </div>
              <div className="m-menu-hero__meta">
                <span>
                  <Icon name="clock" size={14} /> 25–30 mins
                </span>
                <span className="m-menu-hero__dot">·</span>
                <span>₹199 for two</span>
              </div>
              <div className="m-menu-hero__chips">
                <span className="m-menu-chip m-menu-chip--delivery">
                  <Icon name="bike" size={12} /> Free delivery
                </span>
                <span className="m-menu-chip m-menu-chip--veg">
                  <Icon name="leaf" size={12} /> Pure Veg
                </span>
              </div>
            </div>
          </div>
        </div>

        <nav className="m-menu-tabs">
          <a href="#" className="is-active">
            Order Online
          </a>
          <a href="#">Reviews (2.8K+)</a>
          <a href="#">Photos (124)</a>
          <a href="#">About</a>
        </nav>

        <div className="m-cat-pills">
          {categoryNav.slice(0, 5).map(([c], i) => (
            <button key={c} type="button" className={i === 0 ? 'is-active' : undefined}>
              {c}
            </button>
          ))}
        </div>

        <div>
          {displayMenu.map((d) => (
            <article key={d.id} className="dish-card">
              <div className="dish-card__img">
                <img src={d.img} alt={d.name} loading="lazy" />
              </div>
              <div className="dish-card__body">
                <div className="dish-card__name">
                  {d.veg ? <span className="veg-dot" /> : <span className="nonveg-dot" />}
                  {d.name}
                </div>
                <p className="dish-card__desc">{d.desc}</p>
                <div className="dish-card__row">
                  <div className="price-row">
                    <span className="price">₹{d.price}</span>
                    {d.was > d.price ? (
                      <>
                        <span className="price--strike">₹{d.was}</span>
                        <span className="price--off">{d.off}</span>
                      </>
                    ) : null}
                  </div>
                  <button className="btn-add" type="button" onClick={() => addItem(d.id)}>
                    ADD +
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {count > 0 ? (
          <button className="m-cart-bar" type="button" onClick={() => setSheetOpen(true)}>
            <span className="m-cart-bar__left">
              <span className="m-cart-bar__icon">
                <Icon name="bag" size={18} />
              </span>
              <span className="m-cart-bar__copy">
                <strong>
                  {count} item{count === 1 ? '' : 's'} | ₹{itemTotal}
                </strong>
                <small>{need ? `Extra ₹${need} for free delivery` : 'Free delivery on this order'}</small>
              </span>
            </span>
            <span className="m-cart-bar__cta">
              View cart <Icon name="chevron" size={16} />
            </span>
          </button>
        ) : null}

        {sheetOpen ? (
          <>
            <div className="sheet-backdrop" onClick={() => setSheetOpen(false)} />
            <div className="sheet" role="dialog" aria-modal="true">
              <div className="sheet__handle" aria-hidden="true" />
              <div className="sheet__head">
                <h2>{count ? `Your cart (${count} items)` : 'Your cart'}</h2>
                <div className="sheet__head-actions">
                  <button className="sheet__clear" type="button" onClick={clear}>
                    Clear cart
                  </button>
                  <button className="m-icon-btn" type="button" aria-label="Close cart" onClick={() => setSheetOpen(false)}>
                    <Icon name="close" size={20} />
                  </button>
                </div>
              </div>
              <div>
                {lines.map((l) => (
                  <div className="cart-line" key={l.id}>
                    <div className="cart-line__img">
                      <img src={l.img} alt="" />
                    </div>
                    <div className="cart-line__main">
                      <div className="cart-line__name">
                        {l.veg ? <span className="veg-dot" /> : <span className="nonveg-dot" />}
                        <span>{l.name}</span>
                      </div>
                      <div className="cart-line__prices">
                        <span className="price--strike">₹{l.was}</span>
                        <span className="price">₹{l.price}</span>
                        <span className="price--off price--off-pill">{l.off}</span>
                      </div>
                      <div className="cart-line__row">
                        <div className="qty qty--sheet">
                          <button type="button" aria-label="Decrease" onClick={() => changeQty(l.id, -1)}>
                            −
                          </button>
                          <span>{l.qty}</span>
                          <button type="button" aria-label="Increase" onClick={() => changeQty(l.id, 1)}>
                            +
                          </button>
                        </div>
                        <strong className="cart-line__sum">₹{l.price * l.qty}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="apply-coupon" type="button">
                Apply coupon
              </button>
              {count ? (
                <div className="bill-rows">
                  <div className="row">
                    <span>Item total ({count} items)</span>
                    <span>₹{itemTotal}</span>
                  </div>
                  <div className="row">
                    <span>
                      Delivery fee <Icon name="info" size={14} />
                    </span>
                    <span>
                      <span className="price--strike">₹40</span> <span className="row--free">FREE</span>
                    </span>
                  </div>
                  <div className="row">
                    <span>
                      Platform fee <Icon name="info" size={14} />
                    </span>
                    <span>₹{platform}</span>
                  </div>
                </div>
              ) : null}
              <div className="grand-bar">
                <span>Grand total</span>
                <span>₹{grand}</span>
              </div>
              <Link className="m-checkout-cta" to="/checkout">
                <span>Proceed to checkout</span>
                <span className="m-checkout-cta__sep" aria-hidden="true" />
                <span>₹{grand} →</span>
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
