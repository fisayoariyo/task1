/** Minimum trimmed query before discovery search runs. */
export const MIN_SEARCH_QUERY = 3

function readParam(source, key) {
  if (!source) return ''
  if (typeof source.get === 'function') return source.get(key) ?? ''
  return source[key] ?? ''
}

/** URL tab is plural. Only an explicit `restaurants` value leaves the Dishes default. */
export function normalizeRouteTab(tab) {
  return String(tab || '').trim().toLowerCase() === 'restaurants' ? 'restaurants' : 'dishes'
}

/** Map the plural route tab onto the BFF's singular `tab` query. */
export function apiTabForRoute(routeTab) {
  return normalizeRouteTab(routeTab) === 'restaurants' ? 'restaurant' : 'dish'
}

/**
 * @param {URLSearchParams|{ q?: string, tab?: string }|null|undefined} source
 */
export function parseDiscoverySearch(source) {
  const query = String(readParam(source, 'q')).trim()
  const routeTab = normalizeRouteTab(readParam(source, 'tab'))
  return {
    query,
    routeTab,
    apiTab: apiTabForRoute(routeTab),
    ready: query.length >= MIN_SEARCH_QUERY,
  }
}

/** Restaurants tab → menu with no search filter. */
export function restaurantMenuPath(id) {
  return `/restaurant/${encodeURIComponent(String(id))}`
}

/** Dishes group header → menu filtered by the current search query. */
export function dishGroupMenuPath(id, query) {
  const q = String(query ?? '').trim()
  return `/restaurant/${encodeURIComponent(String(id))}?query=${encodeURIComponent(q)}`
}
