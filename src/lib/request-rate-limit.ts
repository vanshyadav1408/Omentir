type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 4096;

function prune(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  while (buckets.size >= MAX_BUCKETS) {
    const oldest = buckets.keys().next().value;
    if (oldest === undefined) break;
    buckets.delete(oldest);
  }
}

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) prune(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  current.count += 1;
  return current.count <= limit;
}

function requestSource(request: Request) {
  const headers = request.headers;
  return (
    headers.get("cf-connecting-ip") ||
    headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export function rateLimitRequest(
  request: Request,
  scope: string,
  options: { perSource: number; global: number; windowMs: number },
) {
  // The global bucket prevents spoofed forwarding headers from bypassing the
  // overall cost ceiling. The bounded source buckets preserve fair use within it.
  return (
    rateLimit(`${scope}:global`, options.global, options.windowMs) &&
    rateLimit(`${scope}:source:${requestSource(request)}`, options.perSource, options.windowMs)
  );
}
