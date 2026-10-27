import { IMG } from './data'

const FALLBACK_REST_IMG = IMG.biryani
const FALLBACK_DISH_IMG = IMG.chicken

function freeDeliveryPromo(costForTwo) {
  const n = Number(costForTwo) || 0
  if (n >= 400) return 'Free delivery on ₹199+'
  if (n >= 250) return 'Free delivery on ₹149+'
  if (n > 0) return 'Free delivery on ₹99+'
  return 'Free delivery on ₹149+'
}

function etaRange(eta) {
  if (!(eta > 0)) return '—'
  const lo = Math.max(15, eta - (eta % 5 || 5))
  const hi = lo + 5
  return `${lo}–${hi} min`
}

export function mapRestaurantCardFromApi(r) {
  const cuisines = String(r.cuisines ?? '').replace(/,\s*/g, ' • ')
  const eta = Number(r.etaMins) || 0
  const costForTwo = Number(r.costForTwo) || 0
  const offer = r.offer ? String(r.offer) : ''
  const rating = Number(r.rating) || 0
  const isVeg = Boolean(r.isVeg)
  const ratings = r.totalRatingsString ? String(r.totalRatingsString) : ''
  let tag = null
  let tagType
  if (isVeg) {
    tag = 'Pure Veg'
    tagType = 'veg'
  } else if (rating >= 4.5) {
    tag = 'Bestseller'
    tagType = 'best'
  }
  return {
    id: r.id,
    name: r.name,
    img: r.imageUrl || FALLBACK_REST_IMG,
    rating,
    ratings,
    etaMins: eta,
    time: etaRange(eta),
    costForTwo,
    cost: costForTwo ? `₹${Math.round(costForTwo)} for two` : '',
    cuisines,
    offer,
    isVeg,
    promo: freeDeliveryPromo(costForTwo),
    tag,
    tagType,
  }
}

export function mapMenuItemFromApi(item, categoryName, categoryId = 0) {
  const price = Math.round(Number(item.price) || 0)
  const was = price > 0 ? Math.round(price * 1.15) : price
  const variants = Array.isArray(item.variants) ? item.variants : []
  const addons = Array.isArray(item.addons) ? item.addons : []
  const pricingModels = Array.isArray(item.pricingModels) ? item.pricingModels : []
  const customisable = Boolean(item.customisable) || variants.length > 0 || addons.length > 0
  return {
    id: item.id,
    name: item.name,
    desc: item.description || '',
    price,
    was,
    off: price > 0 && was > price ? `${Math.round((1 - price / was) * 100)}% OFF` : '',
    img: item.imageUrl || FALLBACK_DISH_IMG,
    veg: Boolean(item.isVeg),
    bestseller: Boolean(item.isBestseller),
    cat: categoryName,
    catId: categoryId,
    variants,
    addons,
    pricingModels,
    customisable,
  }
}
