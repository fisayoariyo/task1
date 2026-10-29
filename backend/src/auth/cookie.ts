import { COOKIE_NAME } from './auth.constants';

function appendSecurityFlags(parts: string[], nodeEnv?: string): void {
  parts.push('Path=/', 'HttpOnly', 'SameSite=Lax');
  if (nodeEnv === 'production') {
    parts.push('Secure');
  }
}

export function buildSessionCookie(
  cookieValue: string,
  expiresAt: Date,
  opts?: { nodeEnv?: string },
): string {
  const parts = [
    `${COOKIE_NAME}=${cookieValue}`,
    `Expires=${expiresAt.toUTCString()}`,
  ];
  appendSecurityFlags(parts, opts?.nodeEnv);
  return parts.join('; ');
}

export function clearSessionCookie(opts?: { nodeEnv?: string }): string {
  const parts = [`${COOKIE_NAME}=`, 'Max-Age=0'];
  appendSecurityFlags(parts, opts?.nodeEnv);
  return parts.join('; ');
}
