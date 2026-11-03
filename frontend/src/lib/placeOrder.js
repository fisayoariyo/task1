/**
 * Place-order entry point. Persists via Nest POST /orders.
 * Payment provider can wrap this later (intent → confirm → order).
 */

import { createOrder } from './api.js'
import { cartRestaurantId, cartRestaurantName, readCart } from './cart.js'

/**
 * @param {{
 *   lines: object[],
 *   grand: number,
 *   count: number,
 *   placeLabel: string,
 *   contact: { name: string, phone: string, email?: string },
 *   instr?: string,
 *   note?: string,
 *   user?: { id: string, fullName: string, email: string } | null,
 *   paymentMethod?: string,
 *   deliveryAddress?: object | null,
 * }} payload
 */
export async function placeOrder(payload) {
  const cart = typeof window !== 'undefined' ? readCart() : []
  const fallbackRestaurantId = cartRestaurantId(cart) || ''
  const fallbackRestaurantName = cartRestaurantName(cart) || ''

  const lines = (payload.lines || []).map((line) => ({
    id: line.id,
    dishId: line.id,
    name: line.name,
    unitPrice: Number(line.unitPrice ?? line.price) || 0,
    qty: Number(line.qty) || 1,
    restaurantId: line.restaurantId || fallbackRestaurantId,
    restaurantName: line.restaurantName || fallbackRestaurantName,
    customisation: line.customisation || null,
  }))

  return createOrder({
    lines,
    grand: payload.grand,
    count: payload.count,
    placeLabel: payload.placeLabel,
    contact: payload.contact,
    note: payload.note || '',
    paymentMethod: payload.paymentMethod || 'upi',
    userId: payload.user?.id ?? null,
    deliveryAddress: payload.deliveryAddress ?? null,
  })
}

/** Validate dispatch contact (name + phone). Email is optional here — required later for guests. */
export function validateOrderContact(contact) {
  const name = String(contact?.name || '').trim()
  const phone = String(contact?.phone || '').trim()
  const email = String(contact?.email || '').trim()
  if (!name || !phone) {
    return { ok: false, message: 'Add your name and phone before placing the order.' }
  }
  return { ok: true, contact: { name, phone, email } }
}

export function validateGuestEmail(email) {
  const value = String(email || '').trim()
  if (!value) return { ok: false, message: 'Email is required for order updates.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return { ok: false, message: 'Enter a valid email address.' }
  }
  return { ok: true, email: value }
}
