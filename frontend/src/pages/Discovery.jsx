import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AuthButtons } from '../components/AuthButtons'
import { DeliverToControl } from '../components/DeliverToControl'
import { FoodMindRail } from '../components/FoodMindRail'
import { RestaurantCard, RestaurantCardShell } from '../components/RestaurantCard'
import { Icon } from '../components/Icon'
import { Logo } from '../components/Logo'
import { PlaceSuggestList } from '../components/PlaceSuggestList'
import { RestaurantSearchOverlay } from '../components/RestaurantSearchOverlay'
import {
  listFoodCategories,
  listRestaurants,
  searchRestaurants,
  suggestRestaurants,
} from '../lib/api'
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
import {
  applyFeedPage,
  createFeedState,
  INITIAL_FILL_MIN,
  shouldPrefetchMore,
} from '../lib/restaurantFeed'
import { usePlaceAutocomplete } from '../lib/usePlaceAutocomplete'
import { listWishlist, toggleWishlist } from '../lib/wishlist'


/** Compact filter chips under the header (no left filter rail). */
const FILTER_CHIPS = [
  { id: 'offers', label: 'Offers', ic: 'percent' },
  { id: 'rating45', label: 'Rating 4.5+', ic: 'star' },
  { id: 'veg', label: 'Pure Veg', ic: 'leaf' },
  { id: 'fast', label: 'Fast delivery', ic: 'bolt' },
]

/** Shell grid density: ~2 rows first paint, ~1 row while paging. */
const INITIAL_SHELL_COUNT = 8
const LOAD_MORE_SHELL_COUNT = 4

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

