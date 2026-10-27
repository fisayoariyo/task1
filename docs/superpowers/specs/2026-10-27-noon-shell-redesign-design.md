# TataEats Noon-like shell redesign

**Date:** 2026-10-27  
**Status:** Approved  
**Approach chosen:** Rebuild page shells (option 2)

## Intent

Make TataEats Landing, Discovery, and Restaurant pages look and feel ~80% like Noon Food (`food.noon.com`). Per product instruction: **visual/layout match Noon; keep everything that is already ours** — TataEats branding, copy/content, APIs, and cart/auth behavior. Visual reference captures live under `.agents/noon-refs/`.

## What we keep from TataEats (do not replace with Noon)

These stay as they are in our app. Noon is a layout/chrome reference only.

| Area | Stick to ours |
|------|----------------|
| **Brand** | `Logo` / “TataEats” wordmark and mark — never “noon FOOD” |
| **Accent** | Existing pink tokens (`--color-primary: #e91e63` and related) |
| **Copy & content** | TataEats headings, footers, “How TataEats works”, category/restaurant/menu names and images from our data |
| **Routes** | `/`, `/discovery`, `/restaurant/:id?`, `/checkout` (+ existing HTML redirects in `App.jsx`) |
| **Location** | `lib/location` cookies/defaults (Mumbai defaults, saved/previous address, `hasSavedLocation` gate) |
| **APIs** | `listRestaurants`, `getMenu`, `listFoodCategories`, `autocomplete` / `geocode` / `reverseGeocode` — same contracts |
| **Mappers / cache** | `mapRestaurantCardFromApi`, `mapMenuItemFromApi`, `httpCache`, `menuCache` |
| **Cart & checkout data** | `useCart`, line keys, replace-cart rules, `CustomiseModal`, `ReplaceCartDialog` |
| **Auth / guest** | `AuthButtons`, guest contact helpers |
| **Wishlist / share** | `wishlist` helpers |
| **Place search UX logic** | `usePlaceAutocomplete`, `PlaceSuggestList` (restyle shell only) |
| **Checkout page** | Out of redesign scope; keep current Checkout behavior |
| **Fallbacks** | Static `CATEGORIES` / discovery cats when APIs empty |

**Explicit deltas vs Noon (also already in the brief):** omit Noon’s desktop left filter rail; Discovery listings **4 columns** on desktop (not Noon’s denser/sidebar layout).

## Why now

Product direction is a major UI shift toward Noon’s food-ordering chrome (header, cards, menu rows, mobile bottom nav). Current pages work functionally but do not match that structure.

## Goals

- Rebuild **page shells** (layout + chrome) for Landing, Discovery, and Restaurant to mirror Noon’s structure on **desktop and mobile**.
- **Preserve** everything in “What we keep from TataEats” above — only presentation/DOM structure changes.
- Discovery: **no left filter sidebar** (unlike Noon desktop); restaurant grid **4 columns on desktop**.
- Mobile: sticky bottom nav on Discovery (and Landing where appropriate): Home, Offers, Orders, Account — wire what we already have; stub or soft-link Offers/Orders/Account if no dedicated pages yet.

## Non-goals

- Swapping TataEats brand, restaurant/menu content, or APIs for Noon’s.
- Checkout redesign (leave as-is unless chrome collision requires a header tweak).
- New backend endpoints or changing API contracts.
- Pixel-perfect Noon clone, Noon assets/copy/logos, or Noon left-rail filters/sort UI.
- Replacing cart/customise/replace-cart modal logic.
- Building a full design-system library beyond what these three pages need.

## Anti-goals

- Shipping a hybrid where Noon layout fights leftover Swiggy-like structure (filters rail, odd card chrome).
- Breaking location → discovery → restaurant → cart flows.
- Introducing a purple/cream generic AI aesthetic; stay Noon-like white + pink + food photography.

## Constraints

- Stack: React + Vite frontend under `frontend/`; styles in `frontend/src/styles/*` and page-level classes.
- Brand: TataEats `Logo`, existing tokens where possible; extend tokens only when Noon layout needs new ones (e.g. hero yellow, offer-chip green).
- Content/data: restaurant cards and menu from current mappers/APIs; promo carousels may use existing category/restaurant imagery or lightweight static promo slots fed by available data.
- Accessibility: keep semantic landmarks, focusable controls, and readable contrast on pink CTAs.
- Scope of pages: Landing, Discovery, Restaurant only.

