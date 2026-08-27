import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtSecret, cookieDomain, isProduction, isPostgres } from '../config.js';
import { get, run } from '../db.js';
import { guestNameFromKey, userNameFromUsername } from '../services/identityDisplay.js';

export { guestNameFromKey, userNameFromUsername } from '../services/identityDisplay.js';

const AUTH_COOKIE = 'yozu_session';
const REFRESH_COOKIE = 'yozu_refresh';
const GUEST_COOKIE = 'yozu_guest';
const AUTH_MAX_AGE_MS = 12 * 60 * 60 * 1000;
const REFRESH_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const GUEST_MAX_AGE_MS = 3 * 365 * 24 * 60 * 60 * 1000;

interface AuthUser {
  id: number;
  username: string;
  role: 'user' | 'admin';
  email: string | null;
  emailVerified: boolean;
  token_version: number;
}

interface GuestIdentity {
  key: string;
  name: string;
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isProduction,
    domain: cookieDomain,
    maxAge,
    path: '/',
  };
}

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    out[k] = decodeURIComponent(v);
  }
  return out;
}

function signToken(payload: object, expiresIn: string | number): string {
  return jwt.sign(payload, jwtSecret, { algorithm: 'HS256', expiresIn: expiresIn as any });
}

function signGuestToken(key: string): string {
  return signToken({ key, typ: 'guest' }, GUEST_MAX_AGE_MS);
}

function verifyGuestToken(token: string | undefined): GuestIdentity | null {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] }) as any;
    if (decoded.typ !== 'guest' || typeof decoded.key !== 'string') return null;
    return { key: decoded.key, name: guestNameFromKey(decoded.key) };
  } catch {
    return null;
  }
}

export function getGuestFromCookie(cookieHeader: string | undefined): GuestIdentity | null {
  const cookies = parseCookies(cookieHeader);
  return verifyGuestToken(cookies[GUEST_COOKIE]);
}

export function ensureGuestCookie(req: Request, res: Response): GuestIdentity {
  const existing = getGuestFromCookie(req.headers.cookie);
  if (existing) return existing;
  const key = crypto.randomUUID();
  const guest: GuestIdentity = { key, name: guestNameFromKey(key) };
  res.cookie(GUEST_COOKIE, signGuestToken(key), cookieOptions(GUEST_MAX_AGE_MS));
  return guest;
}

export function clearGuestCookie(res: Response): void {
  res.clearCookie(GUEST_COOKIE, { ...cookieOptions(0), maxAge: undefined });
}

export function hasAuthSessionCookie(cookieHeader: string | undefined): boolean {
  return Boolean(parseCookies(cookieHeader)[AUTH_COOKIE]);
}

async function resolveUser(userId: number, tokenVersion: number): Promise<AuthUser | null> {
  const row = await get('SELECT * FROM users WHERE id = ?', [userId]);
  if (!row) return null;
  if (Number(row.token_version) !== Number(tokenVersion)) return null;
  if (row.banned_at) return null;
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    email: row.email ?? null,
    emailVerified: Boolean(row.email && row.email_verified_at),
    token_version: Number(row.token_version),
  };
}

export async function authenticateCookie(cookieHeader: string | undefined): Promise<AuthUser | null> {
  const token = parseCookies(cookieHeader)[AUTH_COOKIE];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] }) as any;
    if (decoded.typ !== 'auth') return null;
    return resolveUser(Number(decoded.sub), Number(decoded.ver));
  } catch {
    return null;
  }
}

export async function refreshAuthCookies(cookieHeader: string | undefined, res: Response): Promise<AuthUser | null> {
  const token = parseCookies(cookieHeader)[REFRESH_COOKIE];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] }) as any;
    if (decoded.typ !== 'refresh') return null;
    const user = await resolveUser(Number(decoded.sub), Number(decoded.ver));
    if (!user) return null;
    setAuthCookies(res, user);
    return user;
  } catch {
    return null;
  }
}

export async function restoreAuthSession(cookieHeader: string | undefined, res: Response): Promise<AuthUser | null> {
  const user = await authenticateCookie(cookieHeader);
  if (user) return user;
  return refreshAuthCookies(cookieHeader, res);
}

export function setAuthCookies(res: Response, user: AuthUser): void {
  const authToken = signToken({ sub: String(user.id), ver: user.token_version, typ: 'auth' }, AUTH_MAX_AGE_MS);
  const refreshToken = signToken({ sub: String(user.id), ver: user.token_version, typ: 'refresh' }, REFRESH_MAX_AGE_MS);
  res.cookie(AUTH_COOKIE, authToken, cookieOptions(AUTH_MAX_AGE_MS));
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions(REFRESH_MAX_AGE_MS));
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(AUTH_COOKIE, { ...cookieOptions(0), maxAge: undefined });
  res.clearCookie(REFRESH_COOKIE, { ...cookieOptions(0), maxAge: undefined });
}

export async function invalidateAuthUser(userId: number): Promise<void> {
  // 通过 token_version 递增使所有已签发令牌失效
  await run('UPDATE users SET token_version = token_version + 1 WHERE id = ?', [userId]);
}

async function isGuestBanned(key: string): Promise<boolean> {
  const row = await get('SELECT banned_at FROM guest_accounts WHERE guest_key = ?', [key]);
  return Boolean(row?.banned_at);
}

async function attachIdentity(req: Request, res: Response): Promise<'authenticated' | 'guest' | 'expired' | 'banned'> {
  const user = await restoreAuthSession(req.headers.cookie, res);
  if (user) {
    (req as any).user = user;
  } else if (req.headers['x-auth-expected'] === '1' || hasAuthSessionCookie(req.headers.cookie)) {
    return 'expired';
  }
  const guest = user ? getGuestFromCookie(req.headers.cookie) : ensureGuestCookie(req, res);
  if (!guest) return user ? 'authenticated' : 'guest';
  if (await isGuestBanned(guest.key)) return 'banned';
  (req as any).guestKey = guest.key;
  (req as any).guestName = guest.name;
  if (!user) {
    void run(
      `INSERT INTO guest_accounts (guest_key, display_id, last_seen_at)
       VALUES (?, ?, ${isPostgres ? 'now()' : 'CURRENT_TIMESTAMP'})
       ON CONFLICT(guest_key) DO UPDATE SET last_seen_at = ${isPostgres ? 'now()' : 'CURRENT_TIMESTAMP'}`,
      [guest.key, guest.name]
    ).catch(() => undefined);
  }
  return user ? 'authenticated' : 'guest';
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  void attachIdentity(req, res).then((result) => {
    if (result === 'expired') return res.status(401).json({ code: 'AUTH_EXPIRED' });
    if (result === 'banned') return res.status(403).json({ code: 'USER_BANNED' });
    next();
  }, next);
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  void attachIdentity(req, res).then((result) => {
    if (result === 'banned') return res.status(403).json({ code: 'USER_BANNED' });
    if (!(req as any).user) {
      return res.status(401).json({ code: result === 'expired' ? 'AUTH_EXPIRED' : 'AUTH_REQUIRED' });
    }
    next();
  }, next);
}
