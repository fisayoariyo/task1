/**
 * Browser cache for BFF GETs so revisiting Discovery/menus doesn't refetch.
 * Nest Redis cache still protects Swiggy; this cuts load on Nest under traffic.
 *
 * Soft TTL: serve instantly without network.
 * In-flight map: coalesce duplicate requests (Strict Mode / parallel mounts).
 */

const memory = new Map()
const inflight = new Map()

const STORAGE_PREFIX = 'tataeats-http:'
const MAX_SESSION_ENTRIES = 24

/** When true, every GET hits the network (live testing). */
function httpCacheDisabled() {
  const v = String(import.meta.env.VITE_DISABLE_HTTP_CACHE ?? '').toLowerCase()
  return v === '1' || v === 'true' || v === 'yes'
}

export const CACHE_TTL = {
  /** Under Nest list soft TTL (5m) so clients expire first. */
  restaurants: 3 * 60 * 1000,
  /** Under Nest menu soft TTL (10m). */
  menu: 8 * 60 * 1000,
  autocomplete: 10 * 60 * 1000,
  /** Food tiles rotate by hour — keep client cache short. */
  foodCategories: 2 * 60 * 1000,
}

function roundCoord(n) {
  return Math.round(Number(n) * 1000) / 1000
}

export function restaurantsCacheKey(lat, lng, offset = 0) {
  return `rest:${roundCoord(lat)}:${roundCoord(lng)}:${Number(offset) || 0}`
}

export function menuCacheKey(id) {
  return `menu:${String(id)}`
}

export function foodCategoriesCacheKey(lat, lng, hour = new Date().getHours()) {
  return `foodcats:${roundCoord(lat)}:${roundCoord(lng)}:${Number(hour) || 0}`
}

function readSessionEntry(key) {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed.exp !== 'number') return null
    if (Date.now() > parsed.exp) {
      sessionStorage.removeItem(STORAGE_PREFIX + key)
      return null
    }
    return { data: parsed.data, exp: parsed.exp }
  } catch {
    return null
  }
}

function writeSession(key, data, ttlMs) {
  if (typeof sessionStorage === 'undefined') return
  try {
    const entry = { exp: Date.now() + ttlMs, data }
    sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry))
    trimSession()
  } catch {
    /* quota / private mode — memory cache still works */
  }
}

function trimSession() {
  if (typeof sessionStorage === 'undefined') return
  const keys = []
  for (let i = 0; i < sessionStorage.length; i++) {
    const k = sessionStorage.key(i)
    if (k && k.startsWith(STORAGE_PREFIX)) keys.push(k)
  }
  if (keys.length <= MAX_SESSION_ENTRIES) return
  const scored = keys.map((k) => {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(k) || '{}')
      return { k, exp: parsed.exp || 0 }
    } catch {
      return { k, exp: 0 }
    }
  })
  scored.sort((a, b) => a.exp - b.exp)
  const drop = scored.length - MAX_SESSION_ENTRIES
  for (let i = 0; i < drop; i++) sessionStorage.removeItem(scored[i].k)
}

function getFresh(key) {
  const mem = memory.get(key)
  if (mem && Date.now() <= mem.exp) return mem.data
  if (mem) memory.delete(key)
  const fromSession = readSessionEntry(key)
  if (fromSession) {
    memory.set(key, { exp: fromSession.exp, data: fromSession.data })
    return fromSession.data
  }
  return null
}

/** Sync read for instant UI on revisit (no loading flash). */
export function peekHttpCache(key) {
  return getFresh(key)
}

/**
 * @template T
 * @param {string} key
 * @param {number} ttlMs
 * @param {() => Promise<T>} fetcher
 * @returns {Promise<T>}
 */
export async function cachedGet(key, ttlMs, fetcher) {
  if (httpCacheDisabled()) {
    return fetcher()
  }

  const hit = getFresh(key)
  if (hit !== null && hit !== undefined) return hit

  const pending = inflight.get(key)
  if (pending) return pending

  const req = (async () => {
    try {
      const data = await fetcher()
      memory.set(key, { exp: Date.now() + ttlMs, data })
      writeSession(key, data, ttlMs)
      return data
    } finally {
      inflight.delete(key)
    }
  })()

  inflight.set(key, req)
  return req
}

/** Drop one key or all TataEats HTTP cache (e.g. after forced refresh). */
export function invalidateHttpCache(key) {
  if (key) {
    memory.delete(key)
    inflight.delete(key)
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(STORAGE_PREFIX + key)
    }
    return
  }
  memory.clear()
  inflight.clear()
  if (typeof sessionStorage === 'undefined') return
  const doomed = []
  for (let i = 0; i < sessionStorage.length; i++) {
    const k = sessionStorage.key(i)
    if (k && k.startsWith(STORAGE_PREFIX)) doomed.push(k)
  }
  doomed.forEach((k) => sessionStorage.removeItem(k))
}
