import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import {
  CHARACTERS,
  GAME_TITLES,
  MAX_GUESSES,
  getAnswerPool,
  getCvAliases,
  searchCharacters,
  type Character,
} from '@yozu/shared';
import { getGame, revealAnswer, startGame, submitGuess } from './gameStore.js';
import { rateLimit } from './rateLimit.js';
import { config } from './config.js';
import {
  changePassword,
  changeUsername,
  getHistory,
  getLeaderboard,
  getStats,
  login,
  logout,
  register,
  type AccountErrorCode,
  type User,
} from './accounts.js';
import { attachUser, clearSessionCookie, requireUser, setSessionCookie } from './auth.js';

const readLimit = rateLimit({
  name: 'read',
  limit: config.readRateLimit,
  windowMs: config.rateLimitWindowMs,
});
const writeLimit = rateLimit({
  name: 'write',
  limit: config.writeRateLimit,
  windowMs: config.rateLimitWindowMs,
});

const startSchema = z.object({
  mode: z.enum(['free', 'daily']).default('free'),
  difficulty: z.enum(['heroine', 'full']).default('heroine'),
});

const guessSchema = z.object({
  sessionId: z.string().min(1),
  characterId: z.number().int().positive(),
});

const sessionSchema = z.object({
  sessionId: z.string().min(1),
});

const credentialsSchema = z.object({
  username: z.string().min(1).max(32),
  password: z.string().min(1).max(128),
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(1).max(128),
});

const usernameChangeSchema = z.object({
  username: z.string().min(1).max(32),
});

/** 账号接口配额单独收紧，避免被拿来撞库 */
const authLimit = rateLimit({
  name: 'auth',
  limit: config.authRateLimit,
  windowMs: config.rateLimitWindowMs,
});

/** 账号错误码到 HTTP 状态码的映射 */
const ACCOUNT_STATUS: Record<AccountErrorCode, number> = {
  INVALID_CREDENTIALS: 401,
  USERNAME_TAKEN: 409,
  USERNAME_INVALID: 400,
  PASSWORD_WEAK: 400,
  UNAUTHORIZED: 401,
};

function publicUser(user: User): { id: number; username: string; createdAt: number; lastLoginAt: number | null } {
  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}

/** 猜测列表用的精简角色（不含发色/瞳色等答案属性，避免直接查表作弊） */
function toListItem(c: Character): { id: number; name: string; nameJp: string } {
  return { id: c.id, name: c.name, nameJp: c.nameJp };
}

export const api: ExpressRouter = Router();

// 所有接口都先解析会话，登录态是可选的：未登录也能正常玩，只是不记战绩
api.use(attachUser);

api.get('/health', (_req, res) => {
  res.json({ ok: true });
});

api.get('/meta', readLimit, (_req, res) => {
  res.json({
    maxGuesses: MAX_GUESSES,
    titles: GAME_TITLES,
    poolSizes: {
      heroine: getAnswerPool('heroine').length,
      full: getAnswerPool('full').length,
    },
    totalCharacters: CHARACTERS.length,
  });
});

api.get('/characters', readLimit, (_req, res) => {
  res.json({ characters: CHARACTERS.map(toListItem) });
});

api.get('/characters/search', readLimit, (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q : '';
  res.json({ characters: searchCharacters(q).map(toListItem) });
});

/** 图鉴：完整角色资料，供玩家查阅（不涉及进行中的对局） */
api.get('/codex', readLimit, (_req, res) => {
  res.json({
    characters: CHARACTERS.map((c) => ({ ...c, cvAliases: getCvAliases(c.cv) })),
    titles: GAME_TITLES,
  });
});

api.post('/game/start', writeLimit, (req, res) => {
  const parsed = startSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ code: 'INVALID_PAYLOAD' });
    return;
  }
  const state = startGame(parsed.data.mode, parsed.data.difficulty, req.user?.id ?? null);
  res.status(201).json({ state });
});

