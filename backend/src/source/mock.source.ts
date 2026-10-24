import {
  MenuDto,
  PlaceSuggestion,
  RestaurantCard,
  RestaurantSource,
} from './restaurant-source';

const CLOUDINARY_BASE =
  'https://res.cloudinary.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_600,c_fit';

const PLACES: PlaceSuggestion[] = [
  {
    placeId: 'mock-place-1',
    description: 'Mumbai, Maharashtra, India',
  },
  {
    placeId: 'mock-place-2',
    description: 'Bandra West, Mumbai, Maharashtra, India',
  },
  {
    placeId: 'mock-place-3',
    description: 'Andheri East, Mumbai, Maharashtra, India',
  },
  {
    placeId: 'mock-place-4',
    description: 'Colaba, Mumbai, Maharashtra, India',
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
    imageUrl: `${CLOUDINARY_BASE}/mock-trupti-misal`,
    offer: '20% off up to ₹50',
  },
  {
    id: 'mock-rest-2',
    name: 'Bademiya Kebabs',
    cuisines: 'Mughlai, Kebabs',
    rating: 4.2,
    etaMins: 35,
    costForTwo: 600,
    imageUrl: `${CLOUDINARY_BASE}/mock-bademiya`,
  },
  {
    id: 'mock-rest-3',
    name: 'Gajalee Seafood',
    cuisines: 'Seafood, Malvani, Coastal',
    rating: 4.5,
    etaMins: 42,
    costForTwo: 1200,
    imageUrl: `${CLOUDINARY_BASE}/mock-gajalee`,
    offer: 'Free delivery',
  },
  {
    id: 'mock-rest-4',
    name: 'Pizza By The Bay',
    cuisines: 'Italian, Pizza, Continental',
    rating: 4.3,
    etaMins: 38,
    costForTwo: 900,
    imageUrl: `${CLOUDINARY_BASE}/mock-pizza-bay`,
  },
  {
    id: 'mock-rest-5',
    name: 'Kyani & Co.',
    cuisines: 'Irani, Bakery, Breakfast',
    rating: 4.1,
    etaMins: 25,
    costForTwo: 450,
    imageUrl: `${CLOUDINARY_BASE}/mock-kyani`,
  },
  {
    id: 'mock-rest-6',
    name: 'Mahesh Lunch Home',
    cuisines: 'Seafood, Mangalorean',
    rating: 4.6,
    etaMins: 40,
    costForTwo: 1100,
    imageUrl: `${CLOUDINARY_BASE}/mock-mahesh`,
  },
];

const MENUS: Record<string, MenuDto> = {
  'mock-rest-1': {
    restaurantId: 'mock-rest-1',
    restaurantName: 'Trupti Misal',
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
          },
          {
            id: 'item-2',
            name: 'Poha',
            description: 'Flattened rice with peanuts, curry leaves, and sev',
            price: 60,
            isVeg: true,
          },
          {
            id: 'item-3',
            name: 'Sabudana Khichdi',
            description: 'Sago pearls tempered with cumin and peanuts',
            price: 80,
            isVeg: true,
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
          },
        ],
      },
    ],
  },
  'mock-rest-2': {
    restaurantId: 'mock-rest-2',
    restaurantName: 'Bademiya Kebabs',
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
          },
          {
            id: 'item-6',
            name: 'Mutton Boti Kebab',
            description: 'Tender mutton chunks marinated overnight',
            price: 420,
            isVeg: false,
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
          },
        ],
      },
    ],
  },
  'mock-rest-3': {
    restaurantId: 'mock-rest-3',
    restaurantName: 'Gajalee Seafood',
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
          },
          {
            id: 'item-9',
            name: 'Surmai Tawa Fry',
            description: 'Kingfish pan-fried with Malvani masala',
            price: 580,
            isVeg: false,
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
    const pageSize = 4;
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
}
