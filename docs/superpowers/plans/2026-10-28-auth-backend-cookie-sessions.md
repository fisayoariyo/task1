# Auth Backend (Cookie Sessions + Postgres) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Nest email/password auth with HttpOnly `sid` cookie sessions, Prisma/Postgres, argon2id, CSRF JSON/Origin checks, Docker Compose Postgres, and the e2e coverage in the spec.

**Architecture:** Opaque 32-byte session token in cookie; SHA-256 hex stored as `Session.tokenHash`; `AuthService` owns register/login/logout/me; `AuthCsrfGuard` on POSTs; throttler on register/login with tighter IP+email login limit; Compose adds healthy `postgres` and `DATABASE_URL`.

**Tech Stack:** NestJS 10, Prisma, PostgreSQL 16, `argon2` (argon2id), `@nestjs/throttler`, Jest + supertest, Docker Compose.

**Spec:** `docs/superpowers/specs/2026-10-28-auth-cookie-sessions-design.md`

## Global Constraints

- Cookie name `sid`; TTL **7 days**; raw token **32 bytes** CSPRNG; cookie value **base64url**; DB `tokenHash` = **hex(SHA-256(raw bytes))**.
- Cookie: `HttpOnly`, `SameSite=Lax`, `Path=/`; `Secure` iff `NODE_ENV === 'production'`; **no `Domain`** when not production.
- Passwords: **argon2id**; length **8–72**; email trim + **lowercase** + unique index.
- Responses: only `{ id, fullName, email }`.
- Login: identical **401** for unknown email and wrong password; **dummy argon2 verify** when user missing.
- Register duplicate email → **409**.
- CSRF: POST `/auth/*` requires `Content-Type` starting with `application/json`; if `Origin` present, must be in CORS allowlist → else **403**.
- Logout deletes session row; expired sessions rejected and cleaned lazily.
- CORS: `credentials: true` + explicit origins from `CORS_ORIGIN` (never `*`).
- Frontend AuthModal is **out of scope** for this plan.
- TDD: failing test first for each task.
- Git commits are optional steps — **do not commit unless the user explicitly asks**.

## Review Focus

- Login with email that differs only by casing must hit the same user (normalized email) — covered in Task 5.
- `/auth/logout` without cookie still returns 204 and clears cookie header — covered in Task 6.
- Production cookie sets `Secure` when `NODE_ENV=production` in unit/helper test — covered in Task 3.
- Register with password length 7 and 73 → 400 — covered in Task 5.
- POST login with `Content-Type: text/plain` → 403 even with valid body — covered in Task 4.

## File map

```
backend/
  docker-compose.yml          # + postgres
  Dockerfile                  # prisma generate if needed
  .env.example                # DATABASE_URL
  package.json                # prisma, argon2, etc.
  prisma/schema.prisma
  prisma/migrations/...
  src/
    main.ts                   # credentials: true CORS
    app.module.ts             # AuthModule, PrismaModule
    prisma/
      prisma.module.ts
      prisma.service.ts
    auth/
      auth.module.ts
      auth.controller.ts
      auth.service.ts
      auth.csrf.guard.ts
      auth.constants.ts
      auth.types.ts
      login-throttle.guard.ts # IP+email limiter
      cookie.ts               # build/clear Set-Cookie helpers
      crypto.ts               # token + sha256 helpers
      password.ts             # argon2id hash/verify + dummy hash
  test/
    auth.e2e-spec.ts
```

---

### Task 1: Prisma schema + Docker Postgres + env

**Files:**
- Create: `backend/prisma/schema.prisma`, `backend/src/prisma/prisma.service.ts`, `backend/src/prisma/prisma.module.ts`
- Modify: `backend/docker-compose.yml`, `backend/.env.example`, `backend/package.json`, `backend/Dockerfile` (ensure `prisma generate` in build)
- Test: `backend/src/prisma/prisma.service.spec.ts` (lightweight: service constructs / `onModuleInit` calls `$connect` mocked)

**Interfaces:**
- Produces: `PrismaService extends PrismaClient`; models `User`, `Session` as in spec; Compose service `postgres` with healthcheck; `DATABASE_URL` example `postgresql://nomnom:nomnom@localhost:5432/nomnom?schema=public` (host) / `@postgres:5432` in Compose.

- [ ] **Step 1: Write failing test** that `PrismaService` is defined and provides `$connect`

```ts
// backend/src/prisma/prisma.service.spec.ts
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  it('exposes $connect', () => {
    const s = Object.create(PrismaService.prototype);
    expect(typeof PrismaService.prototype.$connect).toBe('function');
  });
});
```

- [ ] **Step 2: Run** `cd backend && npm test -- --testPathPattern=prisma.service` — expect FAIL (module missing)

