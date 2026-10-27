import {
  FoodCategoriesDto,
  FoodCategory,
  MenuDto,
  PlaceSuggestion,
  RestaurantCard,
  RestaurantSource,
} from './restaurant-source';

/** Real image URLs for localhost mock (Cloudinary mock ids 404). */
const IMG = {
  misal:
    'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&q=80',
  kebab:
    'https://images.unsplash.com/photo-1599487488170-d11ec9c172f3?w=600&q=80',
  seafood:
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=80',
  pizza:
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80',
  bakery:
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80',
  mangalore:
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80',
};

const PLACES: PlaceSuggestion[] = [
  {
    placeId: 'mock-place-1',
    description: 'Mumbai, Maharashtra, India',
    mainText: 'Mumbai',
    secondaryText: 'Maharashtra, India',
  },
  {
    placeId: 'mock-place-2',
    description: 'Bandra West, Mumbai, Maharashtra, India',
    mainText: 'Bandra West',
    secondaryText: 'Mumbai, Maharashtra, India',
  },
  {
    placeId: 'mock-place-3',
    description: 'Andheri East, Mumbai, Maharashtra, India',
    mainText: 'Andheri East',
    secondaryText: 'Mumbai, Maharashtra, India',
  },
  {
    placeId: 'mock-place-4',
    description: 'Colaba, Mumbai, Maharashtra, India',
    mainText: 'Colaba',
    secondaryText: 'Mumbai, Maharashtra, India',
  },
];

const RESTAURANTS: RestaurantCard[] = [
  {
    id: 'mock-rest-1',
    name: 'Trupti Misal',
    cuisines: 'Maharashtrian, Street Food',
    rating: 4.4,
    etaMins: 28,
    costForTwo: 350,
    imageUrl: IMG.misal,
    offer: '20% off up to ₹50',
    isVeg: true,
    totalRatingsString: '1.2K+',
  },
  {
    id: 'mock-rest-2',
    name: 'Bademiya Kebabs',
    cuisines: 'Mughlai, Kebabs',
    rating: 4.2,
    etaMins: 35,
    costForTwo: 600,
    imageUrl: IMG.kebab,
    totalRatingsString: '890+',
  },
  {
    id: 'mock-rest-3',
    name: 'Gajalee Seafood',
    cuisines: 'Seafood, Malvani, Coastal',
    rating: 4.5,
    etaMins: 42,
    costForTwo: 1200,
    imageUrl: IMG.seafood,
    offer: 'Free delivery',
    totalRatingsString: '2.1K+',
  },
  {
    id: 'mock-rest-4',
    name: 'Pizza By The Bay',
    cuisines: 'Italian, Pizza, Continental',
    rating: 4.3,
    etaMins: 38,
    costForTwo: 900,
    imageUrl: IMG.pizza,
    totalRatingsString: '3.4K+',
  },
  {
    id: 'mock-rest-5',
    name: 'Kyani & Co.',
    cuisines: 'Irani, Bakery, Breakfast',
    rating: 4.1,
    etaMins: 25,
    costForTwo: 450,
    imageUrl: IMG.bakery,
    isVeg: true,
    totalRatingsString: '650+',
  },
  {
    id: 'mock-rest-6',
    name: 'Mahesh Lunch Home',
    cuisines: 'Seafood, Mangalorean',
    rating: 4.6,
    etaMins: 40,
    costForTwo: 1100,
    imageUrl: IMG.mangalore,
    totalRatingsString: '4.8K+',
  },
  {
    id: 'mock-rest-7',
    name: 'The Green Bowl',
    cuisines: 'Healthy, Salads, Bowls',
    rating: 4.7,
    etaMins: 22,
    costForTwo: 400,
    imageUrl: IMG.bakery,
    offer: 'Flat ₹60 OFF',
    isVeg: true,
    totalRatingsString: '1.6K+',
  },
  {
    id: 'mock-rest-8',
    name: 'Wok & Roll',
    cuisines: 'Chinese, Momos, Asian',
    rating: 4.3,
    etaMins: 30,
    costForTwo: 500,
    imageUrl: IMG.kebab,
    offer: '20% OFF up to ₹80',
    totalRatingsString: '1.6K+',
  },
  {
    id: 'mock-rest-9',
    name: 'Behrouz Biryani',
    cuisines: 'Biryani, North Indian, Kebabs',
    rating: 4.4,
    etaMins: 36,
    costForTwo: 700,
    imageUrl: IMG.misal,
    offer: 'Free delivery on ₹199+',
    totalRatingsString: '3.9K+',
  },
  {
    id: 'mock-rest-10',
    name: 'Domino\'s Pizza',
    cuisines: 'Pizza, Fast Food, Italian',
    rating: 4.1,
    etaMins: 28,
    costForTwo: 450,
    imageUrl: IMG.pizza,
    offer: 'Buy 1 Get 1',
    totalRatingsString: '12K+',
  },
  {
    id: 'mock-rest-11',
    name: 'Burger Singh',
    cuisines: 'Burgers, American, Fast Food',
    rating: 4.2,
    etaMins: 25,
    costForTwo: 400,
    imageUrl: IMG.kebab,
    isVeg: true,
    totalRatingsString: '2.4K+',
  },
  {
    id: 'mock-rest-12',
    name: 'Saravana Bhavan',
    cuisines: 'South Indian, Vegetarian',
    rating: 4.5,
    etaMins: 32,
    costForTwo: 500,
    imageUrl: IMG.bakery,
    isVeg: true,
    totalRatingsString: '5.1K+',
  },
  {
    id: 'mock-rest-13',
    name: 'Punjabi Tadka',
    cuisines: 'North Indian, Punjabi, Tandoor',
    rating: 4.3,
    etaMins: 40,
    costForTwo: 650,
    imageUrl: IMG.mangalore,
    offer: '15% OFF',
    totalRatingsString: '1.8K+',
  },
  {
    id: 'mock-rest-14',
    name: 'Wow! Momo',
    cuisines: 'Chinese, Momos, Tibetan',
    rating: 4.0,
    etaMins: 24,
    costForTwo: 350,
    imageUrl: IMG.seafood,
    totalRatingsString: '6.2K+',
  },
  {
    id: 'mock-rest-15',
    name: 'Faasos Wraps',
    cuisines: 'Rolls & Wraps, Fast Food',
    rating: 4.2,
    etaMins: 27,
    costForTwo: 300,
    imageUrl: IMG.kebab,
    offer: 'Flat ₹40 OFF',
    totalRatingsString: '4.0K+',
  },
  {
    id: 'mock-rest-16',
    name: 'Sweet Truth',
    cuisines: 'Desserts, Bakery, Ice Cream',
    rating: 4.6,
    etaMins: 33,
    costForTwo: 400,
    imageUrl: IMG.bakery,
    isVeg: true,
    totalRatingsString: '2.7K+',
  },
];

