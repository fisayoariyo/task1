const KEY = 'tataeats-wishlist'

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function write(items) {
  localStorage.setItem(KEY, JSON.stringify(items))
}

export function listWishlist() {
  return read()
}

export function isWishlisted(restaurantId) {
  return read().some((w) => String(w.id) === String(restaurantId))
}

/** @param {{ id: string, name?: string, img?: string }} entry */
export function toggleWishlist(entry) {
  if (!entry?.id) return false
  const id = String(entry.id)
  const cur = read()
  const idx = cur.findIndex((w) => String(w.id) === id)
  if (idx >= 0) {
    cur.splice(idx, 1)
    write(cur)
    return false
  }
  cur.unshift({
    id,
    name: entry.name || `Restaurant ${id}`,
    img: entry.img || '',
  })
  write(cur.slice(0, 50))
  return true
}

export async function shareRestaurant({ title, url }) {
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '')
  const data = {
    title: title || 'TataEats',
    url: shareUrl,
    text: title || 'Check out this restaurant on TataEats',
  }
  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share(data)
      return 'shared'
    }
  } catch (err) {
    if (err?.name === 'AbortError') return 'cancelled'
  }
  try {
    await navigator.clipboard.writeText(shareUrl)
    return 'copied'
  } catch {
    return 'failed'
  }
}
