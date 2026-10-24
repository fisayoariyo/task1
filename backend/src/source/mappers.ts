import {
  MenuDto,
  MenuItem,
  PlaceSuggestion,
  RestaurantCard,
} from './restaurant-source';

export const CLOUDINARY_BASE =
  'https://res.cloudinary.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_600,c_fit';

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

export function buildCloudinaryUrl(cloudinaryImageId: string): string {
  return `${CLOUDINARY_BASE}/${cloudinaryImageId}`;
}

type SwiggyRestaurantInfo = {
  id?: string | number;
  name?: string;
  cuisines?: string[] | string;
  avgRating?: string | number;
  rating?: string | number;
  deliveryTime?: number;
  minDeliveryTime?: number;
  costForTwo?: number;
  cloudinaryImageId?: string;
  sla?: { deliveryTime?: number };
  aggregatedDiscountInfoV2?: {
    shortDescriptionList?: { meta?: string }[];
  };
  aggregatedDiscountInfo?: {
    header?: string;
    shortDescriptionList?: { meta?: string }[];
  };
};

export function mapRestaurantCard(info: SwiggyRestaurantInfo): RestaurantCard {
  const cuisines = Array.isArray(info.cuisines)
    ? info.cuisines.join(', ')
    : String(info.cuisines ?? '');
  const ratingRaw = info.avgRating ?? info.rating ?? 0;
  const rating =
    typeof ratingRaw === 'string' ? parseFloat(ratingRaw) : Number(ratingRaw);
  const etaMins =
    info.sla?.deliveryTime ??
    info.deliveryTime ??
    info.minDeliveryTime ??
    0;
  const offer =
    info.aggregatedDiscountInfoV2?.shortDescriptionList?.[0]?.meta ??
    info.aggregatedDiscountInfo?.shortDescriptionList?.[0]?.meta ??
    info.aggregatedDiscountInfo?.header;

  const card: RestaurantCard = {
    id: String(info.id ?? ''),
    name: String(info.name ?? ''),
    cuisines,
    rating: Number.isFinite(rating) ? rating : 0,
    etaMins,
    costForTwo: paiseToRupees(info.costForTwo ?? 0),
    imageUrl: info.cloudinaryImageId
      ? buildCloudinaryUrl(info.cloudinaryImageId)
      : '',
  };
  if (offer) {
    card.offer = offer;
  }
  return card;
}

function collectRestaurantInfos(node: unknown, out: SwiggyRestaurantInfo[]): void {
  if (!node || typeof node !== 'object') {
    return;
  }
  const obj = node as Record<string, unknown>;
  if (obj.info && typeof obj.info === 'object' && 'id' in (obj.info as object)) {
    out.push(obj.info as SwiggyRestaurantInfo);
  }
  if (obj.data && typeof obj.data === 'object' && 'id' in (obj.data as object)) {
    const inner = obj.data as Record<string, unknown>;
    if (inner.type === 'restaurant' && inner.data) {
      out.push(inner.data as SwiggyRestaurantInfo);
    } else if ('name' in inner && 'id' in inner) {
      out.push(inner as SwiggyRestaurantInfo);
    }
  }
  for (const value of Object.values(obj)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        collectRestaurantInfos(item, out);
      }
    } else if (value && typeof value === 'object') {
      collectRestaurantInfos(value, out);
    }
  }
}

export function mapRestaurantListResponse(payload: unknown): RestaurantCard[] {
  const infos: SwiggyRestaurantInfo[] = [];
  collectRestaurantInfos(payload, infos);
  const seen = new Set<string>();
  const cards: RestaurantCard[] = [];
  for (const info of infos) {
    const id = String(info.id ?? '');
    if (!id || seen.has(id)) {
      continue;
    }
    seen.add(id);
    cards.push(mapRestaurantCard(info));
  }
  return cards;
}

