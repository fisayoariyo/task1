/* Shared UI helpers + mock data for nomnom */

const LOGO_SVG = `
<svg class="logo-mark" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path fill="currentColor" d="M16 3.2c-5.2 0-9.4 3.5-9.4 8.6 0 6.4 7.2 12.8 9 14.1.2.2.6.2.8 0 1.8-1.3 9-7.7 9-14.1C25.4 6.7 21.2 3.2 16 3.2z"/>
  <path fill="#fff" d="M16.2 9.2c-1.8-.9-4 .2-4.1 2.3-.1 1.4.7 2.5 1.7 3.3l.1.1c.4-1.6 1.5-2.9 3.1-3.5.6-.2 1.2-.3 1.8-.2-.3-1-.9-1.7-2.6-2z"/>
  <path fill="#fff" opacity=".9" d="M19.8 12.1c-.9-.4-2-.3-2.9.2 1.4.7 2.3 2 2.4 3.5.8-.8 1.2-1.9 1.1-3.1 0-.2-.2-.5-.6-.6z"/>
</svg>`;

function logoHTML(extraClass = "") {
  return `<a href="../index.html" class="logo ${extraClass}">${LOGO_SVG}<span>nomnom</span></a>`;
}

function logoHTMLRoot(extraClass = "") {
  return `<a href="index.html" class="logo ${extraClass}">${LOGO_SVG}<span>nomnom</span></a>`;
}

function statusBarHTML() {
  return `
  <div class="status-bar" aria-hidden="true">
    <span>9:41</span>
    <div class="status-bar__icons">
      <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><rect x="0" y="3" width="3" height="9" rx="0.5"/><rect x="4.5" y="1.5" width="3" height="10.5" rx="0.5"/><rect x="9" y="0" width="3" height="12" rx="0.5"/><rect x="13.5" y="2" width="2.5" height="10" rx="0.5" opacity=".35"/></svg>
      <svg width="15" height="12" viewBox="0 0 15 12" fill="currentColor"><path d="M7.5 3.5c1.8 0 3.4.7 4.6 1.9l1.2-1.2A8.1 8.1 0 007.5 2 8.1 8.1 0 001.7 4.2l1.2 1.2A6.5 6.5 0 017.5 3.5zm0 3c1 0 1.9.4 2.6 1.1l1.2-1.2A5 5 0 007.5 5 5 5 0 003.7 6.4l1.2 1.2A3.7 3.7 0 017.5 6.5zm0 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"/></svg>
      <svg width="25" height="12" viewBox="0 0 25 12" fill="currentColor"><rect x="0" y="1" width="21" height="10" rx="2" stroke="currentColor" stroke-width="1" fill="none"/><rect x="2" y="3" width="15" height="6" rx="1"/><rect x="22" y="3.5" width="2.5" height="5" rx="0.5" opacity=".4"/></svg>
    </div>
  </div>`;
}

const IMG = {
  biryani: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&q=80",
  pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80",
  burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
  dosa: "https://images.unsplash.com/photo-1630383249896-424e482df921?w=600&q=80",
  north: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80",
  rolls: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&q=80",
  dessert: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80",
  chinese: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&q=80",
  healthy: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80",
  south: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&q=80",
  heroFood: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&q=80",
  takeout: "https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?w=800&q=80",
  gulab: "https://images.unsplash.com/photo-1666190092159-3171cf0fbb12?w=400&q=80",
  chicken: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80",
  gift: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&q=80",
  phone: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&q=80",
};

const CATEGORIES = [
  { name: "Biryani", img: IMG.biryani },
  { name: "Burgers", img: IMG.burger },
  { name: "Pizza", img: IMG.pizza },
  { name: "Dosa & Idli", img: IMG.dosa },
  { name: "North Indian", img: IMG.north },
  { name: "Rolls & Wraps", img: IMG.rolls },
  { name: "Desserts", img: IMG.dessert },
];

const DISCOVERY_CATS = [
  { name: "All", icon: true },
  { name: "Biryani", img: IMG.biryani },
  { name: "Pizza", img: IMG.pizza },
  { name: "Burgers", img: IMG.burger },
  { name: "South Indian", img: IMG.south },
  { name: "North Indian", img: IMG.north },
  { name: "Chinese", img: IMG.chinese },
  { name: "Rolls & Wraps", img: IMG.rolls },
  { name: "Desserts", img: IMG.dessert },
  { name: "Healthy", img: IMG.healthy },
];

