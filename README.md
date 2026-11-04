# nomnom

Food delivery web app: **React (Vite)** frontend + **NestJS BFF** for places, restaurant discovery, and menus. Cart stays client-side in the browser.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, React Router, Tailwind CSS v4 |
| Backend | NestJS, Redis cache, optional Swiggy upstream |
| Data | `DATA_SOURCE=mock` (tests/local) or `swiggy` (live) |

## Quick start (full stack)

### 1. Backend (API)

```bash
cd backend
cp .env.example .env   # set DATABASE_URL to a reachable Postgres
npm install
npx prisma migrate deploy
npm run start:dev
```

API on **http://localhost:3001** with `DATA_SOURCE=mock` by default (no Swiggy network calls).

For live Swiggy data, set in `backend/.env`:

```bash
DATA_SOURCE=swiggy
SWIGGY_BASE_URL=https://www.swiggy.com/dapi
CORS_ORIGIN=http://localhost:5173
```

Health check: `GET http://localhost:3001/health`

See [backend/README.md](backend/README.md) for env details and optional Compose.

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local   # or .env
npm install
npm run dev
```

Set the BFF URL:

```
VITE_API_URL=http://localhost:3001
```

Open **http://localhost:5173**. Landing place search calls `/places/autocomplete` (300 ms debounce). Discovery and menu load from `/restaurants` and `/restaurants/:id/menu`. If the API is down, the UI falls back to static fixtures in `frontend/src/lib/data.js`.

## Routes

| Path | Page |
|------|------|
| `/` | Landing (address / place search) |
| `/discovery` | Restaurant list |
| `/restaurant/:id` | Menu + cart |
| `/checkout` | Checkout |

## Tests

Backend (must pass before release):

```bash
cd backend
npm install
npm test          # unit tests (mock source, no network)
npm run test:e2e  # HTTP smoke (mock source)
```

Frontend: no Vitest in this repo; use manual curl checks in [frontend/README.md](frontend/README.md).

## Build & deploy

```bash
cd frontend
npm run build
npm run preview
```

Vercel builds `frontend/` and serves the SPA from `frontend/dist` (see root `vercel.json`). Host the Nest BFF separately (VPS/Railway/Render, etc.).

## Project layout

| Path | Purpose |
|------|---------|
| `frontend/` | React SPA, `VITE_API_URL`, API client in `src/lib/api.js` |
| `backend/` | Nest BFF, Swiggy/mock sources |
| `docs/superpowers/specs/` | BFF design spec |
| `legacy/` | Old static prototype (not used by the app) |

## Environment summary

| Variable | Where | Purpose |
|----------|-------|---------|
| `VITE_API_URL` | frontend | Nest base URL (default `http://localhost:3001`) |
| `DATA_SOURCE` | backend | `mock` or `swiggy` |
| `REDIS_URL` | backend | Redis; omit for in-memory cache in dev |
| `CORS_ORIGIN` | backend | Frontend origin (e.g. `http://localhost:5173`) |
| `PORT` | backend | API port (default `3001`) |
