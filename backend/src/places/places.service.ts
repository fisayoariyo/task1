import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { CachedService } from '../cache/cached.service';
import { MockSource } from '../source/mock.source';
import {
  PlaceSuggestion,
  RestaurantSource,
} from '../source/restaurant-source';
import { SOURCE } from '../source/source.tokens';
import {
  nominatimAutocomplete,
  nominatimReverse,
  parseGeoPlaceId,
} from './nominatim.fallback';

const AUTOCOMPLETE_TTL_MS = 86_400_000;
const GEOCODE_TTL_MS = 2_592_000_000;

@Injectable()
export class PlacesService {
  private readonly logger = new Logger(PlacesService.name);
  private readonly mock = new MockSource();

  constructor(
    @Inject(SOURCE) private readonly source: RestaurantSource,
    private readonly cached: CachedService,
  ) {}

  async autocomplete(input: string): Promise<PlaceSuggestion[]> {
    if (input.length < 3) {
      throw new BadRequestException('input must be at least 3 characters');
    }
    // v3: Nominatim rows now include mainText/secondaryText (Swiggy-style lines).
    const key = `ac:v3:${input.toLowerCase()}`;
    try {
      return await this.cached.wrap(
        key,
        AUTOCOMPLETE_TTL_MS,
        AUTOCOMPLETE_TTL_MS,
        () => this.source.autocomplete(input),
      );
    } catch (err) {
      this.logger.warn(
        `Swiggy autocomplete failed (${(err as Error)?.message ?? err}); trying Nominatim`,
      );
      try {
        const osm = await nominatimAutocomplete(input);
        if (osm.length) return osm;
      } catch (osmErr) {
        this.logger.warn(
          `Nominatim autocomplete failed (${(osmErr as Error)?.message ?? osmErr}); using mock places`,
        );
      }
      return this.mock.autocomplete(input);
    }
  }

  async geocode(placeId: string): Promise<{ lat: number; lng: number }> {
    const encoded = parseGeoPlaceId(placeId);
    if (encoded) return encoded;

    const key = `geo:${placeId}`;
    try {
      return await this.cached.wrap(
        key,
        GEOCODE_TTL_MS,
        GEOCODE_TTL_MS,
        () => this.source.geocode(placeId),
      );
    } catch (err) {
      this.logger.warn(
        `Swiggy geocode failed (${(err as Error)?.message ?? err}); using mock geocode`,
      );
      return this.mock.geocode(placeId);
    }
  }

  async reverse(latRaw: string, lngRaw: string) {
    const lat = parseFloat(latRaw);
    const lng = parseFloat(lngRaw);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new BadRequestException('lat and lng must be valid numbers');
    }
    const key = `rev:${lat.toFixed(4)}:${lng.toFixed(4)}`;
    return this.cached.wrap(key, GEOCODE_TTL_MS, GEOCODE_TTL_MS, () =>
      nominatimReverse(lat, lng),
    );
  }
}
