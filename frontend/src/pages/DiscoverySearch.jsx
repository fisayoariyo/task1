import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { RestaurantCard } from '../components/RestaurantCard'
import { searchRestaurants } from '../lib/api'
import {
  dishGroupMenuPath,
  parseDiscoverySearch,
} from '../lib/discoverySearch'
import { getLocation } from '../lib/location'
import { mapRestaurantCardFromApi } from '../lib/mappers'

function formatRating(value) {
  const rating = Number(value)
  if (!Number.isFinite(rating) || rating <= 0) return ''
  return rating % 1 === 0 ? rating.toFixed(1) : String(rating)
}

function formatPrice(value) {
  const price = Number(value)
  if (!Number.isFinite(price)) return ''
  return `₹${Math.round(price)}`
}

function DishHit({ dish }) {
  const veg = dish.veg === true
  const knownDiet = dish.veg === true || dish.veg === false
  const rating = formatRating(dish.rating)
  const price = formatPrice(dish.price)
  const imageUrl = String(dish.imageUrl || '').trim()

  return (
    <article className="discovery-search-dish">
      <div className="discovery-search-dish__copy">
        {knownDiet ? (
          <span
            className={veg ? 'veg-dot' : 'nonveg-dot'}
            aria-label={veg ? 'Veg' : 'Non-veg'}
          />
        ) : null}
        <h3 className="discovery-search-dish__name">{dish.name}</h3>
        {rating ? (
          <p className="discovery-search-dish__rating">
            <Icon name="star" size={12} />
            <span>{rating}</span>
            {dish.ratingCount ? <span>({dish.ratingCount})</span> : null}
          </p>
        ) : null}
        {price ? <p className="discovery-search-dish__price">{price}</p> : null}
      </div>
      <div className="discovery-search-dish__media">
        <div className="discovery-search-dish__shot">
          {imageUrl ? (
            <img src={imageUrl} alt="" loading="lazy" />
          ) : (
            <span className="discovery-search-dish__ph" aria-hidden="true" />
          )}
          <button
            type="button"
            className="discovery-search-dish__add"
            aria-label={`Add ${dish.name}`}
            onClick={(event) => {
              event.preventDefault()
            }}
          >
            ADD
          </button>
        </div>
        {dish.customisable ? (
          <span className="discovery-search-dish__custom">Customisable</span>
        ) : null}
      </div>
    </article>
  )
}

function DishGroup({ group, query }) {
  const dishes = Array.isArray(group.dishes) ? group.dishes : []
  if (!group.restaurantId || dishes.length === 0) return null
  const rating = formatRating(group.rating)
  const eta = Number(group.etaMins) > 0 ? `${group.etaMins} mins` : ''

  return (
    <section className="discovery-search-group">
      <Link
        className="discovery-search-group__head"
        to={dishGroupMenuPath(group.restaurantId, query)}
      >
        <span className="discovery-search-group__title">
          <span className="discovery-search-group__name">{group.restaurantName}</span>
          {rating || eta ? (
            <span className="discovery-search-group__meta">
              {rating ? (
                <span className="discovery-search-group__rating">
                  <Icon name="thumbsUp" size={13} />
                  {rating}
                </span>
              ) : null}
              {eta ? <span>{eta}</span> : null}
            </span>
          ) : null}
        </span>
        <Icon name="chevron" size={18} />
      </Link>
      <div className="discovery-search-group__dishes">
        {dishes.map((dish) => (
          <DishHit key={dish.id || dish.name} dish={dish} />
        ))}
      </div>
    </section>
  )
}

