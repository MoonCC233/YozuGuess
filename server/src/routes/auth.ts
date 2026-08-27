import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { get, run, insertReturningId } from '../db.js';
import {
  clearAuthCookies,
  ensureGuestCookie,
  requireAuth,
  setAuthCookies,
  refreshAuthCookies,
  restoreAuthSession,
  invalidateAuthUser,
  userNameFromUsername,
} from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { hashPassword, verifyPassword } from '../services/password.js';

const router = Router();

const USERNAME_PATTERN = /^[\w一-龥-]{2,20}$/;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+$/;

function publicUser(u: { id: number; username: string; role: 'user' | 'admin'; email?: string | null; emailVerified?: boolean }) {
  return {
    id: u.id,
    username: u.username,
    displayId: userNameFromUsername(u.username),
    role: u.role,
    email: u.email ?? null,
    emailVerified: Boolean(u.emailVerified),
  };
}

const credentialsSchema = z.object({
  username: z.string().min(2).max(20),
  password: z.string().min(8).max(128),
});

const registerSchema = credentialsSchema.extend({
  email: z.string().email().max(320).optional().or(z.literal('')),
});

// 注册
router.post(
  '/register',
  rateLimit({ name: 'register', limit: 10, windowSeconds: 60, failClosed: true }),
  async (req: Request, res: Response) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ code: 'INVALID_BODY' });
    const { username, password } = parsed.data;
    const email = parsed.data.email || null;
    if (!USERNAME_PATTERN.test(username)) return res.status(400).json({ code: 'USERNAME_INVALID' });
    if (await get('SELECT id FROM users WHERE username = ?', [username])) {
      return res.status(409).json({ code: 'USERNAME_TAKEN' });
    }
    if (email && !EMAIL_PATTERN.test(email)) return res.status(400).json({ code: 'EMAIL_INVALID' });
    if (email && (await get('SELECT id FROM users WHERE email = ?', [email]))) {
      return res.status(409).json({ code: 'EMAIL_TAKEN' });
    }
    const id = await insertReturningId(
      `INSERT INTO users (username, display_id, password_hash, role, email)
       VALUES (?, ?, ?, 'user', ?)`,
      [username, userNameFromUsername(username), await hashPassword(password), email]
    );
    const user = { id: Number(id), username, role: 'user' as const, token_version: 0, email, emailVerified: false };
    setAuthCookies(res, user);
    res.json({ user: publicUser(user) });
  }
);

// 登录
router.post(
  '/login',
  rateLimit({
    name: 'login',
    limit: 5,
    windowSeconds: 60,
    failClosed: true,
    key: (req) => `${req.ip}:${String((req.body as any)?.username ?? '').toLowerCase()}`,
  }),
  async (req: Request, res: Response) => {
    const parsed = credentialsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ code: 'INVALID_BODY' });
    const { username, password } = parsed.data;
    const row = await get('SELECT * FROM users WHERE username = ?', [username]);
    if (!row || !(await verifyPassword(password, row.password_hash))) {
      return res.status(401).json({ code: 'INVALID_CREDENTIALS' });
    }
    if (row.banned_at) return res.status(403).json({ code: 'USER_BANNED' });
    const user = {
      id: row.id,
      username: row.username,
      role: row.role,
      token_version: Number(row.token_version),
      email: row.email,
      emailVerified: Boolean(row.email && row.email_verified_at),
    };
    setAuthCookies(res, user);
    res.json({ user: publicUser(user) });
  }
);

// 当前会话
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser((req as any).user) });
});

// 刷新（access 过期时用 refresh 续期）
router.post(
  '/refresh',
  rateLimit({ name: 'auth-refresh', limit: 60, windowSeconds: 60, failClosed: true }),
  async (req, res) => {
    const user = await refreshAuthCookies(req.headers.cookie, res);
    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json({ code: 'AUTH_REQUIRED' });
    }
    res.json({ user: publicUser(user) });
  }
);

// 会话探测（未登录则下发访客 cookie）
router.post(
  '/session',
  rateLimit({ name: 'session', limit: 60, windowSeconds: 60, failClosed: true }),
  async (req, res) => {
    const user = await restoreAuthSession(req.headers.cookie, res);
    if (user) return res.json({ authenticated: true, user: publicUser(user) });
    const guest = ensureGuestCookie(req, res);
    res.json({ authenticated: false, guest: { name: guest.name } });
  }
);

// 登出
router.post('/logout', requireAuth, (req, res) => {
  void invalidateAuthUser((req as any).user.id).catch(() => undefined);
  clearAuthCookies(res);
  res.json({ ok: true });
});

// 登录后认领匿名期间的对局记录
router.post('/claim', requireAuth, async (req, res) => {
  const guestKey = (req as any).guestKey as string | undefined;
  if (!guestKey) return res.json({ claimed: 0 });
  const { changes } = await run(
    'UPDATE results SET user_id = ?, guest_key = NULL WHERE guest_key = ?',
    [(req as any).user.id, guestKey]
  );
  res.json({ claimed: Number(changes) });
});

export default router;
