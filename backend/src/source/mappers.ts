import {
  FoodCategoriesDto,
  FoodCategory,
  MenuAbout,
  MenuAddonGroup,
  MenuChoice,
  MenuDto,
  MenuItem,
  MenuPricingModel,
  OpeningHourRow,
  PlaceSuggestion,
  DishSearchGroup,
  DishSearchHit,
  DishSearchResult,
  RestaurantCard,
  RestaurantListPage,
  RestaurantSuggestItem,
  RestaurantSuggestResult,
} from './restaurant-source';

/** Live Swiggy CDN (old res.cloudinary.com/swiggy URLs 404). */
export const CLOUDINARY_BASE =
  'https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_660';

const CATEGORY_IMAGE_BASE =
  'https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_288';

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

export function buildCloudinaryUrl(cloudinaryImageId: string): string {
  const id = String(cloudinaryImageId ?? '').trim();
  if (!id) return '';
  if (/^https?:\/\//i.test(id)) {
    return id.replace(
      'https://res.cloudinary.com/swiggy/image/upload/',
      'https://media-assets.swiggy.com/swiggy/image/upload/',
    );
  }
  return `${CLOUDINARY_BASE}/${id}`;
}

export function buildCategoryImageUrl(cloudinaryImageId: string): string {
  const id = String(cloudinaryImageId ?? '').trim();
  if (!id) return '';
  if (/^https?:\/\//i.test(id)) {
    return id.replace(
      'https://res.cloudinary.com/swiggy/image/upload/',
      'https://media-assets.swiggy.com/swiggy/image/upload/',
    );
  }
  return `${CATEGORY_IMAGE_BASE}/${id}`;
}

