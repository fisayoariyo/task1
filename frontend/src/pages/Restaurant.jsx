import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AuthButtons } from '../components/AuthButtons'
import { CustomiseModal } from '../components/CustomiseModal'
import { DeliverToControl } from '../components/DeliverToControl'
import { Icon } from '../components/Icon'
import { Logo } from '../components/Logo'
import { MenuItemRow } from '../components/MenuItemRow'
import { ReplaceCartDialog } from '../components/ReplaceCartDialog'
import { getMenu } from '../lib/api'
import { menuCacheKey, peekHttpCache } from '../lib/httpCache'
import { useCart } from '../lib/cart'
import { IMG } from '../lib/data'
import { getLocation, shortPlaceLabel } from '../lib/location'
import { flattenMenuDto, setMenuItems } from '../lib/menuCache'
import { mapMenuItemFromApi } from '../lib/mappers'
import { isWishlisted, shareRestaurant, toggleWishlist } from '../lib/wishlist'

function isLiveRestaurantId(id) {
  return /^\d+$/.test(String(id ?? '').trim())
}

/** Product rules for cart / delivery chrome (not from Swiggy). */
const MIN_ORDER = 199
const DELIVERY_ETA = '25–30 mins'
/** Progressive reveal batch for smart scroll on long menus. */
const DISH_BATCH = 10

function MiniSwitch({ on }) {
  return (
    <span className={`menu-switch ${on ? 'is-on' : ''}`} aria-hidden="true">
      <span className="menu-switch__knob" />
    </span>
  )
}

function MenuFilterBar({
  dishQuery,
  onQueryChange,
  filterVeg,
  filterNonVeg,
  filterBestseller,
  onToggleVeg,
  onToggleNonVeg,
  onToggleBestseller,
  hasVeg,
  hasNonVeg,
  hasBestseller,
}) {
  const q = dishQuery.trim()
  return (
    <div className="menu-filter-bar">
      <label className="menu-filter-bar__search">
        <input
          type="search"
          placeholder="Search for dishes"
          aria-label="Search for dishes"
          value={dishQuery}
          onChange={(e) => onQueryChange(e.target.value)}
          autoComplete="off"
        />
        {q ? (
          <button
            type="button"
            className="menu-filter-bar__clear"
            aria-label="Clear dish search"
            onClick={() => onQueryChange('')}
          >
            <Icon name="close" size={16} />
          </button>
        ) : (
          <span className="menu-filter-bar__search-icon" aria-hidden="true">
            <Icon name="search" size={18} />
          </span>
        )}
      </label>
      <div className="menu-filter-bar__chips" role="group" aria-label="Dish filters">
        <button
          type="button"
          className={`menu-diet-chip menu-diet-chip--veg ${filterVeg ? 'is-active' : ''}`}
          aria-pressed={filterVeg}
          disabled={!hasVeg && !filterVeg}
          title={!hasVeg ? 'No veg dishes on this menu' : 'Show vegetarian dishes'}
          onClick={onToggleVeg}
        >
          <span className="veg-dot" aria-hidden="true" />
          <MiniSwitch on={filterVeg} />
          <span className="sr-only">Veg</span>
        </button>
        <button
          type="button"
          className={`menu-diet-chip menu-diet-chip--nonveg ${filterNonVeg ? 'is-active' : ''}`}
          aria-pressed={filterNonVeg}
          disabled={!hasNonVeg && !filterNonVeg}
          title={!hasNonVeg ? 'No non-veg dishes on this menu' : 'Show non-vegetarian dishes'}
          onClick={onToggleNonVeg}
        >
          <span className="nonveg-dot" aria-hidden="true" />
          <MiniSwitch on={filterNonVeg} />
          <span className="sr-only">Non-veg</span>
        </button>
        <button
          type="button"
          className={`menu-bestseller-chip ${filterBestseller ? 'is-active' : ''}`}
          aria-pressed={filterBestseller}
          disabled={!hasBestseller && !filterBestseller}
          title={!hasBestseller ? 'No bestsellers on this menu' : 'Bestsellers only'}
          onClick={onToggleBestseller}
        >
          Bestseller
        </button>
      </div>
    </div>
  )
}

