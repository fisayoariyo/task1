import { COOKIE_NAME } from './auth.constants';
import { buildSessionCookie, clearSessionCookie } from './cookie';

describe('cookie', () => {
  const value = 'abc123base64url';

  describe('buildSessionCookie', () => {
    it('sets sid value and dev attributes without Secure or Domain', () => {
      const expiresAt = new Date('2030-01-15T12:00:00.000Z');
      const header = buildSessionCookie(value, expiresAt);

      expect(header).toContain(`${COOKIE_NAME}=${value}`);
      expect(header).toContain('Path=/');
      expect(header).toContain('HttpOnly');
      expect(header).toContain('SameSite=Lax');
      expect(header).toMatch(/Expires=/i);
      expect(header).not.toMatch(/;\s*Secure/i);
      expect(header).not.toMatch(/Domain=/i);
    });

    it('includes Secure when nodeEnv is production', () => {
      const expiresAt = new Date('2030-01-15T12:00:00.000Z');
      const header = buildSessionCookie(value, expiresAt, {
        nodeEnv: 'production',
      });

      expect(header).toMatch(/;\s*Secure/i);
      expect(header).not.toMatch(/Domain=/i);
    });
  });

  describe('clearSessionCookie', () => {
    it('clears sid with Max-Age=0 and dev attributes', () => {
      const header = clearSessionCookie();

      expect(header).toContain(`${COOKIE_NAME}=`);
      expect(header).toContain('Max-Age=0');
      expect(header).toContain('Path=/');
      expect(header).toContain('HttpOnly');
      expect(header).toContain('SameSite=Lax');
      expect(header).not.toMatch(/;\s*Secure/i);
      expect(header).not.toMatch(/Domain=/i);
    });

    it('includes Secure when nodeEnv is production', () => {
      const header = clearSessionCookie({ nodeEnv: 'production' });

      expect(header).toMatch(/;\s*Secure/i);
    });
  });
});
