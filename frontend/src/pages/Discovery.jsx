import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AuthButtons } from '../components/AuthButtons'
import { BottomNav } from '../components/BottomNav'
import { DeliverToControl } from '../components/DeliverToControl'
import { RestaurantCard } from '../components/RestaurantCard'
import { Icon } from '../components/Icon'
import { Logo } from '../components/Logo'
import { PlaceSuggestList } from '../components/PlaceSuggestList'
import { listFoodCategories, listRestaurants } from '../lib/api'
import { peekHttpCache, restaurantsCacheKey } from '../lib/httpCache'
import { useCart } from '../lib/cart'
import { DISCOVERY_CATS } from '../lib/data'
import {
  DEFAULT_LABEL,
  DEFAULT_LAT,
  DEFAULT_LNG,
  getLocation,
  getPreviousLocation,
  restorePreviousLocation,
  setLocation,
  shortPlaceLabel,
} from '../lib/location'
import { mapRestaurantCardFromApi } from '../lib/mappers'
import { usePlaceAutocomplete } from '../lib/usePlaceAutocomplete'
import { listWishlist, toggleWishlist } from '../lib/wishlist'


/** Compact filter chips under the header (no left filter rail). */
const FILTER_CHIPS = [
  { id: 'offers', label: 'Offers', ic: 'percent' },
  { id: 'rating45', label: 'Rating 4.5+', ic: 'star' },
  { id: 'veg', label: 'Pure Veg', ic: 'leaf' },
  { id: 'fast', label: 'Fast delivery', ic: 'bolt' },
]

const SORT_OPTIONS = [
  { id: 'relevance', label: 'Relevance (Default)' },
  { id: 'delivery', label: 'Delivery Time' },
  { id: 'rating', label: 'Rating' },
  { id: 'costAsc', label: 'Cost: Low to High' },
  { id: 'costDesc', label: 'Cost: High to Low' },
]

function sortRestaurants(list, sortBy) {
  if (!sortBy || sortBy === 'relevance') return list
  const copy = [...list]
  copy.sort((a, b) => {
    if (sortBy === 'delivery') return (a.etaMins || 999) - (b.etaMins || 999)
    if (sortBy === 'rating') return (Number(b.rating) || 0) - (Number(a.rating) || 0)
    if (sortBy === 'costAsc') return (a.costForTwo || 0) - (b.costForTwo || 0)
    if (sortBy === 'costDesc') return (b.costForTwo || 0) - (a.costForTwo || 0)
    return 0
  })
  return copy
}

