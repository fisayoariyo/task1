/**
 * Nest BFF client. Base URL from VITE_API_URL (see frontend/.env.example).
 * On fetch failure, pages fall back to static data in data.js so the UI still works offline.
 */

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

async function getJson(path, params = {}) {
  const url = new URL(path, BASE)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  }
  const res = await fetch(url)
  if (!res.ok) {
    const err = new Error(`API ${res.status} ${path}`)
    err.status = res.status
    throw err
  }
  return res.json()
}

export function apiBaseUrl() {
  return BASE
}

/** @returns {Promise<{ placeId: string, description: string }[]>} */
export async function autocomplete(input) {
  return getJson('/places/autocomplete', { input })
}

/** @returns {Promise<{ lat: number, lng: number }>} */
export async function geocode(placeId) {
  return getJson('/places/geocode', { placeId })
}

export async function listRestaurants(lat, lng, offset = 0) {
  return getJson('/restaurants', { lat, lng, offset })
}

export async function getMenu(id, lat, lng) {
  return getJson(`/restaurants/${encodeURIComponent(id)}/menu`, { lat, lng })
}
