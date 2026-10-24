# NestJS Swiggy BFF Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a go-live NestJS BFF with Redis caching, swappable RestaurantSource (mock/Swiggy), and wire the React frontend to it.

**Architecture:** Nest modules (Source, Cache, Places, Restaurants) behind small DTOs; Redis via Keyv; Docker Compose for Redis+API; frontend uses `VITE_API_URL`.

**Tech Stack:** NestJS 10+, `@nestjs/axios`, `@nestjs/throttler`, `@nestjs/cache-manager`, `cache-manager`, `@keyv/redis`, Jest, Docker Compose, Vite React frontend.

**Spec:** `docs/superpowers/specs/2026-10-24-nest-swiggy-bff-design.md`

## Global Constraints

- Use `@keyv/redis` + `cache-manager` v6+ — never `cache-manager-redis-yet`.
- Browser never calls Swiggy; only Nest.
- Prices: divide paise by 100 before returning DTOs.
- Soft/hard TTL for list (5m/15m) and menu (10m/30m); autocomplete 24h; geocode 30d.
- Round lat/lng to 3 decimals for restaurant list cache keys.
- HTTP timeout 4000 ms; retry once on SwiggySource.
- Cloudinary URLs built in mapper; do not proxy images.
- Nest listens on port **3001**.
- TDD: failing test first for every behavior; commit after each task.
- Work in repo root `backend/` for Nest app.

## File map

```
backend/
  docker-compose.yml
  .env.example
  package.json
  src/
    main.ts
    app.module.ts
    source/
      restaurant-source.ts
      source.tokens.ts
      source.module.ts
      mock.source.ts
      swiggy.source.ts
      mappers.ts
    cache/
      cached.service.ts
      cache.module.ts
    places/
      places.module.ts
      places.controller.ts
      places.service.ts
      dto.ts
    restaurants/
      restaurants.module.ts
      restaurants.controller.ts
      restaurants.service.ts
      dto.ts
  test/ (or *.spec.ts colocated)
frontend/
  .env.example (VITE_API_URL)
  src/lib/api.js (new)
  pages wired to api
```

---

### Task 1: Scaffold Nest backend + Docker Redis

**Files:**
- Create: `backend/package.json`, `backend/tsconfig.json`, `backend/nest-cli.json`, `backend/src/main.ts`, `backend/src/app.module.ts`, `backend/docker-compose.yml`, `backend/.env.example`, `backend/jest.config.js` (or nest defaults)
- Test: `backend/src/app.controller.spec.ts` or health check test

**Interfaces:**
- Produces: Nest app bootable on `PORT` (default 3001); Redis service `redis://localhost:6379`

- [ ] **Step 1: Write failing health test**

Create `backend/src/health.controller.ts` expectation via test file `backend/src/health.controller.spec.ts`:

```ts
import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns ok', async () => {
    const module = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();
    const controller = module.get(HealthController);
    expect(controller.check()).toEqual({ status: 'ok' });
  });
});
```

- [ ] **Step 2: Run test — expect FAIL** (module/controller missing)

Run: `cd backend && npm test -- --testPathPattern=health.controller`

- [ ] **Step 3: Scaffold Nest + HealthController + docker-compose**

Use `@nestjs/cli` or manual package.json with dependencies: `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `reflect-metadata`, `rxjs`. Add script `test` via jest.

`docker-compose.yml`:
```yaml
services:
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
  api:
    build: .
    ports: ["3001:3001"]
    environment:
      PORT: 3001
      REDIS_URL: redis://redis:6379
      DATA_SOURCE: mock
      CORS_ORIGIN: http://localhost:5173
    depends_on: [redis]
```

`.env.example` as in spec. `main.ts` enables CORS from `CORS_ORIGIN`, listens on `PORT`.

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add backend docs
git commit -m "feat(backend): scaffold Nest app, health check, Redis compose"
```

---

### Task 2: RestaurantSource contract + MockSource