function SortByControl({ sortBy, onApply, className = '' }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(sortBy)
  const rootRef = useRef(null)

  useEffect(() => {
    if (open) setDraft(sortBy)
  }, [open, sortBy])

  useEffect(() => {
    if (!open) return undefined
    function onPointerDown(e) {
      if (rootRef.current?.contains(e.target)) return
      setOpen(false)
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const chipLabel =
    sortBy === 'relevance'
      ? 'Sort'
      : SORT_OPTIONS.find((o) => o.id === sortBy)?.label.replace(' (Default)', '') || 'Sort'

  return (
    <div className={`sort-by ${className}`} ref={rootRef}>
      <button
        type="button"
        className={`chip sort-by__trigger ${open || sortBy !== 'relevance' ? 'is-active' : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
      >
        {chipLabel}
        <Icon name="chevronDown" size={14} />
      </button>
      {open ? (
        <div className="sort-by__panel" role="dialog" aria-label="Sort restaurants">
          <ul className="sort-by__list" role="listbox">
            {SORT_OPTIONS.map((opt) => (
              <li key={opt.id}>
                <button
                  type="button"
                  className={`sort-by__option ${draft === opt.id ? 'is-selected' : ''}`}
                  role="option"
                  aria-selected={draft === opt.id}
                  onClick={() => setDraft(opt.id)}
                >
                  <span>{opt.label}</span>
                  <span
                    className={`sort-by__radio ${draft === opt.id ? 'is-on' : ''}`}
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ul>
          <div className="sort-by__footer">
            <button
              type="button"
              className="sort-by__apply"
              onClick={() => {
                onApply(draft)
                setOpen(false)
              }}
            >
              Apply
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/** Matches backend page size (mock + Swiggy list batches). */
const PAGE_SIZE = 8

const CAT_MATCHERS = {
  Biryani: [/biryani/i],
  Pizza: [/pizza/i],
  Burgers: [/burger/i],
  'South Indian': [/south indian|dosa|idli|uttapam|vada/i],
  'North Indian': [/north indian|punjabi|mughlai|tandoor|curry/i],
  Chinese: [/chinese|asian|momos|noodles/i],
  'Rolls & Wraps': [/roll|wrap|frankie/i],
  Desserts: [/dessert|bakery|cake|ice cream|sweet|waffle|pastr/i],
  Healthy: [/healthy|salad|juice|bowl/i],
}

function cityFromLabel(label) {
  if (!label) return 'Your area'
  return String(label).split(',')[0].trim() || 'Your area'
}

function initialCatFromSearch(searchParams) {
  const raw = String(searchParams.get('cat') || '').trim()
  if (!raw) return 'All'
  const known = DISCOVERY_CATS.find(
    (c) => c.name.toLowerCase() === raw.toLowerCase(),
  )
  return known?.name || raw
}

export default function Discovery() {
  const { count } = useCart()
  const [searchParams] = useSearchParams()
  const [placeLabel, setPlaceLabel] = useState(() => getLocation().label)
  const [restaurants, setRestaurants] = useState([])
  /** 'ok' | 'empty' | 'error' — real list only; never demo restaurants */
  const [listStatus, setListStatus] = useState('ok')
  const [loadingList, setLoadingList] = useState(true)
  /** Where the address editor is open: header | page | mobile | null */
  const [locationEditAt, setLocationEditAt] = useState(null)
  const [restQuery, setRestQuery] = useState('')
  const [activeCat, setActiveCat] = useState(() => initialCatFromSearch(searchParams))
  const [activeFilters, setActiveFilters] = useState(() => new Set())
  const [sortBy, setSortBy] = useState('relevance')
  const [foodLine, setFoodLine] = useState([])
  const [foodLineLoading, setFoodLineLoading] = useState(true)
  const [wishTick, setWishTick] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const place = usePlaceAutocomplete()
  const locEditRef = useRef(null)
  const nextOffsetRef = useRef(0)
  const loadMoreLockRef = useRef(false)
  const hasMoreRef = useRef(true)
  const seenIdsRef = useRef(new Set())
  const desktopSentinelRef = useRef(null)
  const mobileSentinelRef = useRef(null)

  function setHasMoreSafe(value) {
    hasMoreRef.current = value
    setHasMore(value)
  }

  function openLocationEdit(at, seedQuery = '') {
    setLocationEditAt(at)
    place.setQuery(seedQuery)
    if (at === 'header') {
      // Address field replaces the top-middle search — keep it in view.
      requestAnimationFrame(() => {
        document.getElementById('discovery-loc-search')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      })
    }
  }

  function closeLocationEdit() {
    setLocationEditAt(null)
    place.setQuery('')
  }

  const placeSuggestEmptyHint =
    place.query.trim().length >= 3 && !place.loading
      ? 'No places match that address. Try a nearby area or landmark.'
      : place.query.trim().length > 0 && place.query.trim().length < 3
        ? 'Keep typing — enter at least 3 letters'
        : null

  function toggleFilter(id) {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function resetListControls() {
    setActiveCat('All')
    setActiveFilters(new Set())
    setSortBy('relevance')
    setRestQuery('')
  }

  /** Which filters can match at least one card in the current area. */
  const filterAvail = useMemo(() => {
    const avail = { offers: false, rating45: false, veg: false, fast: false }
    for (const r of restaurants) {
      if (r.offer) avail.offers = true
      if (Number(r.rating) >= 4.5) avail.rating45 = true
      if (r.isVeg === true) avail.veg = true
      if ((r.etaMins || 0) > 0 && r.etaMins <= 30) avail.fast = true
    }
    return avail
  }, [restaurants])

  const applyListBatch = useCallback((cards, { append }) => {
    const mapped = (cards || []).map(mapRestaurantCardFromApi)
    if (append) {
      const fresh = mapped.filter((r) => !seenIdsRef.current.has(r.id))
      fresh.forEach((r) => seenIdsRef.current.add(r.id))
      if (fresh.length) {
        setRestaurants((prev) => [...prev, ...fresh])
      }
      nextOffsetRef.current += mapped.length
      // Stop if the feed ended or the batch was all duplicates.
      setHasMoreSafe(mapped.length >= PAGE_SIZE && fresh.length > 0)
      return
    }
    seenIdsRef.current = new Set(mapped.map((r) => r.id))
    if (mapped.length) {
      setRestaurants(mapped)
      setListStatus('ok')
    } else {
      setRestaurants([])
      setListStatus('empty')
    }
    nextOffsetRef.current = mapped.length
    setHasMoreSafe(mapped.length >= PAGE_SIZE)
  }, [])

  const loadRestaurants = useCallback(async () => {
    const { lat, lng, label } = getLocation()
    setPlaceLabel(label)
    nextOffsetRef.current = 0
    seenIdsRef.current = new Set()
    setHasMoreSafe(true)
    loadMoreLockRef.current = false

    const cacheKey = restaurantsCacheKey(lat, lng, 0)
    const cached = peekHttpCache(cacheKey)
    if (cached) {
      applyListBatch(cached, { append: false })
      setLoadingList(false)
      return
    }
    setLoadingList(true)
    try {
      const cards = await listRestaurants(lat, lng, 0)
      applyListBatch(cards, { append: false })
    } catch {
      setRestaurants([])
      setListStatus('error')
      setHasMoreSafe(false)
    } finally {
      setLoadingList(false)
    }
  }, [applyListBatch])

  const loadMoreRestaurants = useCallback(async () => {
    if (loadMoreLockRef.current || !hasMoreRef.current) return
    loadMoreLockRef.current = true
    setLoadingMore(true)
    const offset = nextOffsetRef.current
    try {
      const { lat, lng } = getLocation()
      const cards = await listRestaurants(lat, lng, offset)
      applyListBatch(cards, { append: true })
    } catch {
      setHasMoreSafe(false)
    } finally {
      setLoadingMore(false)
      loadMoreLockRef.current = false
    }
  }, [applyListBatch])

  useEffect(() => {
    loadRestaurants()
  }, [loadRestaurants])

  useEffect(() => {
    setActiveCat(initialCatFromSearch(searchParams))
  }, [searchParams])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { lat, lng } = getLocation()
      try {
        const data = await listFoodCategories(lat || DEFAULT_LAT, lng || DEFAULT_LNG)
        if (cancelled) return
        const items = Array.isArray(data?.items) ? data.items : []
        const mapped = items
          .filter((c) => c?.name && c?.imageUrl)
          .map((c) => ({
            id: String(c.id || c.name),
            name: c.name,
            imageUrl: c.imageUrl,
            query: c.query || c.name,
          }))
        setFoodLine(mapped)
      } catch {
        if (!cancelled) setFoodLine([])
      } finally {
        if (!cancelled) setFoodLineLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function applyPlace(suggestion) {
    const ok = await place.selectSuggestion(suggestion)
    if (!ok) return
    closeLocationEdit()
    resetListControls()
    await loadRestaurants()
  }

  /**
   * Close the address editor.
   * If this area has no restaurants and a prior pin exists, undo back to it
   * (so Cancel escapes a bad pick). Otherwise Cancel only closes the field.
   */
  async function cancelLocationEdit() {
    closeLocationEdit()
    if (loadingList || restaurants.length > 0) return
    const prev = getPreviousLocation()
    if (prev) {
      const current = getLocation()
      const same =
        (prev.placeId && current.placeId && prev.placeId === current.placeId) ||
        (Math.abs(prev.lat - current.lat) < 1e-5 && Math.abs(prev.lng - current.lng) < 1e-5)
      if (!same) {
        restorePreviousLocation()
        resetListControls()
        await loadRestaurants()
        return
      }
    }
    // Stuck on an empty area with no undo history — fall back to default city.
    const current = getLocation()
    if (
      Math.abs(current.lat - DEFAULT_LAT) > 1e-4 ||
      Math.abs(current.lng - DEFAULT_LNG) > 1e-4
    ) {
      setLocation({ lat: DEFAULT_LAT, lng: DEFAULT_LNG, label: DEFAULT_LABEL })
      resetListControls()
      await loadRestaurants()
    }
  }

  // Same as Cancel: dismiss address edit when clicking/tapping outside the field.
  useEffect(() => {
    if (!locationEditAt) return undefined
    function onPointerDown(e) {
      const root = locEditRef.current
      if (!root || root.contains(e.target)) return
      cancelLocationEdit()
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') cancelLocationEdit()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [locationEditAt])

  async function goBackToPreviousAddress() {
    if (!restorePreviousLocation()) return
    closeLocationEdit()
    resetListControls()
    await loadRestaurants()
  }

  async function tryDefaultCity() {
    closeLocationEdit()
    setLocation({ lat: DEFAULT_LAT, lng: DEFAULT_LNG, label: DEFAULT_LABEL })
    resetListControls()
    await loadRestaurants()
  }

  const previousLocation = getPreviousLocation()
  const previousShort = previousLocation
    ? shortPlaceLabel(previousLocation.label)
    : null

  const filtered = useMemo(() => {
    const q = restQuery.trim().toLowerCase()
    let list = restaurants

    if (activeCat && activeCat !== 'All') {
      const matchers = CAT_MATCHERS[activeCat] || [
        new RegExp(activeCat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
      ]
      list = list.filter((r) => {
        const hay = `${r.name} ${r.cuisines}`
        return matchers.some((re) => re.test(hay))
      })
    }

    if (q) {
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          String(r.cuisines).toLowerCase().includes(q),
      )
    }

    if (activeFilters.has('offers')) {
      list = list.filter((r) => Boolean(r.offer))
    }
    if (activeFilters.has('rating45')) {
      list = list.filter((r) => Number(r.rating) >= 4.5)
    }
    if (activeFilters.has('veg')) {
      list = list.filter((r) => r.isVeg === true)
    }
    if (activeFilters.has('fast')) {
      list = list.filter((r) => (r.etaMins || 99) > 0 && r.etaMins <= 30)
    }

    return sortRestaurants(list, sortBy)
  }, [restaurants, restQuery, activeCat, activeFilters, sortBy])

  const restSuggest = useMemo(() => {
    const q = restQuery.trim().toLowerCase()
    if (q.length < 2) return []
    return filtered.slice(0, 8)
  }, [filtered, restQuery])

  const restCount = filtered.length
  const city = cityFromLabel(placeLabel)

  // Prefetch more when filters leave a thin list but the feed still has pages.
  useEffect(() => {
    if (loadingList || loadingMore || !hasMore) return
    if (restaurants.length === 0) return
    if (restCount >= PAGE_SIZE) return
    loadMoreRestaurants()
  }, [
    restCount,
    hasMore,
    loadingList,
    loadingMore,
    restaurants.length,
    loadMoreRestaurants,
  ])

  // Smart scroll: load the next API batch when either sentinel enters view.
  useEffect(() => {
    if (loadingList || restCount === 0) return undefined
    const nodes = [desktopSentinelRef.current, mobileSentinelRef.current].filter(
      Boolean,
    )
    if (!nodes.length) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          loadMoreRestaurants()
        }
      },
      { root: null, rootMargin: '320px 0px', threshold: 0 },
    )
    nodes.forEach((n) => observer.observe(n))
    return () => observer.disconnect()
  }, [loadingList, restCount, loadingMore, hasMore, loadMoreRestaurants])

  const filteringWhileLoadingMore =
    restCount === 0 && restaurants.length > 0 && (hasMore || loadingMore)

  function renderInfiniteFooter(sentinelRef) {
    if (restCount === 0) return null
    return (
      <div className="infinite-load" aria-live="polite">
        <div
          className="infinite-load__sentinel"
          ref={sentinelRef}
          aria-hidden="true"
        />
        {loadingMore ? (
          <p className="infinite-load__status">Loading more restaurants…</p>
        ) : hasMore ? (
          <p className="infinite-load__status infinite-load__status--hint">
            Scroll for more
          </p>
        ) : (
          <p className="infinite-load__status">
            Showing {restCount} restaurant{restCount === 1 ? '' : 's'}
          </p>
        )}
      </div>
    )
  }

  function onWish(r, e) {
    e.preventDefault()
    e.stopPropagation()
    toggleWishlist({ id: r.id, name: r.name, img: r.img })
    setWishTick((n) => n + 1)
  }

  const filterChips = (
    <div className="noon-chip-row">
      <SortByControl sortBy={sortBy} onApply={setSortBy} />
      {FILTER_CHIPS.map((f) => {
        const canMatch = filterAvail[f.id]
        const on = activeFilters.has(f.id)
        const disabled = !canMatch && !on
        return (
          <button
            key={f.id}
            type="button"
            className={`chip ${on ? 'is-active' : ''} ${disabled ? 'is-disabled' : ''}`}
            aria-pressed={on}
            disabled={disabled}
            onClick={() => toggleFilter(f.id)}
          >
            <Icon name={f.ic} size={14} /> {f.label}
          </button>
        )
      })}
    </div>
  )

  const listBody = loadingList || filteringWhileLoadingMore ? (
    <p style={{ padding: '48px 0', color: 'var(--color-text-muted)', textAlign: 'center' }}>
      {filteringWhileLoadingMore ? 'Looking for restaurants that match…' : 'Finding restaurants near you…'}
    </p>
  ) : restCount === 0 ? (
    <div style={{ padding: '48px 16px', textAlign: 'center', maxWidth: 420, margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 8 }}>
        {listStatus === 'error'
          ? 'We couldn’t load restaurants'
          : restaurants.length > 0
            ? 'No restaurants match these filters'
            : 'No restaurants deliver here yet'}
      </h2>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
        {listStatus === 'error'
          ? 'Something went wrong on our side. Check your connection and try again.'
          : restaurants.length > 0
            ? 'Clear filters or tap the selected food again — Offers only appears when a deal is on the restaurant card.'
            : 'Try another delivery address — many areas outside big cities have limited coverage.'}
      </p>
      <div className="empty-loc-actions">
        {restaurants.length > 0 ? (
          <button type="button" className="btn btn--primary" onClick={resetListControls}>
            Clear filters
          </button>
        ) : (
          <>
            {previousShort ? (
              <button type="button" className="empty-loc-back" onClick={goBackToPreviousAddress}>
                <Icon name="back" size={16} />
                Back to {previousShort}
              </button>
            ) : listStatus === 'empty' ? (
              <button type="button" className="empty-loc-back" onClick={tryDefaultCity}>
                <Icon name="back" size={16} />
                Try {DEFAULT_LABEL.split(',')[0]}
              </button>
            ) : null}
            <button type="button" className="btn btn--primary" onClick={() => openLocationEdit('header', '')}>
              Change delivery address
            </button>
          </>
        )}
      </div>
    </div>
  ) : (
    <>
      <div className="noon-rest-grid">
        {filtered.map((r) => (
          <RestaurantCard key={r.id} restaurant={r} wishTick={wishTick} onWish={onWish} />
        ))}
      </div>
      {renderInfiniteFooter(desktopSentinelRef)}
    </>
  )

  return (
    <div className="noon-page noon-discovery">
      <header className="noon-header noon-header--discovery">
        <div className="noon-header__inner">
          <div className="noon-header__left">
            <Logo className="logo--sm" to="/discovery" />
          </div>
          <div className="noon-header__center" id="discovery-header-search">
            {locationEditAt ? (
              <DeliverToControl label={placeLabel} editing onEdit={() => {}}>
                <div
                  className="web-header__loc-edit"
                  ref={locEditRef}
                  data-place-search
                >
                  <label className="noon-search-field noon-search-field--loc">
                    <Icon name="pin" size={18} />
                    <input
                      id="discovery-loc-search"
                      type="text"
                      placeholder="Type a new delivery address…"
                      aria-label="Change delivery address"
                      value={place.query}
                      onChange={(e) => place.setQuery(e.target.value)}
                      onFocus={place.onInputFocus}
                      autoComplete="off"
                      autoFocus
                    />
                    {place.panelOpen ? (
                      <PlaceSuggestList
                        suggestions={place.suggestions}
                        onSelect={applyPlace}
                        loading={place.loading}
                        emptyHint={placeSuggestEmptyHint}
                      />
                    ) : null}
                  </label>
                  <button type="button" className="btn btn--ghost" onClick={cancelLocationEdit}>
                    Cancel
                  </button>
                </div>
              </DeliverToControl>
            ) : (
              <>
                <DeliverToControl
                  label={shortPlaceLabel(placeLabel, 2)}
                  onEdit={() => openLocationEdit('header', '')}
                />
                <label className="noon-search-field" style={{ position: 'relative', flex: 1 }}>
                  <span className="noon-search-field__icon">
                    <Icon name="search" size={18} />
                  </span>
                  <input
                    type="search"
                    placeholder="Search restaurants, dishes & cuisines"
                    aria-label="Search"
                    value={restQuery}
                    onChange={(e) => setRestQuery(e.target.value)}
                    autoComplete="off"
                  />
                  {restSuggest.length > 0 ? (
                    <ul
                      className="place-suggest"
                      role="listbox"
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: '100%',
                        zIndex: 40,
                        background: '#fff',
                        border: '1px solid var(--color-border)',
                        borderRadius: 8,
                        maxHeight: 280,
                        overflow: 'auto',
                        margin: 0,
                        padding: 0,
                        listStyle: 'none',
                      }}
                    >
                      {restSuggest.map((r) => (
                        <li key={r.id} role="option">
                          <Link
                            to={`/restaurant/${r.id}`}
                            style={{ display: 'block', padding: '10px 14px' }}
                            onClick={() => setRestQuery('')}
                          >
                            <strong>{r.name}</strong>
                            <div
                              style={{
                                fontSize: '0.8125rem',
                                color: 'var(--color-text-muted)',
                              }}
                            >
                              {r.cuisines}
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </label>
              </>
            )}
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

      <div className="noon-discovery__body">
        <section className="noon-section noon-section--discovery">
          <h1 className="noon-section__title">Restaurants near you</h1>
          <p className="noon-section__meta">
            {loadingList ? 'Loading…' : `Near ${city}`}
            {listWishlist().length ? ` · ${listWishlist().length} saved` : ''}
          </p>

          {foodLineLoading || foodLine.length > 0 ? (
            <div className="food-mind" aria-busy={foodLineLoading || undefined}>
              <div className="food-mind__row" role="list">
                {foodLineLoading
                  ? Array.from({ length: 8 }, (_, i) => (
                      <div key={`sk-${i}`} className="food-mind__item food-mind__item--skeleton" role="presentation">
                        <span className="food-mind__img food-mind__img--skeleton" />
                        <span className="food-mind__label food-mind__label--skeleton" />
                      </div>
                    ))
                  : foodLine.map((c) => {
                      const on = activeCat === c.name
                      return (
                        <button
                          key={c.id}
                          type="button"
                          className={`food-mind__item ${on ? 'is-active' : ''}`}
                          role="listitem"
                          aria-pressed={on}
                          onClick={() => setActiveCat(on ? 'All' : c.name)}
                        >
                          <img
                            className="food-mind__img"
                            src={c.imageUrl}
                            alt=""
                            loading="lazy"
                          />
                          <span className="food-mind__label">{c.name}</span>
                        </button>
                      )
                    })}
              </div>
            </div>
          ) : null}

          {filterChips}
          {listBody}
        </section>
      </div>

      <BottomNav active="home" />
    </div>
  )
}
