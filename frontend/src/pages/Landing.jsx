import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthButtons } from '../components/AuthButtons'
import { Icon } from '../components/Icon'
import { Logo } from '../components/Logo'
import { PlaceSuggestList } from '../components/PlaceSuggestList'
import { privacyPolicyUrl } from '../lib/legalLinks.js'
import { listFoodCategories, reverseGeocode } from '../lib/api'
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

/** Popular areas — TataEats India (layout matches Noon UAE columns). */
const POPULAR_LOCATIONS = [
  {
    city: 'Mumbai',
    areas: ['Andheri', 'Bandra', 'Powai', 'Colaba', 'Worli', 'Juhu', 'Dadar', 'Malad'],
  },
  {
    city: 'Delhi NCR',
    areas: ['Connaught Place', 'Saket', 'Gurgaon', 'Noida', 'Dwarka', 'Karol Bagh'],
  },
  {
    city: 'Bengaluru',
    areas: ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout', 'Jayanagar'],
  },
  {
    city: 'Hyderabad',
    areas: ['Hitech City', 'Banjara Hills', 'Gachibowli', 'Jubilee Hills'],
  },
  {
    city: 'Pune',
    areas: ['Koregaon Park', 'Hinjewadi', 'Viman Nagar', 'Baner'],
  },
  {
    city: 'Chennai',
    areas: ['T. Nagar', 'Adyar', 'OMR', 'Anna Nagar'],
  },
  {
    city: 'Kolkata',
    areas: ['Park Street', 'Salt Lake', 'New Town'],
  },
]

const WHY_POINTS = [
  {
    title: 'Offers',
    body: 'Discover unbeatable discounts and exclusive offers on a diverse range of cuisines and dishes.',
    icon: 'percent',
  },
  {
    title: 'Fast Delivery',
    body: 'Swift and efficient delivery to bring your favorites to your doorstep as soon as you crave them.',
    icon: 'bolt',
  },
  {
    title: 'Low Commissions',
    body: 'Delivering your dishes with the lowest guaranteed commission rates in the region.',
    icon: 'gift',
  },
]

function catDiscoveryPath(cat) {
  const q = encodeURIComponent(cat.query || cat.name)
  return `/discovery?cat=${q}`
}

