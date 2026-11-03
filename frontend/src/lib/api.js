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

/**
 * Empty VITE_API_URL → same-origin (Vite `/restaurants` proxy in dev).
 * Production builds must set an absolute URL in `.env.production`
 * (`https://tataeats.com/api`). Never bake a bare `/api` through Git Bash —
 * MSYS rewrites it to `C:\Program Files\Git\api` → blocked `file://` fetches.
 */
const env = import.meta.env ?? {}

function normalizeApiBase(raw) {
  const value = String(raw ?? '').trim().replace(/\/$/, '')
  if (!value) return ''
  // Reject Windows / file paths accidentally baked in at build time (MSYS).
  if (/^[a-zA-Z]:[\\/]/.test(value) || value.startsWith('file:')) return ''
  if (/Program Files[\\/]+Git/i.test(value)) return ''
  if (/^https?:\/\//i.test(value)) return value
  // Same-origin prefix — resolve against window.location at request time
  if (value.startsWith('/')) return value
  return ''
}

const BASE = normalizeApiBase(env.VITE_API_URL)

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

function pageOrigin() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return 'http://localhost:3001'
}

function buildApiUrl(path) {
  const rel = path.startsWith('/') ? path : `/${path}`
  if (!BASE) {
    return new URL(rel, pageOrigin())
  }
  if (BASE.startsWith('/')) {
    return new URL(`${BASE}${rel}`, pageOrigin())
  }
  return new URL(`${BASE}${rel}`)
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

/**
 * Location-based restaurant page (Swiggy-style cursor).
 * @param {string} [nextOffset]
 * @param {Record<string, string>|null} [widgetOffset]
 * @returns {Promise<{ restaurants: object[], nextOffset: string|null, widgetOffset: object|null, hasMore: boolean }>}
 */
export async function listRestaurants(lat, lng, nextOffset = '', widgetOffset = null) {
  const key = restaurantsCacheKey(lat, lng, nextOffset)
  const params = { lat, lng }
  if (nextOffset) params.nextOffset = nextOffset
  if (widgetOffset && typeof widgetOffset === 'object') {
    params.widgetOffset = JSON.stringify(widgetOffset)
  }
  // Only cache the first page. Cursor pages must always hit the network —
  // a single empty/error response in sessionStorage poisoned infinite scroll (~42).
  if (nextOffset) {
    return getJson('/restaurants', params)
  }
  return cachedGet(key, CACHE_TTL.restaurants, () => getJson('/restaurants', params))
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

/**
 * Keyword search for current deliver-to coordinates.
 * @param {number|string} lat
 * @param {number|string} lng
 * @param {string} q
 * @param {'restaurant'|'dish'} [tab='restaurant'] BFF tab — restaurant cards or dish groups
 * @returns {Promise<
 *   | { query: string, tab: 'restaurant', restaurants: object[] }
 *   | { query: string, tab: 'dish', groups: { restaurantId: string, restaurantName: string, rating?: number, etaMins?: number, dishes: object[] }[] }
 * >}
 */
export async function searchRestaurants(lat, lng, q, tab = 'restaurant') {
  const query = String(q || '').trim()
  return getJson('/restaurants/search', { lat, lng, q: query, tab })
}

/**
 * As-you-type suggest (Swiggy SUGGEST) for discovery search.
 * @param {number|string} lat
 * @param {number|string} lng
 * @param {string} q
 * @returns {Promise<{ query: string, items: { kind: 'dish'|'restaurant', text: string, imageUrl?: string, restaurantId?: string }[] }>}
 */
export async function suggestRestaurants(lat, lng, q) {
  const query = String(q || '').trim()
  return getJson('/restaurants/suggest', { lat, lng, q: query })
}
