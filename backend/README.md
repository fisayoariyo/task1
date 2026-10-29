# nomnom BFF (NestJS)

Backend-for-frontend for places, restaurant discovery, menus, and cookie-session auth.

## Prerequisites

- Node.js 20+
- Redis (optional locally; in-memory cache if `REDIS_URL` is unset)
- Postgres 16 for auth (Compose service `postgres`, or any server matching `DATABASE_URL`)

## Environment

Copy `.env.example` to `.env` and adjust as needed:

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3001` | HTTP port |
| `DATA_SOURCE` | `mock` | `mock` or `swiggy` |
| `SWIGGY_BASE_URL` | Swiggy dapi URL | Live API base when `DATA_SOURCE=swiggy` |
| `REDIS_URL` | — | Redis connection; omit for in-memory cache |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed browser origins (comma-separated). Also the CSRF `Origin` allowlist |
| `DATABASE_URL` | — | Postgres connection string. Required for the API (`PrismaService` connects on boot) and for auth e2e. Host example: `postgresql://nomnom:nomnom@localhost:5432/nomnom?schema=public`. The Compose `api` service uses host `postgres` instead of `localhost` |

## Auth

Session cookie name: `sid` (`HttpOnly`, `SameSite=Lax`, `Path=/`, no `Domain`). `Secure` is added only when `NODE_ENV=production`.

Clients must send `credentials: 'include'` and `Content-Type: application/json` on auth POSTs. A non-JSON content type is **403**. If `Origin` is present, it must be listed in `CORS_ORIGIN`.

| Method | Path | Body | Success | Errors and limits |
|--------|------|------|---------|-------------------|
| POST | `/auth/register` | `{ fullName, email, password }` | 201 `{ id, fullName, email }` + `Set-Cookie` | 400 validation (password 8–72). 409 email taken. 5 requests / 60s per IP |
| POST | `/auth/login` | `{ email, password }` | 200 public user + `Set-Cookie` | 401 invalid credentials. 5 attempts / 15 min per IP + normalized email, plus the app IP throttle |
| POST | `/auth/logout` | `{}` | 204 + cleared cookie (`Max-Age=0`) | 403 CSRF |
| GET | `/auth/me` | — | 200 public user | 401 if the cookie is missing, unknown, or expired |

## Run locally

```bash
cd backend
npm install
docker compose up -d postgres
npx prisma migrate deploy
npm run start:dev
```

Health: `GET http://localhost:3001/health`

## Docker Compose (API + Redis + Postgres)

```bash
cd backend
docker compose up --build
```

Postgres only (user, password, and database `nomnom`, host port `5432`, volume `postgres_data`, `pg_isready` healthcheck):

```bash
cd backend
docker compose up -d postgres
npx prisma migrate deploy
```

The `api` service sets `DATABASE_URL=postgresql://nomnom:nomnom@postgres:5432/nomnom?schema=public` and waits until Postgres is healthy. From the host, use `localhost` in `DATABASE_URL`, not `postgres`.

## Tests

```bash
npm test          # unit tests
npm run test:e2e  # smoke e2e (DATA_SOURCE=mock). Boots Prisma, so DATABASE_URL must be set and Postgres reachable
```

Auth e2e uses real Postgres (not SQLite). The suite runs `prisma migrate deploy` when the database is reachable. If `DATABASE_URL` is unset or Postgres cannot be reached, the suite skips and prints how to run it.

```bash
cd backend
docker compose up -d postgres
npx prisma migrate deploy
npm run test:e2e -- --testPathPattern=auth.e2e-spec
```
