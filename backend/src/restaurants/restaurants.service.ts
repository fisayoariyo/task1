import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CachedService } from '../cache/cached.service';
import {
  FoodCategoriesDto,
  MenuDto,
  RestaurantCard,
  RestaurantSource,
} from '../source/restaurant-source';
import { SOURCE } from '../source/source.tokens';

const LIST_SOFT_TTL_MS = 300_000;
const LIST_HARD_TTL_MS = 900_000;
const MENU_SOFT_TTL_MS = 600_000;
const MENU_HARD_TTL_MS = 1_800_000;
/** Short TTL — categories rotate by time of day. */
const FOOD_CAT_SOFT_TTL_MS = 180_000;
const FOOD_CAT_HARD_TTL_MS = 600_000;

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

@Injectable()
export class RestaurantsService {
  constructor(
    @Inject(SOURCE) private readonly source: RestaurantSource,
    private readonly cached: CachedService,
  ) {}

  async listRestaurants(
    latRaw: string,
    lngRaw: string,
    offsetRaw?: string,
  ): Promise<RestaurantCard[]> {
    const lat = roundCoord(parseRequiredCoord(latRaw, 'lat'));
    const lng = roundCoord(parseRequiredCoord(lngRaw, 'lng'));
    const offset = offsetRaw !== undefined ? parseInt(offsetRaw, 10) : 0;
    const key = `rest:${lat}:${lng}:${offset}`;
    return this.cached.wrap(key, LIST_SOFT_TTL_MS, LIST_HARD_TTL_MS, () =>
      this.source.listRestaurants(lat, lng, offset),
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
}
