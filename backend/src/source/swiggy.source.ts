import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { firstValueFrom } from 'rxjs';
import {
  mapFoodCategoriesResponse,
  mapGeocodeResponse,
  mapMenuResponse,
  mapPlaceAutocomplete,
  mapRestaurantListPage,
  mapRestaurantSearchResponse,
  mapRestaurantSuggestResponse,
} from './mappers';
import {
  FoodCategoriesDto,
  MenuDto,
  PlaceSuggestion,
  RestaurantListCursor,
  RestaurantListPage,
  RestaurantSearchResult,
  RestaurantSuggestItem,
  RestaurantSuggestResult,
  RestaurantSource,
} from './restaurant-source';

export const SWIGGY_HTTP_TIMEOUT_MS = 8000;

const DEFAULT_BASE_URL = 'https://www.swiggy.com/dapi';

/** Live menu API — dapi/menu/v4/full returns 403; dapi/menu/pl returns 202 empty. */
export const SWIGGY_MENU_URL = 'https://www.swiggy.com/mapi/menu/pl';

/**
 * Desktop dapi/list/update is WAF-gated (202 empty). Mobile mapi/update
 * accepts the same nextOffset cursor and returns the next restaurant batch.
 */
export const SWIGGY_LIST_UPDATE_URL =
  'https://www.swiggy.com/mapi/restaurants/list/update';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  Referer: 'https://www.swiggy.com/',
  Origin: 'https://www.swiggy.com',
};

/** Mobile UA — required for mapi list/update pagination without WAF. */
const MOBILE_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  Accept: 'application/json, text/plain, */*',
  Referer: 'https://www.swiggy.com/',
  Origin: 'https://www.swiggy.com',
};

export class SwiggySource implements RestaurantSource {
  private readonly logger = new Logger(SwiggySource.name);

  constructor(
    private readonly http: HttpService,
    private readonly baseUrl: string = DEFAULT_BASE_URL,
  ) {}

  /**
   * Swiggy web uses POST /misc/place-autocomplete with JSON body
   * `{ input, types: [] }` — GET returns a bot/404 HTML page.
   */
  async autocomplete(input: string): Promise<PlaceSuggestion[]> {
    const data = await this.post<unknown>('/misc/place-autocomplete', {
      input,
      types: [],
    });
    return mapPlaceAutocomplete(data);
  }

  /** Swiggy web uses POST /misc/address-recommend with `{ place_id }`. */
  async geocode(placeId: string): Promise<{ lat: number; lng: number }> {
    const data = await this.post<unknown>('/misc/address-recommend', {
      place_id: placeId,
    });
    return mapGeocodeResponse(data);
  }

  /**
   * Location-based restaurant feed with Swiggy-style cursor pagination.
   * First page: dapi homepage listing. Next pages: mapi/list/update.
   */
  async listRestaurants(
    lat: number,
    lng: number,
    cursor?: RestaurantListCursor,
  ): Promise<RestaurantListPage> {
    if (cursor?.nextOffset) {
      return this.listRestaurantsPage(lat, lng, cursor);
    }
    const data = await this.get<unknown>('/restaurants/list/v5', {
      lat,
      lng,
      'is-seo-homepage-enabled': 'true',
      page_type: 'DESKTOP_WEB_LISTING',
    });
    return mapRestaurantListPage(data);
  }

  private async listRestaurantsPage(
    lat: number,
    lng: number,
    cursor: RestaurantListCursor,
  ): Promise<RestaurantListPage> {
    const body: Record<string, unknown> = {
      lat,
      lng,
      nextOffset: cursor.nextOffset,
      widgetOffset: cursor.widgetOffset ?? {},
      filters: {},
      page_type: 'DESKTOP_WEB_LISTING',
    };
    const data = await this.post<unknown>(SWIGGY_LIST_UPDATE_URL, body, {
      headers: MOBILE_HEADERS,
    });
    return mapRestaurantListPage(data);
  }

  /**
   * Homepage listing — includes “What’s on your mind?” image tiles that
   * Swiggy rotates by location and time of day.
   */
  async listFoodCategories(
    lat: number,
    lng: number,
  ): Promise<FoodCategoriesDto> {
    const data = await this.get<unknown>('/restaurants/list/v5', {
      lat,
      lng,
      'is-seo-homepage-enabled': 'true',
      page_type: 'DESKTOP_WEB_LISTING',
    });
    return mapFoodCategoriesResponse(data, new Date().getHours());
  }