api.get('/game/:sessionId', readLimit, (req, res) => {
  const sessionId = String(req.params.sessionId ?? '');
  const state = getGame(sessionId);
  if (!state) {
    res.status(404).json({ code: 'SESSION_NOT_FOUND' });
    return;
  }
  res.json({ state });
});

api.post('/game/guess', writeLimit, (req, res) => {
  const parsed = guessSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ code: 'INVALID_PAYLOAD' });
    return;
  }
  const result = submitGuess(parsed.data.sessionId, parsed.data.characterId);
  if (!result.ok) {
    res.status(result.error === 'SESSION_NOT_FOUND' ? 404 : 400).json({ code: result.error });
    return;
  }
  res.json({ state: result.state, feedback: result.feedback });
});

api.post('/game/reveal', writeLimit, (req, res) => {
  const parsed = sessionSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ code: 'INVALID_PAYLOAD' });
    return;
  }
  const result = revealAnswer(parsed.data.sessionId);
  if (!result.ok) {
    res.status(404).json({ code: result.error });
    return;
  }
  res.json({ state: result.state });
});

/* --------------------------------- 账号 --------------------------------- */

api.post('/auth/register', authLimit, (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ code: 'INVALID_PAYLOAD' });
    return;
  }
  const created = register(parsed.data.username, parsed.data.password);
  if (!created.ok) {
    res.status(ACCOUNT_STATUS[created.error]).json({ code: created.error });
    return;
  }
  setSessionCookie(res, created.value.token, created.value.expiresAt);
  res.status(201).json({ user: publicUser(created.value.user) });
});

api.post('/auth/login', authLimit, (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ code: 'INVALID_PAYLOAD' });
    return;
  }
  const session = login(parsed.data.username, parsed.data.password);
  if (!session.ok) {
    res.status(ACCOUNT_STATUS[session.error]).json({ code: session.error });
    return;
  }
  setSessionCookie(res, session.value.token, session.value.expiresAt);
  res.json({ user: publicUser(session.value.user) });
});

api.post('/auth/logout', (req, res) => {
  logout(req.sessionToken);
  clearSessionCookie(res);
  res.json({ ok: true });
});

api.get('/auth/me', readLimit, (req, res) => {
  res.json({ user: req.user ? publicUser(req.user) : null });
});

api.post('/auth/password', authLimit, requireUser, (req, res) => {
  const parsed = passwordChangeSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ code: 'INVALID_PAYLOAD' });
    return;
  }
  const user = req.user!;
  const changed = changePassword(
    user.id,
    parsed.data.currentPassword,
    parsed.data.newPassword,
    req.sessionToken
  );
  if (!changed.ok) {
    res.status(ACCOUNT_STATUS[changed.error]).json({ code: changed.error });
    return;
  }
  res.json({ ok: true });
});

api.post('/auth/username', authLimit, requireUser, (req, res) => {
  const parsed = usernameChangeSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ code: 'INVALID_PAYLOAD' });
    return;
  }
  const renamed = changeUsername(req.user!.id, parsed.data.username);
  if (!renamed.ok) {
    res.status(ACCOUNT_STATUS[renamed.error]).json({ code: renamed.error });
    return;
  }
  res.json({ user: publicUser(renamed.value) });
});

api.get('/me/stats', readLimit, requireUser, (req, res) => {
  res.json({ stats: getStats(req.user!.id, MAX_GUESSES) });
});

api.get('/me/history', readLimit, requireUser, (req, res) => {
  const raw = Number(req.query.limit ?? 20);
  const limit = Number.isFinite(raw) ? raw : 20;
  res.json(getHistory(req.user!.id, limit));
});

api.get('/leaderboard', readLimit, (req, res) => {
  const raw = Number(req.query.limit ?? 10);
  const limit = Number.isFinite(raw) ? raw : 10;
  res.json({ entries: getLeaderboard(limit) });
});
