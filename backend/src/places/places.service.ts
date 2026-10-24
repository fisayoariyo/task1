import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CachedService } from '../cache/cached.service';
import {
  PlaceSuggestion,
  RestaurantSource,
} from '../source/restaurant-source';
import { SOURCE } from '../source/source.tokens';

const AUTOCOMPLETE_TTL_MS = 86_400_000;
const GEOCODE_TTL_MS = 2_592_000_000;

@Injectable()
export class PlacesService {
  constructor(
    @Inject(SOURCE) private readonly source: RestaurantSource,
    private readonly cached: CachedService,
  ) {}

  async autocomplete(input: string): Promise<PlaceSuggestion[]> {
    if (input.length < 3) {
      throw new BadRequestException('input must be at least 3 characters');
    }
    const key = `ac:${input.toLowerCase()}`;
    return this.cached.wrap(key, AUTOCOMPLETE_TTL_MS, AUTOCOMPLETE_TTL_MS, () =>
      this.source.autocomplete(input),
    );
  }

  async geocode(placeId: string): Promise<{ lat: number; lng: number }> {
    const key = `geo:${placeId}`;
    return this.cached.wrap(key, GEOCODE_TTL_MS, GEOCODE_TTL_MS, () =>
      this.source.geocode(placeId),
    );
  }
}
