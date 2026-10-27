# nomnom — localhost test guide

## Before you start

**Terminal 1 — backend**
```bash
cd backend
# edit .env: DATA_SOURCE=mock   (or swiggy after IP whitelist)
npm run start:dev
```
Check: http://localhost:3001/health → `{ "status": "ok" }`

**Terminal 2 — frontend**
```bash
cd frontend
# optional .env: VITE_API_URL=http://localhost:3001
npm run dev
```
Open: http://localhost:5173

---

## Test A — Mock data (`DATA_SOURCE=mock`)

| # | Steps | Expected |
|---|--------|----------|
| 1 | Home → type `mumbai` in address | Suggestions appear (incl. Colaba); list not cut off by Local options band |
| 2 | Press **Enter** or click a suggestion / **Find food →** | Goes to Discovery; “Delivering to …” matches chosen place |
| 3 | Discovery shows restaurant cards with **images** | Live ids only (numeric); empty areas show a friendly “no restaurants” message — no demo cards |
| 4 | Click a restaurant | Menu page loads dishes/prices |
| 5 | Discovery → **Change** / “Delivering to” | Address autofill; pick another place → list refreshes |
| 6 | Discovery search (e.g. `pizza`) | Restaurant suggestions → click opens that menu |

**Pass if:** address → list → menu works without “(offline demo data)” unless API is down.

---

## Test B — Live Swiggy (`DATA_SOURCE=swiggy`)


1. Set `backend/.env` → `DATA_SOURCE=swiggy`, restart backend.
2. Repeat Test A with a real city (e.g. `mumbai` / `pune`).
3. Expect real restaurant names and **media-assets.swiggy.com** photos (not `res.cloudinary.com`).
4. Menu uses **`mapi/menu/pl`** (not legacy `dapi/menu/v4/full`, which 403s).

| Check | Pass |
|-------|------|
| Autocomplete returns places (Swiggy or Nominatim fallback) | ☐ |
| Restaurant list not empty | ☐ |
| Card `imageUrl` hosts under `media-assets.swiggy.com` | ☐ |
| Menu opens with items/prices | ☐ |
| Discovery **Change** opens address field (does not jump to top) | ☐ |

If list/menu blocked: note your IP (`https://api.ipify.org`), status code, and which step failed → send to David.

**Places note:** Swiggy `/misc/place-autocomplete` often returns 403 even when restaurant list works. The BFF then falls back to OpenStreetMap Nominatim (India), then mock Mumbai places — so Change/Landing suggestions still work.

---

## Quick API checks (optional)

```bash
curl "http://localhost:3001/places/autocomplete?input=mumbai"
curl "http://localhost:3001/restaurants?lat=19.076&lng=72.877&offset=0"
curl "http://localhost:3001/restaurants/MOCK_OR_REAL_ID/menu?lat=19.076&lng=72.877"
```

(For mock menu id use e.g. `mock-rest-1`.)

---

## Not in Swiggy list/menu payload (stubs — no navigation)

Reviews / Photos / About tabs, Sort / Filters / Price chips, Log in / Sign up.
Those are UI chrome only; the dapi endpoints we proxy do **not** return reviews, gallery, or about copy.
