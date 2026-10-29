import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthCsrfGuard } from './auth.csrf.guard';

function postContext(
  headers: Record<string, string | undefined>,
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ method: 'POST', headers }),
    }),
  } as ExecutionContext;
}

describe('AuthCsrfGuard', () => {
  const originalCorsOrigin = process.env.CORS_ORIGIN;
  const guard = new AuthCsrfGuard();

  beforeEach(() => {
    delete process.env.CORS_ORIGIN;
  });

  afterAll(() => {
    if (originalCorsOrigin === undefined) {
      delete process.env.CORS_ORIGIN;
    } else {
      process.env.CORS_ORIGIN = originalCorsOrigin;
    }
  });

  it('rejects POST when Content-Type is text/plain', () => {
    const context = postContext({
      'content-type': 'text/plain',
      origin: 'http://localhost:5173',
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('rejects POST when Origin is not in the CORS allowlist', () => {
    const context = postContext({
      'content-type': 'application/json',
      origin: 'https://evil.example',
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('allows POST with application/json and an allowlisted Origin', () => {
    const context = postContext({
      'content-type': 'application/json',
      origin: 'http://localhost:5173',
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows POST with application/json when Origin is absent', () => {
    const context = postContext({
      'content-type': 'application/json',
    });

    expect(guard.canActivate(context)).toBe(true);
  });
});
