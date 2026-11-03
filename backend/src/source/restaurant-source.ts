export interface PlaceSuggestion {
  placeId: string;
  description: string;
  /** Swiggy structured_formatting.main_text (e.g. "Mumbai Central") */
  mainText?: string;
  /** Swiggy structured_formatting.secondary_text */
  secondaryText?: string;
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
  /** Swiggy list `info.veg` — pure-veg restaurant when true. */
  isVeg?: boolean;
  /** e.g. "1.6K+" from Swiggy `totalRatingsString`. */
  totalRatingsString?: string;
}

/** One selectable option inside a variant/addon group (Swiggy-style). */
export interface MenuChoice {
  id: string;
  name: string;
  price: number;
  isVeg?: boolean;
  inStock?: boolean;
  isDefault?: boolean;
}

/**
 * Customisation group. `max === 1` → radio; `max > 1` → multi checkbox.
 * Variants are always single-select groups.
 */
export interface MenuAddonGroup {
  id: string;
  name: string;
  min: number;
  max: number;
  choices: MenuChoice[];
}

/**
 * Swiggy variantsV2.pricingModels row — price + which addons are valid
 * for a given variation selection.
 */
export interface MenuPricingModel {
  variationIds: string[];
  price: number;
  /** If set, only these addon choice ids are allowed for this combo. */
  addonIds?: string[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  isVeg: boolean;
  imageUrl?: string;
  isBestseller?: boolean;
  /** Dish-level rating from Swiggy aggregatedRating when present. */
  rating?: number;
  /** Review/rating count string or number from API when present. */
  ratingCount?: string | number;
  /** Size / crust / etc. — always single-select; each group = one UI layer. */
  variants?: MenuAddonGroup[];
  /** Sides / toppings — shown on the customise layer after variants. */
  addons?: MenuAddonGroup[];
  pricingModels?: MenuPricingModel[];
  customisable?: boolean;
}

/** One row in the hours dropdown (Mon–Sun style). */
export interface OpeningHourRow {
  day: string;
  time: string;
  /** Highlight today’s row in the UI when known. */
  isToday?: boolean;
}

/** Thin “About” fields from the menu Restaurant card. */
export interface MenuAbout {
  cuisines?: string;
  areaName?: string;
  city?: string;
  address?: string;
  /** Finer locality when Swiggy sends it separately from areaName. */
  locality?: string;
  costForTwoMessage?: string;
  rating?: number;
  totalRatingsString?: string;
  imageUrl?: string;
  /** From discount headers on the restaurant card, when present. */
  offer?: string;
  /** Pure-veg restaurant flag from Swiggy `veg`. */
  isVeg?: boolean;
  /** SLA delivery minutes when present on the menu restaurant card. */
  etaMins?: number;
  /** Display SLA string when present, e.g. "30-35 mins". */
  slaString?: string;
  /** e.g. "2.5 km". */
  distance?: string;
  /** Whether the outlet is accepting orders right now. */
  isOpen?: boolean;
  /** Display close time, e.g. "12:00 am". */
  closesAt?: string;
  /** Weekly (or multi-slot) hours for the hours ▾ panel. */
  openingHours?: OpeningHourRow[];
}

export interface MenuDto {
  restaurantId: string;
  restaurantName: string;
  categories: { name: string; items: MenuItem[] }[];
  about?: MenuAbout;
}

/** Cuisine / dish tile on the landing “favourites” / “best options” grids. */
export interface FoodCategory {
  id: string;
  name: string;
  imageUrl: string;
  /** Optional explore query (from Swiggy action link). */
  query?: string;
}

export interface FoodCategoriesDto {
  /** Section heading from the feed when present (e.g. “What’s on your mind?”). */
  title?: string;
  /** Hour bucket used for mock / cache keying (0–23). */
  hour: number;
  items: FoodCategory[];
}

/** Opaque Swiggy list cursor (not a numeric page index). */
export interface RestaurantListCursor {
  nextOffset?: string;
  widgetOffset?: Record<string, string>;
}

/** One infinite-scroll page of restaurants for a lat/lng. */
export interface RestaurantListPage {
  restaurants: RestaurantCard[];
  nextOffset: string | null;
  widgetOffset: Record<string, string> | null;
  hasMore: boolean;
}

/** Keyword search results for the current deliver-to lat/lng. */
export interface RestaurantSearchResult {
  query: string;
  restaurants: RestaurantCard[];
}

/** As-you-type suggest row (Swiggy submitAction=SUGGEST). */
export interface RestaurantSuggestItem {
  kind: 'dish' | 'restaurant';
  /** Display text and the query to run on tap. */
  text: string;
  imageUrl?: string;
  /** Present when kind is restaurant and the upstream id is known. */
  restaurantId?: string;
}

export interface RestaurantSuggestResult {
  query: string;
  items: RestaurantSuggestItem[];
}

export interface RestaurantSource {
  autocomplete(input: string): Promise<PlaceSuggestion[]>;
  geocode(placeId: string): Promise<{ lat: number; lng: number }>;
  listRestaurants(
    lat: number,
    lng: number,
    cursor?: RestaurantListCursor,
  ): Promise<RestaurantListPage>;
  getMenu(
    restaurantId: string,
    lat: number,
    lng: number,
  ): Promise<MenuDto>;
  /** Time- and location-aware food category tiles for the landing page. */
  listFoodCategories(lat: number, lng: number): Promise<FoodCategoriesDto>;
  /** Free-text restaurant search for this lat/lng (Swiggy str=…). */
  searchRestaurants(
    lat: number,
    lng: number,
    query: string,
  ): Promise<RestaurantSearchResult>;
  /** Live typing suggestions for this lat/lng (Swiggy SUGGEST). */
  suggestRestaurants(
    lat: number,
    lng: number,
    query: string,
  ): Promise<RestaurantSuggestResult>;
}