const MENUS: Record<string, MenuDto> = {
  'mock-rest-1': {
    restaurantId: 'mock-rest-1',
    restaurantName: 'Trupti Misal',
    about: {
      cuisines: 'Maharashtrian, Street Food',
      city: 'Mumbai',
      areaName: 'Dadar',
      locality: 'Dadar West',
      address: 'Near Plaza Cinema, N.C. Kelkar Road, Dadar West, Mumbai 400028',
      costForTwoMessage: '₹350 for two',
      rating: 4.4,
      totalRatingsString: '1.2K+',
      imageUrl: IMG.misal,
      offer: '20% OFF up to ₹50',
      isVeg: true,
      etaMins: 28,
      slaString: '25-30 mins',
      distance: '1.8 km',
      isOpen: true,
      closesAt: '12:00 am',
      openingHours: [
        { day: 'Monday', time: '11:00 am – 12:00 am' },
        { day: 'Tuesday', time: '11:00 am – 12:00 am' },
        { day: 'Wednesday', time: '11:00 am – 12:00 am' },
        { day: 'Thursday', time: '11:00 am – 12:00 am' },
        { day: 'Friday', time: '11:00 am – 12:30 am' },
        { day: 'Saturday', time: '11:00 am – 12:30 am' },
        { day: 'Sunday', time: '11:00 am – 12:00 am' },
      ],
    },
    categories: [
      {
        name: 'Misal & More',
        items: [
          {
            id: 'item-1',
            name: 'Kolhapuri Misal',
            description: 'Spicy usal topped with farsan, onions, and lemon',
            price: 120,
            isVeg: true,
            isBestseller: true,
            imageUrl: IMG.misal,
            customisable: true,
            variants: [
              {
                id: 'misal-size',
                name: 'Choose Size',
                min: 1,
                max: 1,
                choices: [
                  { id: 'reg', name: 'Regular', price: 0, isVeg: true, isDefault: true },
                  { id: 'jumbo', name: 'Jumbo', price: 40, isVeg: true },
                ],
              },
              {
                id: 'misal-spice',
                name: 'Spice level',
                min: 1,
                max: 1,
                choices: [
                  { id: 'mild', name: 'Mild', price: 0, isVeg: true, isDefault: true },
                  { id: 'medium', name: 'Medium', price: 0, isVeg: true },
                  { id: 'extra', name: 'Extra spicy', price: 10, isVeg: true },
                ],
              },
            ],
            pricingModels: [
              {
                variationIds: ['reg', 'mild'],
                price: 120,
                addonIds: ['pav', 'farsan', 'curd'],
              },
              {
                variationIds: ['reg', 'medium'],
                price: 120,
                addonIds: ['pav', 'farsan', 'curd'],
              },
              {
                variationIds: ['reg', 'extra'],
                price: 130,
                addonIds: ['pav', 'farsan', 'curd'],
              },
              {
                variationIds: ['jumbo', 'mild'],
                price: 160,
                addonIds: ['pav', 'farsan', 'curd', 'papad'],
              },
              {
                variationIds: ['jumbo', 'medium'],
                price: 160,
                addonIds: ['pav', 'farsan', 'curd', 'papad'],
              },
              {
                variationIds: ['jumbo', 'extra'],
                price: 170,
                addonIds: ['pav', 'farsan', 'curd', 'papad'],
              },
            ],
            addons: [
              {
                id: 'misal-sides',
                name: 'Choose your Sides (optional)',
                min: 0,
                max: 3,
                choices: [
                  { id: 'pav', name: 'Extra Pav (2 pcs)', price: 20, isVeg: true },
                  { id: 'farsan', name: 'Extra Farsan', price: 15, isVeg: true },
                  { id: 'curd', name: 'Curd', price: 25, isVeg: true },
                  { id: 'papad', name: 'Papad', price: 15, isVeg: true },
                  { id: 'onion', name: 'Extra Onion', price: 10, isVeg: true },
                  { id: 'lemon', name: 'Lemon', price: 5, isVeg: true },
                ],
              },
            ],
          },
          {
            id: 'item-2',
            name: 'Poha',
            description: 'Flattened rice with peanuts, curry leaves, and sev',
            price: 60,
            isVeg: true,
            imageUrl: IMG.bakery,
          },
          {
            id: 'item-3',
            name: 'Sabudana Khichdi',
            description: 'Sago pearls tempered with cumin and peanuts',
            price: 80,
            isVeg: true,
            imageUrl: IMG.mangalore,
          },
        ],
      },
      {
        name: 'Beverages',
        items: [
          {
            id: 'item-4',
            name: 'Mattha (Buttermilk)',
            description: 'Spiced yogurt drink',
            price: 40,
            isVeg: true,
            imageUrl: IMG.seafood,
          },
        ],
      },
    ],
  },
  'mock-rest-2': {
    restaurantId: 'mock-rest-2',
    restaurantName: 'Bademiya Kebabs',
    about: {
      cuisines: 'Mughlai, Kebabs',
      city: 'Mumbai',
      areaName: 'Colaba',
      address: 'Tulloch Road, Apollo Bunder, Colaba, Mumbai 400001',
      costForTwoMessage: '₹600 for two',
      rating: 4.2,
      totalRatingsString: '890+',
      imageUrl: IMG.kebab,
      offer: 'Flat ₹75 OFF',
      etaMins: 35,
      slaString: '35-40 mins',
      distance: '3.2 km',
      isOpen: true,
      closesAt: '1:00 am',
      openingHours: [
        { day: 'Monday', time: '12:00 pm – 1:00 am' },
        { day: 'Tuesday', time: '12:00 pm – 1:00 am' },
        { day: 'Wednesday', time: '12:00 pm – 1:00 am' },
        { day: 'Thursday', time: '12:00 pm – 1:00 am' },
        { day: 'Friday', time: '12:00 pm – 1:30 am' },
        { day: 'Saturday', time: '12:00 pm – 1:30 am' },
        { day: 'Sunday', time: '12:00 pm – 1:00 am' },
      ],
    },
    categories: [
      {
        name: 'Kebabs',
        items: [
          {
            id: 'item-5',
            name: 'Chicken Seekh Kebab',
            description: 'Minced chicken skewers, charcoal grilled',
            price: 280,
            isVeg: false,
            isBestseller: true,
            imageUrl: IMG.kebab,
          },
          {
            id: 'item-6',
            name: 'Mutton Boti Kebab',
            description: 'Tender mutton chunks marinated overnight',
            price: 420,
            isVeg: false,
            imageUrl: IMG.mangalore,
          },
        ],
      },
      {
        name: 'Breads',
        items: [
          {
            id: 'item-7',
            name: 'Roomali Roti',
            description: 'Paper-thin handkerchief bread',
            price: 45,
            isVeg: true,
            imageUrl: IMG.bakery,
          },
        ],
      },
    ],
  },
  'mock-rest-3': {
    restaurantId: 'mock-rest-3',
    restaurantName: 'Gajalee Seafood',
    about: {
      cuisines: 'Seafood, Malvani, Coastal',
      city: 'Mumbai',
      areaName: 'Vashi',
      costForTwoMessage: '₹1200 for two',
      rating: 4.5,
      totalRatingsString: '2.1K+',
      imageUrl: IMG.seafood,
      offer: 'Free delivery',
      etaMins: 42,
      isOpen: true,
      closesAt: '11:30 pm',
    },
    categories: [
      {
        name: 'Coastal Specials',
        items: [
          {
            id: 'item-8',
            name: 'Butter Garlic Prawns',
            description: 'Jumbo prawns in butter garlic sauce',
            price: 650,
            isVeg: false,
            isBestseller: true,
            imageUrl: IMG.seafood,
          },
          {
            id: 'item-9',
            name: 'Surmai Tawa Fry',
            description: 'Kingfish pan-fried with Malvani masala',
            price: 580,
            isVeg: false,
            imageUrl: IMG.mangalore,
          },
        ],
      },
    ],
  },
};

