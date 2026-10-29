import {
  hashPassword,
  verifyPassword,
  verifyPasswordOrDummy,
} from './password';

describe('password', () => {
  it('hash/verify roundtrip with argon2id', async () => {
    const h = await hashPassword('password12');
    expect(await verifyPassword(h, 'password12')).toBe(true);
    expect(await verifyPassword(h, 'wrong')).toBe(false);
  });

  it('verifyPasswordOrDummy with null still returns false', async () => {
    expect(await verifyPasswordOrDummy(null, 'password12')).toBe(false);
  });
});