export default function Landing() {
  const navigate = useNavigate()
  const place = usePlaceAutocomplete()
  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState('')
  const [foodCats, setFoodCats] = useState([])
  const [foodCatsLoading, setFoodCatsLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [openCity, setOpenCity] = useState(null)
  const [savedLabel, setSavedLabel] = useState(() =>
    hasSavedLocation() ? getLocation().label || '' : '',
  )
  const [editingAddress, setEditingAddress] = useState(false)
  const showSavedChip = Boolean(savedLabel) && !editingAddress

  function onChangeAddressFromMenu() {
    setMenuOpen(false)
    startChangeAddress()
    requestAnimationFrame(() => {
      document.getElementById('landing-address-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

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
        setFoodCats(
          items
            .filter((c) => c?.name && c?.imageUrl)
            .map((c) => {
              const name = c.name
              return {
                id: String(c.id || name),
                name,
                imageUrl: c.imageUrl,
                query: c.query || name,
              }
            }),
        )
      } catch {
        if (!cancelled) setFoodCats([])
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
          setLocation({ lat, lng, label: fallback, placeId: `geo:${lat},${lng}` })
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

  function pickPopularArea(city, area) {
    const label = `${area}, ${city}`
    setLocation({ lat: DEFAULT_LAT, lng: DEFAULT_LNG, label })
    setSavedLabel(label)
    navigate('/discovery')
  }

  return (
    <div className={`noon-page noon-landing ${menuOpen ? 'is-drawer-open' : ''}`}>
      <header className="nl-topbar">
        <button
          type="button"
          className="nl-topbar__menu"
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>
        <Logo className="logo--landing" mark={false} />
      </header>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="nl-drawer-backdrop"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="nl-drawer" role="dialog" aria-label="Menu">
            <div className="nl-drawer__head">
              <button
                type="button"
                className="nl-topbar__menu"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              >
                <span />
                <span />
                <span />
              </button>
              <Logo className="logo--landing" mark={false} to="/" />
            </div>
            <nav className="nl-drawer__nav">
              <button type="button" className="nl-drawer__link is-active" onClick={() => setMenuOpen(false)}>
                Home
              </button>
              <button type="button" className="nl-drawer__link" onClick={onChangeAddressFromMenu}>
                Change address
              </button>
              <a className="nl-drawer__link" href="#contact" onClick={() => setMenuOpen(false)}>
                Contact us
              </a>
              <a className="nl-drawer__link" href="mailto:partners@tataeats.com">
                Become a restaurant partner
              </a>
            </nav>
            <div className="nl-drawer__actions">
              <AuthButtons variant="drawer" />
            </div>
          </aside>
        </>
      ) : null}

      <section className="nl-hero" aria-label="Choose delivery location">
        <div className="nl-hero__media" aria-hidden="true">
          <img src="/assets/hero-bg.jpg" alt="" />
        </div>
        <div className="nl-card" data-place-search>
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
              <button className="nl-card__cta" type="button" onClick={continueWithSaved}>
                View Restaurants
              </button>
            </>
          ) : (
            <>
              <label className="nl-card__search">
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
                <span className="nl-card__search-icon" aria-hidden="true">
                  <Icon name="search" size={18} />
                </span>
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
              <button className="nl-card__cta" type="button" onClick={goDiscovery}>
                View Restaurants
              </button>
              <button
                type="button"
                className="nl-card__locate"
                disabled={locating}
                onClick={() => locateMe({ goToDiscovery: true })}
              >
                {locating ? 'Getting location…' : 'Use my current location'}
              </button>
            </>
          )}
          {locateError ? <p className="nl-card__error">{locateError}</p> : null}
          <div className="nl-card__login">
            <AuthButtons variant="links" /> for your recent addresses
          </div>
        </div>
      </section>

      <section className="nl-brands" aria-busy={foodCatsLoading || undefined}>
        <h2 className="nl-brands__title">Popular foods on TataEats</h2>
        <div className="nl-brands__row" role="list">
          {foodCatsLoading
            ? Array.from({ length: 8 }, (_, i) => (
                <div key={`sk-${i}`} className="nl-brand nl-brand--skeleton" role="presentation">
                  <span className="nl-brand__circle" />
                  <span className="nl-brand__name nl-brand__name--skeleton" />
                </div>
              ))
            : foodCats.map((c) => (
                <Link
                  key={c.id}
                  className="nl-brand"
                  to={catDiscoveryPath(c)}
                  role="listitem"
                  aria-label={c.name}
                >
                  <span className="nl-brand__circle nl-brand__circle--tile">
                    <img src={c.imageUrl} alt="" loading="lazy" />
                  </span>
                  <span className="nl-brand__name">{c.name}</span>
                </Link>
              ))}
        </div>
      </section>

      <section className="nl-why">
        <div className="nl-why__inner">
          <div className="nl-why__media">
            <img src="/assets/partner-wok.jpg" alt="Food delivery on TataEats" />
          </div>
          <div className="nl-why__copy">
            <h2>Why TataEats?</h2>
            <ul className="nl-why__list">
              {WHY_POINTS.map((p) => (
                <li key={p.title}>
                  <span className="nl-why__icon" aria-hidden="true">
                    <Icon name={p.icon} size={22} />
                  </span>
                  <div>
                    <strong>{p.title}</strong>
                    <p>{p.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="nl-locations">
        <h2>Popular locations in India</h2>
        {/* Mobile: accordion (Noon mobile) */}
        <div className="nl-locations__accordion only-mobile">
          {POPULAR_LOCATIONS.map((col) => {
            const open = openCity === col.city
            return (
              <div key={col.city} className={`nl-acc ${open ? 'is-open' : ''}`}>
                <button
                  type="button"
                  className="nl-acc__trigger"
                  aria-expanded={open}
                  onClick={() => setOpenCity(open ? null : col.city)}
                >
                  <span>{col.city}</span>
                  <span className="nl-acc__chev" aria-hidden="true">
                    ▾
                  </span>
                </button>
                {open ? (
                  <ul className="nl-acc__panel">
                    {col.areas.map((area) => (
                      <li key={area}>
                        <button type="button" onClick={() => pickPopularArea(col.city, area)}>
                          {area}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )
          })}
        </div>
        {/* Desktop: multi-column */}
        <div className="nl-locations__grid only-desktop">
          {POPULAR_LOCATIONS.map((col) => (
            <div key={col.city} className="nl-locations__col">
              <h3>{col.city}</h3>
              <ul>
                {col.areas.map((area) => (
                  <li key={area}>
                    <button type="button" onClick={() => pickPopularArea(col.city, area)}>
                      {area}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <footer className="nl-footer" id="contact">
        <div className="nl-footer__stores">
          <button type="button" className="nl-store-btn" disabled title="Coming soon">
            <span className="nl-store-btn__glyph" aria-hidden="true">
              &#63743;
            </span>
            <span className="nl-store-btn__text">
              <small>Coming soon on the</small>
              <strong>App Store</strong>
            </span>
          </button>
          <button type="button" className="nl-store-btn" disabled title="Coming soon">
            <span className="nl-store-btn__glyph nl-store-btn__glyph--play" aria-hidden="true">
              ▶
            </span>
            <span className="nl-store-btn__text">
              <small>Coming soon on</small>
              <strong>Google Play</strong>
            </span>
          </button>
        </div>
        <p className="nl-footer__copy">© 2026 TataEats. All Rights Reserved</p>
        <p className="nl-footer__legal">
          <a href="#">Terms of Use</a>
          {privacyPolicyUrl ? (
            <a href={privacyPolicyUrl}>Privacy Policy</a>
          ) : (
            <span>Privacy Policy</span>
          )}
        </p>
        <p className="nl-footer__contact">
          Contact us:{' '}
          <a href="mailto:hello@tataeats.com">hello@tataeats.com</a>
        </p>
      </footer>
    </div>
  )
}
