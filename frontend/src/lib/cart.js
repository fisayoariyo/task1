import { useCallback, useEffect, useState } from 'react'
import { CART_DEFAULT, MENU } from './data'
import { getCachedMenuItem } from './menuCache'

function resolveMenuItem(id) {
  return getCachedMenuItem(id) ?? MENU.find((m) => m.id === id)
}

const KEY = 'nomnom-cart'

export function readCart() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return CART_DEFAULT.map((c) => ({ ...c }))
}

export function writeCart(items) {
  localStorage.setItem(KEY, JSON.stringify(items))
}

export function cartTotals(cart) {
  const lines = cart
    .map((c) => {
      const item = resolveMenuItem(c.id)
      return item ? { ...item, qty: c.qty } : null
    })
    .filter(Boolean)
  const itemTotal = lines.reduce((s, l) => s + l.price * l.qty, 0)
  const count = lines.reduce((s, l) => s + l.qty, 0)
  return { lines, itemTotal, count }
}

export function useCart() {
  const [cart, setCartState] = useState(() =>
    typeof window === 'undefined' ? CART_DEFAULT.map((c) => ({ ...c })) : readCart(),
  )

  useEffect(() => {
    writeCart(cart)
  }, [cart])

  const setCart = useCallback((next) => {
    setCartState(next)
  }, [])

  const addItem = useCallback((id) => {
    setCartState((prev) => {
      const existing = prev.find((c) => c.id === id)
      if (existing) {
        return prev.map((c) => (c.id === id ? { ...c, qty: c.qty + 1 } : c))
      }
      return [...prev, { id, qty: 1 }]
    })
  }, [])

  const changeQty = useCallback((id, delta) => {
    setCartState((prev) =>
      prev
        .map((c) => (c.id === id ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0),
    )
  }, [])

  const clear = useCallback(() => setCartState([]), [])

  return { cart, setCart, addItem, changeQty, clear, ...cartTotals(cart) }
}
