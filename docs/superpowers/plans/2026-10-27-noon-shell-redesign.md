# Noon-like shell redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Landing, Discovery, and Restaurant page shells to ~80% Noon Food structure while keeping TataEats brand, content, APIs, routes, cart, and auth.

**Architecture:** Extract shared chrome (`AppHeader`, `DeliverToControl`, `BottomNav`, `RestaurantCard`, `MenuItemRow`) then rewrite each page’s markup/CSS to Noon-like shells. Data layer (`lib/api`, mappers, location, cart) stays untouched; presentation only.

**Tech Stack:** React 19 + Vite + react-router-dom; existing CSS token files (`tokens.css`, `web.css`, `mobile.css`, `components.css`).

**Spec:** `docs/superpowers/specs/2026-10-27-noon-shell-redesign-design.md`

## Global Constraints

- Keep TataEats `Logo` / wordmark — never Noon branding or assets.
- Keep `--color-primary: #e91e63` and existing API/mapper/location/cart/auth contracts.
- Routes stay `/`, `/discovery`, `/restaurant/:id?`, `/checkout`.
- Discovery: **no left filter rail**; desktop restaurant grid **4 columns**.
- Checkout page out of scope (must not break).
- No new backend endpoints.
- Project has no unit-test runner; each task verifies with `npm run lint`, `npm run build`, and a short manual route check in `npm run dev`.

## Review Focus

- Missing saved location still lands on Landing; with cookie, Discovery/Restaurant chrome shows Deliver to without crash.
- Empty restaurant / menu API responses show an empty state, not a broken grid.
- Cart `CustomiseModal` / `ReplaceCartDialog` still open from menu `+` after shell rewrite.
- Mobile bottom nav does not cover the sticky cart bar or primary CTAs.
- Desktop Discovery never reintroduces a left filter column at any breakpoint ≥1024px.

---

### Task 1: Tokens + shared chrome components

**Files:**
- Modify: `frontend/src/styles/tokens.css`
- Create: `frontend/src/components/AppHeader.jsx`
- Create: `frontend/src/components/DeliverToControl.jsx`
- Create: `frontend/src/components/BottomNav.jsx`
- Create: `frontend/src/styles/noon-shell.css`
- Modify: `frontend/src/index.css` (import `noon-shell.css`)

**Interfaces:**
- Consumes: `Logo`, `AuthButtons`, `Icon`, `getLocation` / `shortPlaceLabel`, react-router `Link`/`NavLink`
- Produces:
  - `AppHeader({ variant: 'landing' | 'discovery' | 'restaurant', center?, right?, onDeliverToClick? })`
  - `DeliverToControl({ label: string, onEdit: () => void, editing?: boolean, children?: ReactNode })`
  - `BottomNav({ active: 'home' | 'offers' | 'orders' | 'account' })` — Home → `/` or `/discovery` via `hasSavedLocation()`; Offers → `/discovery` (chip focus later); Orders → `/checkout`; Account → scrolls/focuses auth or `#` no-op with `AuthButtons` link behavior as builder chooses among soft links in the spec

- [ ] **Step 1: Extend tokens**

Add (names exact): `--color-hero-yellow`, `--color-offer-chip-bg`, `--color-offer-chip-border`, `--color-rating-green`, `--bottom-nav-h`. Keep existing primary pink.

- [ ] **Step 2: Implement the three components + `noon-shell.css` base layout classes**

Classes to define now: `.noon-header`, `.noon-deliver`, `.noon-bottom-nav`, `.noon-page`. Components must render TataEats `Logo` only.

- [ ] **Step 3: Verify**

Run: `npm run lint` and `npm run build` in `frontend/`  
Expected: both succeed.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/styles/tokens.css frontend/src/styles/noon-shell.css frontend/src/index.css frontend/src/components/AppHeader.jsx frontend/src/components/DeliverToControl.jsx frontend/src/components/BottomNav.jsx
git commit -m "feat: add Noon-shell tokens and shared chrome components"
```

---

### Task 2: Rebuild Landing shell

**Files:**
- Modify: `frontend/src/pages/Landing.jsx`
- Modify: `frontend/src/styles/noon-shell.css` (landing sections)
- Modify: `frontend/src/styles/web.css` / `mobile.css` only to neutralize conflicting old `.hero*` rules if they override the new shell (prefer scoping old rules away rather than deleting checkout-safe rules)

**Interfaces:**
- Consumes: Task 1 chrome; existing `usePlaceAutocomplete`, `PlaceSuggestList`, `listFoodCategories`, location helpers, `AuthButtons`, `goDiscovery` / `pickSuggestion` logic already in the page
- Produces: Landing DOM structure matching Noon pre-address shell with TataEats content

- [ ] **Step 1: Replace Landing chrome markup**

Desktop + mobile:
- Yellow full-bleed hero (`--color-hero-yellow` + existing `/assets/hero-bg.jpg` or food pattern)
- Centered white card: location field + primary CTA label **View Restaurants** (keep existing `goDiscovery` handler)
- Auth secondary line using existing `AuthButtons` / login affordance
- Below: circular “Top brands” / categories from `listFoodCategories` + `FALLBACK_CATS` (TataEats names/images)
- Mobile: centered `Logo`, optional menu; `BottomNav` with `active="home"` when no address required

Keep all location/autocomplete handlers; only restyle/restructure JSX.

- [ ] **Step 2: Verify**

Run: `npm run lint`, `npm run build`  
Manual: open `/` — hero card + brands visible; submit location still navigates to `/discovery`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Landing.jsx frontend/src/styles/noon-shell.css frontend/src/styles/web.css frontend/src/styles/mobile.css
git commit -m "feat: rebuild Landing page to Noon-like shell"
```