**Files:**
- Create: `backend/src/source/restaurant-source.ts`, `source.tokens.ts`, `mock.source.ts`, `source.module.ts`, `mappers.ts` (stub if needed)
- Test: `backend/src/source/mock.source.spec.ts`

**Interfaces:**
- Produces:
```ts
export const SOURCE = Symbol('SOURCE');
export interface PlaceSuggestion { placeId: string; description: string; }
export interface RestaurantCard {
  id: string; name: string; cuisines: string; rating: number;
  etaMins: number; costForTwo: number; imageUrl: string; offer?: string;
}
export interface MenuItem {
  id: string; name: string; description: string; price: number;
  isVeg: boolean; imageUrl?: string; isBestseller?: boolean;
}
export interface MenuDto {
  restaurantId: string; restaurantName: string;
  categories: { name: string; items: MenuItem[] }[];
}
export interface RestaurantSource {
  autocomplete(input: string): Promise<PlaceSuggestion[]>;
  geocode(placeId: string): Promise<{ lat: number; lng: number }>;
  listRestaurants(lat: number, lng: number, offset: number): Promise<RestaurantCard[]>;
  getMenu(restaurantId: string, lat: number, lng: number): Promise<MenuDto>;
}
```

- [ ] **Step 1: Write failing MockSource tests**

```ts
describe('MockSource', () => {
  const src = new MockSource();
  it('autocomplete returns suggestions for mumbai', async () => {
    const r = await src.autocomplete('mumbai');
    expect(r.length).toBeGreaterThan(0);
    expect(r[0]).toEqual(expect.objectContaining({ placeId: expect.any(String), description: expect.any(String) }));
  });
  it('geocode returns lat lng', async () => {
    const g = await src.geocode('mock-place-1');
    expect(g.lat).toBeCloseTo(19.07, 0);
    expect(g.lng).toBeCloseTo(72.87, 0);
  });
  it('listRestaurants returns cards with imageUrl', async () => {
    const list = await src.listRestaurants(19.076, 72.877, 0);
    expect(list[0].id).toBeDefined();
    expect(list[0].costForTwo).toBeGreaterThan(0);
    expect(list[0].imageUrl).toMatch(/^https?:\/\//);
  });
  it('getMenu returns categories with prices in rupees', async () => {
    const menu = await src.getMenu(listId, 19.076, 72.877);
    expect(menu.categories[0].items[0].price).toBeLessThan(10000); // not paise
  });
});
```

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement MockSource + SourceModule** (`DATA_SOURCE=mock` default provider)

- [ ] **Step 4: Run — PASS**

- [ ] **Step 5: Commit** `feat(backend): add RestaurantSource contract and MockSource`

---

### Task 3: CachedService soft/hard TTL + coalescing

**Files:**
- Create: `backend/src/cache/cached.service.ts`, `cache.module.ts`
- Test: `backend/src/cache/cached.service.spec.ts`

**Interfaces:**
```ts
wrap<T>(key: string, softTtlMs: number, hardTtlMs: number, fn: () => Promise<T>): Promise<T>
```
Store `{ value, softExpiresAt, hardExpiresAt }`. On soft miss but hard hit, return stale and refresh in background OR sync-refresh with stale fallback on error. Spec: on upstream fail after soft expiry, serve last-good if hard TTL valid.

- [ ] **Step 1: Failing tests** — hit returns cached; concurrent calls invoke fn once; after soft TTL failure serves stale; after hard TTL rethrows

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement with in-memory Map for unit tests; CacheModule registers memory store in test / Keyv Redis when `REDIS_URL` set

- [ ] **Step 4: PASS**

- [ ] **Step 5: Commit** `feat(backend): CachedService with soft/hard TTL and coalescing`

---

### Task 4: PlacesController (autocomplete + geocode)

**Files:**
- Create: `places/*`
- Test: `places.controller.spec.ts` or e2e

