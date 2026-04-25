/**
 * absoluteApiUrl — resolve a relative API path to an absolute URL based on the
 * current Vercel environment.
 *
 * Spec ref: spec.md > Library > lib/baseUrl.ts. Three-branch resolver:
 *   1. `VERCEL_ENV === 'production'` → `https://${VERCEL_PROJECT_PRODUCTION_URL}${path}`
 *   2. else if `VERCEL_URL` set → `https://${VERCEL_URL}${path}`
 *   3. else → `${BASE_URL || 'http://localhost:3000'}${path}`
 *
 * `path` is normalized to start with `/`. Callers usually pass `/api/profile?...`
 * but a missing leading slash is forgiven.
 */
export function absoluteApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (process.env.VERCEL_ENV === "production") {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}${normalizedPath}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}${normalizedPath}`;
  }

  const base = process.env.BASE_URL || "http://localhost:3000";
  return `${base}${normalizedPath}`;
}
