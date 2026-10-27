# Mobile hero height + popular-foods marquee

**Date:** 2026-10-27  
**Status:** pending approval  
**Scope:** Landing page, **mobile only** (`max-width: 767px`)

## Intent

Match Noon’s mobile first-screen feel more closely: a **noticeably taller** hero backdrop with our own art and **our existing location card**, plus a **Popular foods** circle strip that **auto-marquees** on mobile (Noon “Top brands” motion, TataEats content).

## Goals

- Mobile hero taller than today (card still centered; more backdrop above/below).
- Keep current card UI/behavior (search, View Restaurants, locate, Log In strip, saved chip).
- Title stays **Popular foods on TataEats**; items still from `listFoodCategories` (fallback cats OK).
- Mobile strip: continuous horizontal marquee of circular tiles + labels.
- Desktop hero and desktop strip behavior **unchanged** (no marquee on desktop).
- Hide baked-in caption text on live category images (crop), still dynamic from API — **no messy code**.

## Non-goals

- Desktop hero/layout changes.
- Replacing hero with Noon pastry assets.
- Removing locate / Log In from our card.
- New npm marquee dependency.
- Per-name image swap maps or dual asset pipelines for the text fix.

## Approaches considered

1. **CSS-only** taller hero + CSS keyframe marquee — light, weaker pause/a11y control.
2. **CSS taller hero + small marquee helper** (duplicate track, CSS animation, pause on touch, `prefers-reduced-motion`) — **chosen**.
3. **Library marquee** — unnecessary dependency for one strip.

**Pick:** Approach 2.

## How (builder notes)

### Hero (mobile only)

- In `@media (max-width: 767px)`, raise `.nl-hero` `min-height` and vertical padding so the section is **noticeably** taller than current (~340px), not full-bleed first screen.
- Keep `/assets/hero-bg.jpg` (or existing TataEats hero asset already wired). Do not change desktop `.nl-hero` rules.
- Card markup/styles stay as-is.

### Popular foods marquee (mobile only)

- Keep circle + label shape (`.nl-brand` / `.nl-brand__circle`).
- On mobile: wrap the row in a marquee track; render items **twice** (or clone in a tiny helper) for a seamless loop; CSS `@keyframes` translate; hide overflow.
- Pause animation on `pointerdown` / touch; resume on `pointerup` / leave (optional: keep pause while dragging).
- Honor `prefers-reduced-motion: reduce` → static horizontal scroll (current row behavior).
- Desktop (`min-width: 768px` or existing desktop brands rules): leave as non-animated flex/scroll row.

### Hide in-image captions (keep API images)

- Prefer **one CSS rule** on the circle img (e.g. `object-fit: cover` + slight `scale` / `object-position` so the bottom caption band is clipped). Same for mobile + desktop tiles — captions look bad everywhere.
- Avoid name→asset maps, canvas scrubbing, or branching fetch logic.
- Only if CSS crop isn’t enough: a single Cloudinary crop transform in existing `buildCategoryImageUrl` (one string change) — still no messy frontend.

### Files likely touched

- `frontend/src/styles/noon-shell.css` — mobile hero height; marquee keyframes/classes; circle img crop.
- `frontend/src/pages/Landing.jsx` — marquee structure + pause handlers; title already “Popular foods”.
- Optionally `backend/src/source/mappers.ts` — only if URL crop is needed instead of/in addition to CSS.

## Anti-goals

- Marquee that fights vertical page scroll or traps the user.
- Janky jump at loop boundary (must duplicate track width-matched).
- Accidental desktop style regressions.
- Messy per-category image override tables for caption hiding.

## Builder calls

- Exact `min-height` (e.g. ~420–480px) tuned visually on a ~390px-wide phone preview.
- Marquee speed ~20–40s per full loop; adjust by eye.
- Crop amount tuned so captions disappear without cutting food faces badly.