const RESTAURANTS = [
  {
    id: "royal",
    name: "Royal Biryani House",
    img: IMG.biryani,
    rating: 4.5,
    ratings: "2.8K+",
    time: "25–30 min",
    cost: "₹199 for two",
    cuisines: "Biryani • Mughlai • North Indian",
    offer: "20% OFF up to ₹100",
    promo: "Free delivery on ₹199+",
    tag: "Pure Veg",
    tagType: "veg",
  },
  {
    id: "spice",
    name: "Spice Route Kitchen",
    img: IMG.north,
    rating: 4.3,
    ratings: "1.2K+",
    time: "30–35 min",
    cost: "₹249 for two",
    cuisines: "North Indian • Punjabi",
    offer: "Flat ₹75 OFF",
    promo: "Free delivery on ₹199+",
    tag: "Bestseller",
    tagType: "best",
  },
  {
    id: "crust",
    name: "Crust & Co. Pizza",
    img: IMG.pizza,
    rating: 4.6,
    ratings: "4.1K+",
    time: "20–25 min",
    cost: "₹299 for two",
    cuisines: "Pizza • Italian • Fast Food",
    offer: "Buy 1 Get 1",
    promo: "Free delivery on ₹299+",
    tag: "Bestseller",
    tagType: "best",
  },
  {
    id: "bun",
    name: "Bun Street Burgers",
    img: IMG.burger,
    rating: 4.2,
    ratings: "890+",
    time: "25–30 min",
    cost: "₹199 for two",
    cuisines: "Burgers • American",
    offer: "15% OFF",
    promo: "Free delivery on ₹149+",
    tag: null,
  },
  {
    id: "dosa",
    name: "Dosa Corner",
    img: IMG.dosa,
    rating: 4.7,
    ratings: "3.5K+",
    time: "20–25 min",
    cost: "₹149 for two",
    cuisines: "South Indian • Dosa",
    offer: "Flat ₹50 OFF",
    promo: "Free delivery on ₹99+",
    tag: "Pure Veg",
    tagType: "veg",
  },
  {
    id: "wok",
    name: "Wok Express",
    img: IMG.chinese,
    rating: 4.1,
    ratings: "650+",
    time: "30–40 min",
    cost: "₹249 for two",
    cuisines: "Chinese • Asian",
    offer: "20% OFF",
    promo: "Free delivery on ₹199+",
    tag: null,
  },
  {
    id: "wrap",
    name: "Roll House",
    img: IMG.rolls,
    rating: 4.4,
    ratings: "1.1K+",
    time: "20–25 min",
    cost: "₹179 for two",
    cuisines: "Rolls • Wraps • Street Food",
    offer: "₹40 OFF",
    promo: "Free delivery on ₹149+",
    tag: "Bestseller",
    tagType: "best",
  },
  {
    id: "sweet",
    name: "Sweet Ending",
    img: IMG.dessert,
    rating: 4.8,
    ratings: "2.2K+",
    time: "25–30 min",
    cost: "₹199 for two",
    cuisines: "Desserts • Bakery",
    offer: "10% OFF",
    promo: "Free delivery on ₹199+",
    tag: "Pure Veg",
    tagType: "veg",
  },
];

const MENU = [
  {
    id: "cdb",
    name: "Chicken Dum Biryani",
    desc: "Slow-cooked basmati rice with tender chicken, saffron & spices.",
    price: 249,
    was: 299,
    off: "17% OFF",
    img: IMG.chicken,
    veg: false,
    bestseller: true,
    cat: "Recommended",
  },
  {
    id: "vgb",
    name: "Veg Dum Biryani",
    desc: "Fragrant rice with mixed vegetables and house spice blend.",
    price: 199,
    was: 249,
    off: "20% OFF",
    img: IMG.biryani,
    veg: true,
    cat: "Recommended",
  },
  {
    id: "mutton",
    name: "Mutton Biryani",
    desc: "Succulent mutton pieces layered with premium basmati.",
    price: 349,
    was: 399,
    off: "13% OFF",
    img: IMG.biryani,
    veg: false,
    cat: "Biryani",
  },
  {
    id: "gulab",
    name: "Gulab Jamun (2 pcs)",
    desc: "Soft milk dumplings soaked in warm cardamom syrup.",
    price: 90,
    was: 120,
    off: "25% OFF",
    img: IMG.gulab,
    veg: true,
    cat: "Desserts",
  },
  {
    id: "combo",
    name: "Biryani Combo Meal",
    desc: "Chicken biryani + raita + gulab jamun + soft drink.",
    price: 329,
    was: 399,
    off: "18% OFF",
    img: IMG.takeout,
    veg: false,
    cat: "Combos",
  },
  {
    id: "kebab",
    name: "Chicken Seekh Kebab",
    desc: "Charcoal-grilled minced chicken with mint chutney.",
    price: 219,
    was: 259,
    off: "15% OFF",
    img: IMG.chicken,
    veg: false,
    cat: "Starters",
  },
];