  async getMenu(
    restaurantId: string,
    lat: number,
    lng: number,
  ): Promise<MenuDto> {
    const data = await this.get<unknown>(SWIGGY_MENU_URL, {
      'page-type': 'REGULAR_MENU',
      'complete-menu': 'true',
      lat,
      lng,
      restaurantId,
      catalog_qa: 'undefined',
      submitAction: 'ENTER',
    });
    return mapMenuResponse(data, restaurantId);
  }

  /**
   * Keyword search for the deliver-to point (Swiggy `str` + restaurant tab).
   * Any user keyword — not limited to a fixed vocabulary.
   */
  async searchRestaurants(
    lat: number,
    lng: number,
    query: string,
  ): Promise<RestaurantSearchResult> {
    const str = String(query ?? '').trim();
    const data = await this.get<unknown>('/restaurants/search/v2_2', {
      lat,
      lng,
      str,
      trackingId: 'undefined',
      submitAction: 'ENTER',
      queryUniqueId: 'undefined',
      selectedPLTab: 'RESTAURANT',
    });
    return mapRestaurantSearchResponse(data, str);
  }

  /**
   * As-you-type suggestions (Swiggy `submitAction=SUGGEST`).
   * Falls back to ENTER search cards if SUGGEST returns empty.
   */
  async suggestRestaurants(
    lat: number,
    lng: number,
    query: string,
  ): Promise<RestaurantSuggestResult> {
    const str = String(query ?? '').trim();
    const data = await this.get<unknown>('/restaurants/search/v2_2', {
      lat,
      lng,
      str,
      trackingId: 'undefined',
      submitAction: 'SUGGEST',
      queryUniqueId: 'undefined',
    });
    const mapped = mapRestaurantSuggestResponse(data, str);
    if (mapped.items.length > 0) {
      return mapped;
    }
    const fallback = await this.searchRestaurants(lat, lng, str);
    return {
      query: fallback.query,
      items: fallback.restaurants.slice(0, 24).map((restaurant) => {
        const item: RestaurantSuggestItem = {
          kind: 'restaurant',
          text: restaurant.name,
          restaurantId: restaurant.id,
        };
        if (restaurant.imageUrl) item.imageUrl = restaurant.imageUrl;
        return item;
      }),
    };
  }

  private resolveUrl(pathOrUrl: string): string {
    if (/^https?:\/\//i.test(pathOrUrl)) {
      return pathOrUrl;
    }
    return `${this.baseUrl}${pathOrUrl}`;
  }

  private upstreamStatus(err: unknown): string {
    if (err && typeof err === 'object' && 'isAxiosError' in err) {
      const ax = err as AxiosError;
      const status = ax.response?.status;
      if (status !== undefined) return String(status);
    }
    return (err as Error)?.message ?? 'unknown';
  }

  private async requestWithRetry<T>(
    label: string,
    run: () => Promise<T>,
  ): Promise<T> {
    try {
      return await run();
    } catch (firstErr) {
      this.logger.warn(
        `Swiggy ${label} failed (status=${this.upstreamStatus(firstErr)}); retrying once`,
      );
      try {
        return await run();
      } catch (secondErr) {
        const status = this.upstreamStatus(secondErr);
        this.logger.error(
          `Swiggy ${label} failed after retry (status=${status})`,
        );
        throw new Error(`Swiggy upstream ${status} for ${label}`);
      }
    }
  }

  private async get<T>(
    pathOrUrl: string,
    params: Record<string, string | number>,
  ): Promise<T> {
    const url = this.resolveUrl(pathOrUrl);
    const config: AxiosRequestConfig = {
      params,
      timeout: SWIGGY_HTTP_TIMEOUT_MS,
      headers: BROWSER_HEADERS,
    };
    return this.requestWithRetry(url, async () => {
      const response = await firstValueFrom(this.http.get<T>(url, config));
      return response.data;
    });
  }

  private async post<T>(
    pathOrUrl: string,
    body: Record<string, unknown>,
    opts?: { headers?: Record<string, string> },
  ): Promise<T> {
    const url = this.resolveUrl(pathOrUrl);
    const config: AxiosRequestConfig = {
      timeout: SWIGGY_HTTP_TIMEOUT_MS,
      headers: {
        ...(opts?.headers ?? BROWSER_HEADERS),
        'Content-Type': 'application/json',
      },
    };
    return this.requestWithRetry(url, async () => {
      const response = await firstValueFrom(
        this.http.post<T>(url, body, config),
      );
      return response.data;
    });
  }
}