---

### Task 3: `RestaurantCard` + Discovery shell (no left rail, 4-col)

**Files:**
- Create: `frontend/src/components/RestaurantCard.jsx`
- Modify: `frontend/src/pages/Discovery.jsx`
- Modify: `frontend/src/styles/noon-shell.css`

**Interfaces:**
- Consumes: `mapRestaurantCardFromApi` card shape (`id`, `name`, `img`, `rating`, `ratings`, `time`, `cuisines`, `offer`, `promo`, …); Task 1 `AppHeader`, `DeliverToControl`, `BottomNav`; existing `listRestaurants` / filter / infinite-scroll state in Discovery
- Produces: `RestaurantCard({ restaurant, to })` → link to `/restaurant/:id`; Discovery grid `.noon-rest-grid` with `grid-template-columns: repeat(4, 1fr)` at desktop (≥1024px), `repeat(2, 1fr)` mobile

- [ ] **Step 1: Add `RestaurantCard`**

Noon-like card: image, optional offer badge from `restaurant.offer`, name, rating, cuisines, ETA, delivery/promo line from `promo`. TataEats data fields only.

- [ ] **Step 2: Rebuild Discovery layout**

- Header: Logo + Deliver to + search + `AuthButtons` / cart (keep cart button behavior)
- **Remove** any left filter column markup/CSS for desktop
- Keep filter/sort as a **horizontal chip row** in the main column (reuse `FILTER_CHIPS` / `SortByControl`)
- Promo horizontal strip from first N restaurants or categories
- Main grid uses `RestaurantCard`; preserve infinite scroll sentinels
- Mobile: `BottomNav active="home"`

- [ ] **Step 3: Verify Review Focus items for Discovery**

Run: `npm run lint`, `npm run build`  
Manual: `/discovery` with location — 4 cards across on wide viewport; no left rail; filters still narrow the list; empty API shows empty state.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/RestaurantCard.jsx frontend/src/pages/Discovery.jsx frontend/src/styles/noon-shell.css
git commit -m "feat: rebuild Discovery shell with 4-col grid, no left rail"
```

---

### Task 4: `MenuItemRow` + Restaurant shell

**Files:**
- Create: `frontend/src/components/MenuItemRow.jsx`
- Modify: `frontend/src/pages/Restaurant.jsx`
- Modify: `frontend/src/styles/noon-shell.css`

**Interfaces:**
- Consumes: mapped dish shape from `mapMenuItemFromApi`; existing add-to-cart / customise / replace-cart handlers; Task 1 header pieces
- Produces: `MenuItemRow({ dish, onAdd })` — text left (name, desc, price), image right, pink `+`; desktop menu list **2 columns**, mobile **1 column**

- [ ] **Step 1: Add `MenuItemRow`**

Wire `onAdd` to the same handlers the current dish card uses (customise vs direct add).

- [ ] **Step 2: Rebuild Restaurant chrome**

- Hero image + name, cuisines, rating, cost cue, ETA from existing restaurant state
- Delivery / Pickup toggle: Pickup **disabled** (builder call from spec)
- Offer chips if `offer`/promo fields exist; keep veg/nonveg/bestseller filters (compact, not a left rail)
- Sticky search + horizontal category tabs (reuse category scroll logic)
- Replace dish grid/cards with `MenuItemRow` layout
- Preserve bottom cart bar, `CustomiseModal`, `ReplaceCartDialog`

- [ ] **Step 3: Verify**

Run: `npm run lint`, `npm run build`  
Manual: open a restaurant — add item still opens customise/replace as before; desktop shows 2-col items; mobile 1-col.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/MenuItemRow.jsx frontend/src/pages/Restaurant.jsx frontend/src/styles/noon-shell.css
git commit -m "feat: rebuild Restaurant menu shell Noon-like"
```

---

### Task 5: Cross-page polish + Checkout smoke

**Files:**
- Modify: `frontend/src/styles/noon-shell.css` / `responsive.css` as needed
- Modify: pages only if shared header spacing breaks Checkout
- Touch Checkout **only** if a shared import forces a one-line layout fix

- [ ] **Step 1: Pass Review Focus checklist**

Manual on `npm run dev`:
1. No location → `/` Landing works  
2. Set location → Discovery 4-col, no left rail  
3. Open restaurant → menu add-to-cart path works  
4. `/checkout` still renders  
5. Mobile widths (~390px): bottom nav + cart bar don’t obscure primary actions  

- [ ] **Step 2: Final lint/build**

Run: `npm run lint`, `npm run build`  
Expected: both succeed.

- [ ] **Step 3: Commit**

```bash
git add frontend/src
git commit -m "fix: polish Noon-shell responsive chrome without breaking checkout"
```

---

## Self-review notes

- Spec “keep TataEats” table → Global Constraints + every task’s data/brand steps.  
- No left rail + 4-col → Task 3.  
- Landing / Discovery / Restaurant shells → Tasks 2–4.  
- Shared chrome → Task 1.  
- Checkout non-goal → Task 5 smoke only.  
- Builder calls (Pickup disabled, soft bottom-nav links, derived promos) pinned in Tasks 1/3/4.
