const KEY = 'tataeats-guest-contact'

const DEFAULT = { name: '', phone: '' }

export function readGuestContact() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT }
    const parsed = JSON.parse(raw)
    return {
      name: String(parsed?.name || '').trim(),
      phone: String(parsed?.phone || '').trim(),
    }
  } catch {
    return { ...DEFAULT }
  }
}

export function writeGuestContact({ name, phone }) {
  const next = {
    name: String(name || '').trim(),
    phone: String(phone || '').trim(),
  }
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function guestContactLabel(contact = readGuestContact()) {
  const name = contact.name || 'Guest'
  const phone = contact.phone || 'Add phone'
  return `${name} · ${phone}`
}
