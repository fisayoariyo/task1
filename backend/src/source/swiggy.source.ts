import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { firstValueFrom } from 'rxjs';
import {
  mapFoodCategoriesResponse,
  mapGeocodeResponse,
  mapMenuResponse,
  mapPlaceAutocomplete,
  mapRestaurantListResponse,
} from './mappers';
import {
  FoodCategoriesDto,
  MenuDto,
  PlaceSuggestion,
  RestaurantCard,
  RestaurantSource,
} from './restaurant-source';

export const SWIGGY_HTTP_TIMEOUT_MS = 8000;

const DEFAULT_BASE_URL = 'https://www.swiggy.com/dapi';

/** Live menu API — dapi/menu/v4/full returns 403; dapi/menu/pl returns 202 empty. */
export const SWIGGY_MENU_URL = 'https://www.swiggy.com/mapi/menu/pl';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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

  async listRestaurants(
    lat: number,
    lng: number,
    offset: number,
  ): Promise<RestaurantCard[]> {
    const data = await this.get<unknown>('/restaurants/list/v5', {
      lat,
      lng,
      offset,
      sortBy: 'RELEVANCE',
      pageType: 'SEE_ALL',
      page_type: 'DESKTOP_SEE_ALL_LISTING',
    });
    return mapRestaurantListResponse(data);
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
  ): Promise<T> {
    const url = this.resolveUrl(pathOrUrl);
    const config: AxiosRequestConfig = {
      timeout: SWIGGY_HTTP_TIMEOUT_MS,
      headers: {
        ...BROWSER_HEADERS,
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