const CART_DEFAULT = [
  { id: "cdb", qty: 1 },
  { id: "gulab", qty: 1 },
];

function icon(name, size = 20) {
  const icons = {
    gift: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18M12 8c-2-3-5-4-5-2s2 2 5 2zm0 0c2-3 5-4 5-2s-2 2-5 2z"/></svg>`,
    pin: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>`,
    search: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
    heart: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
    cart: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>`,
    shoppingCart: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>`,
    user: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    home: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    bag: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
    shoppingBag: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
    list: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/></svg>`,
    clipboardList: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>`,
    back: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`,
    close: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
    filter: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M7 12h10"/><path d="M10 18h4"/></svg>`,
    slidersHorizontal: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/></svg>`,
    settings2: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>`,
    star: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>`,
    percent: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" x2="5" y1="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>`,
    leaf: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
    clock: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    bike: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h3"/></svg>`,
    phone: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>`,
    phoneCall: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
    door: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"/><path d="M2 20h20"/><path d="M14 12v.01"/></svg>`,
    fileText: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`,
    store: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M10 22V12a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v10"/><path d="M15 7a3 3 0 1 0-6 0"/><path d="M2 7h20"/></svg>`,
    bolt: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>`,
    zap: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>`,
    share: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>`,
    locate: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" x2="5" y1="12" y2="12"/><line x1="19" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="5"/><line x1="12" x2="12" y1="19" y2="22"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/></svg>`,
    chevron: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`,
    chevronDown: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`,
    image: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
    grid: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>`,
    layoutGrid: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>`,
    shield: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z"/></svg>`,
    shieldCheck: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z" fill="#fff" stroke="#fff" stroke-width="1"/><path d="m9 12 2 2 4-4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    receipt: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2Z"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h5"/></svg>`,
    tag: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 12l-8 8-9-9V3h8l9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>`,
    info: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg>`,
    utensils: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v7a2 2 0 002 2h0a2 2 0 002-2V3M10 12v9M16 3v18M16 3c2 2 2 4 0 6"/></svg>`,
    chefHat: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><line x1="6" x2="18" y1="17" y2="17"/></svg>`,
    globe: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.8 3.8 5.8 3.8 9S14.5 18.2 12 21c-2.5-2.8-3.8-5.8-3.8-9S9.5 5.8 12 3z"/></svg>`,
    bulb: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6M10 21h4M12 3a6 6 0 00-4 10.5V15h8v-1.5A6 6 0 0012 3z"/></svg>`,
    creditCard: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>`,
    landmark: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>`,
    wallet: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>`,
    banknote: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>`,
    percentBadge: `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="currentColor"/><circle cx="8.5" cy="8.5" r="1.85" fill="#fff"/><circle cx="15.5" cy="15.5" r="1.85" fill="#fff"/><line x1="15.8" y1="8.2" x2="8.2" y2="15.8" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>`,
    upi: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M4 16.5 10.2 4.8c.35-.66 1.25-.66 1.6 0L18 16.5" stroke="#097939" stroke-width="2.2" stroke-linecap="round"/><path d="M8 16.5 12.2 7.8c.3-.6 1.1-.6 1.4 0L18 16.5" stroke="#ED6B00" stroke-width="2.2" stroke-linecap="round"/><path d="M7 19h10" stroke="#097939" stroke-width="2" stroke-linecap="round"/></svg>`,
  };
  return icons[name] || "";
}

function formatINR(n) {
  return `₹${n}`;
}

function getCart() {
  try {
    const raw = localStorage.getItem("nomnom-cart");
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return CART_DEFAULT.map((c) => ({ ...c }));
}

function setCart(items) {
  localStorage.setItem("nomnom-cart", JSON.stringify(items));
}

function cartLines() {
  return getCart()
    .map((c) => {
      const item = MENU.find((m) => m.id === c.id);
      return item ? { ...item, qty: c.qty } : null;
    })
    .filter(Boolean);
}

function cartTotals() {
  const lines = cartLines();
  const itemTotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  return { lines, itemTotal, count };
}
