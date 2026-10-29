import { spawnSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Response } from 'supertest';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { COOKIE_NAME } from '../src/auth/auth.constants';
import { generateSessionToken } from '../src/auth/crypto';
import { hashPassword } from '../src/auth/password';
import { getCorsOrigins } from '../src/cors-origins';
import { PrismaService } from '../src/prisma/prisma.service';

const backendRoot = join(__dirname, '..');
const PASSWORD = 'test-password-1';
const RUN_WHEN_DOCKER_IS_AVAILABLE = [
  'cd backend',
  'docker compose up -d postgres',
  'npx prisma migrate deploy',
  'npm run test:e2e -- --testPathPattern=auth.e2e-spec',
].join('\n');

jest.setTimeout(120_000);

loadEnvFile(join(backendRoot, '.env'));
process.env.NODE_ENV = 'test';
process.env.DATA_SOURCE = 'mock';
process.env.REDIS_URL = '';

const skipReason = probePostgres();
if (skipReason) {
  // Jest marks the suite skipped; print why so a green exit is not a silent pass.
  process.stderr.write(`\nSKIP auth e2e:\n${skipReason}\n`);
}

const describeAuth = skipReason ? describe.skip : describe;
const suiteName = skipReason
  ? 'Auth cookie sessions (e2e, Postgres) [skipped: DATABASE_URL unset or Postgres unreachable]'
  : 'Auth cookie sessions (e2e, Postgres)';

describeAuth(suiteName, () => {
  let app: INestApplication | undefined;
  let prisma: PrismaService | undefined;
  const createdEmails: string[] = [];

  beforeAll(async () => {
    migrateDeploy();

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    const origins = getCorsOrigins();
    app.enableCors({
      origin: origins.length === 1 ? origins[0] : origins,
      credentials: true,
    });
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    try {
      if (prisma && createdEmails.length > 0) {
        await prisma.user.deleteMany({
          where: { email: { in: createdEmails } },
        });
      }
    } finally {
      if (app) {
        await app.close();
      }
    }
  });

  it('registers and returns the same user from /auth/me via the session cookie', async () => {
    const email = uniqueEmail('register', createdEmails);
    const res = await postJson('/auth/register', {
      fullName: 'E2E User',
      email,
      password: PASSWORD,
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: expect.any(String),
      fullName: 'E2E User',
      email,
    });
    const sid = expectSessionCookie(res);

    const me = await getMe(sid);
    expect(me.status).toBe(200);
    expect(me.body).toEqual(res.body);
  });

  it('logs in with the correct password', async () => {
    const email = uniqueEmail('login', createdEmails);
    await insertUser(email, PASSWORD);

    const res = await postJson('/auth/login', { email, password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: expect.any(String),
      fullName: 'E2E User',
      email,
    });
    const sid = expectSessionCookie(res);
    const me = await getMe(sid);
    expect(me.status).toBe(200);
    expect(me.body).toEqual(res.body);
  });

  it('returns 401 for a wrong password', async () => {
    const email = uniqueEmail('wrong', createdEmails);
    await insertUser(email, PASSWORD);

    const res = await postJson('/auth/login', {
      email,
      password: 'wrong-password-1',
    });

    expect(res.status).toBe(401);
  });

  it('returns 409 when the email is already registered', async () => {
    const email = uniqueEmail('dup', createdEmails);
    const first = await postJson('/auth/register', {
      fullName: 'E2E User',
      email,
      password: PASSWORD,
    });
    expect(first.status).toBe(201);

    const second = await postJson('/auth/register', {
      fullName: 'E2E User',
      email,
      password: PASSWORD,
    });
    expect(second.status).toBe(409);
  });

  it('returns 403 for a POST without application/json', async () => {
    const res = await request(httpServer())
      .post('/auth/register')
      .set('Content-Type', 'text/plain')
      .send('not-json');

    expect(res.status).toBe(403);
  });

  it('returns 401 from /auth/me after logout', async () => {
    const email = uniqueEmail('logout', createdEmails);
    await insertUser(email, PASSWORD);
    const login = await postJson('/auth/login', { email, password: PASSWORD });
    expect(login.status).toBe(200);
    const sid = expectSessionCookie(login);

    const logout = await request(httpServer())
      .post('/auth/logout')
      .set('Content-Type', 'application/json')
      .set('Cookie', `${COOKIE_NAME}=${sid}`)
      .send({});
    expect(logout.status).toBe(204);

    const me = await getMe(sid);
    expect(me.status).toBe(401);
  });

  it('returns 401 for a session inserted with a past expiresAt', async () => {
    const email = uniqueEmail('expired', createdEmails);
    const user = await insertUser(email, PASSWORD);
    const { cookieValue, tokenHash } = generateSessionToken();
    await prismaClient().session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() - 60_000),
      },
    });

    const me = await getMe(cookieValue);
    expect(me.status).toBe(401);
  });

  function httpServer() {
    if (!app) {
      throw new Error('Nest application failed to start');
    }
    return app.getHttpServer();
  }

  function prismaClient(): PrismaService {
    if (!prisma) {
      throw new Error('PrismaService is unavailable');
    }
    return prisma;
  }

  function postJson(path: string, body: Record<string, string>) {
    return request(httpServer())
      .post(path)
      .set('Content-Type', 'application/json')
      .send(body);
  }

  function getMe(sid: string) {
    return request(httpServer())
      .get('/auth/me')
      .set('Cookie', `${COOKIE_NAME}=${sid}`);
  }

  async function insertUser(email: string, password: string) {
    return prismaClient().user.create({
      data: {
        email,
        fullName: 'E2E User',
        passwordHash: await hashPassword(password),
      },
    });
  }
});