- [ ] **Step 3: Add deps** `prisma` `@prisma/client`, implement schema:

```prisma
generator client {
  provider = "prisma-client-js"
}
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
model User {
  id           String    @id @default(uuid())
  fullName     String
  email        String    @unique
  passwordHash String
  createdAt    DateTime  @default(now())
  sessions     Session[]
}
model Session {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

Implement `PrismaService` + global `PrismaModule`. Extend `docker-compose.yml` with `postgres:16-alpine`, volume, healthcheck, env user/password/db `nomnom`; wire `api` `DATABASE_URL` and `depends_on` condition. Update `.env.example`. Run `npx prisma migrate dev --name init_auth` against local/compose Postgres when available.

- [ ] **Step 4: Run test** — PASS

- [ ] **Step 5: Commit** (only if user asked)

---

### Task 2: Crypto + password helpers (unit TDD)

**Files:**
- Create: `backend/src/auth/crypto.ts`, `backend/src/auth/password.ts`, `backend/src/auth/auth.constants.ts`
- Test: `backend/src/auth/crypto.spec.ts`, `backend/src/auth/password.spec.ts`

**Interfaces:**
- Produces:
  - `SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000`
  - `COOKIE_NAME = 'sid'`
  - `PASSWORD_MIN = 8`, `PASSWORD_MAX = 72`
  - `generateSessionToken(): { raw: Buffer; cookieValue: string; tokenHash: hex string }`
  - `hashSessionToken(cookieValue: string): string` (decode base64url → SHA-256 hex)
  - `hashPassword(plain: string): Promise<string>` argon2id
  - `verifyPassword(hash: string, plain: string): Promise<boolean>`
  - `DUMMY_PASSWORD_HASH: string` constant precomputed at module load for dummy verifies
  - `verifyPasswordOrDummy(hash: string | null, plain: string): Promise<boolean>`

- [ ] **Step 1: Failing tests**

```ts
// crypto.spec.ts
it('generateSessionToken raw length 32 and hash is 64-char hex', () => {
  const t = generateSessionToken();
  expect(t.raw.length).toBe(32);
  expect(t.tokenHash).toMatch(/^[0-9a-f]{64}$/);
  expect(hashSessionToken(t.cookieValue)).toBe(t.tokenHash);
});

