# nomnom NestJS BFF Design (Go-Live)

**Date:** 2026-10-24  
**Status:** Approved for implementation (partner: build go-live path immediately)

## Intent

Ship a NestJS backend that feeds the existing React frontend with restaurant discovery and menu data. The browser never calls Swiggy. Nest owns place autocomplete → geocode → restaurant list → menu, with Redis caching suitable for high traffic.

## Goals

- Local + production share the same architecture (Nest + Redis via Docker Compose).
- Frontend calls only our API (`VITE_API_URL`).
- Swappable data source behind `RestaurantSource` (live Swiggy or mock).
- Small DTOs; prices in rupees (paise ÷ 100).
- Cache, throttle, short timeouts, stale-on-error, on-demand pagination.

## Non-goals

- Cart/checkout persistence (frontend cart stays client-side for this phase).
- Proxying Cloudinary images through Nest.
- Pre-crawling all restaurants in a city.
- Multi-region / multi-tenant.

## Anti-goals

- Browser calling `swiggy.com/dapi` directly.
- Returning raw Swiggy JSON blobs to the client.
- In-memory-only cache in production (would break multi-instance and go-live resilience).

## Constraints

- Stack: NestJS (Node), Redis via `@nestjs/cache-manager` + `@keyv/redis` (not deprecated `cache-manager-redis-yet`).
- Swiggy endpoints are unofficial website APIs; keep them behind `RestaurantSource`.
- Test locally: Nest on `:3001`, Redis on `:6379`, Vite frontend with proxy or env URL.
- Hosting: not Vercel for Nest; Docker Compose for local; same image shape for a later VPS/Railway/Render deploy.

## Approaches considered

1. **Go-live BFF + Redis from day one (chosen)** — Same path local and prod; mock source for tests; Swiggy source when `DATA_SOURCE=swiggy`.
2. **In-memory cache locally, Redis later** — Faster first boot, diverges from prod, rejected for go-live.
3. **Frontend mocks only** — Already exists; rejected because partner wants live backend now.

## Architecture

```
React (Vite) → Nest Controllers → CachedService → RestaurantSource
                                      ↓                    ↓
                                   Redis            SwiggySource | MockSource
```

### Modules

| Module | Responsibility |
|--------|----------------|
| `SourceModule` | Provides `SOURCE` token → `SwiggySource` or `MockSource` |
| `CacheModule` | Redis store + `CachedService` (soft/hard TTL, in-process coalescing) |
| `PlacesModule` | Autocomplete + geocode |
| `RestaurantsModule` | List by lat/lng/offset + menu by id |
| `AppModule` | Throttler, config, CORS |

### RestaurantSource interface

```ts
export interface RestaurantSource {
  autocomplete(input: string): Promise<PlaceSuggestion[]>;
  geocode(placeId: string): Promise<{ lat: number; lng: number }>;
  listRestaurants(lat: number, lng: number, offset: number): Promise<RestaurantCard[]>;
  getMenu(restaurantId: string, lat: number, lng: number): Promise<MenuDto>;
}
```

### Public HTTP API

| Method | Path | Query | Cache |
|--------|------|-------|-------|
| GET | `/places/autocomplete` | `input` (min 3 chars) | 24h, key `ac:{lower}` |
| GET | `/places/geocode` | `placeId` | 30d, key `geo:{placeId}` |
| GET | `/restaurants` | `lat`, `lng`, `offset` | 5m soft / 15m hard, key `rest:{lat3}:{lng3}:{offset}` |
| GET | `/restaurants/:id/menu` | `lat`, `lng` | 10m soft / 30m hard, key `menu:{id}` |

Lat/lng rounded to 3 decimals for list cache keys (~110 m grid).

### Swiggy upstream (SwiggySource only)

1. `GET /misc/place-autocomplete?input=&types=`
2. `GET /misc/address-recommend?place_id=`
3. `GET /restaurants/list/v5?lat=&lng=&offset=&sortBy=RELEVANCE&pageType=SEE_ALL&page_type=DESKTOP_SEE_ALL_LISTING`
4. `GET /menu/v4/full?lat=&lng=&menuId=`
5. Images: `https://res.cloudinary.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_600,c_fit/{cloudinaryImageId}`

Base URL: `SWIGGY_BASE_URL` default `https://www.swiggy.com/dapi`.  
HTTP timeout 4000 ms; retry once; on failure after soft TTL, serve last-good if hard TTL still valid.

### DTOs (client-facing)

- `PlaceSuggestion`: `{ placeId, description }`
- `RestaurantCard`: `{ id, name, cuisines, rating, etaMins, costForTwo, imageUrl, offer? }`
- `MenuDto`: `{ restaurantId, restaurantName, categories: { name, items: MenuItem[] }[] }`
- `MenuItem`: `{ id, name, description, price, isVeg, imageUrl?, isBestseller?, addons? }`

### Resilience & traffic

- `@nestjs/throttler` global (e.g. 60 req/min/IP); Redis storage when multi-instance later; in-memory OK for single instance go-live.
- Frontend debounce autocomplete 300 ms (document for frontend wire-up task).
- Do not crawl cities; only fetch when requested.

### Config (env)

```
PORT=3001
DATA_SOURCE=swiggy|mock
SWIGGY_BASE_URL=https://www.swiggy.com/dapi
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=http://localhost:5173
```

### Testing

- Unit/e2e with `DATA_SOURCE=mock` (no network).
- TDD for CachedService wrap, DTO mapping, controllers with mocked source.
- Manual smoke: Docker Compose up → hit autocomplete/list/menu against live Swiggy when available.

### Frontend integration (same phase)

- Add `VITE_API_URL=http://localhost:3001`.
- Replace static discovery/menu fetches with API calls where restaurants/menus are loaded; keep cart client-side.
- Debounce place search 300 ms.

## Builder calls (defaults)

- Nest port **3001** (avoid clashing with common 3000).
- Soft/hard TTL as in table above.
- Single Nest instance for go-live; in-process inflight map only (document Redis lock as follow-up if scaling out).
- Default `DATA_SOURCE=mock` in committed `.env.example`; production/local live uses `swiggy`.

## Success criteria

- `docker compose up` starts Redis + Nest.
- `GET /restaurants?lat=…&lng=…&offset=0` returns DTO array (mock or live).
- Frontend discovery/menu can load from Nest.
- Tests pass without calling Swiggy.
