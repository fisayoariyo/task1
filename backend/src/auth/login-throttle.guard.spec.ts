import { ExecutionContext, HttpException } from '@nestjs/common';
import { LoginThrottleGuard } from './login-throttle.guard';

function context(ip: string, email: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ ip, body: { email } }),
    }),
  } as ExecutionContext;
}

describe('LoginThrottleGuard', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('allows 5 attempts per ip and normalized email, then rejects', () => {
    const guard = new LoginThrottleGuard();
    const same = context('203.0.113.8', '  Ada@Example.com ');

    for (let attempt = 0; attempt < 5; attempt++) {
      expect(guard.canActivate(same)).toBe(true);
    }

    expect(() => guard.canActivate(context('203.0.113.8', 'ADA@EXAMPLE.COM'))).toThrow(
      HttpException,
    );
    try {
      guard.canActivate(same);
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(429);
    }

    expect(guard.canActivate(context('203.0.113.9', 'ada@example.com'))).toBe(
      true,
    );
    expect(guard.canActivate(context('203.0.113.8', 'other@example.com'))).toBe(
      true,
    );
  });

  it('forgets attempts after 15 minutes', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    const guard = new LoginThrottleGuard();
    const same = context('203.0.113.8', 'ada@example.com');

    for (let attempt = 0; attempt < 5; attempt++) {
      expect(guard.canActivate(same)).toBe(true);
    }
    expect(() => guard.canActivate(same)).toThrow(HttpException);

    jest.setSystemTime(new Date('2026-01-01T00:15:00.000Z'));
    expect(guard.canActivate(same)).toBe(true);
  });
});