type SwiggyRestaurantInfo = {
  id?: string | number;
  name?: string;
  cuisines?: string[] | string;
  avgRating?: string | number;
  rating?: string | number;
  deliveryTime?: number;
  minDeliveryTime?: number;
  costForTwo?: number | string;
  costForTwoMessage?: string;
  totalRatingsString?: string;
  cloudinaryImageId?: string;
  veg?: boolean;
  sla?: { deliveryTime?: number };
  aggregatedDiscountInfoV3?: {
    header?: string;
    subHeader?: string;
    discountTag?: string;
  };
  aggregatedDiscountInfoV2?: {
    header?: string;
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
  const v3 = info.aggregatedDiscountInfoV3;
  const v3Parts = [v3?.header, v3?.subHeader, v3?.discountTag]
    .map((s) => (s == null ? '' : String(s).trim()))
    .filter((s) => s && s !== 'null');
  const offer =
    (v3Parts.length ? v3Parts.join(' ') : undefined) ??
    info.aggregatedDiscountInfoV2?.shortDescriptionList?.[0]?.meta ??
    info.aggregatedDiscountInfoV2?.header ??
    info.aggregatedDiscountInfo?.shortDescriptionList?.[0]?.meta ??
    info.aggregatedDiscountInfo?.header;

  let costForTwo = 0;
  if (typeof info.costForTwo === 'number' && Number.isFinite(info.costForTwo)) {
    costForTwo =
      info.costForTwo >= 1000
        ? paiseToRupees(info.costForTwo)
        : info.costForTwo;
  } else if (typeof info.costForTwo === 'string') {
    const n = parseInt(info.costForTwo.replace(/[^\d]/g, ''), 10);
    costForTwo = Number.isFinite(n) ? n : 0;
  } else if (info.costForTwoMessage) {
    const n = parseInt(
      String(info.costForTwoMessage).replace(/[^\d]/g, ''),
      10,
    );
    costForTwo = Number.isFinite(n) ? n : 0;
  }

  const card: RestaurantCard = {
    id: String(info.id ?? ''),
    name: String(info.name ?? ''),
    cuisines,
    rating: Number.isFinite(rating) ? rating : 0,
    etaMins,
    costForTwo,
    imageUrl: info.cloudinaryImageId
      ? buildCloudinaryUrl(info.cloudinaryImageId)
      : '',
  };
  if (offer && String(offer).trim() && String(offer) !== 'null') {
    card.offer = String(offer).trim();
  }
  if (info.veg === true) {
    card.isVeg = true;
  }
  if (info.totalRatingsString) {
    card.totalRatingsString = String(info.totalRatingsString);
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

/** Keyword search (dapi/restaurants/search) — same restaurant `info` cards. */
export function mapRestaurantSearchResponse(
  payload: unknown,
  query: string,
): { query: string; restaurants: RestaurantCard[] } {
  return {
    query: String(query ?? '').trim(),
    restaurants: mapRestaurantListResponse(payload),
  };
}

function asRecord(node: unknown): Record<string, unknown> | null {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return null;
  return node as Record<string, unknown>;
}

/** Dish cards carry a price; restaurant cards carry cuisines / costForTwo. */
function looksLikeDishInfo(info: Record<string, unknown>): boolean {
  if (info.id == null || !String(info.name ?? '').trim()) return false;
  return 'price' in info || 'defaultPrice' in info || 'finalPrice' in info;
}

function readPaise(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    return readPaise(obj.value ?? obj.price);
  }
  return 0;
}

function dishPriceRupees(info: Record<string, unknown>): number {
  const paise =
    readPaise(info.finalPrice) ||
    readPaise(info.defaultPrice) ||
    readPaise(info.price);
  return paiseToRupees(paise);
}

function dishImageUrl(info: Record<string, unknown>): string | undefined {
  const raw = info.imageId ?? info.cloudinaryImageId ?? info.imageUrl;
  const id = String(raw ?? '').trim();
  if (!id) return undefined;
  const url = buildCloudinaryUrl(id);
  return url || undefined;
}

function dishVeg(info: Record<string, unknown>): boolean | undefined {
  if (info.isVeg === true || info.isVeg === 1) return true;
  if (info.isVeg === false || info.isVeg === 0) return false;
  const classifier = String(info.vegClassifier ?? '').toUpperCase();
  if (!classifier) return undefined;
  if (classifier.includes('NON')) return false;
  if (classifier === 'VEG' || classifier === 'PURE_VEG') return true;
  return undefined;
}

function positiveNumber(raw: unknown): number | undefined {
  const n = typeof raw === 'string' ? parseFloat(raw) : Number(raw);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function dishRatingFields(info: Record<string, unknown>): {
  rating?: number;
  ratingCount?: string | number;
} {
  const ratings = asRecord(info.ratings);
  const agg = asRecord(ratings?.aggregatedRating) ?? asRecord(info.aggregatedRating);
  const rating = positiveNumber(agg?.rating ?? info.rating);
  const countRaw = agg?.ratingCountV2 ?? agg?.ratingCount ?? info.ratingCount;
  let ratingCount: string | number | undefined;
  if (typeof countRaw === 'number' && Number.isFinite(countRaw)) {
    ratingCount = countRaw;
  } else if (typeof countRaw === 'string' && countRaw.trim()) {
    ratingCount = countRaw.trim();
  }
  return { rating, ratingCount };
}

function dishIsCustomisable(info: Record<string, unknown>): boolean {
  if (info.customisable === true || info.isCustomisable === true) return true;
  if (Array.isArray(info.addons) && info.addons.length > 0) return true;
  const variants = asRecord(info.variants);
  if (
    variants &&
    Array.isArray(variants.variantGroups) &&
    variants.variantGroups.length > 0
  ) {
    return true;
  }
  const variantsV2 = asRecord(info.variantsV2);
  return Boolean(
    variantsV2 &&
      Array.isArray(variantsV2.variantGroups) &&
      variantsV2.variantGroups.length > 0,
  );
}

function toDishHit(info: Record<string, unknown>): DishSearchHit | null {
  const id = String(info.id ?? '').trim();
  const name = String(info.name ?? '').trim();
  if (!id || !name) return null;
  const hit: DishSearchHit = { id, name, price: dishPriceRupees(info) };
  const imageUrl = dishImageUrl(info);
  if (imageUrl) hit.imageUrl = imageUrl;
  const veg = dishVeg(info);
  if (veg !== undefined) hit.veg = veg;
  const { rating, ratingCount } = dishRatingFields(info);
  if (rating !== undefined) hit.rating = rating;
  if (ratingCount !== undefined) hit.ratingCount = ratingCount;
  if (dishIsCustomisable(info)) hit.customisable = true;
  return hit;
}

function dishInfoFrom(node: unknown): Record<string, unknown> | null {
  const rec = asRecord(node);
  if (!rec) return null;
  const nested = asRecord(rec.info);
  if (nested && looksLikeDishInfo(nested)) return nested;
  if (looksLikeDishInfo(rec)) return rec;
  return null;
}

function restaurantMeta(restaurantNode: unknown): {
  restaurantId: string;
  restaurantName: string;
  rating?: number;
  etaMins?: number;
} | null {
  const rec = asRecord(restaurantNode);
  if (!rec) return null;
  const info = asRecord(rec.info) ?? rec;
  if (looksLikeDishInfo(info)) return null;
  const restaurantId = String(info.id ?? '').trim();
  const restaurantName = String(info.name ?? '').trim();
  if (!restaurantId || !restaurantName) return null;
  const sla = asRecord(info.sla);
  const etaMins = positiveNumber(
    sla?.deliveryTime ?? info.deliveryTime ?? info.minDeliveryTime,
  );
  const rating = positiveNumber(
    info.avgRating ?? info.avgRatingString ?? info.rating,
  );
  return {
    restaurantId,
    restaurantName,
    ...(rating !== undefined ? { rating } : {}),
    ...(etaMins !== undefined ? { etaMins: Math.round(etaMins) } : {}),
  };
}

/**
 * ENTER + selectedPLTab=DISH.
 * Walks dish cards (`info` + sibling `restaurant`) and RestaurantDishGroup
 * (`restaurant` + `dishes[]`). Prices are Swiggy paise. Synthetic until a
 * live DISH fixture is captured.
 */
export function mapRestaurantDishSearchResponse(
  payload: unknown,
  query: string,
): DishSearchResult {
  const order: string[] = [];
  const groups = new Map<string, DishSearchGroup>();

  function addDish(
    meta: NonNullable<ReturnType<typeof restaurantMeta>>,
    hit: DishSearchHit,
  ): void {
    let group = groups.get(meta.restaurantId);
    if (!group) {
      group = {
        restaurantId: meta.restaurantId,
        restaurantName: meta.restaurantName,
        dishes: [],
      };
      if (meta.rating !== undefined) group.rating = meta.rating;
      if (meta.etaMins !== undefined) group.etaMins = meta.etaMins;
      groups.set(meta.restaurantId, group);
      order.push(meta.restaurantId);
    } else {
      if (group.rating === undefined && meta.rating !== undefined) {
        group.rating = meta.rating;
      }
      if (group.etaMins === undefined && meta.etaMins !== undefined) {
        group.etaMins = meta.etaMins;
      }
    }
    if (group.dishes.some((dish) => dish.id === hit.id)) return;
    group.dishes.push(hit);
  }

  function walk(node: unknown): void {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    const obj = node as Record<string, unknown>;
    const meta = restaurantMeta(obj.restaurant);
    if (meta && Array.isArray(obj.dishes)) {
      for (const raw of obj.dishes) {
        const info = dishInfoFrom(raw);
        const hit = info ? toDishHit(info) : null;
        if (hit) addDish(meta, hit);
      }
    }
    const info = asRecord(obj.info);
    if (meta && info && looksLikeDishInfo(info)) {
      const hit = toDishHit(info);
      if (hit) addDish(meta, hit);
    }
    for (const value of Object.values(obj)) {
      if (value && typeof value === 'object') walk(value);
    }
  }

  walk(payload);
  return {
    query: String(query ?? '').trim(),
    tab: 'dish',
    groups: order.map((id) => groups.get(id)!),
  };
}

/** Suggest type tokens only — skip protobuf `@type` paths and sentences. */
function isTextSuggestType(raw: string): boolean {
  const t = raw.trim();
  if (!t || t.length > 32) return false;
  return !/[./\s]/.test(t);
}

/** CUISINE, QUERY, and any non-restaurant text suggest open as a dish. */
function suggestKind(typeRaw: string): 'dish' | 'restaurant' {
  return typeRaw.trim().toLowerCase() === 'restaurant' ? 'restaurant' : 'dish';
}

function readSuggestText(s: Record<string, unknown>): string {
  return String(s.text ?? s.suggestion ?? s.query ?? '').trim();
}

function readSuggestImage(s: Record<string, unknown>): string | undefined {
  const candidates = [s.imageUrl, s.cloudinaryId, s.cloudinaryImageId, s.imageId];
  for (const raw of candidates) {
    const id = String(raw ?? '').trim();
    if (!id) continue;
    const url = buildCloudinaryUrl(id);
    if (url) return url;
  }
  return undefined;
}

function readSuggestRestaurantId(s: Record<string, unknown>): string | undefined {
  const raw = s.restaurantId ?? s.restaurant_id;
  if (raw == null || raw === '') return undefined;
  const id = String(raw).trim();
  return id || undefined;
}

function pushSuggestItem(
  s: Record<string, unknown>,
  out: RestaurantSuggestItem[],
  seen: Set<string>,
  inSuggestionsList: boolean,
): void {
  const text = readSuggestText(s);
  if (text.length < 2) return;
  const typeRaw = String(
    s.type ?? s.suggestionType ?? s.tagToDisplay ?? (inSuggestionsList ? 'query' : ''),
  ).trim();
  if (!isTextSuggestType(typeRaw)) return;
  const kind = suggestKind(typeRaw);
  const key = `${kind}\0${text.toLowerCase()}`;
  if (seen.has(key)) return;
  seen.add(key);
  const item: RestaurantSuggestItem = { kind, text };
  const imageUrl = readSuggestImage(s);
  if (imageUrl) item.imageUrl = imageUrl;
  if (kind === 'restaurant') {
    const restaurantId = readSuggestRestaurantId(s);
    if (restaurantId) item.restaurantId = restaurantId;
  }
  out.push(item);
}

function collectSuggestItems(
  node: unknown,
  out: RestaurantSuggestItem[],
  seen: Set<string>,
): void {
  if (!node || typeof node !== 'object') return;
  const obj = node as Record<string, unknown>;

  const list = obj.suggestions;
  if (Array.isArray(list)) {
    for (const raw of list) {
      if (!raw || typeof raw !== 'object') continue;
      pushSuggestItem(raw as Record<string, unknown>, out, seen, true);
    }
  }

  pushSuggestItem(obj, out, seen, false);

  for (const value of Object.values(obj)) {
    if (Array.isArray(value)) {
      for (const item of value) collectSuggestItems(item, out, seen);
    } else if (value && typeof value === 'object') {
      collectSuggestItems(value, out, seen);
    }
  }
}

/**
 * As-you-type suggest (Swiggy SUGGEST) → typed dish/restaurant rows.
 * Restaurant list cards are not copied in; dish entities stay kind dish.
 */
export function mapRestaurantSuggestResponse(
  payload: unknown,
  query: string,
): RestaurantSuggestResult {
  const items: RestaurantSuggestItem[] = [];
  collectSuggestItems(payload, items, new Set());
  return {
    query: String(query ?? '').trim(),
    items: items.slice(0, 12),
  };
}

/** Pull restaurants + Swiggy pageOffset cursor from list/v5 or list/update. */
export function mapRestaurantListPage(payload: unknown): RestaurantListPage {
  const restaurants = mapRestaurantListResponse(payload);
  const root = payload as {
    data?: {
      pageOffset?: {
        nextOffset?: string;
        widgetOffset?: Record<string, string>;
      };
    };
  };
  const pageOffset = root.data?.pageOffset;
  const nextOffset =
    typeof pageOffset?.nextOffset === 'string' && pageOffset.nextOffset.trim()
      ? pageOffset.nextOffset
      : null;
  const widgetOffset =
    pageOffset?.widgetOffset && typeof pageOffset.widgetOffset === 'object'
      ? pageOffset.widgetOffset
      : null;
  return {
    restaurants,
    nextOffset,
    widgetOffset,
    hasMore: Boolean(nextOffset),
  };
}

type ImageGridInfo = {
  id?: string | number;
  imageId?: string;
  action?: { link?: string; text?: string };
  accessibility?: { altText?: string; altTextCta?: string };
  description?: string;
};

/**
 * Pull “What’s on your mind?” / best-food image tiles from a homepage list/v5 payload.
 * Swiggy varies these by location and time of day.
 */
export function mapFoodCategoriesResponse(
  payload: unknown,
  hour = new Date().getHours(),
): FoodCategoriesDto {
  const root = payload as {
    data?: { cards?: { card?: { card?: Record<string, unknown> } }[] };
  };
  const cards = root.data?.cards ?? [];
  let title: string | undefined;
  const items: FoodCategory[] = [];
  const seen = new Set<string>();

  for (const wrap of cards) {
    const card = wrap?.card?.card;
    if (!card || typeof card !== 'object') continue;
    const grid = card.imageGridCards as
      | { info?: ImageGridInfo[] }
      | undefined;
    const infos = grid?.info;
    if (!Array.isArray(infos) || !infos.length) continue;

    const header = card.header as { title?: string } | undefined;
    if (!title && header?.title) title = String(header.title).trim();

    for (const info of infos) {
      const imageId = info.imageId;
      if (!imageId) continue;
      const name = foodCategoryName(info);
      if (!name) continue;
      const id = String(info.id ?? imageId);
      if (seen.has(id)) continue;
      seen.add(id);
      const query = foodCategoryQuery(info);
      const item: FoodCategory = {
        id,
        name,
        imageUrl: buildCategoryImageUrl(imageId),
      };
      if (query) item.query = query;
      items.push(item);
    }
  }

  return { hour, ...(title ? { title } : {}), items };
}

function foodCategoryName(info: ImageGridInfo): string {
  const text = String(info.action?.text ?? '').trim();
  if (text && text.toLowerCase() !== 'undefined') return titleCase(text);
  const alt = String(info.accessibility?.altText ?? '').trim();
  if (alt) {
    const cleaned = alt
      .replace(/^restaurants?\s+curated\s+for\s+/i, '')
      .replace(/^order\s+/i, '')
      .trim();
    if (cleaned) return titleCase(cleaned);
  }
  const desc = String(info.description ?? '').trim();
  return desc ? titleCase(desc) : '';
}

function foodCategoryQuery(info: ImageGridInfo): string | undefined {
  const link = String(info.action?.link ?? '');
  const fromQuery = link.match(/[?&]query=([^&]+)/i);
  if (fromQuery) {
    try {
      return decodeURIComponent(fromQuery[1]).replace(/\+/g, ' ').trim();
    } catch {
      return fromQuery[1];
    }
  }
  const name = foodCategoryName(info);
  return name || undefined;
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function mapPlaceAutocomplete(payload: unknown): PlaceSuggestion[] {
  const root = payload as { data?: unknown[] };
  if (!Array.isArray(root.data)) {
    return [];
  }
  return root.data
    .map((row) => {
      const r = row as {
        place_id?: string;
        description?: string;
        structured_formatting?: {
          main_text?: string;
          secondary_text?: string;
        };
      };
      if (!r.place_id || !r.description) {
        return null;
      }
      const suggestion: PlaceSuggestion = {
        placeId: r.place_id,
        description: r.description,
      };
      const main = r.structured_formatting?.main_text?.trim();
      const secondary = r.structured_formatting?.secondary_text?.trim();
      if (main) suggestion.mainText = main;
      if (secondary) suggestion.secondaryText = secondary;
      return suggestion;
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

type SwiggyChoice = {
  id?: string | number;
  name?: string;
  price?: number;
  defaultPrice?: number;
  isVeg?: number | boolean;
  inStock?: number | boolean;
  isEnabled?: number | boolean;
  default?: number | boolean;
};

type SwiggyAddonGroup = {
  groupId?: string | number;
  groupName?: string;
  name?: string;
  minAddons?: number;
  maxAddons?: number;
  choices?: SwiggyChoice[];
};

type SwiggyVariantGroup = {
  groupId?: string | number;
  name?: string;
  variations?: SwiggyChoice[];
};

type SwiggyPricingModel = {
  variations?: Array<string | number>;
  price?: number;
  addonCombinations?: Array<{
    groupId?: string | number;
    addonId?: string | number;
  }>;
};

type SwiggyMenuItem = {
  id?: string | number;
  name?: string;
  description?: string;
  price?: number;
  defaultPrice?: number;
  finalPrice?: { value?: number };
  isVeg?: number | boolean;
  cloudinaryImageId?: string;
  /** Some Swiggy payloads use imageId instead of cloudinaryImageId. */
  imageId?: string;
  imageIds?: string[];
  isBestSeller?: boolean;
  ribbon?: { text?: string };
  recommended?: number;
  ratings?: {
    aggregatedRating?: {
      rating?: string | number;
      ratingCount?: string | number;
      ratingCountV2?: string | number;
    };
  };
  addons?: SwiggyAddonGroup[];
  variantsV2?: {
    variantGroups?: SwiggyVariantGroup[];
    pricingModels?: SwiggyPricingModel[];
  };
  variants?: {
    variantGroups?: SwiggyVariantGroup[];
    pricingModels?: SwiggyPricingModel[];
  };
};

function menuItemRating(
  raw: SwiggyMenuItem,
): { rating: number; ratingCount?: string } | null {
  const agg = raw.ratings?.aggregatedRating;
  if (!agg) return null;
  const ratingRaw = agg.rating;
  const rating =
    typeof ratingRaw === 'string' ? parseFloat(ratingRaw) : Number(ratingRaw);
  if (!Number.isFinite(rating) || rating <= 0) return null;
  const countRaw = agg.ratingCountV2 ?? agg.ratingCount;
  const ratingCount =
    countRaw != null && String(countRaw).trim() !== ''
      ? String(countRaw).trim()
      : undefined;
  return ratingCount ? { rating, ratingCount } : { rating };
}

function menuItemImageId(raw: SwiggyMenuItem): string {
  const fromArray = Array.isArray(raw.imageIds)
    ? String(raw.imageIds.find(Boolean) ?? '').trim()
    : '';
  return (
    String(raw.cloudinaryImageId ?? '').trim() ||
    String(raw.imageId ?? '').trim() ||
    fromArray
  );
}

function mapChoice(raw: SwiggyChoice): MenuChoice | null {
  const id = String(raw.id ?? '').trim();
  const name = String(raw.name ?? '').trim();
  if (!id || !name) return null;
  if (raw.isEnabled === 0 || raw.isEnabled === false) return null;
  const pricePaise = Number(raw.price ?? raw.defaultPrice ?? 0) || 0;
  const choice: MenuChoice = {
    id,
    name,
    price: paiseToRupees(pricePaise),
  };
  if (raw.isVeg !== undefined) {
    choice.isVeg = raw.isVeg === true || raw.isVeg === 1;
  }
  if (raw.inStock !== undefined) {
    choice.inStock = !(raw.inStock === 0 || raw.inStock === false);
  }
  if (raw.default === 1 || raw.default === true) {
    choice.isDefault = true;
  }
  return choice;
}

function mapAddonGroups(groups: SwiggyAddonGroup[] | undefined): MenuAddonGroup[] {
  if (!Array.isArray(groups)) return [];
  const out: MenuAddonGroup[] = [];
  for (const g of groups) {
    const choices = (g.choices ?? [])
      .map(mapChoice)
      .filter((c): c is MenuChoice => Boolean(c));
    if (!choices.length) continue;
    const maxRaw = Number(g.maxAddons);
    const max =
      Number.isFinite(maxRaw) && maxRaw > 0
        ? maxRaw
        : Math.max(1, choices.length);
    const min = Math.max(0, Number(g.minAddons) || 0);
    out.push({
      id: String(g.groupId ?? g.groupName ?? g.name ?? out.length),
      name: String(g.groupName ?? g.name ?? 'Options'),
      min: Math.min(min, max),
      max,
      choices,
    });
  }
  return out;
}

function mapVariantGroups(raw: SwiggyMenuItem): MenuAddonGroup[] {
  const groups =
    raw.variantsV2?.variantGroups ?? raw.variants?.variantGroups ?? [];
  if (!Array.isArray(groups)) return [];
  const out: MenuAddonGroup[] = [];
  for (const g of groups) {
    const choices = (g.variations ?? [])
      .map(mapChoice)
      .filter((c): c is MenuChoice => Boolean(c));
    if (!choices.length) continue;
    out.push({
      id: String(g.groupId ?? g.name ?? out.length),
      name: String(g.name ?? 'Choice'),
      min: 1,
      max: 1,
      choices,
    });
  }
  return out;
}

function mapPricingModels(raw: SwiggyMenuItem): MenuPricingModel[] {
  const models =
    raw.variantsV2?.pricingModels ?? raw.variants?.pricingModels ?? [];
  if (!Array.isArray(models)) return [];
  const out: MenuPricingModel[] = [];
  for (const m of models) {
    const variationIds = (m.variations ?? [])
      .map((id) => String(id ?? '').trim())
      .filter(Boolean);
    if (!variationIds.length) continue;
    const model: MenuPricingModel = {
      variationIds,
      price: paiseToRupees(Number(m.price) || 0),
    };
    const addonIds = (m.addonCombinations ?? [])
      .map((c) => String(c.addonId ?? '').trim())
      .filter(Boolean);
    if (addonIds.length) model.addonIds = [...new Set(addonIds)];
    out.push(model);
  }
  return out;
}

function mapMenuItem(raw: SwiggyMenuItem): MenuItem {
  const isVeg = raw.isVeg === true || raw.isVeg === 1;
  const isBestseller =
    raw.isBestSeller === true ||
    raw.ribbon?.text?.toLowerCase() === 'bestseller' ||
    raw.recommended === 1;

  const variants = mapVariantGroups(raw);
  const addons = mapAddonGroups(raw.addons);
  const pricingModels = mapPricingModels(raw);

  const defaultModel =
    pricingModels.find((m) =>
      m.variationIds.every((vid) =>
        variants.some((g) => g.choices.some((c) => c.id === vid && c.isDefault)),
      ),
    ) ?? pricingModels[0];

  const pricePaise =
    Number(raw.finalPrice?.value ?? raw.defaultPrice ?? raw.price ?? 0) || 0;
  const price =
    defaultModel && defaultModel.price > 0
      ? defaultModel.price
      : paiseToRupees(pricePaise);

  const item: MenuItem = {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    description: String(raw.description ?? ''),
    price,
    isVeg,
  };
  const imageKey = menuItemImageId(raw);
  if (imageKey) {
    item.imageUrl = buildCloudinaryUrl(imageKey);
  }
  if (isBestseller) {
    item.isBestseller = true;
  }
  const dishRating = menuItemRating(raw);
  if (dishRating) {
    item.rating = dishRating.rating;
    if (dishRating.ratingCount) item.ratingCount = dishRating.ratingCount;
  }
  if (variants.length) item.variants = variants;
  if (addons.length) item.addons = addons;
  if (pricingModels.length) item.pricingModels = pricingModels;
  if (variants.length || addons.length) item.customisable = true;
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

type MenuInfoCard = {
  '@type'?: string;
  text?: string;
  info?: {
    name?: string;
    cuisines?: string[] | string;
    avgRating?: number | string;
    totalRatingsString?: string;
    areaName?: string;
    locality?: string;
    city?: string;
    costForTwoMessage?: string;
    cloudinaryImageId?: string;
    veg?: boolean | number;
    sla?: {
      deliveryTime?: number;
      slaString?: string;
      lastMileTravelString?: string;
    };
    availability?: {
      opened?: boolean;
      nextCloseTime?: string | number;
      nextCloseMessage?: string;
      nextOpenTime?: string | number;
      restaurantClosedMessage?: string;
    };
    isOpen?: boolean | number;
    /** Occasional weekly hours payloads on restaurant / about widgets. */
    openingHours?: unknown;
    openingHoursList?: unknown;
    aggregatedDiscountInfoV3?: {
      header?: string;
      subHeader?: string;
      discountTag?: string;
    };
    aggregatedDiscountInfoV2?: {
      header?: string;
      shortDescriptionList?: { meta?: string }[];
    };
    aggregatedDiscountInfo?: {
      header?: string;
      shortDescriptionList?: { meta?: string }[];
    };
    labels?: { title?: string; message?: string }[];
  };
};

function walkMenuCards(payload: unknown): MenuInfoCard[] {
  const root = payload as {
    data?: { cards?: { card?: { card?: MenuInfoCard } }[] };
  };
  return (root.data?.cards ?? [])
    .map((c) => c?.card?.card)
    .filter((c): c is MenuInfoCard => Boolean(c));
}

function extractMenuRestaurantName(payload: unknown): string | undefined {
  const root = payload as { data?: { name?: string } };
  if (root.data?.name) return root.data.name;
  for (const inner of walkMenuCards(payload)) {
    if (inner?.text && String(inner.text).trim()) {
      return String(inner.text).trim();
    }
    if (inner?.info?.name) {
      return String(inner.info.name).trim();
    }
  }
  return undefined;
}

function extractMenuAbout(payload: unknown): MenuAbout | undefined {
  const restaurantCard = walkMenuCards(payload).find((c) =>
    String(c['@type'] ?? '').includes('food.v2.Restaurant'),
  );
  const info = restaurantCard?.info;
  if (!info) return undefined;

  const cuisines = Array.isArray(info.cuisines)
    ? info.cuisines.join(', ')
    : String(info.cuisines ?? '');
  const addressLabel = info.labels?.find(
    (l) => String(l.title ?? '').toLowerCase() === 'address',
  );
  const address =
    addressLabel?.message && addressLabel.message !== 'null'
      ? String(addressLabel.message)
      : undefined;
  const ratingRaw = info.avgRating;
  const rating =
    typeof ratingRaw === 'string' ? parseFloat(ratingRaw) : Number(ratingRaw);

  const v3 = info.aggregatedDiscountInfoV3;
  const v3Parts = [v3?.header, v3?.subHeader, v3?.discountTag]
    .map((s) => (s == null ? '' : String(s).trim()))
    .filter((s) => s && s !== 'null');
  const offer =
    (v3Parts.length ? v3Parts.join(' ') : undefined) ??
    info.aggregatedDiscountInfoV2?.shortDescriptionList?.[0]?.meta ??
    info.aggregatedDiscountInfoV2?.header ??
    info.aggregatedDiscountInfo?.shortDescriptionList?.[0]?.meta ??
    info.aggregatedDiscountInfo?.header;
  const etaMins = Number(info.sla?.deliveryTime) || 0;
  const openedRaw = info.availability?.opened ?? info.isOpen;
  const isOpen =
    openedRaw === undefined || openedRaw === null
      ? undefined
      : Boolean(openedRaw === true || openedRaw === 1);
  const closesRaw =
    info.availability?.nextCloseMessage ||
    info.availability?.nextCloseTime ||
    '';
  const closesAt = formatClosesAt(closesRaw);

  const about: MenuAbout = {};
  if (cuisines) about.cuisines = cuisines;
  if (info.areaName) about.areaName = String(info.areaName);
  if (info.locality) about.locality = String(info.locality);
  if (info.city) about.city = String(info.city);
  if (address) about.address = address;
  if (info.costForTwoMessage) {
    about.costForTwoMessage = String(info.costForTwoMessage);
  }
  if (Number.isFinite(rating) && rating > 0) about.rating = rating;
  if (info.totalRatingsString) {
    about.totalRatingsString = String(info.totalRatingsString);
  }
  if (info.cloudinaryImageId) {
    about.imageUrl = buildCloudinaryUrl(info.cloudinaryImageId);
  }
  if (offer && String(offer).trim() && String(offer) !== 'null') {
    about.offer = String(offer).trim();
  }
  if (info.veg === true || info.veg === 1) {
    about.isVeg = true;
  }
  if (etaMins > 0) {
    about.etaMins = etaMins;
  }
  const slaString = String(info.sla?.slaString ?? '').trim();
  if (slaString && slaString !== 'null') about.slaString = slaString;
  const distance = String(info.sla?.lastMileTravelString ?? '').trim();
  if (distance && distance !== 'null') about.distance = distance;
  if (isOpen !== undefined) about.isOpen = isOpen;
  if (closesAt) about.closesAt = closesAt;

  const openingHours =
    parseOpeningHours(info.openingHours) ||
    parseOpeningHours(info.openingHoursList) ||
    findOpeningHoursInPayload(payload);
  if (openingHours?.length) about.openingHours = openingHours;

  return Object.keys(about).length ? about : undefined;
}

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

function todayName(): string {
  return WEEKDAYS[new Date().getDay()];
}

/** Normalize Swiggy / partner weekly hours into UI rows. */
export function parseOpeningHours(raw: unknown): OpeningHourRow[] | undefined {
  if (!raw) return undefined;
  const today = todayName();

  if (Array.isArray(raw)) {
    const rows: OpeningHourRow[] = [];
    for (const entry of raw) {
      if (!entry || typeof entry !== 'object') continue;
      const e = entry as Record<string, unknown>;
      const day = String(
        e.day ?? e.Day ?? e.title ?? e.name ?? e.weekday ?? '',
      ).trim();
      const time = String(
        e.time ??
          e.Time ??
          e.hours ??
          e.Hours ??
          e.message ??
          e.openTime ??
          e.timing ??
          '',
      ).trim();
      if (!day || !time || time === 'null') continue;
      const row: OpeningHourRow = { day, time };
      if (day.toLowerCase().startsWith(today.slice(0, 3).toLowerCase())) {
        row.isToday = true;
      }
      rows.push(row);
    }
    return rows.length ? rows : undefined;
  }

  if (typeof raw === 'string' && raw.trim()) {
    return [{ day: 'Hours', time: raw.trim(), isToday: true }];
  }

  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    // { Monday: "10am-11pm", ... }
    const rows: OpeningHourRow[] = [];
    for (const day of WEEKDAYS) {
      const time = obj[day] ?? obj[day.toLowerCase()] ?? obj[day.slice(0, 3)];
      if (time == null || String(time).trim() === '') continue;
      rows.push({
        day,
        time: String(time).trim(),
        ...(day === today ? { isToday: true } : {}),
      });
    }
    if (rows.length) return rows;
  }

  return undefined;
}

/** Deep-scan menu cards for an opening-hours widget Swiggy sometimes nests. */
function findOpeningHoursInPayload(payload: unknown): OpeningHourRow[] | undefined {
  const found: OpeningHourRow[] = [];

  function walk(node: unknown, depth: number) {
    if (!node || depth > 12 || found.length) return;
    if (Array.isArray(node)) {
      const asHours = parseOpeningHours(node);
      if (asHours && asHours.length >= 3) {
        found.push(...asHours);
        return;
      }
      for (const child of node) walk(child, depth + 1);
      return;
    }
    if (typeof node !== 'object') return;
    const obj = node as Record<string, unknown>;
    for (const [key, value] of Object.entries(obj)) {
      if (/opening.?hour/i.test(key) || /^timings?$/i.test(key)) {
        const parsed = parseOpeningHours(value);
        if (parsed?.length) {
          found.push(...parsed);
          return;
        }
      }
      walk(value, depth + 1);
      if (found.length) return;
    }
  }

  walk(payload, 0);
  return found.length ? found : undefined;
}

/** Turn Swiggy close timestamps / messages into a short display time. */
function formatClosesAt(raw: unknown): string | undefined {
  if (raw == null || raw === '') return undefined;
  const text = String(raw).trim();
  if (!text || text === 'null') return undefined;
  const fromMessage = text.match(
    /closes?\s+(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i,
  );
  if (fromMessage) return fromMessage[1].replace(/\s+/g, ' ').toLowerCase();
  if (/^\d{1,2}(?::\d{2})?\s*(?:am|pm)$/i.test(text)) {
    return text.replace(/\s+/g, ' ').toLowerCase();
  }
  const asNum = Number(text);
  if (Number.isFinite(asNum) && asNum > 1e11) {
    const clock = clockFromDate(new Date(asNum));
    if (clock) return clock;
  }
  // "2026-10-27 23:00:00" / ISO-ish nextCloseMessage values
  const datetime = text.match(
    /^(\d{4}-\d{2}-\d{2})[ T](\d{1,2}:\d{2}(?::\d{2})?)/,
  );
  if (datetime) {
    const clock = clockFromDate(new Date(`${datetime[1]}T${datetime[2]}`));
    if (clock) return clock;
  }
  if (/\d{4}-\d{2}-\d{2}/.test(text)) return undefined;
  return text.length <= 24 ? text : undefined;
}

function clockFromDate(d: Date): string | undefined {
  if (Number.isNaN(d.getTime())) return undefined;
  return d
    .toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .replace(/\s+/g, ' ')
    .toLowerCase();
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
  const about = extractMenuAbout(payload);
  const name =
    restaurantName ??
    extractMenuRestaurantName(payload) ??
    root.data?.name ??
    `Restaurant ${restaurantId}`;
  const dto: MenuDto = {
    restaurantId,
    restaurantName: name,
    categories,
  };
  if (about) dto.about = about;
  return dto;
}
