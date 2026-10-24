import { Inject, Injectable } from '@nestjs/common';
import { CachedService } from '../cache/cached.service';
import {
  MenuDto,
  RestaurantCard,
  RestaurantSource,
} from '../source/restaurant-source';
import { SOURCE } from '../source/source.tokens';

const LIST_SOFT_TTL_MS = 300_000;
const LIST_HARD_TTL_MS = 900_000;
const MENU_SOFT_TTL_MS = 600_000;
const MENU_HARD_TTL_MS = 1_800_000;

function roundCoord(value: number): number {
  return Math.round(value * 1000) / 1000;
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
    const lat = roundCoord(parseFloat(latRaw));
    const lng = roundCoord(parseFloat(lngRaw));
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
    const lat = parseFloat(latRaw);
    const lng = parseFloat(lngRaw);
    const key = `menu:${restaurantId}`;
    return this.cached.wrap(key, MENU_SOFT_TTL_MS, MENU_HARD_TTL_MS, () =>
      this.source.getMenu(restaurantId, lat, lng),
    );
  }
}
