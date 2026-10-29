import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import * as request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthCsrfGuard } from './auth.csrf.guard';
import { AuthService } from './auth.service';
import { LoginThrottleGuard } from './login-throttle.guard';
import { PublicUser } from './auth.types';

const user: PublicUser = {
  id: 'user-1',
  fullName: 'Ada Lovelace',
  email: 'ada@example.com',
};

const expiresAt = new Date('2030-01-15T12:00:00.000Z');

describe('AuthController', () => {
  let app: INestApplication;
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    me: jest.fn(),
  };

  beforeEach(async () => {
    authService.register.mockReset();
    authService.login.mockReset();
    authService.logout.mockReset();
    authService.me.mockReset();
    authService.register.mockResolvedValue({
      user,
      cookieValue: 'cookie-token',
      expiresAt,
    });
    authService.login.mockResolvedValue({
      user,
      cookieValue: 'login-token',
      expiresAt,
    });
    authService.logout.mockResolvedValue(undefined);
    authService.me.mockImplementation(async (sid?: string) => {
      if (!sid) {
        throw new UnauthorizedException();
      }
      return user;
    });

    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }])],
      controllers: [AuthController],
      providers: [
        AuthCsrfGuard,
        LoginThrottleGuard,
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 201 and sets the session cookie when register succeeds', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .set('Content-Type', 'application/json')
      .send({
        fullName: 'Ada Lovelace',
        email: 'Ada@Example.com',
        password: 'password1',
      });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(user);
    expect(authService.register).toHaveBeenCalledWith({
      fullName: 'Ada Lovelace',
      email: 'Ada@Example.com',
      password: 'password1',
    });
    const setCookie = cookieHeader(res.headers['set-cookie']);
    expect(setCookie).toContain('sid=cookie-token');
    expect(setCookie).toContain(`Expires=${expiresAt.toUTCString()}`);
    expect(setCookie).toContain('Path=/');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Lax');
    expect(setCookie).not.toMatch(/Domain=/i);
    expect(setCookie).not.toMatch(/;\s*Secure/i);
  });

  it('rejects register without JSON content type', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .set('Content-Type', 'text/plain')
      .send('nope');

    expect(res.status).toBe(403);
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('allows 5 registers per minute and rejects the 6th', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .set('Content-Type', 'application/json')
        .send({
          fullName: 'Ada Lovelace',
          email: `ada${i}@example.com`,
          password: 'password1',
        });
      expect(res.status).toBe(201);
    }

    const blocked = await request(app.getHttpServer())
      .post('/auth/register')
      .set('Content-Type', 'application/json')
      .send({
        fullName: 'Ada Lovelace',
        email: 'ada6@example.com',
        password: 'password1',
      });

    expect(blocked.status).toBe(429);
    expect(authService.register).toHaveBeenCalledTimes(5);
  });

  it('returns 200 and sets the session cookie when login succeeds', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .send({ email: 'Ada@Example.com', password: 'password1' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(user);
    expect(authService.login).toHaveBeenCalledWith({
      email: 'Ada@Example.com',
      password: 'password1',
    });
    const setCookie = cookieHeader(res.headers['set-cookie']);
    expect(setCookie).toContain('sid=login-token');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Lax');
    expect(setCookie).not.toMatch(/Domain=/i);
  });

  it('rejects the 6th login for the same ip and normalized email', async () => {
    const sendLogin = (email: string) =>
      request(app.getHttpServer())
        .post('/auth/login')
        .set('Content-Type', 'application/json')
        .send({ email, password: 'password1' });

    for (const email of [
      'Ada@Example.com',
      'ada@example.com',
      '  ADA@example.com ',
      'ada@example.com',
      'ada@example.com',
    ]) {
      expect((await sendLogin(email)).status).toBe(200);
    }

    expect((await sendLogin('ada@example.com')).status).toBe(429);
    expect(authService.login).toHaveBeenCalledTimes(5);
    expect((await sendLogin('other@example.com')).status).toBe(200);
  });

  it('returns 204, clears the cookie, and logs out the sid', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Content-Type', 'application/json')
      .set('Cookie', 'theme=dark; sid=sess-token')
      .send({});

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
    expect(authService.logout).toHaveBeenCalledWith('sess-token');
    const setCookie = cookieHeader(res.headers['set-cookie']);
    expect(setCookie).toContain('sid=; Max-Age=0');
    expect(setCookie).toContain('Path=/');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Lax');
  });

  it('rejects logout without JSON content type', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Content-Type', 'text/plain')
      .send('nope');

    expect(res.status).toBe(403);
    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('returns the user for a valid sid and 401 when the cookie is missing', async () => {
    const ok = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', 'sid=sess-token');

    expect(ok.status).toBe(200);
    expect(ok.body).toEqual(user);
    expect(authService.me).toHaveBeenCalledWith('sess-token');

    const missing = await request(app.getHttpServer()).get('/auth/me');
    expect(missing.status).toBe(401);
    expect(authService.me).toHaveBeenCalledWith(undefined);
  });
});

function cookieHeader(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value.join('\n');
  }
  return value ?? '';
}
