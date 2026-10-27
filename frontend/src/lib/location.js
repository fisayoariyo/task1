/** Default delivery pin when no place has been selected (Mumbai). */
export const DEFAULT_LAT = 19.076
export const DEFAULT_LNG = 72.877
export const DEFAULT_LABEL = 'Mumbai, Maharashtra'

const KEYS = {
  lat: 'tataeats-lat',
  lng: 'tataeats-lng',
  label: 'tataeats-place-label',
  placeId: 'tataeats-place-id',
  prev: 'tataeats-place-prev',
  /** Set when the user has committed an address (survives forever). */
  saved: 'tataeats-loc-saved',
}

/** ~100 years — “last never” for a saved delivery address. */
const COOKIE_MAX_AGE_SEC = 100 * 365 * 24 * 60 * 60

function canUseDom() {
  return typeof document !== 'undefined'
}

function setCookie(name, value) {
  if (!canUseDom()) return
  const encoded = encodeURIComponent(String(value ?? ''))
  document.cookie = `${name}=${encoded};path=/;max-age=${COOKIE_MAX_AGE_SEC};SameSite=Lax`
}

function getCookie(name) {
  if (!canUseDom()) return null
  const prefix = `${name}=`
  const parts = document.cookie.split(';')
  for (const part of parts) {
    const row = part.trim()
    if (row.startsWith(prefix)) {
      try {
        return decodeURIComponent(row.slice(prefix.length))
      } catch {
        return row.slice(prefix.length)
      }
    }
  }
  return null
}

function removeCookie(name) {
  if (!canUseDom()) return
  document.cookie = `${name}=;path=/;max-age=0;SameSite=Lax`
}

/** One-time bridge: older builds used sessionStorage. */
function migrateFromSession() {
  if (typeof sessionStorage === 'undefined') return
  if (getCookie(KEYS.saved) === '1') return
  const lat = sessionStorage.getItem(KEYS.lat)
  const lng = sessionStorage.getItem(KEYS.lng)
  if (lat == null || lng == null) return
  setCookie(KEYS.lat, lat)
  setCookie(KEYS.lng, lng)
  const label = sessionStorage.getItem(KEYS.label)
  if (label) setCookie(KEYS.label, label)
  const placeId = sessionStorage.getItem(KEYS.placeId)
  if (placeId) setCookie(KEYS.placeId, placeId)
  const prev = sessionStorage.getItem(KEYS.prev)
  if (prev) setCookie(KEYS.prev, prev)
  setCookie(KEYS.saved, '1')
  ;[KEYS.lat, KEYS.lng, KEYS.label, KEYS.placeId, KEYS.prev].forEach((k) =>
    sessionStorage.removeItem(k),
  )
}

function samePlace(a, b) {
  if (!a || !b) return false
  if (a.placeId && b.placeId && a.placeId === b.placeId) return true
  return (
    Math.abs(Number(a.lat) - Number(b.lat)) < 1e-5 &&
    Math.abs(Number(a.lng) - Number(b.lng)) < 1e-5
  )
}

/** True when the user has saved a delivery address (returning visits). */
export function hasSavedLocation() {
  migrateFromSession()
  return getCookie(KEYS.saved) === '1'
}

export function getLocation() {
  migrateFromSession()
  if (!canUseDom()) {
    return { lat: DEFAULT_LAT, lng: DEFAULT_LNG, label: DEFAULT_LABEL }
  }
  const lat = parseFloat(getCookie(KEYS.lat))
  const lng = parseFloat(getCookie(KEYS.lng))
  return {
    lat: Number.isFinite(lat) ? lat : DEFAULT_LAT,
    lng: Number.isFinite(lng) ? lng : DEFAULT_LNG,
    label: getCookie(KEYS.label) || DEFAULT_LABEL,
    placeId: getCookie(KEYS.placeId) || undefined,
  }
}

/** Last committed address before the most recent change (for Cancel / undo). */
export function getPreviousLocation() {
  migrateFromSession()
  if (!canUseDom()) return null
  try {
    const raw = getCookie(KEYS.prev)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Number.isFinite(parsed?.lat) || !Number.isFinite(parsed?.lng)) return null
    return {
      lat: parsed.lat,
      lng: parsed.lng,
      label: parsed.label || DEFAULT_LABEL,
      placeId: parsed.placeId || undefined,
    }
  } catch {
    return null
  }
}

function writePrevious(loc) {
  if (!canUseDom() || !loc) return
  setCookie(
    KEYS.prev,
    JSON.stringify({
      lat: loc.lat,
      lng: loc.lng,
      label: loc.label,
      placeId: loc.placeId,
    }),
  )
}

function clearPrevious() {
  removeCookie(KEYS.prev)
}

/**
 * Save a new delivery pin forever (cookies). Remembers the prior pin for Cancel / undo.
 */
export function setLocation({ lat, lng, label, placeId }) {
  const next = {
    lat,
    lng,
    label: label || DEFAULT_LABEL,
    placeId,
  }
  const current = getLocation()
  if (hasSavedLocation() && !samePlace(current, next)) {
    writePrevious(current)
  }
  setCookie(KEYS.lat, String(lat))
  setCookie(KEYS.lng, String(lng))
  if (label) setCookie(KEYS.label, label)
  else removeCookie(KEYS.label)
  if (placeId) setCookie(KEYS.placeId, placeId)
  else removeCookie(KEYS.placeId)
  setCookie(KEYS.saved, '1')
}

/**
 * Restore the previous pin (if any). Clears the undo slot so Cancel won’t bounce
 * between two empty/covered areas. Returns the restored location, or null.
 */
export function restorePreviousLocation() {
  const prev = getPreviousLocation()
  if (!prev) return null
  clearPrevious()
  // Do not call setLocation (that would re-stash current as previous).
  setCookie(KEYS.lat, String(prev.lat))
  setCookie(KEYS.lng, String(prev.lng))
  setCookie(KEYS.label, prev.label || DEFAULT_LABEL)
  if (prev.placeId) setCookie(KEYS.placeId, prev.placeId)
  else removeCookie(KEYS.placeId)
  setCookie(KEYS.saved, '1')
  return getLocation()
}

export function shortPlaceLabel(label, parts = 2) {
  if (!label) return 'your area'
  return (
    String(label)
      .split(',')
      .slice(0, parts)
      .map((s) => s.trim())
      .filter(Boolean)
      .join(', ') || label
  )
}
