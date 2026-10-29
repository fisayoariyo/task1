# Auth: Cookie Sessions + Docker Postgres Design

**Date:** 2026-10-28  
**Status:** Approved (partner: fold CSRF/session/cookie rules into spec, then proceed; backend first)  
**Scope of this spec’s implementation plan:** Nest backend + Docker Postgres (auth API). Frontend AuthModal is specified for contract alignment; UI implementation is a follow-up plan unless bundled later.

## Intent

Ship live-ready email/password auth for the food delivery app: register and sign in create an HttpOnly cookie session against Postgres. No email confirmation. Docker Compose runs API + Postgres (+ existing Redis) so local matches production shape.

## Goals

- `POST /auth/register` with full name, email, password → create user, create session, set cookie, return public user.
- `POST /auth/login` with email, password → same session cookie + public user.
- `POST /auth/logout` → delete session row and clear cookie.
- `GET /auth/me` → current user from valid session cookie, or 401.
- Passwords hashed with **argon2id**; never stored or returned in plain text.
- Opaque session token in cookie; **only SHA-256(`token`) stored** as `tokenHash`.
- CSRF hardening: require `Content-Type: application/json` on `/auth` POSTs; optionally check `Origin` against allowed CORS origins; `SameSite=Lax`.
- Throttle register/login; tighter per-IP+email limit on login.
- Compose: `postgres` + `redis` + `api` with `DATABASE_URL`.

## Non-goals (v1)

- Email verification, password reset, OAuth / social login.
- Marketing-consent persistence.
- Guest-cart merge into user account.
- JWT in `localStorage` or any client-readable access token.
- Frontend AuthModal implementation (covered in a separate plan; this spec defines the API the modal will call).

## Anti-goals

- Storing plain passwords or raw session tokens in the DB.
- Putting Postgres inside the API container.
- Setting an explicit cookie `Domain` in development (breaks Vite proxy / localhost).
- Claiming HttpOnly alone makes XSS “safe” — XSS can still issue credentialed requests; cookie storage reduces token theft, not request forgery via injected script.

## Constraints

- Stack: NestJS, Prisma + PostgreSQL, argon2id, existing `@nestjs/throttler`.
- Cookie name: `sid`.
- Cookie: `HttpOnly`, `SameSite=Lax`, `Path=/`, **no `Domain` in dev**; `Secure` when `NODE_ENV === 'production'`.
- Session TTL: **7 days**. Logout deletes the session row. Expired rows cleaned **lazily** (on read/miss or when creating new sessions for that user — no required cron in v1).
- Token: **32 cryptographically random bytes** (encode for cookie as base64url or hex); DB stores **SHA-256** hex/base64 of the raw token only.
- Password length: **min 8**, **max 72** characters (builder call; prevents DoS via huge argon2 inputs).
- Email: trim, **normalize to lowercase**, unique index on normalized email.
- Auth JSON responses return **only** `{ id, fullName, email }` (never `passwordHash` or session internals).
- Same 401 body/message for unknown email and wrong password; always run a **dummy argon2 verify** when user is missing to reduce timing oracle risk.
- Register duplicate email → **409** (accepted enumeration tradeoff).
- Production: web and API must share a **registrable domain** so the session cookie works cross-subdomain or same-site as deployed (exact cookie domain strategy for prod is an ops choice; still prefer omitting `Domain` when API is reverse-proxied same-origin).
- Dev: Vite proxy for `/auth` with `credentials: 'include'` is the supported path; pitfall is explicit `Domain`, not the proxy itself.
- CORS must use `credentials: true` and explicit origin(s) from `CORS_ORIGIN` (not `*`).

## Approaches considered

1. **JWT in localStorage** — Fast for SPAs; weaker for public go-live (XSS can steal token). Rejected for live.
2. **HttpOnly cookie sessions + Postgres (chosen)** — Opaque token, server-side session row, CSRF mitigations above.
3. **Hosted auth (Clerk/Auth0)** — Rejected; partner wants first-party Postgres accounts.

## Architecture

```
Browser (credentials: include)
  → Nest AuthController
      → AuthCsrfGuard (Content-Type + optional Origin)
      → Throttler (register / login limits)
      → AuthService
          → Prisma User + Session
          → argon2id hash/verify
          → session token generate + SHA-256 store
  → Set-Cookie: sid=… (HttpOnly; Secure in prod)
```

### Modules / files (backend)

| Unit | Responsibility |
|------|----------------|
| `PrismaModule` / `prisma.service.ts` | DB client lifecycle |
| `prisma/schema.prisma` | `User`, `Session` models |
| `auth/auth.module.ts` | Wires controller, service, guards |
| `auth/auth.service.ts` | Register, login, logout, me, session create/validate/delete, lazy expiry cleanup |
| `auth/auth.controller.ts` | HTTP routes |
| `auth/auth.csrf.guard.ts` | Require JSON Content-Type on POSTs; optional Origin allowlist |
| `auth/session.constants.ts` | Cookie name, TTL, password bounds |
| `auth/auth.types.ts` | DTOs / public user type |
| Docker Compose | `postgres` service + `DATABASE_URL` on `api` |
| `main.ts` | CORS with `credentials: true` |

