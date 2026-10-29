import { createHash, randomBytes } from 'crypto';

export function generateSessionToken(): {
  raw: Buffer;
  cookieValue: string;
  tokenHash: string;
} {
  const raw = randomBytes(32);
  const cookieValue = raw.toString('base64url');
  const tokenHash = createHash('sha256').update(raw).digest('hex');
  return { raw, cookieValue, tokenHash };
}

export function hashSessionToken(cookieValue: string): string {
  const raw = Buffer.from(cookieValue, 'base64url');
  return createHash('sha256').update(raw).digest('hex');
}
