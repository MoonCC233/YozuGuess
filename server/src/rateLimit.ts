import type { NextFunction, Request, RequestHandler, Response } from 'express';

interface Bucket {
  count: number;
  resetAt: number;
}

export interface RateLimitOptions {
  /** 桶名，用于隔离不同接口的配额 */
  name: string;
  /** 窗口内允许的最大请求数 */
  limit: number;
  /** 窗口长度（毫秒） */
  windowMs: number;
}

const buckets = new Map<string, Bucket>();

/** 定期清掉过期的桶，避免 Map 无限增长 */
function sweep(now: number): void {
  if (buckets.size < 10_000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

function clientKey(req: Request): string {
  return req.ip ?? req.socket.remoteAddress ?? 'anon';
}

/**
 * 判断某个来源在窗口内是否还有配额，并在有配额时计数。
 * socket 层没有 express req，直接用这个函数。
 */
export function consume(name: string, identity: string, limit: number, windowMs: number): {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
} {
  const now = Date.now();
  sweep(now);
  const key = `${name}:${identity}`;
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }
  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterMs: bucket.resetAt - now };
  }
  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, retryAfterMs: 0 };
}

/** 基于内存令牌桶的限流中间件，按客户端 IP 分桶 */
export function rateLimit(options: RateLimitOptions): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = consume(options.name, clientKey(req), options.limit, options.windowMs);
    res.setHeader('X-RateLimit-Limit', String(options.limit));
    res.setHeader('X-RateLimit-Remaining', String(result.remaining));
    if (!result.allowed) {
      res.setHeader('Retry-After', String(Math.ceil(result.retryAfterMs / 1000)));
      res.status(429).json({ code: 'RATE_LIMITED' });
      return;
    }
    next();
  };
}

/** 仅用于测试：清空全部计数 */
export function resetRateLimits(): void {
  buckets.clear();
}
