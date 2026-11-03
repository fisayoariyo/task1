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

/** Cart snapshot for a dish search hit. Veg is stored only when the hit says. */
export function menuItemFromDishHit(dish) {
  if (dish?.id == null || String(dish.id).trim() === '') return null
  const item = {
    id: String(dish.id),
    name: String(dish.name ?? ''),
    price: Math.round(Number(dish.price) || 0),
    img: String(dish.imageUrl ?? dish.img ?? '').trim(),
  }
  if (dish.veg === true || dish.veg === false) item.veg = dish.veg
  return item
}

/** Merge one-off hits into the menu cache. Full menu loads still use setMenuItems. */
export function upsertMenuItems(items) {
  const map = readStore()
  for (const item of items ?? []) {
    if (item?.id == null || String(item.id).trim() === '') continue
    const id = String(item.id)
    map[id] = { ...(map[id] || {}), ...item, id }
  }
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
