import { generateSessionToken, hashSessionToken } from './crypto';

describe('crypto', () => {
  it('generateSessionToken raw length 32 and hash is 64-char hex', () => {
    const t = generateSessionToken();
    expect(t.raw.length).toBe(32);
    expect(t.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashSessionToken(t.cookieValue)).toBe(t.tokenHash);
  });
});