export default function DiscoverySearch() {
  const [searchParams, setSearchParams] = useSearchParams()
  const parsed = useMemo(
    () => parseDiscoverySearch(searchParams),
    [searchParams],
  )
  const [draft, setDraft] = useState(parsed.query)
  const [echoedQuery, setEchoedQuery] = useState(parsed.query)
  const [result, setResult] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const seqRef = useRef(0)

  if (parsed.query !== echoedQuery) {
    setEchoedQuery(parsed.query)
    if (draft.trim() !== parsed.query) setDraft(parsed.query)
  }

  useEffect(() => {
    if (!parsed.ready) return undefined

    const seq = ++seqRef.current
    const { lat, lng } = getLocation()
    const query = parsed.query
    const apiTab = parsed.apiTab
    const timer = window.setTimeout(() => {
      searchRestaurants(lat, lng, query, apiTab)
        .then((data) => {
          if (seq !== seqRef.current) return
          if (apiTab === 'restaurant') {
            const list = Array.isArray(data?.restaurants) ? data.restaurants : []
            setResult({
              query,
              apiTab,
              restaurants: list.map(mapRestaurantCardFromApi),
              groups: [],
              error: '',
            })
          } else {
            setResult({
              query,
              apiTab,
              restaurants: [],
              groups: Array.isArray(data?.groups) ? data.groups : [],
              error: '',
            })
          }
        })
        .catch(() => {
          if (seq !== seqRef.current) return
          setResult({
            query,
            apiTab,
            restaurants: [],
            groups: [],
            error: 'Search failed. Try again.',
          })
        })
    }, 300)

    return () => window.clearTimeout(timer)
  }, [parsed.query, parsed.apiTab, parsed.ready, attempt])

  function selectTab(routeTab) {
    const next = new URLSearchParams(searchParams)
    next.set('tab', routeTab)
    if (!String(next.get('q') || '').trim()) next.set('q', draft.trim())
    setSearchParams(next, { replace: true })
  }

  function writeQuery(raw) {
    const trimmed = String(raw ?? '').trim()
    if (trimmed === parsed.query) return
    const next = new URLSearchParams(searchParams)
    next.set('q', trimmed)
    setSearchParams(next, { replace: true })
  }

  const current =
    result && result.query === parsed.query && result.apiTab === parsed.apiTab ? result : null
  const status = !parsed.ready ? 'short' : !current ? 'loading' : current.error ? 'error' : 'ready'
  const restaurants = current?.restaurants ?? []
  const visibleGroups = (current?.groups ?? []).filter(
    (group) => group?.restaurantId && Array.isArray(group.dishes) && group.dishes.length > 0,
  )
  const isRestaurants = parsed.routeTab === 'restaurants'
  const showRestaurants = isRestaurants && status === 'ready' && restaurants.length > 0
  const showDishes = !isRestaurants && status === 'ready' && visibleGroups.length > 0
  const emptyLabel = isRestaurants ? 'restaurants' : 'dishes'

  return (
    <div className="noon-page discovery-search">
      <header className="noon-header discovery-search__header">
        <div className="discovery-search__bar">
          <Link className="discovery-search__back" to="/discovery" aria-label="Back to discovery">
            <Icon name="back" size={22} />
          </Link>
          <label className="noon-search-field noon-search-field--rest">
            <span className="noon-search-field__icon">
              <Icon name="search" size={18} />
            </span>
            <input
              type="search"
              placeholder="Search restaurants, dishes & cuisines"
              aria-label="Search restaurants and dishes"
              value={draft}
              onChange={(event) => {
                const value = event.target.value
                setDraft(value)
                writeQuery(value)
              }}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return
                event.preventDefault()
                writeQuery(event.currentTarget.value)
              }}
              autoComplete="off"
            />
          </label>
        </div>
        <div className="discovery-search__tabs" role="tablist" aria-label="Search results">
          <button
            type="button"
            role="tab"
            id="discovery-search-tab-restaurants"
            className={`discovery-search__tab${isRestaurants ? ' is-active' : ''}`}
            aria-selected={isRestaurants}
            aria-controls="discovery-search-panel"
            onClick={() => selectTab('restaurants')}
          >
            Restaurants
          </button>
          <button
            type="button"
            role="tab"
            id="discovery-search-tab-dishes"
            className={`discovery-search__tab${isRestaurants ? '' : ' is-active'}`}
            aria-selected={!isRestaurants}
            aria-controls="discovery-search-panel"
            onClick={() => selectTab('dishes')}
          >
            Dishes
          </button>
        </div>
      </header>

      <main
        className="discovery-search__body"
        id="discovery-search-panel"
        role="tabpanel"
        aria-labelledby={
          isRestaurants ? 'discovery-search-tab-restaurants' : 'discovery-search-tab-dishes'
        }
      >
        <h1 className="sr-only">
          {parsed.ready ? `Search results for ${parsed.query}` : 'Search results'}
        </h1>

        {status === 'short' ? (
          <p className="discovery-search__status">Type at least 3 characters</p>
        ) : null}
        {status === 'loading' ? (
          <p className="discovery-search__status" role="status">
            Searching…
          </p>
        ) : null}
        {status === 'error' ? (
          <div className="discovery-search__status">
            <p>{current?.error}</p>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                setResult(null)
                setAttempt((n) => n + 1)
              }}
            >
              Try again
            </button>
          </div>
        ) : null}
        {status === 'ready' && !showRestaurants && !showDishes ? (
          <p className="discovery-search__status">No {emptyLabel} for “{parsed.query}”</p>
        ) : null}

        {showRestaurants ? (
          <div className="noon-section">
            <div className="noon-rest-grid">
              {restaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          </div>
        ) : null}

        {showDishes ? (
          <div className="discovery-search__groups">
            {visibleGroups.map((group) => (
              <DishGroup
                key={group.restaurantId}
                group={group}
                query={parsed.query}
              />
            ))}
          </div>
        ) : null}
      </main>
    </div>
  )
}