**Interfaces:**
- Consumes: `CachedService`, `SOURCE`
- Routes: `GET /places/autocomplete?input=`, `GET /places/geocode?placeId=`
- Reject input shorter than 3 chars with 400

- [ ] **Step 1: Failing controller tests** with mock SOURCE + mock cache wrap passthrough

- [ ] **Step 2: FAIL**

- [ ] **Step 3: Implement**

- [ ] **Step 4: PASS**

- [ ] **Step 5: Commit** `feat(backend): places autocomplete and geocode endpoints`

---

### Task 5: RestaurantsController (list + menu)

**Files:**
- Create: `restaurants/*`
- Test: `restaurants.controller.spec.ts`

**Interfaces:**
- `GET /restaurants?lat=&lng=&offset=` — round lat/lng to 3 decimals for cache key
- `GET /restaurants/:id/menu?lat=&lng=`

- [ ] **Step 1: Failing tests**

- [ ] **Step 2: FAIL**

- [ ] **Step 3: Implement + ThrottlerGuard on controllers**

- [ ] **Step 4: PASS**

- [ ] **Step 5: Commit** `feat(backend): restaurants list and menu endpoints`

---

### Task 6: SwiggySource + mappers

**Files:**
- Create/modify: `swiggy.source.ts`, `mappers.ts`
- Test: `mappers.spec.ts`, `swiggy.source.spec.ts` (HttpService mocked)

**Interfaces:**
- Map raw JSON → DTOs; paise/100; Cloudinary URL builder `w_600`
- Retry once; timeout 4000

- [ ] **Step 1: Failing mapper tests** with fixture JSON snippets from spec (Ramsar Bakery / Amul Butter PavBhaji shapes)

- [ ] **Step 2: FAIL**

- [ ] **Step 3: Implement mappers + SwiggySource**

- [ ] **Step 4: PASS**

- [ ] **Step 5: Commit** `feat(backend): SwiggySource and DTO mappers`

---

### Task 7: Wire AppModule, env, compose smoke

**Files:**
- Modify: `app.module.ts`, `source.module.ts`, `docker-compose.yml`, `README.md` (backend section)
- Test: e2e `backend/test/app.e2e-spec.ts` with mock source — autocomplete + list + menu

- [ ] **Step 1: Write e2e failing until routes registered**

- [ ] **Step 2: FAIL**

- [ ] **Step 3: Wire modules, ConfigModule, ThrottlerModule, CORS**

- [ ] **Step 4: PASS e2e**

- [ ] **Step 5: Commit** `feat(backend): wire modules and e2e smoke`

---

### Task 8: Frontend API client + wire discovery/menu

**Files:**
- Create: `frontend/src/lib/api.js`, `frontend/.env.example`
- Modify: `Discovery.jsx`, `Restaurant.jsx`, `Landing.jsx` (place search if present)
- Test: minimal unit test if present, else manual verification script note; prefer testing api.js with vitest if available — if no vitest, add a tiny node assert script or skip UI test and document curl checks

**Interfaces:**
```js
export async function autocomplete(input) { ... }
export async function geocode(placeId) { ... }
export async function listRestaurants(lat, lng, offset = 0) { ... }
export async function getMenu(id, lat, lng) { ... }
```
Base: `import.meta.env.VITE_API_URL` default `http://localhost:3001`. Debounce autocomplete 300ms in UI.

- [ ] **Step 1: Failing test for api URL builder / fetch wrapper if test runner exists; else write api.js first then verify with curl against mock server**

- [ ] **Step 2: Implement api.js + wire pages to replace static RESTAURANTS/menu where loaded**

- [ ] **Step 3: Commit** `feat(frontend): consume Nest BFF for places, restaurants, menu`

---

### Task 9: Root README + verify go-live path

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document** `docker compose -f backend/docker-compose.yml up`, `DATA_SOURCE=swiggy`, frontend env, test commands

- [ ] **Step 2: Run full backend test suite — must pass**

- [ ] **Step 3: Commit** `docs: go-live Nest BFF runbook`
