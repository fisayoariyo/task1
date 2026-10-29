/**
 * Nest BFF client. Base URL from VITE_API_URL (see frontend/.env.example).
 * List/menu responses are cached in the browser (memory + sessionStorage) so
 * revisits don’t refetch; Nest Redis still shields Swiggy under load.
 */

import {
  CACHE_TTL,
  cachedGet,
  foodCategoriesCacheKey,
  menuCacheKey,
  restaurantsCacheKey,
} from './httpCache.js'

/** Empty VITE_API_URL → same-origin (Vite proxy in dev). */
const env = import.meta.env ?? {}
const BASE = String(
  env.VITE_API_URL !== undefined && env.VITE_API_URL !== null
    ? env.VITE_API_URL
    : 'http://localhost:3001',
).replace(/\/$/, '')

async function getJson(path, params = {}) {
  // Do not use `new URL('/x', baseWithPath)` — a leading "/" replaces the base path
  // (e.g. https://tataeats.com/api + /places → https://tataeats.com/places).
  const url = buildApiUrl(path)
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

function buildApiUrl(path) {
  const rel = path.startsWith('/') ? path : `/${path}`
  return BASE ? new URL(`${BASE}${rel}`) : new URL(rel, window.location.origin)
}

async function authRequest(path, method = 'GET', body) {
  const options = { credentials: 'include' }
  if (method !== 'GET') {
    options.method = method
    options.headers = { 'Content-Type': 'application/json' }
    if (body !== undefined) options.body = JSON.stringify(body)
  }

  const res = await fetch(buildApiUrl(path), options)
  if (!res.ok) {
    const payload = await res.json()
    const serverMessage = Array.isArray(payload?.message)
      ? payload.message.join(', ')
      : payload?.message
    const error = new Error(
      typeof serverMessage === 'string' && serverMessage.trim()
        ? serverMessage
        : `API ${res.status} ${path}`,
    )
    error.status = res.status
    throw error
  }
  if (res.status === 204) return undefined
  return res.json()
}

export function apiBaseUrl() {
  return BASE
}

/** @returns {Promise<{ id: string, fullName: string, email: string }>} */
export function getCurrentUser() {
  return authRequest('/auth/me')
}

/** @param {{ email: string, password: string }} credentials */
export function login(credentials) {
  return authRequest('/auth/login', 'POST', credentials)
}

/** @param {{ fullName: string, email: string, password: string }} credentials */
export function register(credentials) {
  return authRequest('/auth/register', 'POST', credentials)
}

export function logout() {
  return authRequest('/auth/logout', 'POST', {})
}

/** @returns {Promise<{ placeId: string, description: string }[]>} */
export async function autocomplete(input) {
  const q = String(input || '').trim().toLowerCase()
  if (q.length < 3) return getJson('/places/autocomplete', { input })
  return cachedGet(`ac:v3:${q}`, CACHE_TTL.autocomplete, () =>
    getJson('/places/autocomplete', { input }),
  )
}

/** @returns {Promise<{ lat: number, lng: number }>} */
export async function geocode(placeId) {
  return getJson('/places/geocode', { placeId })
}

/** @returns {Promise<{ lat: number, lng: number, label: string }>} */
export async function reverseGeocode(lat, lng) {
  return getJson('/places/reverse', { lat, lng })
}

export async function listRestaurants(lat, lng, offset = 0) {
  const key = restaurantsCacheKey(lat, lng, offset)
  return cachedGet(key, CACHE_TTL.restaurants, () =>
    getJson('/restaurants', { lat, lng, offset }),
  )
}

export async function getMenu(id, lat, lng) {
  const key = menuCacheKey(id)
  return cachedGet(key, CACHE_TTL.menu, () =>
    getJson(`/restaurants/${encodeURIComponent(id)}/menu`, { lat, lng }),
  )
}

/**
 * Time-aware food category tiles for the landing page.
 * @returns {Promise<{ title?: string, hour: number, items: { id: string, name: string, imageUrl: string, query?: string }[] }>}
 */
export async function listFoodCategories(lat, lng) {
  const hour = new Date().getHours()
  const key = foodCategoriesCacheKey(lat, lng, hour)
  return cachedGet(key, CACHE_TTL.foodCategories, () =>
    getJson('/restaurants/food-categories', { lat, lng }),
  )
}