const DEFAULT_MENU: MenuDto = {
  restaurantId: 'unknown',
  restaurantName: 'Local Favourites',
  categories: [
    {
      name: 'Recommended',
      items: [
        {
          id: 'item-default',
          name: 'Veg Thali',
          description: 'Dal, sabzi, roti, rice, and pickle',
          price: 199,
          isVeg: true,
        },
        {
          id: 'item-default-2',
          name: 'Chicken Biryani',
          description: 'Hyderabadi dum biryani with raita',
          price: 249,
          isVeg: false,
          isBestseller: true,
        },
      ],
    },
  ],
};

/** Time-of-day food tiles (mirrors Swiggy homepage mind widgets). */
const FOOD_BY_SLOT: Record<string, FoodCategory[]> = {
  breakfast: [
    { id: 'dosa', name: 'Dosa & Idli', imageUrl: IMG.bakery, query: 'Dosa' },
    { id: 'bakery', name: 'Breakfast', imageUrl: IMG.bakery, query: 'Breakfast' },
    { id: 'healthy', name: 'Healthy', imageUrl: IMG.mangalore, query: 'Healthy' },
    { id: 'south', name: 'South Indian', imageUrl: IMG.bakery, query: 'South Indian' },
    { id: 'chai', name: 'Tea & Snacks', imageUrl: IMG.bakery, query: 'Chai' },
    { id: 'sandwich', name: 'Sandwich', imageUrl: IMG.pizza, query: 'Sandwich' },
  ],
  lunch: [
    { id: 'biryani', name: 'Biryani', imageUrl: IMG.misal, query: 'Biryani' },
    { id: 'thali', name: 'Thali', imageUrl: IMG.mangalore, query: 'Thali' },
    { id: 'pizza', name: 'Pizza', imageUrl: IMG.pizza, query: 'Pizza' },
    { id: 'south', name: 'South Indian', imageUrl: IMG.bakery, query: 'South Indian' },
    { id: 'north', name: 'North Indian', imageUrl: IMG.mangalore, query: 'North Indian' },
    { id: 'chinese', name: 'Chinese', imageUrl: IMG.kebab, query: 'Chinese' },
    { id: 'burgers', name: 'Burgers', imageUrl: IMG.kebab, query: 'Burgers' },
    { id: 'salad', name: 'Salad', imageUrl: IMG.bakery, query: 'Salad' },
  ],
  evening: [
    { id: 'pizza', name: 'Pizza', imageUrl: IMG.pizza, query: 'Pizza' },
    { id: 'burger', name: 'Burger', imageUrl: IMG.kebab, query: 'Burger' },
    { id: 'cake', name: 'Cake', imageUrl: IMG.bakery, query: 'Cake' },
    { id: 'desserts', name: 'Desserts', imageUrl: IMG.bakery, query: 'Desserts' },
    { id: 'south', name: 'South Indian', imageUrl: IMG.bakery, query: 'South Indian' },
    { id: 'momo', name: 'Momo', imageUrl: IMG.seafood, query: 'Momo' },
    { id: 'shawarma', name: 'Shawarma', imageUrl: IMG.kebab, query: 'Shawarma' },
    { id: 'noodles', name: 'Noodles', imageUrl: IMG.kebab, query: 'Noodles' },
    { id: 'pasta', name: 'Pasta', imageUrl: IMG.pizza, query: 'Pasta' },
    { id: 'rolls', name: 'Rolls', imageUrl: IMG.kebab, query: 'Rolls' },
  ],
  latenight: [
    { id: 'biryani', name: 'Biryani', imageUrl: IMG.misal, query: 'Biryani' },
    { id: 'pizza', name: 'Pizza', imageUrl: IMG.pizza, query: 'Pizza' },
    { id: 'burgers', name: 'Burgers', imageUrl: IMG.kebab, query: 'Burgers' },
    { id: 'chinese', name: 'Chinese', imageUrl: IMG.kebab, query: 'Chinese' },
    { id: 'rolls', name: 'Rolls & Wraps', imageUrl: IMG.kebab, query: 'Rolls' },
    { id: 'desserts', name: 'Desserts', imageUrl: IMG.bakery, query: 'Desserts' },
  ],
};

