import { Request, Response, NextFunction } from 'express';

// 轻量内存限流（演示用，生产可换 Redis）。按 identity 分桶。
interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

function identityKey(req: Request): string {
  const auth = (req as any).user;
  if (auth?.id) return `u:${auth.id}`;
  const guest = (req as any).guestKey;
  if (guest) return `g:${guest}`;
  return req.ip || 'anon';
}

export function rateLimit(options: {
  name: string;
  limit: number;
  windowSeconds: number;
  failClosed?: boolean;
  key?: (req: Request) => string;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = options.key?.(req) ?? `${options.name}:${identityKey(req)}`;
      const now = Date.now();
      const bucket = buckets.get(id);
      if (!bucket || bucket.resetAt <= now) {
        buckets.set(id, { count: 1, resetAt: now + options.windowSeconds * 1000 });
        return next();
      }
      if (bucket.count >= options.limit) {
        return res.status(429).json({ code: 'RATE_LIMITED' });
      }
      bucket.count += 1;
      next();
    } catch {
      if (options.failClosed) return res.status(503).json({ code: 'RATE_LIMIT_UNAVAILABLE' });
      next();
    }
  };
}
