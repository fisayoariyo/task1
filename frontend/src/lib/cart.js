import { useCallback, useEffect, useState } from 'react'
import { getCachedMenuItem } from './menuCache'

const KEY = 'tataeats-cart'

/** Demo dish ids from the old static MENU — never keep these. */
const DEMO_DISH_IDS = new Set(['cdb', 'vgb', 'mutton', 'gulab', 'combo', 'kebab'])

function isDemoDishId(id) {
  return DEMO_DISH_IDS.has(String(id))
}

export function makeLineKey(dishId, selectionIds = []) {
  const ids = [...selectionIds].map(String).filter(Boolean).sort()
  return ids.length ? `${dishId}::${ids.join(',')}` : String(dishId)
}

/**
 * Prefer live menu cache; else use fields saved when the user added the item.
 * Never invent demo dishes.
 */
function resolveLine(entry) {
  if (!entry?.id || isDemoDishId(entry.id)) return null
  const lineKey = entry.lineKey || makeLineKey(entry.id)
  const live = getCachedMenuItem(entry.id)
  if (live && entry.unitPrice == null && !entry.customisation?.length) {
    return { ...live, qty: entry.qty, lineKey, id: entry.id }
  }
  if (entry.name != null && (entry.unitPrice != null || entry.price != null)) {
    return {
      id: entry.id,
      lineKey,
      name: entry.name,
      price: Number(entry.unitPrice ?? entry.price) || 0,
      img: entry.img || live?.img || '',
      veg: entry.veg != null ? Boolean(entry.veg) : Boolean(live?.veg),
      qty: entry.qty,
      customisation: entry.customisation || [],
    }
  }
  if (live) {
    return {
      ...live,
      qty: entry.qty,
      lineKey,
      id: entry.id,
      price: Number(entry.unitPrice ?? live.price) || 0,
      customisation: entry.customisation || [],
    }
  }
  return null
}

export function readCart() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((c) => c?.id && !isDemoDishId(c.id) && Number(c.qty) > 0)
  } catch {
    return []
  }
}

export function writeCart(items) {
  localStorage.setItem(KEY, JSON.stringify(items))
}

export function cartTotals(cart) {
  const lines = cart.map(resolveLine).filter(Boolean)
  const itemTotal = lines.reduce((s, l) => s + l.price * l.qty, 0)
  const count = lines.reduce((s, l) => s + l.qty, 0)
  return { lines, itemTotal, count }
}

/** Restaurant id currently owning the cart (first line wins). */
export function cartRestaurantId(cart) {
  const id = cart.find((c) => c?.restaurantId)?.restaurantId
  return id != null && id !== '' ? String(id) : null
}

export function cartRestaurantName(cart) {
  const row = cart.find((c) => c?.restaurantId)
  return row?.restaurantName ? String(row.restaurantName) : null
}