function foodSlotForHour(hour: number): keyof typeof FOOD_BY_SLOT {
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 16) return 'lunch';
  if (hour >= 16 && hour < 21) return 'evening';
  return 'latenight';
}

export class MockSource implements RestaurantSource {
  async autocomplete(input: string): Promise<PlaceSuggestion[]> {
    const q = input.trim().toLowerCase();
    if (!q) {
      return [];
    }
    return PLACES.filter(
      (p) =>
        p.description.toLowerCase().includes(q) ||
        p.placeId.toLowerCase().includes(q),
    );
  }

  async geocode(placeId: string): Promise<{ lat: number; lng: number }> {
    const offsets: Record<string, { lat: number; lng: number }> = {
      'mock-place-1': { lat: 19.076, lng: 72.8777 },
      'mock-place-2': { lat: 19.0596, lng: 72.8295 },
      'mock-place-3': { lat: 19.1136, lng: 72.8697 },
      'mock-place-4': { lat: 18.9067, lng: 72.8147 },
    };
    return offsets[placeId] ?? { lat: 19.076, lng: 72.8777 };
  }

  async listRestaurants(
    _lat: number,
    _lng: number,
    offset: number,
  ): Promise<RestaurantCard[]> {
    const pageSize = 8;
    const start = Math.max(0, offset);
    return RESTAURANTS.slice(start, start + pageSize);
  }

  async getMenu(
    restaurantId: string,
    _lat: number,
    _lng: number,
  ): Promise<MenuDto> {
    const menu = MENUS[restaurantId];
    if (menu) {
      return { ...menu, restaurantId };
    }
    return {
      ...DEFAULT_MENU,
      restaurantId,
      restaurantName: `Restaurant ${restaurantId}`,
    };
  }

  async listFoodCategories(
    _lat: number,
    _lng: number,
  ): Promise<FoodCategoriesDto> {
    const hour = new Date().getHours();
    const slot = foodSlotForHour(hour);
    const titles: Record<keyof typeof FOOD_BY_SLOT, string> = {
      breakfast: 'Start your morning right',
      lunch: 'Order our best food options',
      evening: 'Order our best food options',
      latenight: 'Late-night favourites',
    };
    return {
      hour,
      title: titles[slot],
      items: FOOD_BY_SLOT[slot].map((c) => ({ ...c })),
    };
  }
}
