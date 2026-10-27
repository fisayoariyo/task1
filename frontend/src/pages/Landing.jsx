import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthButtons } from '../components/AuthButtons'
import { BottomNav } from '../components/BottomNav'
import { Icon } from '../components/Icon'
import { Logo } from '../components/Logo'
import { PlaceSuggestList } from '../components/PlaceSuggestList'
import { listFoodCategories, reverseGeocode } from '../lib/api'
import { CATEGORIES } from '../lib/data'
import {
  DEFAULT_LABEL,
  DEFAULT_LAT,
  DEFAULT_LNG,
  getLocation,
  hasSavedLocation,
  setLocation,
  shortPlaceLabel,
} from '../lib/location'
import { usePlaceAutocomplete } from '../lib/usePlaceAutocomplete'

/** Static fallback if the food-categories API is empty / offline. */
const FALLBACK_CATS = CATEGORIES.map((c) => ({
  id: c.name,
  name: c.name,
  imageUrl: c.img,
  query: c.name,
}))

function catDiscoveryPath(cat) {
  const q = encodeURIComponent(cat.query || cat.name)
  return `/discovery?cat=${q}`
}

export default function Landing() {
  const navigate = useNavigate()
  const place = usePlaceAutocomplete()
  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState('')
  const [foodCats, setFoodCats] = useState(FALLBACK_CATS)
  const [foodCatsTitle, setFoodCatsTitle] = useState('Top brands on TataEats')
  const [foodCatsLoading, setFoodCatsLoading] = useState(true)
  const [savedLabel, setSavedLabel] = useState(() =>
    hasSavedLocation() ? getLocation().label || '' : '',
  )
  const [editingAddress, setEditingAddress] = useState(false)
  const showSavedChip = Boolean(savedLabel) && !editingAddress

  useEffect(() => {
    if (!hasSavedLocation()) return
    const loc = getLocation()
    if (loc?.label) setSavedLabel(loc.label)
  }, [])

  function startChangeAddress() {
    setEditingAddress(true)
    place.setQuery('')
    requestAnimationFrame(() => {
      document.getElementById('landing-address-input')?.focus()
    })
  }

  function continueWithSaved() {
    navigate('/discovery')
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { lat, lng } = getLocation()
      try {
        const data = await listFoodCategories(lat || DEFAULT_LAT, lng || DEFAULT_LNG)
        if (cancelled) return
        const items = Array.isArray(data?.items) ? data.items : []
        if (items.length) {
          setFoodCats(
            items.map((c) => ({
              id: String(c.id || c.name),
              name: c.name,
              imageUrl: c.imageUrl,
              query: c.query || c.name,
            })),
          )
          if (data.title) setFoodCatsTitle(data.title)
          else setFoodCatsTitle('Top brands on TataEats')
        }
      } catch {
        /* keep FALLBACK_CATS */
      } finally {
        if (!cancelled) setFoodCatsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  function applyDefaultLocation() {
    setLocation({ lat: DEFAULT_LAT, lng: DEFAULT_LNG, label: DEFAULT_LABEL })
    setSavedLabel(DEFAULT_LABEL)
    setEditingAddress(false)
  }

  function locateMe({ goToDiscovery = true } = {}) {
    setLocateError('')
    if (!navigator.geolocation) {
      setLocateError('Location isn’t supported in this browser. Type an address instead.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        try {
          const reversed = await reverseGeocode(lat, lng)
          const label = reversed.label || `Near ${lat.toFixed(4)}, ${lng.toFixed(4)}`
          setLocation({
            lat: reversed.lat ?? lat,
            lng: reversed.lng ?? lng,
            label,
            placeId: `geo:${lat},${lng}`,
          })
          setSavedLabel(label)
          setEditingAddress(false)
          place.setQuery(label)
          if (goToDiscovery) navigate('/discovery')
        } catch {
          const fallback = `Near ${lat.toFixed(4)}, ${lng.toFixed(4)}`
          setLocation({
            lat,
            lng,
            label: fallback,
            placeId: `geo:${lat},${lng}`,
          })
          setSavedLabel(fallback)
          setEditingAddress(false)
          place.setQuery(fallback)
          if (goToDiscovery) navigate('/discovery')
        } finally {
          setLocating(false)
        }
      },
      (err) => {
        setLocating(false)
        if (err.code === 1) {
          setLocateError('Location permission denied. Allow access or type an address.')
        } else if (err.code === 3) {
          setLocateError('Location timed out. Try again or type an address.')
        } else {
          setLocateError('Couldn’t get your location. Type an address instead.')
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60_000 },
    )
  }

  async function goDiscovery() {
    if (place.suggestions.length > 0) {
      await place.selectSuggestion(place.suggestions[0])
    } else if (!place.query.trim()) {
      applyDefaultLocation()
    }
    navigate('/discovery')
  }

  async function pickSuggestion(suggestion) {
    await place.selectSuggestion(suggestion)
    navigate('/discovery')
  }

  async function onAddressKeyDown(e) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    await goDiscovery()
  }

  const brandsTitle =
    foodCatsTitle && /brand|categor|food/i.test(foodCatsTitle)
      ? foodCatsTitle.includes('TataEats')
        ? foodCatsTitle
        : 'Top brands on TataEats'
      : 'Top brands on TataEats'

  return (
    <div className="noon-page noon-landing">
      <div className="noon-landing-mobile-top only-mobile">
        <Logo className="logo--sm" />
      </div>

      <header className="noon-header noon-header--landing only-desktop">
        <div className="noon-header__inner">
          <div className="noon-header__left">
            <Logo />
          </div>
          <div className="noon-header__right">
            <AuthButtons />
          </div>
        </div>
      </header>

      <section className="noon-landing-hero" aria-label="Choose delivery location">
        <div className="noon-landing-hero__media" aria-hidden="true">
          <img src="/assets/hero-bg.jpg" alt="" />
        </div>
        <div className="noon-landing-card" data-place-search>
          {showSavedChip ? (
            <>
              <div className="loc-chip" role="status">
                <span className="loc-chip__pin" aria-hidden="true">
                  <Icon name="pin" size={16} />
                </span>
                <span className="loc-chip__text">
                  <span className="loc-chip__label">Delivering to</span>
                  <strong className="loc-chip__place" title={savedLabel}>
                    {shortPlaceLabel(savedLabel, 2)}
                  </strong>
                </span>
                <button type="button" className="loc-chip__change" onClick={startChangeAddress}>
                  Change
                </button>
              </div>
              <button className="btn btn--primary btn--lg" type="button" onClick={continueWithSaved}>
                View Restaurants
              </button>
            </>
          ) : (
            <>
              <label className="noon-search-field" style={{ position: 'relative', display: 'flex' }}>
                <span className="noon-search-field__icon" aria-hidden="true">
                  <Icon name="search" size={18} />
                </span>
                <input
                  id="landing-address-input"
                  type="text"
                  placeholder="Search your location"
                  aria-label="Delivery address"
                  value={place.query}
                  onChange={(e) => place.setQuery(e.target.value)}
                  onFocus={place.onInputFocus}
                  onKeyDown={onAddressKeyDown}
                  autoComplete="off"
                />
                {place.panelOpen ? (
                  <PlaceSuggestList
                    suggestions={place.suggestions}
                    onSelect={pickSuggestion}
                    loading={place.loading}
                    emptyHint={
                      place.query.trim().length >= 3 && !place.loading
                        ? 'No places match that address. Try a nearby area or landmark.'
                        : place.query.trim().length > 0 && place.query.trim().length < 3
                          ? 'Keep typing — enter at least 3 letters'
                          : null
                    }
                  />
                ) : null}
              </label>
              <button className="btn btn--primary btn--lg" type="button" onClick={goDiscovery}>
                View Restaurants
              </button>
              <div className="hero__loc-actions" style={{ justifyContent: 'center' }}>
                {savedLabel ? (
                  <button type="button" className="hero__use-saved" onClick={() => setEditingAddress(false)}>
                    Use saved: {shortPlaceLabel(savedLabel, 2)}
                  </button>
                ) : null}
                <button
                  className="hero__locate"
                  type="button"
                  disabled={locating}
                  onClick={() => locateMe({ goToDiscovery: true })}
                >
                  <Icon name="locate" size={16} />
                  {locating ? 'Getting your location…' : 'Use my current location'}
                </button>
              </div>
            </>
          )}
          {locateError ? (
            <p className="hero__hint" style={{ color: 'var(--color-primary)', margin: 0 }}>
              {locateError}
            </p>
          ) : null}
          <p className="noon-landing-card__auth">
            <button type="button" className="btn btn--outline" disabled title="Coming soon">
              Log in
            </button>{' '}
            for your recent addresses
          </p>
        </div>
      </section>

      <section className="noon-brands" aria-busy={foodCatsLoading || undefined}>
        <h2 className="noon-brands__title">{brandsTitle}</h2>
        <div className="noon-brands__row">
          {foodCats.map((c) => (
            <Link key={c.id} className="noon-brand-circle" to={catDiscoveryPath(c)}>
              <img className="noon-brand-circle__img" src={c.imageUrl} alt="" loading="lazy" />
              <span className="noon-brand-circle__name">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="only-desktop" style={{ padding: '24px 16px 48px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
        © 2026 TataEats. All rights reserved.
      </footer>

      <BottomNav active="home" />
    </div>
  )
}