function uniqueEmail(label: string, createdEmails: string[]): string {
  const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const email = `e2e-${label}-${suffix}@example.com`;
  createdEmails.push(email);
  return email;
}

function expectSessionCookie(res: Response): string {
  const header = res.headers['set-cookie'];
  const lines = Array.isArray(header) ? header : header ? [String(header)] : [];
  const line = lines.find(
    (entry) =>
      entry.startsWith(`${COOKIE_NAME}=`) &&
      !entry.startsWith(`${COOKIE_NAME}=;`),
  );
  expect(line).toBeDefined();
  const cookie = line as string;
  const attributes = cookie.split(';').slice(1).map((part) => part.trim());
  expect(attributes).toContain('HttpOnly');
  expect(attributes).toContain('SameSite=Lax');
  expect(attributes).toContain('Path=/');
  expect(attributes.some((attribute) => /^domain=/i.test(attribute))).toBe(false);
  expect(attributes.some((attribute) => /^secure$/i.test(attribute))).toBe(false);
  const value = cookie.split(';', 1)[0].slice(COOKIE_NAME.length + 1);
  expect(value.length).toBeGreaterThan(0);
  return value;
}

function loadEnvFile(path: string): void {
  if (!existsSync(path)) {
    return;
  }
  const text = readFileSync(path, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq <= 0) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function probePostgres(): string | undefined {
  if (!process.env.DATABASE_URL) {
    return [
      'DATABASE_URL is unset. Copy backend/.env.example to backend/.env or export DATABASE_URL.',
      'Example: postgresql://nomnom:nomnom@localhost:5432/nomnom?schema=public',
      'When Docker is available:',
      RUN_WHEN_DOCKER_IS_AVAILABLE,
    ].join('\n');
  }

  const probeScript = [
    "const { PrismaClient } = require('@prisma/client');",
    'const client = new PrismaClient();',
    'client.$connect()',
    "  .then(() => client.$queryRawUnsafe('SELECT 1'))",
    '  .then(() => client.$disconnect())',
    '  .then(() => process.exit(0))',
    '  .catch(async (error) => {',
    '    const message = error && error.message ? error.message : String(error);',
    '    console.error(message);',
    '    try { await client.$disconnect(); } catch (disconnectError) { /* ignore */ }',
    '    process.exit(2);',
    '  });',
  ].join('\n');

  const result = spawnSync(process.execPath, ['-e', probeScript], {
    cwd: backendRoot,
    env: process.env,
    encoding: 'utf8',
    timeout: 15_000,
  });

  if (result.status === 0) {
    return undefined;
  }

  const detail = `${result.stderr ?? ''}${result.stdout ?? ''}`.trim();
  return [
    'Postgres is unreachable for auth e2e (or the probe failed).',
    detail || `probe exit ${result.status ?? 'timeout'}`,
    'When Docker is available:',
    RUN_WHEN_DOCKER_IS_AVAILABLE,
  ].join('\n');
}

function migrateDeploy(): void {
  const result = spawnSync('npx --no-install prisma migrate deploy', {
    cwd: backendRoot,
    env: process.env,
    encoding: 'utf8',
    shell: true,
    timeout: 60_000,
  });
  if (result.status !== 0) {
    throw new Error(
      [
        'prisma migrate deploy failed.',
        result.stdout ?? '',
        result.stderr ?? '',
        'When Docker is available:',
        RUN_WHEN_DOCKER_IS_AVAILABLE,
      ].join('\n'),
    );
  }
}