// password.spec.ts
it('hash/verify roundtrip with argon2id', async () => {
  const h = await hashPassword('password12');
  expect(await verifyPassword(h, 'password12')).toBe(true);
  expect(await verifyPassword(h, 'wrong')).toBe(false);
});
it('verifyPasswordOrDummy with null still returns false', async () => {
  expect(await verifyPasswordOrDummy(null, 'password12')).toBe(false);
});
```

- [ ] **Step 2: Run** — FAIL

- [ ] **Step 3: Implement helpers** using Node `crypto` + `argon2` package (`argon2.hash` with `type: argon2.argon2id`)

- [ ] **Step 4: Run** — PASS

- [ ] **Step 5: Commit** (if asked)

---

### Task 3: Cookie header helpers

**Files:**
- Create: `backend/src/auth/cookie.ts`
- Test: `backend/src/auth/cookie.spec.ts`

**Interfaces:**
- Produces:
  - `buildSessionCookie(cookieValue: string, expiresAt: Date, opts?: { nodeEnv?: string }): string`
  - `clearSessionCookie(opts?: { nodeEnv?: string }): string`
  - Parsed attributes must include `HttpOnly`, `Path=/`, `SameSite=Lax`; include `Secure` only when `nodeEnv === 'production'`; must **not** include `Domain=`

- [ ] **Step 1: Failing tests** asserting substring flags for dev vs production

- [ ] **Step 2: Run** — FAIL

- [ ] **Step 3: Implement** `buildSessionCookie` / `clearSessionCookie` (`Max-Age=0` / past Expires on clear)

- [ ] **Step 4: Run** — PASS

- [ ] **Step 5: Commit** (if asked)

---

### Task 4: CSRF guard

**Files:**
- Create: `backend/src/auth/auth.csrf.guard.ts`
- Test: `backend/src/auth/auth.csrf.guard.spec.ts`
- Modify: `backend/src/main.ts` (document that guard reads same origin list as CORS — export `getCorsOrigins(): string[]` from a tiny `cors-origins.ts` used by `main.ts` and guard)

**Interfaces:**
- Produces: `AuthCsrfGuard implements CanActivate` — for POST: Content-Type must start with `application/json`; if `Origin` header present, must be in allowlist from `CORS_ORIGIN` / defaults.

- [ ] **Step 1: Failing unit tests** — reject text/plain; reject bad Origin; allow JSON + good Origin; allow JSON with no Origin

- [ ] **Step 2: Run** — FAIL

- [ ] **Step 3: Implement guard** throwing `ForbiddenException`

- [ ] **Step 4: Run** — PASS

- [ ] **Step 5: Commit** (if asked)

---

### Task 5: AuthService register + login

**Files:**
- Create: `backend/src/auth/auth.service.ts`, `backend/src/auth/auth.types.ts`
- Test: `backend/src/auth/auth.service.spec.ts` (Prisma mocked)

**Interfaces:**
- Consumes: PrismaService, password/crypto/cookie helpers, constants
- Produces:
  - `register(input: { fullName: string; email: string; password: string }): Promise<{ user: PublicUser; cookieValue: string; expiresAt: Date }>`
  - `login(input: { email: string; password: string }): Promise<{ user: PublicUser; cookieValue: string; expiresAt: Date }>`
  - Validation: trim fullName non-empty; email basic shape; password length 8–72; email lowercased before lookup/insert
  - Duplicate email → `ConflictException`
  - Bad credentials → `UnauthorizedException` after `verifyPasswordOrDummy`

- [ ] **Step 1: Failing service tests** for happy register, duplicate, login ok, login unknown email, login wrong password, short password

- [ ] **Step 2: Run** — FAIL

- [ ] **Step 3: Implement AuthService** (create User + Session in transaction on register/login)

- [ ] **Step 4: Run** — PASS

- [ ] **Step 5: Commit** (if asked)

---

### Task 6: AuthService me + logout + lazy expiry

**Files:**
- Modify: `backend/src/auth/auth.service.ts`
- Test: `backend/src/auth/auth.service.spec.ts` (extend)

**Interfaces:**
- Produces:
  - `me(cookieValue: string | undefined): Promise<PublicUser>` — 401 if missing/invalid/expired; delete expired row when found expired
  - `logout(cookieValue: string | undefined): Promise<void>` — delete by tokenHash if present; always succeed

- [ ] **Step 1: Failing tests** — valid me; expired session rejected + delete called; logout deletes; me after logout fails

- [ ] **Step 2: Run** — FAIL

- [ ] **Step 3: Implement**

- [ ] **Step 4: Run** — PASS

- [ ] **Step 5: Commit** (if asked)

---

### Task 7: AuthController + module + throttling + wire app

**Files:**
- Create: `backend/src/auth/auth.controller.ts`, `backend/src/auth/auth.module.ts`, `backend/src/auth/login-throttle.guard.ts`
- Modify: `backend/src/app.module.ts`, `backend/src/main.ts`
- Test: `backend/src/auth/auth.controller.spec.ts` (light) and/or rely on e2e in Task 8

**Interfaces:**
- Produces routes as spec; sets `Set-Cookie` via `res.setHeader('Set-Cookie', ...)`; `@UseGuards(AuthCsrfGuard)` on POSTs; `@Throttle` on register; custom login throttle guard using in-memory Map keyed by `ip + ':' + email` (document limit: **5 attempts / 15 minutes** per key); register **5 / 60s** per IP via Nest Throttle.

- [ ] **Step 1: Failing controller test** — register returns 201 shape when service mocked

- [ ] **Step 2: Run** — FAIL

- [ ] **Step 3: Implement controller + module; enable CORS credentials in `main.ts` using shared origins helper

- [ ] **Step 4: Run** — PASS

- [ ] **Step 5: Commit** (if asked)

---

### Task 8: Auth e2e against real Postgres

**Files:**
- Create: `backend/test/auth.e2e-spec.ts`
- Modify: `backend/test/jest-e2e.json` if needed; `backend/README.md` for auth + Compose Postgres

**Interfaces:**
- Consumes full AppModule; requires `DATABASE_URL` (skip or fail clearly if unset)
- Tests: register+me; login; wrong password 401; duplicate 409; CSRF 403; logout then me 401; expired session 401 (insert session with past `expiresAt`); assert `Set-Cookie` flags (HttpOnly, SameSite=Lax, Path=/, no Domain, no Secure in test env)

- [ ] **Step 1: Write e2e file** with the cases above

- [ ] **Step 2: Run** `docker compose up -d postgres` then `npx prisma migrate deploy` then `npm run test:e2e -- --testPathPattern=auth` — expect FAIL until Task 7 complete (if already complete, fix until PASS)

- [ ] **Step 3: Fix gaps** until PASS

- [ ] **Step 4: Update README** env table: `DATABASE_URL`, auth endpoints summary, Compose postgres

- [ ] **Step 5: Commit** (if asked)

---

## Execution notes

- Prefer Testcontainers or Compose Postgres for e2e; do not use SQLite (spec is Postgres).
- Do not implement frontend modal in this plan.
- Do not force-push or amend; commits only when user requests.