## Approaches considered

| Approach | Tradeoff |
|----------|----------|
| 1. Restyle in place | Fastest; high risk of leftover DOM fighting Noon layout |
| **2. Rebuild page shells** (chosen) | New layout shells per page; reuse hooks/APIs/branding; best ~80% match without full rewrite |
| 3. Design-system first | Most consistent long-term; slowest to first visible match |

**Chosen:** 2 — rebuild shells page by page, shared chrome components extracted when duplicated.

## Target shells (what “done” looks like)

### Landing (pre-address / address entry)

- **Desktop:** Full-bleed yellow food-hero band; centered white card with location search + primary “View Restaurants” CTA; secondary “Log in for recent addresses” affordance using existing auth; below-fold “Top brands” / category circles from food-categories API (fallback to static cats).
- **Mobile:** Hamburger or minimal header + centered TataEats logo; same hero card pattern; brands row; no desktop-only multi-column chrome.

### Discovery (post-address)

- **Desktop header:** Logo, Deliver to (editable), centered search (“Search restaurants, dishes & cuisines”), Sign in / Register (existing `AuthButtons`).
- **No left sidebar.** Optional compact sort/filter as chips or a single control in the main column (builder may keep a slim chip row if current filter logic stays; must not become a left rail).
- **Promo strip:** Horizontal rounded image cards (curated from restaurants/categories).
- **Grid:** “Restaurants near you” — **4 columns** desktop; 2 mobile; card = image + offer badge (when available) + name + rating + cuisines + ETA + delivery fee styling from available fields.
- **Mobile:** Same header condensed; sticky **bottom nav** (Home active); no left rail.

### Restaurant (menu)

- **Desktop:** Header with logo + Deliver to + search/auth as needed; restaurant hero; name, cuisines, rating, cost cue, ETA; Delivery/Pickup toggle if we can represent pickup without new API (Pickup may be visual-only / disabled — builder call); fee/offer chips; sticky category nav; **menu items 2-column** desktop; item row = text left, image right, pink `+`.
- **Mobile:** Single-column item list; sticky search + horizontal category tabs; same item anatomy; bottom cart bar behavior preserved from current app.

## Architecture (builder guidance)

- Prefer rewriting markup in `Landing.jsx`, `Discovery.jsx`, `Restaurant.jsx` rather than layering CSS overrides on old class trees.
- Extract small shared pieces only when reused: e.g. `AppHeader`, `DeliverTo`, `BottomNav`, `RestaurantCard`, `MenuItemRow` under `frontend/src/components/`.
- Keep data hooks and mappers (`lib/api`, `lib/mappers`, `lib/location`, `lib/cart`, etc.) intact; adapt presentation only.
- Styles: extend `tokens.css`; reorganize page styles into clear BEM-ish blocks (or existing convention) in `components.css` / page sections; prune dead Swiggy-like rules for the rebuilt pages when they conflict.
- Checkout: out of scope; ensure shared header changes do not break `/checkout` layout.

## What’s left to the builder

- Exact CSS values within tokens (radii, gaps) as long as the shell matches Noon structure at ~80%.
- Whether Pickup is disabled vs hidden if unsupported.
- How to map “Offers” / “Orders” / “Account” bottom-nav targets when dedicated routes are missing (e.g. scroll to offers chips, checkout/orders stub, auth modal).
- Whether promo strip uses dedicated static slides or derived restaurant imagery.
- File split of new components vs in-page markup for one-off sections.

## Out of scope for this design (follow-ups)

- Checkout Noon-matching.
- Full Offers / Orders / Account pages.
- Native app wrappers.

## References

- Live: `https://food.noon.com/uae-en/`
- Captures: `.agents/noon-refs/mobile-landing.webp`, `mobile-discovery.webp`, `mobile-menu.webp`, `mobile-menu-items.webp`
- App entry: `frontend/src/App.jsx`
- Pages: `frontend/src/pages/{Landing,Discovery,Restaurant}.jsx`
- Tokens: `frontend/src/styles/tokens.css` (`--color-primary: #e91e63`)