/** Open/closes + outlet + delivery ETA — chevrons open real panels. */
function RestaurantHoursBlock({
  isOpen,
  closesAt,
  outletName,
  etaLabel,
  openingHours = [],
  address,
  city,
  locality,
  distance,
}) {
  const open = isOpen !== false
  const [panel, setPanel] = useState(null) // 'hours' | 'outlet' | null
  const rootRef = useRef(null)

  useEffect(() => {
    if (!panel) return undefined
    function onPointerDown(e) {
      if (rootRef.current?.contains(e.target)) return
      setPanel(null)
    }
    function onKey(e) {
      if (e.key === 'Escape') setPanel(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [panel])

  function toggle(next) {
    setPanel((cur) => (cur === next ? null : next))
  }

  const hoursRows =
    openingHours?.length > 0
      ? openingHours
      : [
          {
            day: 'Today',
            time: open
              ? closesAt
                ? `Open now · Closes ${closesAt}`
                : 'Open now'
              : closesAt
                ? `Closed · Opens ${closesAt}`
                : 'Closed',
            isToday: true,
          },
        ]

  return (
    <div className="rest-hours" ref={rootRef}>
      <div className="rest-hours__status-wrap">
        <button
          type="button"
          className={`rest-hours__status ${panel === 'hours' ? 'is-open' : ''}`}
          aria-expanded={panel === 'hours'}
          aria-controls="rest-hours-panel"
          onClick={() => toggle('hours')}
        >
          <span className={open ? 'rest-hours__open' : 'rest-hours__closed'}>
            {open ? 'Open now' : 'Closed'}
          </span>
          {closesAt ? (
            <>
              <span className="rest-hours__sep" aria-hidden="true">
                •
              </span>
              <span className="rest-hours__closes">
                {open ? `Closes ${closesAt}` : `Opens ${closesAt}`}
              </span>
            </>
          ) : null}
          <Icon name="chevronDown" size={14} />
        </button>
        {panel === 'hours' ? (
          <div id="rest-hours-panel" className="rest-hours__panel" role="region" aria-label="Opening hours">
            <p className="rest-hours__panel-title">Opening hours</p>
            <ul className="rest-hours__days">
              {hoursRows.map((row) => (
                <li
                  key={`${row.day}-${row.time}`}
                  className={row.isToday ? 'is-today' : undefined}
                >
                  <span>{row.day}</span>
                  <span>{row.time}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="rest-hours__route">
        <div className="rest-hours__rail" aria-hidden="true">
          <span className="rest-hours__dot" />
          <span className="rest-hours__line" />
          <span className="rest-hours__dot rest-hours__dot--end" />
        </div>
        <div className="rest-hours__route-text">
          <div className="rest-hours__outlet-wrap">
            <button
              type="button"
              className={`rest-hours__outlet ${panel === 'outlet' ? 'is-open' : ''}`}
              aria-expanded={panel === 'outlet'}
              aria-controls="rest-outlet-panel"
              onClick={() => toggle('outlet')}
            >
              <span className="rest-hours__outlet-label">Outlet</span>{' '}
              <strong>{outletName}</strong>
              <Icon name="chevronDown" size={14} />
            </button>
            {panel === 'outlet' ? (
              <div
                id="rest-outlet-panel"
                className="rest-hours__panel rest-hours__panel--outlet"
                role="region"
                aria-label="Outlet details"
              >
                <p className="rest-hours__panel-title">This outlet</p>
                <dl className="rest-hours__outlet-meta">
                  <div>
                    <dt>Area</dt>
                    <dd>{outletName}</dd>
                  </div>
                  {locality && locality !== outletName ? (
                    <div>
                      <dt>Locality</dt>
                      <dd>{locality}</dd>
                    </div>
                  ) : null}
                  {city ? (
                    <div>
                      <dt>City</dt>
                      <dd>{city}</dd>
                    </div>
                  ) : null}
                  {address ? (
                    <div>
                      <dt>Address</dt>
                      <dd>{address}</dd>
                    </div>
                  ) : null}
                  {distance ? (
                    <div>
                      <dt>Distance</dt>
                      <dd>{distance}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt>Delivery</dt>
                    <dd>{etaLabel}</dd>
                  </div>
                </dl>
                {!address ? (
                  <p className="rest-hours__panel-note">
                    Full street address isn’t in this menu feed for every restaurant.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
          <p className="rest-hours__eta">{etaLabel}</p>
        </div>
      </div>
    </div>
  )
}

function DishList({ items, totalCount, onAdd, sentinelRef, hasMore }) {
  if (!items.length) {
    return (
      <p style={{ color: 'var(--color-text-muted)', padding: '16px 0' }}>
        No dishes match your filters.
      </p>
    )
  }
  return (
    <>
      <div className="noon-menu-grid">
        {items.map((d) => (
          <MenuItemRow
            key={`${d.catId}-${d.id}`}
            id={`dish-${d.catId}-${d.id}`}
            dish={d}
            onAdd={onAdd}
          />
        ))}
      </div>
      <div className="menu-infinite" aria-live="polite">
        <div className="menu-infinite__sentinel" ref={sentinelRef} aria-hidden="true" />
        {hasMore ? (
          <p className="menu-infinite__status menu-infinite__status--hint">Scroll for more</p>
        ) : totalCount > DISH_BATCH ? (
          <p className="menu-infinite__status">
            Showing all {totalCount} dish{totalCount === 1 ? '' : 'es'}
          </p>
        ) : null}
      </div>
    </>
  )
}

export default function Restaurant() {
  const navigate = useNavigate()
  const { id: routeId } = useParams()
  const restaurantId = String(routeId ?? '').trim()
  const liveId = isLiveRestaurantId(restaurantId)
  const {
    lines,
    itemTotal,
    count,
    addItem,
    addCustomisedItem,
    replaceCartWithItem,
    changeQty,
    clear,
    restaurantId: cartRestaurantId,
  } = useCart()
  const [customiseDish, setCustomiseDish] = useState(null)
  /** Pending add blocked by another restaurant’s cart: { kind, payload } */
  const [replacePrompt, setReplacePrompt] = useState(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [placeLabel, setPlaceLabel] = useState(() => getLocation().label)
  const [restaurantName, setRestaurantName] = useState('Loading…')
  const [heroImg, setHeroImg] = useState(IMG.biryani)
  const [about, setAbout] = useState(null)
  const [menuItems, setMenuItemsState] = useState([])
  const [categoryNav, setCategoryNav] = useState([])
  const [menuError, setMenuError] = useState(null)
  const [menuLoading, setMenuLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('order')
  const [dishQuery, setDishQuery] = useState('')
  const [filterVeg, setFilterVeg] = useState(false)
  const [filterNonVeg, setFilterNonVeg] = useState(false)
  const [filterBestseller, setFilterBestseller] = useState(false)
  const [visibleCount, setVisibleCount] = useState(DISH_BATCH)
  const [activeCatId, setActiveCatId] = useState(null)
  const [fav, setFav] = useState(() => isWishlisted(restaurantId))
  const [shareNote, setShareNote] = useState('')
  const desktopDishSentinelRef = useRef(null)
  const mobileDishSentinelRef = useRef(null)

  useEffect(() => {
    setFav(isWishlisted(restaurantId))
  }, [restaurantId])

  useEffect(() => {
    const { lat, lng, label } = getLocation()
    setPlaceLabel(label)
    setMenuError(null)
    setActiveTab('order')
    setDishQuery('')
    setFilterVeg(false)
    setFilterNonVeg(false)
    setFilterBestseller(false)
    setVisibleCount(DISH_BATCH)
    setActiveCatId(null)

    if (!liveId) {
      setRestaurantName(restaurantId ? `Unknown restaurant` : 'No restaurant selected')
      setMenuError(
        restaurantId
          ? 'This restaurant link isn’t valid. Go back and pick one from the list near you.'
          : 'Pick a restaurant from the list near you.',
      )
      setMenuItemsState([])
      setCategoryNav([])
      setAbout(null)
      setMenuLoading(false)
      return undefined
    }

    function applyMenu(menuDto) {
      const mapped = flattenMenuDto(menuDto, mapMenuItemFromApi)
      if (!mapped.length) {
        setMenuItemsState([])
        setCategoryNav([])
        setRestaurantName(menuDto.restaurantName || `Restaurant ${restaurantId}`)
        setAbout(menuDto.about || null)
        setMenuError('This restaurant has no dishes available to order right now.')
        setMenuLoading(false)
        return
      }
      setMenuItems(mapped)
      setMenuItemsState(mapped)
      setRestaurantName(menuDto.restaurantName || `Restaurant ${restaurantId}`)
      setAbout(menuDto.about || null)
      setMenuError(null)
      const hero = menuDto.about?.imageUrl || mapped.find((d) => d.img)?.img
      if (hero) setHeroImg(hero)
      const cats = (menuDto.categories ?? []).map((c, id) => ({
        id,
        name: c.name,
        count: c.items?.length ?? 0,
      }))
      setCategoryNav(cats)
      setActiveCatId(cats[0]?.id ?? null)
      setMenuLoading(false)
    }

    const cached = peekHttpCache(menuCacheKey(restaurantId))
    if (cached) {
      applyMenu(cached)
      return undefined
    }

    setMenuLoading(true)
    setRestaurantName('Loading…')
    setMenuItemsState([])
    setCategoryNav([])
    setAbout(null)
    setHeroImg(IMG.biryani)

    let cancelled = false
    ;(async () => {
      try {
        const menuDto = await getMenu(restaurantId, lat, lng)
        if (cancelled) return
        applyMenu(menuDto)
      } catch {
        if (!cancelled) {
          setMenuItemsState([])
          setCategoryNav([])
          setRestaurantName(`Restaurant ${restaurantId}`)
          setMenuError(
            'We couldn’t load this menu right now. Please go back and try another restaurant.',
          )
          setMenuLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [restaurantId, liveId])

  const activeCatName =
    categoryNav.find((c) => c.id === activeCatId)?.name || ''

  const filteredDishes = useMemo(() => {
    const q = dishQuery.trim().toLowerCase()
    let list = menuItems
    // Searching spans the whole menu; otherwise stay on the active category.
    if (!q && activeCatId != null) {
      list = list.filter((d) => d.catId === activeCatId)
    }
    if (q) {
      list = list.filter((d) => {
        const hay = `${d.name} ${d.desc || ''} ${d.cat || ''}`.toLowerCase()
        return hay.includes(q)
      })
    }
    // Both off or both on → no diet restriction; one on → that diet only.
    if (filterVeg !== filterNonVeg) {
      list = list.filter((d) => (filterVeg ? d.veg : !d.veg))
    }
    if (filterBestseller) {
      list = list.filter((d) => d.bestseller)
    }
    return list
  }, [menuItems, activeCatId, dishQuery, filterVeg, filterNonVeg, filterBestseller])

  const visibleDishes = useMemo(
    () => filteredDishes.slice(0, visibleCount),
    [filteredDishes, visibleCount],
  )
  const hasMoreDishes = visibleCount < filteredDishes.length

  useEffect(() => {
    setVisibleCount(DISH_BATCH)
  }, [dishQuery, activeCatId, filterVeg, filterNonVeg, filterBestseller, restaurantId])

  const loadMoreDishes = useCallback(() => {
    setVisibleCount((n) => Math.min(n + DISH_BATCH, filteredDishes.length))
  }, [filteredDishes.length])

  useEffect(() => {
    if (!hasMoreDishes) return undefined
    const nodes = [desktopDishSentinelRef.current, mobileDishSentinelRef.current].filter(
      Boolean,
    )
    if (!nodes.length) return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMoreDishes()
      },
      { root: null, rootMargin: '280px 0px', threshold: 0 },
    )
    nodes.forEach((n) => observer.observe(n))
    return () => observer.disconnect()
  }, [hasMoreDishes, loadMoreDishes, visibleDishes.length])

  const galleryImgs = useMemo(() => {
    const seen = new Set()
    const out = []
    for (const d of menuItems) {
      if (!d.img || seen.has(d.img)) continue
      seen.add(d.img)
      out.push(d.img)
    }
    if (heroImg && !seen.has(heroImg)) out.unshift(heroImg)
    return out
  }, [menuItems, heroImg])

  const thumbImgs = galleryImgs.slice(0, 3)
  const photoCount = galleryImgs.length

  const cuisineLine =
    about?.cuisines?.replace(/,\s*/g, ' • ') ||
    (categoryNav.length ? `${categoryNav.length} menu sections · ${menuItems.length} items` : 'Live menu')

  const cityBreadcrumb =
    about?.city || shortPlaceLabel(placeLabel, 1) || 'Your area'
  const deliveryShort = shortPlaceLabel(placeLabel, 2)
  const hasVegOptions = about?.isVeg === true || menuItems.some((d) => d.veg)
  const hasNonVegOptions = menuItems.some((d) => !d.veg)
  const hasBestseller = menuItems.some((d) => d.bestseller)

  function onDishQueryChange(value) {
    setDishQuery(value)
    setActiveTab('order')
  }

  const filterBarProps = {
    dishQuery,
    onQueryChange: onDishQueryChange,
    filterVeg,
    filterNonVeg,
    filterBestseller,
    onToggleVeg: () => setFilterVeg((v) => !v),
    onToggleNonVeg: () => setFilterNonVeg((v) => !v),
    onToggleBestseller: () => setFilterBestseller((v) => !v),
    hasVeg: hasVegOptions,
    hasNonVeg: hasNonVegOptions,
    hasBestseller,
  }
  const offerLabel = about?.offer ? String(about.offer) : ''
  const etaLabel =
    about?.slaString ||
    (about?.etaMins > 0
      ? `${Math.max(15, about.etaMins - (about.etaMins % 5 || 5))}–${Math.max(15, about.etaMins - (about.etaMins % 5 || 5)) + 5} mins`
      : DELIVERY_ETA)
  const outletName = about?.areaName || about?.locality || about?.city || 'Nearby outlet'
  const closesAt = about?.closesAt || '12:00 am'
  const isOpenNow = about?.isOpen !== false
  const openingHours = useMemo(() => {
    const rows = Array.isArray(about?.openingHours) ? about.openingHours : []
    if (!rows.length) return rows
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
    return rows.map((r) => ({
      ...r,
      isToday:
        r.isToday ||
        String(r.day || '')
          .toLowerCase()
          .startsWith(today.slice(0, 3).toLowerCase()),
    }))
  }, [about?.openingHours])
  const costLabel = about?.costForTwoMessage || `₹${MIN_ORDER} for two`
  const ratingsLabel = about?.totalRatingsString
    ? /rating/i.test(about.totalRatingsString)
      ? about.totalRatingsString
      : `${about.totalRatingsString} ratings`
    : ''

  const platform = 5
  const grand = count ? itemTotal + platform : 0
  const need = Math.max(0, MIN_ORDER - itemTotal)

  function onToggleFav() {
    const on = toggleWishlist({ id: restaurantId, name: restaurantName, img: heroImg })
    setFav(on)
  }

  async function onShare() {
    const result = await shareRestaurant({ title: restaurantName })
    if (result === 'copied') {
      setShareNote('Link copied')
      setTimeout(() => setShareNote(''), 2000)
    } else if (result === 'failed') {
      setShareNote('Couldn’t share')
      setTimeout(() => setShareNote(''), 2000)
    }
  }

  function selectCategory(catId) {
    setActiveCatId(catId)
    setActiveTab('order')
    setDishQuery('')
    requestAnimationFrame(() => {
      document.querySelector('.menu-layout section, .m-cat-pills + div')?.scrollTo?.(0, 0)
      window.scrollTo({ top: Math.min(window.scrollY, 280), behavior: 'smooth' })
    })
  }

  const cartMeta = {
    restaurantId,
    restaurantName,
  }

  function cartBelongsToOtherRestaurant() {
    return Boolean(
      count && cartRestaurantId && String(cartRestaurantId) !== String(restaurantId),
    )
  }

  function handleAddDish(dish) {
    if (dish?.customisable) {
      setCustomiseDish(dish)
      return
    }
    if (cartBelongsToOtherRestaurant()) {
      setReplacePrompt({ kind: 'plain', payload: dish.id })
      return
    }
    addItem(dish.id, cartMeta)
  }

  function handleAddCustomised(payload) {
    const next = { ...payload, ...cartMeta }
    if (cartBelongsToOtherRestaurant()) {
      setCustomiseDish(null)
      setReplacePrompt({ kind: 'custom', payload: next })
      return
    }
    addCustomisedItem(next)
  }

  function confirmReplaceCart() {
    if (!replacePrompt) return
    replaceCartWithItem(replacePrompt.kind, replacePrompt.payload, cartMeta)
    setReplacePrompt(null)
  }

  return (
    <div className="noon-page noon-menu-page" style={{ background: 'var(--color-bg)' }}>
      <CustomiseModal
        dish={customiseDish}
        open={Boolean(customiseDish)}
        onClose={() => setCustomiseDish(null)}
        onAdd={handleAddCustomised}
      />
      <ReplaceCartDialog
        open={Boolean(replacePrompt)}
        onNo={() => setReplacePrompt(null)}
        onYes={confirmReplaceCart}
      />
      <div className="only-desktop">
        <header className="noon-header noon-header--restaurant">
          <div className="noon-header__inner">
            <div className="noon-header__left">
              <Logo className="logo--sm" to="/discovery" />
            </div>
            <div className="noon-header__center">
              <DeliverToControl
                label={shortPlaceLabel(placeLabel, 2)}
                onEdit={() => navigate('/discovery')}
              />
              <label className="noon-search-field">
                <span className="noon-search-field__icon">
                  <Icon name="search" size={18} />
                </span>
                <input
                  type="search"
                  placeholder="Search menu"
                  aria-label="Search for dishes"
                  value={dishQuery}
                  onChange={(e) => onDishQueryChange(e.target.value)}
                />
              </label>
            </div>
            <div className="noon-header__right">
              <AuthButtons />
              <Link className="cart-btn" to="/checkout" aria-label="Cart">
                <Icon name="cart" size={20} />
                <span className="cart-btn__badge">{count}</span>
              </Link>
            </div>
          </div>
        </header>

        <main className="container" style={{ padding: '0 24px' }}>
          <nav className="breadcrumb">
            <Link to="/">Home</Link> /{' '}
            <Link to="/discovery" title="Change area">
              {cityBreadcrumb}
            </Link>{' '}
            / <Link to="/discovery">Restaurants</Link> / {restaurantName}
          </nav>

          <section className="rest-hero">
            <div className="rest-hero__main">
              <img src={heroImg} alt={restaurantName} />
              {!menuError && !menuLoading && (hasBestseller || (about?.rating ?? 0) >= 4.5) ? (
                <span className="rest-hero__badge">
                  <Icon name="star" size={11} /> Bestseller
                </span>
              ) : null}
            </div>
            <div className="rest-hero__panel">
              <div className="rest-hero__info">
                <h1>{restaurantName}</h1>
                {menuLoading ? (
                  <p className="rest-hero__cuisines">Fetching live menu…</p>
                ) : menuError ? (
                  <p className="rest-hero__cuisines">
                    {menuError}{' '}
                    <Link to="/discovery" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                      Back to Discovery
                    </Link>
                  </p>
                ) : (
                  <p className="rest-hero__cuisines">{cuisineLine}</p>
                )}
                <div className="noon-service-toggle" role="group" aria-label="Fulfillment">
                  <button type="button" className="noon-service-toggle__btn is-active">
                    Delivery
                  </button>
                  <button type="button" className="noon-service-toggle__btn" disabled title="Pickup coming soon">
                    Pickup
                  </button>
                </div>
                {!menuError && !menuLoading ? (
                  <>
                    <div className="rest-meta">
                      {about?.rating ? (
                        <>
                          <span className="rest-meta__item">
                            <span className="star">
                              <Icon name="star" size={14} />
                            </span>
                            <strong>{about.rating}</strong>
                            {ratingsLabel ? ` (${ratingsLabel})` : ''}
                          </span>
                          <span className="rest-meta__divider" aria-hidden="true" />
                        </>
                      ) : null}
                      <span className="rest-meta__item">{costLabel}</span>
                    </div>
                    <RestaurantHoursBlock
                      isOpen={isOpenNow}
                      closesAt={closesAt}
                      outletName={outletName}
                      etaLabel={etaLabel}
                      openingHours={openingHours}
                      address={about?.address}
                      city={about?.city}
                      locality={about?.locality}
                      distance={about?.distance}
                    />
                    <div className="rest-tags">
                      <span className="rest-tags__item rest-tags__item--delivery">
                        <Icon name="bike" size={14} /> Free delivery on orders ₹{MIN_ORDER}+
                      </span>
                      {hasVegOptions ? (
                        <span className="rest-tags__item rest-tags__item--veg">
                          <Icon name="leaf" size={14} /> Pure Veg options
                        </span>
                      ) : null}
                      {offerLabel ? (
                        <span className="rest-tags__item rest-tags__item--offer">
                          <Icon name="tag" size={14} /> {offerLabel}
                        </span>
                      ) : null}
                    </div>
                  </>
                ) : null}
              </div>
              <div className="rest-hero__side">
                <div className="rest-actions">
                  <button
                    className="m-icon-btn"
                    type="button"
                    aria-label={fav ? 'Remove from wishlist' : 'Save to wishlist'}
                    aria-pressed={fav}
                    onClick={onToggleFav}
                    style={fav ? { color: 'var(--color-primary)' } : undefined}
                  >
                    <Icon name="heart" size={18} />
                  </button>
                  <button className="m-icon-btn" type="button" aria-label="Share" onClick={onShare}>
                    <Icon name="share" size={18} />
                  </button>
                </div>
                {shareNote ? (
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 6 }}>{shareNote}</p>
                ) : null}
                {!menuError && !menuLoading && photoCount > 0 ? (
                  <div className="rest-hero__thumbs">
                    {thumbImgs.map((src) => (
                      <button
                        key={src}
                        type="button"
                        className="rest-hero__thumb"
                        onClick={() => setActiveTab('photos')}
                        aria-label="View photos"
                      >
                        <img src={src} alt="" loading="lazy" />
                      </button>
                    ))}
                    <button
                      className="rest-hero__photos"
                      type="button"
                      onClick={() => setActiveTab('photos')}
                    >
                      <Icon name="image" size={16} />
                      <span>View photos</span>
                      <span>({photoCount})</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <nav className="rest-tabs" aria-label="Restaurant sections">
            <button
              type="button"
              className={activeTab === 'order' ? 'is-active' : undefined}
              onClick={() => setActiveTab('order')}
            >
              Order Online
            </button>
            <span title="Full reviews aren’t in the menu feed" style={{ opacity: 0.45, cursor: 'default' }}>
              Reviews{about?.totalRatingsString ? ` (${about.totalRatingsString})` : ''}
            </span>
            <button
              type="button"
              className={activeTab === 'photos' ? 'is-active' : undefined}
              onClick={() => setActiveTab('photos')}
              disabled={photoCount === 0}
              style={{ opacity: photoCount ? 1 : 0.45, cursor: photoCount ? 'pointer' : 'default' }}
            >
              Photos{photoCount ? ` (${photoCount})` : ''}
            </button>
            <button
              type="button"
              className={activeTab === 'about' ? 'is-active' : undefined}
              onClick={() => setActiveTab('about')}
              disabled={!about}
              style={{ opacity: about ? 1 : 0.45, cursor: about ? 'pointer' : 'default' }}
            >
              About
            </button>
          </nav>

          {activeTab === 'photos' ? (
            <section className="rest-photo-grid" style={{ padding: '8px 0 48px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 16 }}>
                Photos ({photoCount})
              </h2>
              <div className="rest-photo-grid__list">
                {galleryImgs.map((src) => (
                  <div key={src} className="rest-photo-grid__item">
                    <img src={src} alt="" loading="lazy" />
                  </div>
                ))}
              </div>
            </section>
          ) : activeTab === 'about' ? (
            <section style={{ maxWidth: 640, padding: '24px 0 48px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 12 }}>About</h2>
              {about?.cuisines ? (
                <p style={{ marginBottom: 8 }}>
                  <strong>Cuisines:</strong> {about.cuisines}
                </p>
              ) : null}
              {about?.areaName || about?.city ? (
                <p style={{ marginBottom: 8 }}>
                  <strong>Area:</strong> {[about.areaName, about.city].filter(Boolean).join(', ')}
                </p>
              ) : null}
              {about?.costForTwoMessage ? (
                <p style={{ marginBottom: 8 }}>
                  <strong>Cost:</strong> {about.costForTwoMessage}
                </p>
              ) : null}
              {about?.address ? (
                <p style={{ marginBottom: 8, lineHeight: 1.5 }}>
                  <strong>Address:</strong> {about.address}
                </p>
              ) : (
                <p style={{ color: 'var(--color-text-muted)' }}>No extra details for this restaurant.</p>
              )}
            </section>
          ) : (
            <div className="menu-layout menu-layout--noon">
              <section>
                <nav className="noon-menu-cats" aria-label="Menu categories">
                  {categoryNav.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`noon-menu-cats__item ${
                        activeCatId === cat.id && !dishQuery.trim() ? 'is-active' : ''
                      }`}
                      onClick={() => selectCategory(cat.id)}
                    >
                      {cat.name}
                    </button>
                  ))}
                </nav>
                <MenuFilterBar {...filterBarProps} />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 4 }}>
                  {menuLoading
                    ? 'Loading menu…'
                    : menuError
                      ? 'Menu unavailable'
                      : dishQuery.trim()
                        ? `Search results (${filteredDishes.length})`
                        : `${activeCatName || 'Menu'} (${filteredDishes.length})`}
                </h2>
                {menuError ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '.875rem', marginBottom: 8 }}>
                    {menuError}
                  </p>
                ) : (
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '.875rem', marginBottom: 8 }}>
                    {dishQuery.trim()
                      ? `Matches for “${dishQuery.trim()}”`
                      : 'Pick a category or filter dishes below.'}
                  </p>
                )}
                <div>
                  <DishList
                    items={visibleDishes}
                    totalCount={filteredDishes.length}
                    onAdd={handleAddDish}
                    sentinelRef={desktopDishSentinelRef}
                    hasMore={hasMoreDishes}
                  />
                </div>
              </section>

              <aside className="cart-panel">
                <h3 className="cart-panel__title">Your cart</h3>

                <div className="cart-box cart-box--empty">
                  {!count ? (
                    <div className="cart-empty">
                      <div className="cart-empty__art" aria-hidden="true">
                        <span className="cart-empty__spark cart-empty__spark--1" />
                        <span className="cart-empty__spark cart-empty__spark--2" />
                        <span className="cart-empty__spark cart-empty__spark--3" />
                        <Icon name="bag" size={36} />
                      </div>
                      <p className="cart-empty__title">Add items to get started</p>
                      <p className="cart-empty__sub">Delicious food is just a few clicks away.</p>
                    </div>
                  ) : (
                    <div className="cart-panel__lines">
                      {lines.map((l) => (
                        <div className="cart-line cart-line--panel" key={l.lineKey || l.id}>
                          <div className="cart-line__main">
                            <div className="cart-line__name">
                              {l.veg ? <span className="veg-dot" /> : <span className="nonveg-dot" />} {l.name}
                            </div>
                            {l.customisation?.length ? (
                              <p className="cart-line__custom">
                                {l.customisation.map((c) => c.choiceName).join(', ')}
                              </p>
                            ) : null}
                            <div className="cart-line__row">
                              <div className="qty qty--sheet">
                                <button
                                  type="button"
                                  aria-label="Decrease"
                                  onClick={() => changeQty(l.lineKey || l.id, -1)}
                                >
                                  −
                                </button>
                                <span>{l.qty}</span>
                                <button
                                  type="button"
                                  aria-label="Increase"
                                  onClick={() => changeQty(l.lineKey || l.id, 1)}
                                >
                                  +
                                </button>
                              </div>
                              <strong className="cart-line__sum">₹{l.price * l.qty}</strong>
                            </div>
                          </div>
                        </div>
                      ))}
                      <p className="cart-panel__total">Item total · ₹{itemTotal}</p>
                    </div>
                  )}
                </div>

                <div className="cart-box delivery-box">
                  <div className="delivery-box__loc">
                    <span className="delivery-box__pin" aria-hidden="true">
                      <Icon name="pin" size={16} />
                    </span>
                    <div className="delivery-box__loc-text">
                      <span className="delivery-box__label">Delivering to</span>
                      <strong title={placeLabel}>{deliveryShort}</strong>
                    </div>
                    <Link className="delivery-box__change" to="/discovery">
                      Change
                    </Link>
                  </div>
                  <ul className="delivery-box__facts">
                    <li>
                      <Icon name="clock" size={16} />
                      <span>Delivery in</span>
                      <strong>{DELIVERY_ETA}</strong>
                    </li>
                    <li>
                      <span className="delivery-box__rupee" aria-hidden="true">
                        ₹
                      </span>
                      <span>Minimum order</span>
                      <strong>₹{MIN_ORDER}</strong>
                    </li>
                    <li>
                      <Icon name="tag" size={16} />
                      <span>Delivery fee</span>
                      <span className="delivery-box__pill">
                        <s>₹40</s> Free
                      </span>
                    </li>
                  </ul>
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
          )}
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
            <button
              className="m-icon-btn"
              type="button"
              aria-label={fav ? 'Remove from wishlist' : 'Save to wishlist'}
              onClick={onToggleFav}
              style={fav ? { color: 'var(--color-primary)' } : undefined}
            >
              <Icon name="heart" size={20} />
            </button>
            <button className="m-icon-btn" type="button" aria-label="Share" onClick={onShare}>
              <Icon name="share" size={20} />
            </button>
            <button className="m-icon-btn" type="button" aria-label="Cart" onClick={() => setSheetOpen(true)}>
              <Icon name="cart" size={20} />
              <span className="m-badge">{count}</span>
            </button>
          </div>
        </header>
        <div style={{ padding: '0 12px 8px' }}>
          <DeliverToControl
            label={shortPlaceLabel(placeLabel, 2)}
            onEdit={() => navigate('/discovery')}
          />
        </div>

        <div className="m-menu-hero">
          <div className="m-menu-hero__top">
            <div className="m-menu-hero__media">
              <img src={heroImg} alt={restaurantName} />
              <button
                className="m-menu-hero__fav"
                type="button"
                aria-label={fav ? 'Remove from wishlist' : 'Favourite'}
                onClick={onToggleFav}
                style={fav ? { color: 'var(--color-primary)' } : undefined}
              >
                <Icon name="heart" size={16} />
              </button>
            </div>
            <div className="m-menu-hero__info">
              <h1>{restaurantName}</h1>
              <p className="m-menu-hero__cuisines">
                {menuLoading ? 'Fetching live menu…' : menuError || cuisineLine}
              </p>
              {!menuError && !menuLoading && about?.rating ? (
                <p className="m-menu-hero__rating">
                  <span className="star">
                    <Icon name="star" size={12} />
                  </span>
                  <strong>{about.rating}</strong>
                  {ratingsLabel ? ` (${ratingsLabel})` : ''}
                  <span className="m-menu-hero__dot">·</span>
                  {costLabel}
                </p>
              ) : null}
            </div>
          </div>
          {!menuError && !menuLoading ? (
            <RestaurantHoursBlock
              isOpen={isOpenNow}
              closesAt={closesAt}
              outletName={outletName}
              etaLabel={etaLabel}
              openingHours={openingHours}
              address={about?.address}
              city={about?.city}
              locality={about?.locality}
              distance={about?.distance}
            />
          ) : null}
        </div>

        <nav className="m-menu-tabs">
          <button
            type="button"
            className={activeTab === 'order' ? 'is-active' : undefined}
            onClick={() => setActiveTab('order')}
            style={{ background: 'none', border: 'none', font: 'inherit' }}
          >
            Order Online
          </button>
          <span style={{ opacity: 0.45 }}>Reviews</span>
          <span style={{ opacity: 0.45 }}>Photos</span>
          <button
            type="button"
            className={activeTab === 'about' ? 'is-active' : undefined}
            onClick={() => about && setActiveTab('about')}
            style={{ background: 'none', border: 'none', font: 'inherit', opacity: about ? 1 : 0.45 }}
          >
            About
          </button>
        </nav>

        {activeTab === 'about' ? (
          <div style={{ padding: 16 }}>
            {about?.address ? <p style={{ lineHeight: 1.5 }}>{about.address}</p> : null}
            {about?.cuisines ? <p style={{ marginTop: 8 }}>Cuisines: {about.cuisines}</p> : null}
            {about?.costForTwoMessage ? <p style={{ marginTop: 8 }}>{about.costForTwoMessage}</p> : null}
          </div>
        ) : (
          <>
            <div className="m-menu-filters">
              <MenuFilterBar {...filterBarProps} />
            </div>
            {!dishQuery.trim() ? (
              <div className="m-cat-pills">
                {categoryNav.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={activeCatId === cat.id ? 'is-active' : undefined}
                    onClick={() => selectCategory(cat.id)}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="m-menu-search-summary">
                {filteredDishes.length
                  ? `${filteredDishes.length} dish${filteredDishes.length === 1 ? '' : 'es'} for “${dishQuery.trim()}”`
                  : `No dishes match “${dishQuery.trim()}”`}
              </p>
            )}
            <div>
              <DishList
                items={visibleDishes}
                totalCount={filteredDishes.length}
                onAdd={handleAddDish}
                sentinelRef={mobileDishSentinelRef}
                hasMore={hasMoreDishes}
              />
            </div>
          </>
        )}

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
                  <div className="cart-line" key={l.lineKey || l.id}>
                    <div className="cart-line__img">
                      <img src={l.img} alt="" />
                    </div>
                    <div className="cart-line__main">
                      <div className="cart-line__name">
                        {l.veg ? <span className="veg-dot" /> : <span className="nonveg-dot" />}
                        <span>{l.name}</span>
                      </div>
                      {l.customisation?.length ? (
                        <p className="cart-line__custom">
                          {l.customisation.map((c) => c.choiceName).join(', ')}
                        </p>
                      ) : null}
                      <div className="cart-line__row">
                        <div className="qty qty--sheet">
                          <button
                            type="button"
                            aria-label="Decrease"
                            onClick={() => changeQty(l.lineKey || l.id, -1)}
                          >
                            −
                          </button>
                          <span>{l.qty}</span>
                          <button
                            type="button"
                            aria-label="Increase"
                            onClick={() => changeQty(l.lineKey || l.id, 1)}
                          >
                            +
                          </button>
                        </div>
                        <strong className="cart-line__sum">₹{l.price * l.qty}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ padding: '8px 16px', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                Coupons coming later
              </p>
              {count ? (
                <div className="bill-rows">
                  <div className="row">
                    <span>Item total ({count} items)</span>
                    <span>₹{itemTotal}</span>
                  </div>
                  <div className="row">
                    <span>Platform fee</span>
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