export function useCart() {
  const [cart, setCartState] = useState(() =>
    typeof window === 'undefined' ? [] : readCart(),
  )

  useEffect(() => {
    writeCart(cart)
  }, [cart])

  const setCart = useCallback((next) => {
    setCartState(next)
  }, [])

  /**
   * Plain ADD (no customisation).
   * @param {string} id
   * @param {{ restaurantId?: string, restaurantName?: string }} [meta]
   */
  const addItem = useCallback((id, meta = {}) => {
    if (isDemoDishId(id)) return
    const live = getCachedMenuItem(id)
    if (!live) return
    const lineKey = makeLineKey(id)
    const restaurantId = meta.restaurantId != null ? String(meta.restaurantId) : undefined
    const restaurantName = meta.restaurantName ? String(meta.restaurantName) : undefined
    setCartState((prev) => {
      const existing = prev.find((c) => (c.lineKey || makeLineKey(c.id)) === lineKey)
      if (existing) {
        return prev.map((c) =>
          (c.lineKey || makeLineKey(c.id)) === lineKey ? { ...c, qty: c.qty + 1 } : c,
        )
      }
      return [
        ...prev,
        {
          id,
          lineKey,
          qty: 1,
          name: live.name,
          price: live.price,
          unitPrice: live.price,
          img: live.img,
          veg: live.veg,
          ...(restaurantId ? { restaurantId } : {}),
          ...(restaurantName ? { restaurantName } : {}),
        },
      ]
    })
  }, [])

  /**
   * ADD after customise sheet.
   * @param {{ id: string, unitPrice: number, selectionIds: string[], customisation: { groupName: string, choiceName: string, price: number }[], restaurantId?: string, restaurantName?: string }} payload
   */
  const addCustomisedItem = useCallback((payload) => {
    const id = payload?.id
    if (!id || isDemoDishId(id)) return
    const live = getCachedMenuItem(id)
    if (!live && payload.name == null) return
    const selectionIds = payload.selectionIds || []
    const lineKey = makeLineKey(id, selectionIds)
    const unitPrice = Math.round(Number(payload.unitPrice) || 0)
    const name = payload.name || live?.name || 'Item'
    const img = payload.img || live?.img || ''
    const veg = payload.veg != null ? Boolean(payload.veg) : Boolean(live?.veg)
    const customisation = payload.customisation || []
    const restaurantId =
      payload.restaurantId != null ? String(payload.restaurantId) : undefined
    const restaurantName = payload.restaurantName
      ? String(payload.restaurantName)
      : undefined

    setCartState((prev) => {
      const existing = prev.find((c) => (c.lineKey || makeLineKey(c.id)) === lineKey)
      if (existing) {
        return prev.map((c) =>
          (c.lineKey || makeLineKey(c.id)) === lineKey ? { ...c, qty: c.qty + 1 } : c,
        )
      }
      return [
        ...prev,
        {
          id,
          lineKey,
          qty: 1,
          name,
          price: unitPrice,
          unitPrice,
          img,
          veg,
          customisation,
          ...(restaurantId ? { restaurantId } : {}),
          ...(restaurantName ? { restaurantName } : {}),
        },
      ]
    })
  }, [])

  const changeQty = useCallback((lineKeyOrId, delta) => {
    const key = String(lineKeyOrId)
    setCartState((prev) =>
      prev
        .map((c) => {
          const k = c.lineKey || makeLineKey(c.id)
          return k === key ? { ...c, qty: c.qty + delta } : c
        })
        .filter((c) => c.qty > 0),
    )
  }, [])

  const clear = useCallback(() => setCartState([]), [])

  /**
   * Wipe cart then add one item — used after “YES, START AFRESH”.
   * @param {'plain'|'custom'} kind
   * @param {string|object} payload dish id for plain, customise payload for custom
   * @param {{ restaurantId: string, restaurantName?: string }} meta
   */
  const replaceCartWithItem = useCallback((kind, payload, meta = {}) => {
    const restaurantId =
      meta.restaurantId != null ? String(meta.restaurantId) : undefined
    const restaurantName = meta.restaurantName
      ? String(meta.restaurantName)
      : undefined
    const restMeta = {
      ...(restaurantId ? { restaurantId } : {}),
      ...(restaurantName ? { restaurantName } : {}),
    }

    if (kind === 'custom') {
      const id = payload?.id
      if (!id || isDemoDishId(id)) return
      const live = getCachedMenuItem(id)
      if (!live && payload.name == null) return
      const selectionIds = payload.selectionIds || []
      const lineKey = makeLineKey(id, selectionIds)
      const unitPrice = Math.round(Number(payload.unitPrice) || 0)
      setCartState([
        {
          id,
          lineKey,
          qty: 1,
          name: payload.name || live?.name || 'Item',
          price: unitPrice,
          unitPrice,
          img: payload.img || live?.img || '',
          veg: payload.veg != null ? Boolean(payload.veg) : Boolean(live?.veg),
          customisation: payload.customisation || [],
          ...restMeta,
        },
      ])
      return
    }

    const id = payload
    if (!id || isDemoDishId(id)) return
    const live = getCachedMenuItem(id)
    if (!live) return
    setCartState([
      {
        id,
        lineKey: makeLineKey(id),
        qty: 1,
        name: live.name,
        price: live.price,
        unitPrice: live.price,
        img: live.img,
        veg: live.veg,
        ...restMeta,
      },
    ])
  }, [])

  return {
    cart,
    setCart,
    addItem,
    addCustomisedItem,
    replaceCartWithItem,
    changeQty,
    clear,
    restaurantId: cartRestaurantId(cart),
    restaurantName: cartRestaurantName(cart),
    ...cartTotals(cart),
  }
}
