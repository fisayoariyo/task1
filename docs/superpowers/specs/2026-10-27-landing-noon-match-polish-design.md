# Landing noon-match polish (header, brands, why, splash)

**Date:** 2026-10-27  
**Status:** In progress — Discovery: no left filter rail; 4-col desktop grid  
**Parent:** `2026-10-27-noon-shell-redesign-design.md` (keep TataEats brand/APIs)

## Intent

Bring the TataEats landing chrome in line with noon Food reference shots: left header cluster, Top brands spacing, Why section placement, plus a one-shot TataEats splash on new visits.

## Goals

1. **Header** — Slim white bar; hamburger + TataEats wordmark **left-aligned as one cluster** on mobile and desktop; no centered logo; empty right. Wordmark stays ours (`Tata` + pink `Eats`), not noon FOOD.
2. **Top brands** — Title “Top brands on TataEats” (centered on desktop); restaurant brands from **`listRestaurants`** (API-fed images); noon-style pastel circles; **no labels** under circles; generous gap (~28–32px) and vertical padding under hero.
3. **Why TataEats?** — Light `#f0f2f9` band; image left / copy right; heading **left-aligned in the copy column** above Offers (same placement as noon’s Why heading).
4. **Splash** — Short spin + “tataeats” before landing; **once per new visit** (`sessionStorage`); skip on in-app return within the same tab session.

## Non-goals

- New brands backend endpoint
- Copying noon Language/Country drawer rows
- Discovery / Restaurant / Checkout redesign
- Pixel-perfect noon assets or noon logos

## Approaches (brands)

| Approach | Tradeoff |
|----------|----------|
| **A. `listRestaurants` images** (chosen) | API-fed; no backend; images may be food photos not logo marks |
| B. Swiggy homepage brand widget | Better logos if present; payload risk |
| C. Static curated logos | Most noon-like; not API-fed |

**Chosen:** A — per product (“real brand logos as the api feeds”).

## Constraints

- Keep TataEats `Logo`, pink tokens, routes, cart/auth.
- Styles primarily in `frontend/src/styles/noon-shell.css`; landing data in `Landing.jsx`.
- Splash: small component or overlay; respect `prefers-reduced-motion` (short fade, no spin).

## Builder calls

- Pastel circle fills: rotate soft tints per index.
- Click brand → `/restaurant/:id` for that card.
- Drawer keep existing TataEats links; Sign in solid / Sign Up outline already close to noon — tighten if needed when touching header.
- Splash key: e.g. `tataeats-splash-seen` in `sessionStorage`.

## What’s wrong / missing?

Partner approval of this short design unlocks the implementation plan.
