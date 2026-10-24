/** Default delivery pin when no place has been selected (Mumbai). */
export const DEFAULT_LAT = 19.076
export const DEFAULT_LNG = 72.877
export const DEFAULT_LABEL = 'Mumbai, Maharashtra'

const KEYS = {
  lat: 'nomnom-lat',
  lng: 'nomnom-lng',
  label: 'nomnom-place-label',
  placeId: 'nomnom-place-id',
}

export function getLocation() {
  if (typeof sessionStorage === 'undefined') {
    return { lat: DEFAULT_LAT, lng: DEFAULT_LNG, label: DEFAULT_LABEL }
  }
  const lat = parseFloat(sessionStorage.getItem(KEYS.lat))
  const lng = parseFloat(sessionStorage.getItem(KEYS.lng))
  return {
    lat: Number.isFinite(lat) ? lat : DEFAULT_LAT,
    lng: Number.isFinite(lng) ? lng : DEFAULT_LNG,
    label: sessionStorage.getItem(KEYS.label) || DEFAULT_LABEL,
    placeId: sessionStorage.getItem(KEYS.placeId) || undefined,
  }
}

export function setLocation({ lat, lng, label, placeId }) {
  sessionStorage.setItem(KEYS.lat, String(lat))
  sessionStorage.setItem(KEYS.lng, String(lng))
  if (label) sessionStorage.setItem(KEYS.label, label)
  if (placeId) sessionStorage.setItem(KEYS.placeId, placeId)
}
