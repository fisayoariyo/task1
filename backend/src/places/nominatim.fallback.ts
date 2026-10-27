import { PlaceSuggestion } from '../source/restaurant-source';

/** Encoded when Swiggy place-autocomplete is blocked (403) — lat/lng already resolved. */
export const GEO_PLACE_PREFIX = 'geo:';

type NominatimHit = {
  lat?: string;
  lon?: string;
  display_name?: string;
  name?: string;
  address?: Record<string, string>;
};

export function parseGeoPlaceId(
  placeId: string,
): { lat: number; lng: number } | null {
  if (!placeId.startsWith(GEO_PLACE_PREFIX)) return null;
  const [latS, lngS] = placeId.slice(GEO_PLACE_PREFIX.length).split(',');
  const lat = Number(latS);
  const lng = Number(lngS);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

async function nominatimFetch(url: URL): Promise<unknown> {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'NestSwiggyBFF/1.0 (localhost food-delivery demo)',
    },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) {
    throw new Error(`Nominatim ${res.status}`);
  }
  return res.json();
}

/** Reverse geocode lat/lng → display name (for “Use my current location”). */
export async function nominatimReverse(
  lat: number,
  lng: number,
): Promise<{ lat: number; lng: number; label: string }> {
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');

  const row = (await nominatimFetch(url)) as NominatimHit & {
    error?: string;
  };
  if (row?.error || !row?.display_name) {
    return {
      lat,
      lng,
      label: `Near ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    };
  }
  return { lat, lng, label: String(row.display_name).trim() };
}

/**
 * Split OSM display_name into Swiggy-style main + secondary lines.
 * e.g. "Mumbai Central, Mumbai, Maharashtra, India" →
 *   main: "Mumbai Central", secondary: "Mumbai, Maharashtra, India"
 */
export function splitDisplayName(
  displayName: string,
  address?: Record<string, string>,
  name?: string,
): { mainText: string; secondaryText?: string } {
  const full = String(displayName ?? '').trim();
  const parts = full
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  const fromAddress =
    address?.amenity ||
    address?.building ||
    address?.tourism ||
    address?.railway ||
    address?.suburb ||
    address?.neighbourhood ||
    address?.road ||
    address?.village ||
    address?.town ||
    address?.city ||
    address?.county;

  const mainText = String(name || fromAddress || parts[0] || full).trim();
  let secondaryText: string | undefined;

  if (parts.length > 1) {
    // Drop the main chunk if it matches the first segment.
    const rest =
      parts[0].toLowerCase() === mainText.toLowerCase()
        ? parts.slice(1)
        : parts.filter((p) => p.toLowerCase() !== mainText.toLowerCase());
    secondaryText = (rest.length ? rest : parts.slice(1)).join(', ');
  }

  if (secondaryText && secondaryText.toLowerCase() === mainText.toLowerCase()) {
    secondaryText = undefined;
  }

  return secondaryText ? { mainText, secondaryText } : { mainText };
}

/** OpenStreetMap Nominatim — used only when Swiggy places endpoints fail. */
export async function nominatimAutocomplete(
  input: string,
): Promise<PlaceSuggestion[]> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', input);
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '6');
  url.searchParams.set('countrycodes', 'in');

  const rows = (await nominatimFetch(url)) as NominatimHit[];
  if (!Array.isArray(rows)) return [];

  return rows
    .map((row) => {
      const lat = Number(row.lat);
      const lng = Number(row.lon);
      const description = String(row.display_name ?? '').trim();
      if (!description || !Number.isFinite(lat) || !Number.isFinite(lng)) {
        return null;
      }
      const { mainText, secondaryText } = splitDisplayName(
        description,
        row.address,
        row.name,
      );
      const suggestion: PlaceSuggestion = {
        placeId: `${GEO_PLACE_PREFIX}${lat},${lng}`,
        description,
        mainText,
      };
      if (secondaryText) suggestion.secondaryText = secondaryText;
      return suggestion;
    })
    .filter((x): x is PlaceSuggestion => x !== null);
}