### Data model

**User**

| Field | Notes |
|-------|--------|
| `id` | UUID (cuid or uuid) |
| `fullName` | string, required |
| `email` | unique, stored lowercase |
| `passwordHash` | argon2id encoded hash |
| `createdAt` | timestamptz |

**Session**

| Field | Notes |
|-------|--------|
| `id` | UUID |
| `userId` | FK → User, cascade delete |
| `tokenHash` | unique; SHA-256 of raw cookie token |
| `expiresAt` | createdAt + 7 days |
| `createdAt` | timestamptz |

### Public HTTP API

| Method | Path | Body | Success | Errors |
|--------|------|------|---------|--------|
| POST | `/auth/register` | `{ fullName, email, password }` | 201 + `{ id, fullName, email }` + `Set-Cookie` | 400 validation, 409 email taken, 403 CSRF |
| POST | `/auth/login` | `{ email, password }` | 200 + public user + `Set-Cookie` | 400, 401 invalid credentials, 403 CSRF |
| POST | `/auth/logout` | (empty JSON `{}` ok) | 204 + clear cookie | 403 CSRF |
| GET | `/auth/me` | — | 200 + public user | 401 |

### Cookie & session rules

- Raw token: 32 bytes from CSPRNG; cookie value = base64url(token).
- Persist `SHA-256(raw token bytes)` only.
- On authenticated request: hash presented cookie → lookup by `tokenHash` → if missing, expired, or user gone → 401; optionally delete expired row (lazy cleanup).
- Logout: delete session by `tokenHash`, clear cookie (`Max-Age=0`).
- After logout, previous cookie must not authenticate.
- Cookie flags under test: `HttpOnly`, `SameSite=Lax`, `Path=/`; `Secure` iff production; no `Domain` attribute in non-production.

### CSRF

On all `/auth` POST handlers:

1. Reject unless `Content-Type` starts with `application/json` (403 or 415 — use **403** with stable message for CSRF-ish rejects).
2. If `Origin` header is present, it must match an allowed CORS origin; if absent (non-browser), allow (same as many APIs) unless product later tightens.

`SameSite=Lax` remains the primary cross-site POST defense; JSON Content-Type blocks simple form POSTs from other origins.

### Throttling

- Global throttler may remain.
- `/auth/register`: standard auth throttle (e.g. 5 / minute / IP — builder picks exact numbers matching Nest throttler decorators; document in README).
- `/auth/login`: tighter limit keyed by **IP + normalized email** (e.g. 5 / 15 min) in addition to IP throttle, to slow credential stuffing without only relying on IP.

### Docker

- Add `postgres:16-alpine` (or 15+) with volume, healthcheck, credentials via env.
- `api` `depends_on` postgres healthy; `DATABASE_URL=postgresql://…@postgres:5432/…`
- Keep Redis as today.
- Document migrate on boot or `prisma migrate deploy` in entrypoint/README.

### Frontend contract (for later UI plan)

- Modal: Sign in → email + password; Register → full name + email + password; floating header respects `prefers-reduced-motion`; focus trap; Escape closes.
- `fetch(..., { credentials: 'include', headers: { 'Content-Type': 'application/json' } })`.
- Dev: Vite proxy `/auth` → API so cookie is host-only on the Vite origin without setting `Domain`.

## Error handling

| Case | Status |
|------|--------|
| Validation (missing fields, password length, invalid email shape) | 400 |
| Bad login (unknown email or wrong password) | 401 (identical) |
| Duplicate email on register | 409 |
| CSRF / bad Content-Type / bad Origin | 403 |
| No/invalid/expired session on `/me` | 401 |

## Testing (backend must-haves)

- Register → 201, public user shape, `Set-Cookie` with required flags (dev: no Secure, no Domain).
- Login success / wrong password / unknown email → same 401.
- Dummy verify path exercised when user missing (unit or integration).
- `/me` with valid cookie → 200; without → 401.
- Expired session → 401 (and row cleaned or ignored).
- Logout → subsequent `/me` with old cookie → 401; session row gone.
- CSRF: POST without JSON Content-Type → 403; with disallowed Origin → 403.
- Duplicate register → 409.
- Throttle behavior smoke if practical in e2e (optional if flaky; unit-test custom login throttle guard).

## Security notes (review correction)

- Vite proxy helps same-site cookies in dev; do **not** set explicit `Domain` locally.
- HttpOnly reduces exfiltration of the session secret via `document.cookie`; it does **not** stop XSS from calling `/auth/me` or mutating state with the victim’s cookie. Continue normal XSS hygiene.

## Builder calls (pinned here)

- Password min **8** / max **72**.
- Cookie name **`sid`**.
- Session TTL **7 days**.
- Hash algorithm **argon2id** (default argon2 params from `@node-rs/argon2` or `argon2` package — pick one maintained Nest-friendly lib).
- Token encoding in cookie: **base64url**.
- `tokenHash` storage: **hex** of SHA-256.
