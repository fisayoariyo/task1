import { ADMIN_COOKIE_NAME } from './admin.constants';

function appendSecurityFlags(parts: string[], nodeEnv?: string): void {
  parts.push('Path=/', 'HttpOnly', 'SameSite=Lax');
  if (nodeEnv === 'production') {
    parts.push('Secure');
  }
}

export function buildAdminSessionCookie(
  cookieValue: string,
  expiresAt: Date,
  opts?: { nodeEnv?: string },
): string {
  const parts = [
    `${ADMIN_COOKIE_NAME}=${cookieValue}`,
    `Expires=${expiresAt.toUTCString()}`,
  ];
  appendSecurityFlags(parts, opts?.nodeEnv);
  return parts.join('; ');
}

export function clearAdminSessionCookie(opts?: { nodeEnv?: string }): string {
  const parts = [`${ADMIN_COOKIE_NAME}=`, 'Max-Age=0'];
  appendSecurityFlags(parts, opts?.nodeEnv);
  return parts.join('; ');
}

export function readAdminSessionId(
  cookieHeader: string | undefined,
): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }

  const prefix = `${ADMIN_COOKIE_NAME}=`;
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim();
    if (!trimmed.startsWith(prefix)) {
      continue;
    }
    const value = trimmed.slice(prefix.length);
    return value.length > 0 ? value : undefined;
  }
  return undefined;
}
