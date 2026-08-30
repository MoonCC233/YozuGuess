import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { consume, rateLimit, resetRateLimits } from './rateLimit.js';
import { createApp } from './app.js';

beforeEach(() => {
  resetRateLimits();
});

describe('consume', () => {
  it('allows up to the limit then blocks within the window', () => {
    expect(consume('t', 'a', 2, 1000).allowed).toBe(true);
    expect(consume('t', 'a', 2, 1000).allowed).toBe(true);
    const third = consume('t', 'a', 2, 1000);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterMs).toBeGreaterThan(0);
  });

  it('isolates buckets by name and identity', () => {
    consume('t', 'a', 1, 1000);
    expect(consume('t', 'b', 1, 1000).allowed).toBe(true);
    expect(consume('other', 'a', 1, 1000).allowed).toBe(true);
  });

  it('refills after the window elapses', () => {
    expect(consume('t', 'a', 1, 1).allowed).toBe(true);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(consume('t', 'a', 1, 1).allowed).toBe(true);
        resolve();
      }, 5);
    });
  });
});

describe('rateLimit middleware', () => {
  it('returns 429 with RATE_LIMITED once exhausted', async () => {
    const app = express();
    app.get('/ping', rateLimit({ name: 'ping', limit: 1, windowMs: 60_000 }), (_req, res) => {
      res.json({ ok: true });
    });
    const first = await request(app).get('/ping').expect(200);
    expect(first.headers['x-ratelimit-limit']).toBe('1');
    expect(first.headers['x-ratelimit-remaining']).toBe('0');
    const second = await request(app).get('/ping').expect(429, { code: 'RATE_LIMITED' });
    expect(second.headers['retry-after']).toBeDefined();
  });
});

describe('security headers', () => {
  it('sets hardening headers and drops X-Powered-By', async () => {
    const res = await request(createApp()).get('/api/health').expect(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['referrer-policy']).toBe('no-referrer');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
