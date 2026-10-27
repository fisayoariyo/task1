/** Client-side menu item registry so cart can resolve API-loaded dishes by id. */

const KEY = 'tataeats-menu-items'

function readStore() {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return {}
}

export function setMenuItems(items) {
  const map = Object.fromEntries(items.map((item) => [item.id, item]))
  sessionStorage.setItem(KEY, JSON.stringify(map))
}

export function getCachedMenuItem(id) {
  const map = readStore()
  return map[id] ?? null
}

export function flattenMenuDto(menuDto, mapItem) {
  const out = []
  ;(menuDto.categories ?? []).forEach((cat, catId) => {
    for (const item of cat.items ?? []) {
      out.push(mapItem(item, cat.name, catId))
    }
  })
  return out
}
