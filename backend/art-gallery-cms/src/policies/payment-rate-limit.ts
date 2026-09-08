import { errors } from '@strapi/utils';

type Bucket = { count: number; resetAt: number };
type RateLimitConfig = { bucket?: string; limit?: number; windowMs?: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 2048;

function pruneExpiredBuckets(now: number) {
  for (const [bucketKey, value] of buckets) {
    if (value.resetAt <= now) buckets.delete(bucketKey);
  }
}

export default (policyContext, config: RateLimitConfig = {}) => {
  const now = Date.now();
  const limit = Math.max(1, Number(config.limit) || 10);
  const windowMs = Math.max(1000, Number(config.windowMs) || 600000);
  const ip = policyContext.request.ip || policyContext.ip || 'unknown';
  const bucketName = String(config.bucket || 'checkout');
  const key = `${bucketName}:${ip}`;
  pruneExpiredBuckets(now);
  if (!buckets.has(key) && buckets.size >= MAX_BUCKETS) {
    const oldestKey = buckets.keys().next().value;
    if (oldestKey) buckets.delete(oldestKey);
  }
  const current = buckets.get(key);
  const bucket = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + windowMs }
    : current;

  bucket.count += 1;
  buckets.set(key, bucket);
  policyContext.response?.set?.('RateLimit-Limit', String(limit));
  policyContext.response?.set?.('RateLimit-Remaining', String(Math.max(0, limit - bucket.count)));

  if (bucket.count > limit) {
    policyContext.response?.set?.('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
    throw new errors.RateLimitError('Too many checkout requests. Please wait and try again.');
  }

  return true;
};
