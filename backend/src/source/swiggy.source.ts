import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  mapGeocodeResponse,
  mapMenuResponse,
  mapPlaceAutocomplete,
  mapRestaurantListResponse,
} from './mappers';
import {
  MenuDto,
  PlaceSuggestion,
  RestaurantCard,
  RestaurantSource,
} from './restaurant-source';

export const SWIGGY_HTTP_TIMEOUT_MS = 4000;

const DEFAULT_BASE_URL = 'https://www.swiggy.com/dapi';

export class SwiggySource implements RestaurantSource {
  constructor(
    private readonly http: HttpService,
    private readonly baseUrl: string = DEFAULT_BASE_URL,
  ) {}

  async autocomplete(input: string): Promise<PlaceSuggestion[]> {
    const data = await this.get<unknown>('/misc/place-autocomplete', {
      input,
      types: '',
    });
    return mapPlaceAutocomplete(data);
  }

  async geocode(placeId: string): Promise<{ lat: number; lng: number }> {
    const data = await this.get<unknown>('/misc/address-recommend', {
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

  async getMenu(
    restaurantId: string,
    lat: number,
    lng: number,
  ): Promise<MenuDto> {
    const data = await this.get<unknown>('/menu/v4/full', {
      lat,
      lng,
      menuId: restaurantId,
    });
    return mapMenuResponse(data, restaurantId);
  }

  private async get<T>(
    path: string,
    params: Record<string, string | number>,
  ): Promise<T> {
    const config = {
      params,
      timeout: SWIGGY_HTTP_TIMEOUT_MS,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
        Referer: 'https://www.swiggy.com/',
        Origin: 'https://www.swiggy.com',
      },
    };
    const url = `${this.baseUrl}${path}`;
    try {
      const response = await firstValueFrom(this.http.get<T>(url, config));
      return response.data;
    } catch {
      const response = await firstValueFrom(this.http.get<T>(url, config));
      return response.data;
    }
  }
}
