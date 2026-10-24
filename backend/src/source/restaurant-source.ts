export interface PlaceSuggestion {
  placeId: string;
  description: string;
}

export interface RestaurantCard {
  id: string;
  name: string;
  cuisines: string;
  rating: number;
  etaMins: number;
  costForTwo: number;
  imageUrl: string;
  offer?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  isVeg: boolean;
  imageUrl?: string;
  isBestseller?: boolean;
}

export interface MenuDto {
  restaurantId: string;
  restaurantName: string;
  categories: { name: string; items: MenuItem[] }[];
}

export interface RestaurantSource {
  autocomplete(input: string): Promise<PlaceSuggestion[]>;
  geocode(placeId: string): Promise<{ lat: number; lng: number }>;
  listRestaurants(
    lat: number,
    lng: number,
    offset: number,
  ): Promise<RestaurantCard[]>;
  getMenu(
    restaurantId: string,
    lat: number,
    lng: number,
  ): Promise<MenuDto>;
}
