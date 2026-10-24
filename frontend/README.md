# nomnom frontend

React + Vite SPA for landing, discovery, menu, and checkout.

## API

Copy `.env.example` to `.env.local` (or `.env`):

```
VITE_API_URL=http://localhost:3001
```

Discovery and menu pages call the Nest BFF via `src/lib/api.js`. If the API is unreachable, they **fall back to static fixtures** in `src/lib/data.js` so the UI still works for demos and offline development.

Place search on the landing page debounces autocomplete by **300 ms** (`usePlaceAutocomplete.js`).

## Run

```bash
npm install
npm run dev
```

## Manual API checks (backend on :3001)

```bash
curl "http://localhost:3001/places/autocomplete?input=Mumbai"
curl "http://localhost:3001/restaurants?lat=19.076&lng=72.877&offset=0"
curl "http://localhost:3001/restaurants/mock-rest-1/menu?lat=19.076&lng=72.877"
```
