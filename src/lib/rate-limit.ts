/**
 * Simple in-memory sliding-window rate limiter.
 * Good enough for a single-instance deployment (Vercel Hobby / single serverless function).
 * For multi-region deployments, replace with Upstash Redis.
 */

const store = new Map<string, number[]>();

/**
 * Returns true if the request is allowed, false if the limit is exceeded.
 * @param key      Unique key per client+action (e.g. "login:127.0.0.1")
 * @param limit    Max requests allowed in the window
 * @param windowMs Window duration in milliseconds
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (store.get(key) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= limit) return false;

  timestamps.push(now);
  store.set(key, timestamps);
  return true;
}

/**
 * Extract client IP from Next.js request headers (works on Vercel and most proxies).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}
