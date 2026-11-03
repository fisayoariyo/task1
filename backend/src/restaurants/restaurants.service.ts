import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CachedService } from '../cache/cached.service';
import {
  FoodCategoriesDto,
  MenuDto,
  RestaurantListCursor,
  RestaurantListPage,
  RestaurantSuggestResult,
  RestaurantSource,
  SearchResult,
  SearchTab,
} from '../source/restaurant-source';
import { SOURCE } from '../source/source.tokens';

const LIST_SOFT_TTL_MS = 300_000;
const LIST_HARD_TTL_MS = 900_000;
const MENU_SOFT_TTL_MS = 600_000;
const MENU_HARD_TTL_MS = 1_800_000;
/** Short TTL — categories rotate by time of day. */
const FOOD_CAT_SOFT_TTL_MS = 180_000;
const FOOD_CAT_HARD_TTL_MS = 600_000;
const SEARCH_SOFT_TTL_MS = 120_000;
const SEARCH_HARD_TTL_MS = 300_000;
/** Typing suggest — shorter cache so chips stay fresh. */
const SUGGEST_SOFT_TTL_MS = 60_000;
const SUGGEST_HARD_TTL_MS = 180_000;

function roundCoord(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function parseRequiredCoord(raw: string | undefined, name: string): number {
  if (raw === undefined || raw.trim() === '') {
    throw new BadRequestException(`${name} query parameter is required`);
  }
  const value = parseFloat(raw);
  if (Number.isNaN(value)) {
    throw new BadRequestException(`${name} must be a valid number`);
  }
  return value;
}

function normalizeSearchTab(raw: string | undefined): SearchTab {
  return String(raw ?? '').trim().toLowerCase() === 'dish'
    ? 'dish'
    : 'restaurant';
}

function parseWidgetOffset(
  raw: string | undefined,
): Record<string, string> | undefined {
  if (raw === undefined || raw.trim() === '') return undefined;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new BadRequestException('widgetOffset must be a JSON object');
    }
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (v != null) out[k] = String(v);
    }
    return out;
  } catch (err) {
    if (err instanceof BadRequestException) throw err;
    throw new BadRequestException('widgetOffset must be valid JSON');
  }
}

@Injectable()
export class RestaurantsService {
  constructor(
    @Inject(SOURCE) private readonly source: RestaurantSource,
    private readonly cached: CachedService,
  ) {}

  async listRestaurants(
    latRaw: string,
    lngRaw: string,
    nextOffsetRaw?: string,
    widgetOffsetRaw?: string,
  ): Promise<RestaurantListPage> {
    const lat = roundCoord(parseRequiredCoord(latRaw, 'lat'));
    const lng = roundCoord(parseRequiredCoord(lngRaw, 'lng'));
    const nextOffset = nextOffsetRaw?.trim() || undefined;
    const widgetOffset = parseWidgetOffset(widgetOffsetRaw);
    const cursor: RestaurantListCursor | undefined = nextOffset
      ? { nextOffset, widgetOffset }
      : undefined;
    const cursorKey = nextOffset
      ? `${nextOffset}:${widgetOffsetRaw?.slice(0, 48) ?? ''}`
      : '0';
    const key = `rest:${lat}:${lng}:${cursorKey}`;
    return this.cached.wrap(key, LIST_SOFT_TTL_MS, LIST_HARD_TTL_MS, () =>
      this.source.listRestaurants(lat, lng, cursor),
    );
  }

  async getMenu(
    restaurantId: string,
    latRaw: string,
    lngRaw: string,
  ): Promise<MenuDto> {
    const lat = parseRequiredCoord(latRaw, 'lat');
    const lng = parseRequiredCoord(lngRaw, 'lng');
    const key = `menu:${restaurantId}`;
    return this.cached.wrap(key, MENU_SOFT_TTL_MS, MENU_HARD_TTL_MS, () =>
      this.source.getMenu(restaurantId, lat, lng),
    );
  }

  async listFoodCategories(
    latRaw: string,
    lngRaw: string,
  ): Promise<FoodCategoriesDto> {
    const lat = roundCoord(parseRequiredCoord(latRaw, 'lat'));
    const lng = roundCoord(parseRequiredCoord(lngRaw, 'lng'));
    const hour = new Date().getHours();
    const key = `foodcats:${lat}:${lng}:${hour}`;
    return this.cached.wrap(
      key,
      FOOD_CAT_SOFT_TTL_MS,
      FOOD_CAT_HARD_TTL_MS,
      () => this.source.listFoodCategories(lat, lng),
    );
  }

  async searchRestaurants(
    latRaw: string,
    lngRaw: string,
    queryRaw: string | undefined,
    tabRaw?: string,
  ): Promise<SearchResult> {
    const lat = roundCoord(parseRequiredCoord(latRaw, 'lat'));
    const lng = roundCoord(parseRequiredCoord(lngRaw, 'lng'));
    const query = String(queryRaw ?? '').trim();
    if (query.length < 3) {
      throw new BadRequestException('q must be at least 3 characters');
    }
    const tab = normalizeSearchTab(tabRaw);
    const key = `search:${lat}:${lng}:${tab}:${query.toLowerCase()}`;
    return this.cached.wrap(key, SEARCH_SOFT_TTL_MS, SEARCH_HARD_TTL_MS, () =>
      this.source.searchRestaurants(lat, lng, query, tab),
    );
  }

  async suggestRestaurants(
    latRaw: string,
    lngRaw: string,
    queryRaw: string | undefined,
  ): Promise<RestaurantSuggestResult> {
    const lat = roundCoord(parseRequiredCoord(latRaw, 'lat'));
    const lng = roundCoord(parseRequiredCoord(lngRaw, 'lng'));
    const query = String(queryRaw ?? '').trim();
    if (query.length < 3) {
      throw new BadRequestException('q must be at least 3 characters');
    }
    const key = `suggest:${lat}:${lng}:${query.toLowerCase()}`;
    return this.cached.wrap(key, SUGGEST_SOFT_TTL_MS, SUGGEST_HARD_TTL_MS, () =>
      this.source.suggestRestaurants(lat, lng, query),
    );
  }
}