/** Prefetch more when filtered visible rows drop below this. */
const PREFETCH_MIN_VISIBLE = 8
/** How far above the fold counts as “near end” for chained loads. */
const LOAD_MORE_ROOT_MARGIN_PX = 720

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
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [searchSuggestions, setSearchSuggestions] = useState([])
  const [searchRanFor, setSearchRanFor] = useState('')
  const suggestSeqRef = useRef(0)
  const [activeCat, setActiveCat] = useState(() => initialCatFromSearch(searchParams))
  const [categoryResults, setCategoryResults] = useState([])
  const [categoryLoading, setCategoryLoading] = useState(false)
  const [categoryError, setCategoryError] = useState(null)
  const [activeFilters, setActiveFilters] = useState(() => new Set())
  const [sortBy, setSortBy] = useState('relevance')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [foodLine, setFoodLine] = useState([])
  const [foodLineLoading, setFoodLineLoading] = useState(true)
  const categoryMode = Boolean(activeCat && activeCat !== 'All')
  const categoryFetchGenRef = useRef(0)
  const [wishTick, setWishTick] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const place = usePlaceAutocomplete()
  const locEditRef = useRef(null)
  /** Swiggy opaque cursor — not a numeric page index. */
  const nextOffsetRef = useRef(null)
  const widgetOffsetRef = useRef(null)
  const loadMoreLockRef = useRef(false)
  const hasMoreRef = useRef(true)
  /** Bumps on each fresh list load so stale page-2 responses are ignored. */
  const listGenRef = useRef(0)
  /** Pure cursor feed — source of truth for merge / hasMore (see restaurantFeed.js). */
  const feedRef = useRef(createFeedState())
  const desktopSentinelRef = useRef(null)
  const loadMoreObserverRef = useRef(null)
  const loadMoreRestaurantsRef = useRef(null)

  function setHasMoreSafe(value) {
    hasMoreRef.current = value
    setHasMore(value)
  }

  function disconnectLoadMoreObserver() {
    loadMoreObserverRef.current?.disconnect()
    loadMoreObserverRef.current = null
  }

  function observeLoadMoreSentinel(node) {
    disconnectLoadMoreObserver()
    if (!node || !hasMoreRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          loadMoreRestaurantsRef.current?.()
        }
      },
      {
        root: null,
        rootMargin: `${LOAD_MORE_ROOT_MARGIN_PX}px 0px`,
        threshold: 0,
      },
    )
    loadMoreObserverRef.current = observer
    observer.observe(node)
  }

  /** Callback ref — attaches IO whenever the footer sentinel mounts/moves. */
  const infiniteSentinelRef = useCallback((node) => {
    desktopSentinelRef.current = node
    if (node) observeLoadMoreSentinel(node)
    else disconnectLoadMoreObserver()
  }, [])

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

  const placeSuggestEmptyHint = place.fetchError
    ? 'Address search is unavailable. Check that the API is running.'
    : place.query.trim().length >= 3 && !place.loading
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

  function clearCategoryMode() {
    setActiveCat('All')
    setCategoryResults([])
    setCategoryError(null)
    setCategoryLoading(false)
    categoryFetchGenRef.current += 1
  }

  function resetListControls() {
    clearCategoryMode()
    setActiveFilters(new Set())
    setSortBy('relevance')
    setRestQuery('')
  }

  /** Which filters can match at least one card in the current list. */
  const filterAvail = useMemo(() => {
    const source = categoryMode ? categoryResults : restaurants
    const avail = { offers: false, rating45: false, veg: false, fast: false }
    for (const r of source) {
      if (r.offer) avail.offers = true
      if (Number(r.rating) >= 4.5) avail.rating45 = true
      if (r.isVeg === true) avail.veg = true
      if ((r.etaMins || 0) > 0 && r.etaMins <= 30) avail.fast = true
    }
    return avail
  }, [restaurants, categoryResults, categoryMode])

  const applyListBatch = useCallback((page, { append }) => {
    const raw = Array.isArray(page?.restaurants)
      ? page.restaurants
      : Array.isArray(page)
        ? page
        : []
    const mappedPage = {
      restaurants: raw.map(mapRestaurantCardFromApi),
      nextOffset: page?.nextOffset ?? null,
      widgetOffset: page?.widgetOffset ?? null,
      hasMore: page?.hasMore === true,
    }
    const next = applyFeedPage(feedRef.current, mappedPage, { append })
    feedRef.current = next
    nextOffsetRef.current = next.nextOffset
    widgetOffsetRef.current = next.widgetOffset
    setRestaurants(next.restaurants)
    setHasMoreSafe(next.hasMore)
    if (!append) {
      setListStatus(next.restaurants.length ? 'ok' : 'empty')
    }
  }, [])

  const sentinelNearViewport = useCallback(() => {
    const el = desktopSentinelRef.current
    if (!el) return false
    const rect = el.getBoundingClientRect()
    return rect.top < window.innerHeight + LOAD_MORE_ROOT_MARGIN_PX
  }, [])

  /**
   * Fetch one cursor page and append. Returns true if the feed may still grow.
   * Generation-guarded so a remount / new pin can’t apply a stale page-2.
   */
  const loadMoreRestaurants = useCallback(async () => {
    if (loadMoreLockRef.current || !hasMoreRef.current) return false
    const cursor = nextOffsetRef.current || feedRef.current.nextOffset
    if (!cursor) {
      setHasMoreSafe(false)
      return false
    }
    // Take the lock before any await so IO + scroll cannot double-fetch one cursor.
    loadMoreLockRef.current = true
    const gen = listGenRef.current
    setLoadingMore(true)
    try {
      const { lat, lng } = getLocation()
      const page = await listRestaurants(
        lat,
        lng,
        cursor,
        widgetOffsetRef.current || feedRef.current.widgetOffset,
      )
      if (gen !== listGenRef.current) return false
      applyListBatch(page, { append: true })
      return hasMoreRef.current
    } catch {
      // Transient network/proxy errors — keep cursor so the next scroll retries.
      return false
    } finally {
      if (gen === listGenRef.current) {
        setLoadingMore(false)
        loadMoreLockRef.current = false
        // Re-bind observer (card list grew) + chain if footer is still near the fold.
        if (desktopSentinelRef.current && hasMoreRef.current) {
          observeLoadMoreSentinel(desktopSentinelRef.current)
        }
        if (hasMoreRef.current && sentinelNearViewport()) {
          queueMicrotask(() => {
            loadMoreRestaurantsRef.current?.()
          })
        }
      }
    }
  }, [applyListBatch, sentinelNearViewport])

  loadMoreRestaurantsRef.current = loadMoreRestaurants

  const loadRestaurants = useCallback(async () => {
    const { lat, lng, label } = getLocation()
    const gen = ++listGenRef.current
    setPlaceLabel(label)
    feedRef.current = createFeedState()
    nextOffsetRef.current = null
    widgetOffsetRef.current = null
    setHasMoreSafe(true)
    loadMoreLockRef.current = false
    setLoadingMore(false)

    /** First page paints fast; then pull cursor pages until the feed feels dense. */
    async function fillFeedToMin() {
      while (gen === listGenRef.current && shouldPrefetchMore(feedRef.current, INITIAL_FILL_MIN)) {
        const more = await loadMoreRestaurantsRef.current?.()
        if (!more) break
      }
    }

    const cacheKey = restaurantsCacheKey(lat, lng)
    const cached = peekHttpCache(cacheKey)
    if (cached) {
      if (gen !== listGenRef.current) return
      applyListBatch(cached, { append: false })
      setLoadingList(false)
      await fillFeedToMin()
      return
    }
    setLoadingList(true)
    try {
      const page = await listRestaurants(lat, lng)
      if (gen !== listGenRef.current) return
      applyListBatch(page, { append: false })
    } catch {
      if (gen !== listGenRef.current) return
      setRestaurants([])
      setListStatus('error')
      setHasMoreSafe(false)
    } finally {
      if (gen === listGenRef.current) {
        setLoadingList(false)
      }
    }
    if (gen === listGenRef.current) {
      await fillFeedToMin()
    }
  }, [applyListBatch])

  useEffect(() => {
    loadRestaurants()
  }, [loadRestaurants])

  const selectCategory = useCallback(async (catOrAll) => {
    if (!catOrAll || catOrAll === 'All') {
      clearCategoryMode()
      return
    }
    const name = typeof catOrAll === 'string' ? catOrAll : String(catOrAll.name || '').trim()
    const query = String(
      (typeof catOrAll === 'object' && catOrAll.query) || name,
    ).trim()
    if (!name || query.length < 2) {
      clearCategoryMode()
      return
    }
    const gen = ++categoryFetchGenRef.current
    setActiveCat(name)
    setCategoryLoading(true)
    setCategoryError(null)
    try {
      const { lat, lng } = getLocation()
      const data = await searchRestaurants(
        lat || DEFAULT_LAT,
        lng || DEFAULT_LNG,
        query,
      )
      if (gen !== categoryFetchGenRef.current) return
      const raw = Array.isArray(data?.restaurants) ? data.restaurants : []
      setCategoryResults(raw.map(mapRestaurantCardFromApi))
    } catch {
      if (gen !== categoryFetchGenRef.current) return
      setCategoryResults([])
      setCategoryError('We couldn’t load this category. Try again.')
    } finally {
      if (gen === categoryFetchGenRef.current) {
        setCategoryLoading(false)
      }
    }
  }, [])

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

  /** Deep-link ?cat=Biryani — run search once food tiles (or name alone) are ready. */
  useEffect(() => {
    const name = initialCatFromSearch(searchParams)
    if (!name || name === 'All') return
    if (foodLineLoading) return
    if (
      activeCat === name &&
      (categoryLoading || categoryResults.length > 0 || categoryError)
    ) {
      return
    }
    const item = foodLine.find((c) => c.name.toLowerCase() === name.toLowerCase())
    void selectCategory(item || { name, query: name })
  }, [
    searchParams,
    foodLineLoading,
    foodLine,
    selectCategory,
    activeCat,
    categoryLoading,
    categoryResults.length,
    categoryError,
  ])

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
    let list = categoryMode ? categoryResults : restaurants

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
  }, [restaurants, categoryResults, categoryMode, activeFilters, sortBy])

  const runRestaurantSearch = useCallback(async (rawQuery) => {
    const q = String(rawQuery ?? restQuery).trim()
    // Cancel any in-flight suggest so ENTER results aren’t overwritten.
    suggestSeqRef.current += 1
    if (q.length < 3) {
      setSearchError('Type at least 3 characters')
      setSearchResults([])
      setSearchSuggestions([])
      setSearchRanFor(q)
      setSearchOpen(true)
      return
    }
    setSearchOpen(true)
    setSearchLoading(true)
    setSearchError(null)
    setSearchRanFor(q)
    try {
      const { lat, lng } = getLocation()
      const data = await searchRestaurants(
        lat || DEFAULT_LAT,
        lng || DEFAULT_LNG,
        q,
      )
      setSearchSuggestions([])
      setSearchResults(Array.isArray(data?.restaurants) ? data.restaurants : [])
    } catch {
      setSearchResults([])
      setSearchSuggestions([])
      setSearchError('Search failed. Try again.')
    } finally {
      setSearchLoading(false)
    }
  }, [restQuery])

  const runRestaurantSuggest = useCallback(async (rawQuery) => {
    const q = String(rawQuery ?? '').trim()
    if (q.length < 3) {
      setSearchResults([])
      setSearchSuggestions([])
      setSearchError(null)
      setSearchLoading(false)
      setSearchRanFor('')
      return
    }
    const seq = ++suggestSeqRef.current
    setSearchOpen(true)
    setSearchLoading(true)
    setSearchError(null)
    setSearchRanFor(q)
    try {
      const { lat, lng } = getLocation()
      const data = await suggestRestaurants(
        lat || DEFAULT_LAT,
        lng || DEFAULT_LNG,
        q,
      )
      if (seq !== suggestSeqRef.current) return
      setSearchSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : [])
      setSearchResults(Array.isArray(data?.restaurants) ? data.restaurants : [])
    } catch {
      if (seq !== suggestSeqRef.current) return
      setSearchResults([])
      setSearchSuggestions([])
      setSearchError('Search failed. Try again.')
    } finally {
      if (seq === suggestSeqRef.current) setSearchLoading(false)
    }
  }, [])

  // Live suggest while typing (Swiggy SUGGEST) — not Enter-only.
  useEffect(() => {
    if (!searchOpen) return undefined
    const q = restQuery.trim()
    if (q.length < 3) {
      setSearchResults([])
      setSearchSuggestions([])
      setSearchError(null)
      setSearchLoading(false)
      return undefined
    }
    const timer = window.setTimeout(() => {
      void runRestaurantSuggest(q)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [restQuery, searchOpen, runRestaurantSuggest])

  useEffect(() => {
    if (!searchOpen) return undefined
    function onKey(e) {
      if (e.key === 'Escape') setSearchOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [searchOpen])

  const restCount = filtered.length
  const city = cityFromLabel(placeLabel)

  // Prefetch more when filters leave a thin list but the feed still has pages.
  useEffect(() => {
    if (categoryMode) return
    if (loadingList || loadingMore || !hasMore) return
    if (restaurants.length === 0) return
    if (restCount >= PREFETCH_MIN_VISIBLE) return
    loadMoreRestaurants()
  }, [
    categoryMode,
    restCount,
    hasMore,
    loadingList,
    loadingMore,
    restaurants.length,
    loadMoreRestaurants,
  ])

  // Window-scroll backup — IO alone can miss if the sentinel never “re-enters”.
  useEffect(() => {
    if (categoryMode || loadingList || !hasMore) return undefined
    const onScrollOrResize = () => {
      if (!hasMoreRef.current || loadMoreLockRef.current) return
      if (sentinelNearViewport()) loadMoreRestaurants()
    }
    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize)
    onScrollOrResize()
    return () => {
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [categoryMode, loadingList, hasMore, loadMoreRestaurants, sentinelNearViewport])

  useEffect(() => () => disconnectLoadMoreObserver(), [])

  const filteringWhileLoadingMore =
    !categoryMode &&
    restCount === 0 &&
    restaurants.length > 0 &&
    (hasMore || loadingMore)

  function renderShells(count) {
    return Array.from({ length: count }, (_, i) => (
      <RestaurantCardShell key={`shell-${i}`} />
    ))
  }

  function renderInfiniteFooter() {
    if (categoryMode) {
      if (restCount === 0) return null
      return (
        <div className="infinite-load" aria-live="polite">
          <p className="infinite-load__status">
            Showing {restCount} restaurant{restCount === 1 ? '' : 's'}
          </p>
        </div>
      )
    }
    if (restCount === 0) return null
    return (
      <div className="infinite-load" aria-live="polite">
        <div
          className="infinite-load__sentinel"
          ref={infiniteSentinelRef}
          aria-hidden="true"
        />
        {loadingMore ? (
          <p className="sr-only">Loading more restaurants…</p>
        ) : hasMore ? null : (
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

  const filtersActive = sortBy !== 'relevance' || activeFilters.size > 0
  const filterChips = (
    <div className={`noon-chip-row ${filtersOpen ? 'is-open' : ''}`}>
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

  const listBody =
    categoryLoading || loadingList || filteringWhileLoadingMore ? (
    <div
      className="noon-rest-grid"
      aria-busy="true"
      aria-label={
        categoryLoading
          ? `Finding ${activeCat} restaurants`
          : filteringWhileLoadingMore
            ? 'Looking for restaurants that match'
            : 'Finding restaurants near you'
      }
    >
      {renderShells(INITIAL_SHELL_COUNT)}
    </div>
  ) : restCount === 0 ? (
    <div style={{ padding: '48px 16px', textAlign: 'center', maxWidth: 420, margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 8 }}>
        {categoryMode
          ? categoryError
            ? 'We couldn’t load this category'
            : categoryResults.length > 0
              ? 'No restaurants match these filters'
              : `No ${activeCat} restaurants nearby`
          : listStatus === 'error'
            ? 'We couldn’t load restaurants'
            : restaurants.length > 0
              ? 'No restaurants match these filters'
              : 'No restaurants deliver here yet'}
      </h2>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
        {categoryMode
          ? categoryError
            ? 'Check your connection and try the category again.'
            : categoryResults.length > 0
              ? 'Clear filters or tap the category again to go back.'
              : 'Try another category or change your delivery address.'
          : listStatus === 'error'
            ? 'Something went wrong on our side. Check your connection and try again.'
            : restaurants.length > 0
              ? 'Clear filters or tap the selected food again — Offers only appears when a deal is on the restaurant card.'
              : 'Try another delivery address — many areas outside big cities have limited coverage.'}
      </p>
      <div className="empty-loc-actions">
        {categoryMode ? (
          <button type="button" className="btn btn--primary" onClick={() => selectCategory('All')}>
            Show all restaurants
          </button>
        ) : restaurants.length > 0 ? (
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
      <div className="noon-rest-grid" aria-busy={loadingMore || undefined}>
        {filtered.map((r) => (
          <RestaurantCard key={r.id} restaurant={r} wishTick={wishTick} onWish={onWish} />
        ))}
        {!categoryMode && loadingMore ? renderShells(LOAD_MORE_SHELL_COUNT) : null}
      </div>
      {renderInfiniteFooter()}
    </>
  )

  return (
    <div className="noon-page noon-discovery">
      <header className="noon-header noon-header--discovery">
        <div className="noon-header__inner">
          <div className="noon-header__left">
            <Logo className="logo--sm" to="/discovery" />
          </div>

          {!locationEditAt ? (
            <div className="noon-header__deliver">
              <DeliverToControl
                label={shortPlaceLabel(placeLabel, 2)}
                onEdit={() => openLocationEdit('header', '')}
              />
            </div>
          ) : null}

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
                <label className="noon-search-field noon-search-field--rest">
                  <span className="noon-search-field__icon">
                    <Icon name="search" size={18} />
                  </span>
                  <input
                    type="search"
                    placeholder="Search restaurants, dishes & cuisines"
                    aria-label="Search restaurants"
                    value={restQuery}
                    onChange={(e) => {
                      const v = e.target.value
                      setRestQuery(v)
                      if (v.trim().length >= 3) setSearchOpen(true)
                    }}
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter') return
                      e.preventDefault()
                      runRestaurantSearch(e.currentTarget.value)
                    }}
                    onFocus={() => {
                      if (restQuery.trim().length >= 3 || searchRanFor) setSearchOpen(true)
                    }}
                    autoComplete="off"
                  />
                </label>
                <button
                  type="button"
                  className={`noon-filter-btn ${filtersOpen || filtersActive ? 'is-active' : ''}`}
                  aria-label="Sort and filters"
                  aria-expanded={filtersOpen}
                  aria-controls="discovery-filters"
                  onClick={() => setFiltersOpen((v) => !v)}
                >
                  <Icon name="filter" size={20} />
                </button>
              </>
            )}
          </div>

          {/* Desktop only — mobile uses bottom-nav Orders (avoid double cart) */}
          <div className="noon-header__right only-desktop">
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
          <div className="noon-section__head">
            <h1 className="noon-section__title">
              {categoryMode ? activeCat : 'Restaurants near you'}
            </h1>
            <p className="noon-section__meta only-desktop">
              {categoryLoading || loadingList
                ? 'Loading…'
                : categoryMode
                  ? `${restCount} place${restCount === 1 ? '' : 's'} near ${city}`
                  : `Near ${city}`}
            </p>
          </div>

          {foodLineLoading || foodLine.length > 0 ? (
            <FoodMindRail
              loading={foodLineLoading}
              items={foodLine}
              activeName={activeCat}
              onSelect={selectCategory}
            />
          ) : null}

          <div id="discovery-filters">{filterChips}</div>
          {listBody}
        </section>
      </div>

      <RestaurantSearchOverlay
        open={searchOpen}
        query={restQuery}
        onQueryChange={setRestQuery}
        onSubmit={() => runRestaurantSearch()}
        onPickSuggestion={(text) => {
          setRestQuery(text)
          void runRestaurantSearch(text)
        }}
        onClose={() => setSearchOpen(false)}
        loading={searchLoading}
        error={searchError}
        suggestions={searchSuggestions}
        restaurants={searchResults}
      />

    </div>
  )
}
