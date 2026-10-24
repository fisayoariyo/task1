import { IMG } from './data'

const FALLBACK_REST_IMG = IMG.biryani
const FALLBACK_DISH_IMG = IMG.chicken

export function mapRestaurantCardFromApi(r) {
  const cuisines = String(r.cuisines ?? '').replace(/,\s*/g, ' • ')
  const eta = Number(r.etaMins)
  return {
    id: r.id,
    name: r.name,
    img: r.imageUrl || FALLBACK_REST_IMG,
    rating: r.rating ?? 0,
    ratings: '',
    time: eta > 0 ? `${eta} min` : '30 min',
    cost: r.costForTwo ? `₹${Math.round(r.costForTwo)} for two` : '',
    cuisines,
    offer: r.offer || 'Offers available',
    promo: 'Check cart for delivery fees',
    tag: null,
    tagType: undefined,
  }
}

export function mapMenuItemFromApi(item, categoryName) {
  const price = Math.round(Number(item.price) || 0)
  const was = price > 0 ? Math.round(price * 1.15) : price
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
  }
}
