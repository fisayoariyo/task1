/**
 * Origin allowlist shared by CORS in `main.ts` and `AuthCsrfGuard`.
 * Same defaults as the previous inline list in `main.ts`.
 */
export function getCorsOrigins(): string[] {
  const corsOrigin =
    process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://127.0.0.1:5173';
  const origins = corsOrigin
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  // Vite may be opened as localhost or 127.0.0.1 — allow both by default.
  if (!process.env.CORS_ORIGIN) {
    origins.push('http://127.0.0.1:5173');
  }
  return origins;
}