export function mapPlaceAutocomplete(payload: unknown): PlaceSuggestion[] {
  const root = payload as { data?: unknown[] };
  if (!Array.isArray(root.data)) {
    return [];
  }
  return root.data
    .map((row) => {
      const r = row as { place_id?: string; description?: string };
      if (!r.place_id || !r.description) {
        return null;
      }
      return { placeId: r.place_id, description: r.description };
    })
    .filter((x): x is PlaceSuggestion => x !== null);
}

export function mapGeocodeResponse(payload: unknown): { lat: number; lng: number } {
  const root = payload as {
    data?: { geometry?: { location?: { lat?: number; lng?: number } } }[];
  };
  const loc = root.data?.[0]?.geometry?.location;
  if (loc?.lat === undefined || loc?.lng === undefined) {
    throw new Error('Swiggy geocode response missing lat/lng');
  }
  return { lat: loc.lat, lng: loc.lng };
}

type SwiggyMenuItem = {
  id?: string | number;
  name?: string;
  description?: string;
  price?: number;
  isVeg?: number | boolean;
  cloudinaryImageId?: string;
  isBestSeller?: boolean;
  ribbon?: { text?: string };
  recommended?: number;
};

function mapMenuItem(raw: SwiggyMenuItem): MenuItem {
  const isVeg = raw.isVeg === true || raw.isVeg === 1;
  const isBestseller =
    raw.isBestSeller === true ||
    raw.ribbon?.text?.toLowerCase() === 'bestseller' ||
    raw.recommended === 1;

  const item: MenuItem = {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    description: String(raw.description ?? ''),
    price: paiseToRupees(raw.price ?? 0),
    isVeg,
  };
  if (raw.cloudinaryImageId) {
    item.imageUrl = buildCloudinaryUrl(raw.cloudinaryImageId);
  }
  if (isBestseller) {
    item.isBestseller = true;
  }
  return item;
}

function extractMenuCategories(payload: unknown): { name: string; items: MenuItem[] }[] {
  const categories: { name: string; items: MenuItem[] }[] = [];

  function walk(node: unknown): void {
    if (!node || typeof node !== 'object') {
      return;
    }
    const obj = node as Record<string, unknown>;
    if (typeof obj.title === 'string' && Array.isArray(obj.itemCards)) {
      const items: MenuItem[] = [];
      for (const itemCard of obj.itemCards) {
        const card = (itemCard as { card?: { info?: SwiggyMenuItem } }).card;
        const info = card?.info ?? (itemCard as { info?: SwiggyMenuItem }).info;
        if (info?.id !== undefined) {
          items.push(mapMenuItem(info));
        }
      }
      if (items.length > 0) {
        categories.push({ name: obj.title, items });
      }
    }
    if (obj.info && typeof obj.info === 'object' && 'price' in (obj.info as object)) {
      const info = obj.info as SwiggyMenuItem;
      const categoryName =
        (obj as { category?: string }).category ??
        (info as { category?: string }).category ??
        'Items';
      let bucket = categories.find((c) => c.name === categoryName);
      if (!bucket) {
        bucket = { name: categoryName, items: [] };
        categories.push(bucket);
      }
      bucket.items.push(mapMenuItem(info));
    }
    for (const value of Object.values(obj)) {
      if (Array.isArray(value)) {
        for (const child of value) {
          walk(child);
        }
      } else if (value && typeof value === 'object') {
        walk(value);
      }
    }
  }

  walk(payload);
  return categories;
}

export function mapMenuResponse(
  payload: unknown,
  restaurantId: string,
  restaurantName?: string,
): MenuDto {
  const root = payload as {
    data?: { cards?: unknown[]; name?: string };
  };
  const categories = extractMenuCategories(root.data ?? payload);
  const name =
    restaurantName ??
    root.data?.name ??
    `Restaurant ${restaurantId}`;
  return {
    restaurantId,
    restaurantName: name,
    categories,
  };
}
