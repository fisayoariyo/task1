# nomnom BFF (NestJS)

Backend-for-frontend for places, restaurant discovery, and menus.

## Prerequisites

- Node.js 20+
- Redis (optional locally; in-memory cache if `REDIS_URL` is unset)

## Environment

Copy `.env.example` to `.env` and adjust as needed:

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3001` | HTTP port |
| `DATA_SOURCE` | `mock` | `mock` or `swiggy` |
| `SWIGGY_BASE_URL` | Swiggy dapi URL | Live API base when `DATA_SOURCE=swiggy` |
| `REDIS_URL` | — | Redis connection; omit for in-memory cache |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed browser origin |

## Run locally

```bash
cd backend
npm install
npm run start:dev
```

Health: `GET http://localhost:3001/health`

## Docker Compose (API + Redis, mock data)

```bash
cd backend
docker compose up --build
```

## Tests

```bash
npm test          # unit tests
npm run test:e2e  # smoke e2e (DATA_SOURCE=mock)
```
