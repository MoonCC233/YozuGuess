import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { authenticate, type User } from './accounts.js';
import { config } from './config.js';

export const AUTH_COOKIE = 'yozu_session';

/** 极简 cookie 解析，只为读一个会话 cookie，不值得引入 cookie-parser */
export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq <= 0) continue;
    const name = part.slice(0, eq).trim();
    if (name === '' || name in out) continue;
    const raw = part.slice(eq + 1).trim();
    try {
      out[name] = decodeURIComponent(raw);
    } catch {
      out[name] = raw;
    }
  }
  return out;
}

export function readSessionToken(header: string | undefined): string | undefined {
  const token = parseCookies(header)[AUTH_COOKIE];
  return token === '' ? undefined : token;
}

/** 会话 cookie：httpOnly 防脚本读取，SameSite=Lax 防跨站携带 */
export function setSessionCookie(res: Response, token: string, expiresAt: number): void {
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.authCookieSecure,
    expires: new Date(expiresAt),
    path: '/',
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.authCookieSecure,
    path: '/',
  });
}

declare global {
  namespace Express {
    interface Request {
      /** 由 attachUser 填充；未登录时为 null */
      user?: User | null;
      sessionToken?: string | undefined;
    }
  }
}

/** 解析会话但不强制登录，供可选登录的接口使用 */
export const attachUser: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  const token = readSessionToken(req.headers.cookie);
  req.sessionToken = token;
  req.user = authenticate(token);
  next();
};

/** 强制登录，未登录直接 401 */
export const requireUser: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({ code: 'UNAUTHORIZED' });
    return;
  }
  next();
};
