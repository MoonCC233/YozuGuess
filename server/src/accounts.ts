import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { BoType, Difficulty, MatchEndReason, RoundEndReason } from '@yozu/shared';
import { getDb } from './db.js';
import { config } from './config.js';

export type AccountErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'USERNAME_TAKEN'
  | 'USERNAME_INVALID'
  | 'PASSWORD_WEAK'
  | 'UNAUTHORIZED';

export type AccountResult<T> = { ok: true; value: T } | { ok: false; error: AccountErrorCode };

export interface User {
  id: number;
  username: string;
  createdAt: number;
  lastLoginAt: number | null;
}

export interface AuthSession {
  token: string;
  user: User;
  expiresAt: number;
}

const USERNAME_RE = /^[\p{L}\p{N}_-]{2,16}$/u;
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 128;
const SCRYPT_KEYLEN = 64;
/** scrypt 参数写进哈希串，将来调高成本也能校验旧密码 */
const SCRYPT_COST = { N: 16384, r: 8, p: 1 } as const;

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN, { ...SCRYPT_COST });
  return `scrypt$${SCRYPT_COST.N}$${SCRYPT_COST.r}$${SCRYPT_COST.p}$${salt.toString('base64')}$${derived.toString('base64')}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, nRaw, rRaw, pRaw, saltRaw, hashRaw] = parts;
  const N = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
  let expected: Buffer;
  try {
    expected = Buffer.from(hashRaw!, 'base64');
  } catch {
    return false;
  }
  const salt = Buffer.from(saltRaw!, 'base64');
  let derived: Buffer;
  try {
    derived = scryptSync(password, salt, expected.length, { N, r, p });
  } catch {
    return false;
  }
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

/** 只把 token 的摘要写进库，库被读到也无法冒充登录 */
function tokenId(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  created_at: number;
  last_login_at: number | null;
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
  };
}

function db(): DatabaseSync {
  return getDb();
}

function findUserRow(username: string): UserRow | undefined {
  return db()
    .prepare('SELECT id, username, password_hash, created_at, last_login_at FROM users WHERE username_lower = ?')
    .get(username.toLowerCase()) as UserRow | undefined;
}

export function getUserById(id: number): User | null {
  const row = db()
    .prepare('SELECT id, username, password_hash, created_at, last_login_at FROM users WHERE id = ?')
    .get(id) as UserRow | undefined;
  return row ? toUser(row) : null;
}

function issueSession(userId: number, now = Date.now()): { token: string; expiresAt: number } {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = now + config.authSessionTtlMs;
  db()
    .prepare(
      'INSERT INTO auth_sessions (id, user_id, created_at, expires_at, last_seen_at) VALUES (?, ?, ?, ?, ?)'
    )
    .run(tokenId(token), userId, now, expiresAt, now);
  return { token, expiresAt };
}

/** 清掉过期会话，登录与鉴权时顺手调用 */
export function sweepSessions(now = Date.now()): number {
  const info = db().prepare('DELETE FROM auth_sessions WHERE expires_at <= ?').run(now);
  return Number(info.changes);
}

export function register(username: string, password: string): AccountResult<AuthSession> {
  const name = username.trim();
  if (!USERNAME_RE.test(name)) return { ok: false, error: 'USERNAME_INVALID' };
  if (password.length < MIN_PASSWORD || password.length > MAX_PASSWORD) {
    return { ok: false, error: 'PASSWORD_WEAK' };
  }
  if (findUserRow(name)) return { ok: false, error: 'USERNAME_TAKEN' };

  const now = Date.now();
  let userId: number;
  try {
    const info = db()
      .prepare(
        'INSERT INTO users (username, username_lower, password_hash, created_at, last_login_at) VALUES (?, ?, ?, ?, ?)'
      )
      .run(name, name.toLowerCase(), hashPassword(password), now, now);
    userId = Number(info.lastInsertRowid);
  } catch {
    // 唯一索引兜住并发注册同名的竞态
    return { ok: false, error: 'USERNAME_TAKEN' };
  }
  const { token, expiresAt } = issueSession(userId, now);
  const user = getUserById(userId);
  if (!user) return { ok: false, error: 'INVALID_CREDENTIALS' };
  return { ok: true, value: { token, user, expiresAt } };
}

export function login(username: string, password: string): AccountResult<AuthSession> {
  const row = findUserRow(username.trim());
  if (!row || !verifyPassword(password, row.password_hash)) {
    return { ok: false, error: 'INVALID_CREDENTIALS' };
  }
  sweepSessions();
  const now = Date.now();
  db().prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(now, row.id);
  const { token, expiresAt } = issueSession(row.id, now);
  return { ok: true, value: { token, user: toUser({ ...row, last_login_at: now }), expiresAt } };
}

/** 校验会话 token，顺带续期 last_seen_at */
export function authenticate(token: string | undefined): User | null {
  if (!token) return null;
  const now = Date.now();
  const row = db()
    .prepare('SELECT user_id, expires_at FROM auth_sessions WHERE id = ?')
    .get(tokenId(token)) as { user_id: number; expires_at: number } | undefined;
  if (!row) return null;
  if (row.expires_at <= now) {
    db().prepare('DELETE FROM auth_sessions WHERE id = ?').run(tokenId(token));
    return null;
  }
  db().prepare('UPDATE auth_sessions SET last_seen_at = ? WHERE id = ?').run(now, tokenId(token));
  return getUserById(row.user_id);
}

export function logout(token: string | undefined): void {
  if (!token) return;
  db().prepare('DELETE FROM auth_sessions WHERE id = ?').run(tokenId(token));
}

/** 改密后吊销其他所有会话，只留当前这一个 */
export function changePassword(
  userId: number,
  currentPassword: string,
  nextPassword: string,
  keepToken?: string
): AccountResult<true> {
  const row = db()
    .prepare('SELECT id, username, password_hash, created_at, last_login_at FROM users WHERE id = ?')
    .get(userId) as UserRow | undefined;
  if (!row) return { ok: false, error: 'UNAUTHORIZED' };
  if (!verifyPassword(currentPassword, row.password_hash)) {
    return { ok: false, error: 'INVALID_CREDENTIALS' };
  }
  if (nextPassword.length < MIN_PASSWORD || nextPassword.length > MAX_PASSWORD) {
    return { ok: false, error: 'PASSWORD_WEAK' };
  }
  db().prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(nextPassword), userId);
  if (keepToken) {
    db().prepare('DELETE FROM auth_sessions WHERE user_id = ? AND id != ?').run(userId, tokenId(keepToken));
  } else {
    db().prepare('DELETE FROM auth_sessions WHERE user_id = ?').run(userId);
  }
  return { ok: true, value: true };
}

/** 改名：登录用的就是这个用户名，所以要过同样的格式与重名校验 */
export function changeUsername(userId: number, nextUsername: string): AccountResult<User> {
  const name = nextUsername.trim();
  if (!USERNAME_RE.test(name)) return { ok: false, error: 'USERNAME_INVALID' };
  const current = getUserById(userId);
  if (!current) return { ok: false, error: 'UNAUTHORIZED' };
  // 只改大小写属于同一个名字，放行；否则撞到别人就拒绝
  const existing = findUserRow(name);
  if (existing && existing.id !== userId) return { ok: false, error: 'USERNAME_TAKEN' };
  if (existing === undefined && name.toLowerCase() === current.username.toLowerCase()) {
    // 理论上不会走到（自己肯定查得到），留个兜底
    return { ok: true, value: current };
  }
  try {
    db()
      .prepare('UPDATE users SET username = ?, username_lower = ? WHERE id = ?')
      .run(name, name.toLowerCase(), userId);
  } catch {
    return { ok: false, error: 'USERNAME_TAKEN' };
  }
  const updated = getUserById(userId);
  return updated ? { ok: true, value: updated } : { ok: false, error: 'UNAUTHORIZED' };
}

/* ------------------------------- 战绩记录 ------------------------------- */

export type SoloOutcome = 'won' | 'lost' | 'revealed';

export interface SoloRecordInput {
  userId: number;
  mode: 'free' | 'daily';
  difficulty: Difficulty;
  status: SoloOutcome;
  guessCount: number;
  answerId: number;
  answerName: string;
  durationMs: number;
  dateKey: string | null;
}

/** 记录一局单人成绩；每日一柚每人每天只记第一次，重复调用直接忽略 */
export function recordSoloGame(input: SoloRecordInput): boolean {
  try {
    const info = db()
      .prepare(
        `INSERT INTO game_records
           (user_id, mode, difficulty, status, guess_count, answer_id, answer_name, duration_ms, date_key, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT DO NOTHING`
      )
      .run(
        input.userId,
        input.mode,
        input.difficulty,
        input.status,
        input.guessCount,
        input.answerId,
        input.answerName,
        input.durationMs,
        input.dateKey,
        Date.now()
      );
    return Number(info.changes) > 0;
  } catch {
    return false;
  }
}

export type MatchOutcome = 'won' | 'lost' | 'draw';

export interface MatchRecordInput {
  userId: number;
  roomCode: string;
  boType: BoType;
  difficulty: Difficulty;
  result: MatchOutcome;
  ownScore: number;
  rivalScore: number;
  opponents: string[];
  reason: MatchEndReason | RoundEndReason;
}

export function recordMatch(input: MatchRecordInput): boolean {
  try {
    const info = db()
      .prepare(
        `INSERT INTO match_records
           (user_id, room_code, bo_type, difficulty, result, own_score, rival_score, opponents, reason, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        input.userId,
        input.roomCode,
        input.boType,
        input.difficulty,
        input.result,
        input.ownScore,
        input.rivalScore,
        JSON.stringify(input.opponents),
        input.reason,
        Date.now()
      );
    return Number(info.changes) > 0;
  } catch {
    return false;
  }
}

export interface SoloStats {
  played: number;
  won: number;
  winRate: number;
  /** 猜中局的平均猜测次数，没有猜中局时为 null */
  avgGuesses: number | null;
  bestGuesses: number | null;
  currentStreak: number;
  bestStreak: number;
  /** 猜中局按猜测次数的分布，下标 0 表示 1 次猜中 */
  distribution: number[];
}

export interface MatchStats {
  played: number;
  won: number;
  lost: number;
  draw: number;
  winRate: number;
}

export interface AccountStats {
  solo: SoloStats;
  daily: SoloStats;
  match: MatchStats;
}

interface SoloRow {
  mode: string;
  status: string;
  guess_count: number;
  created_at: number;
}

function soloStats(rows: SoloRow[], maxGuesses: number): SoloStats {
  const played = rows.length;
  const wins = rows.filter((r) => r.status === 'won');
  const distribution = Array.from({ length: maxGuesses }, () => 0);
  for (const w of wins) {
    const idx = Math.min(Math.max(w.guess_count, 1), maxGuesses) - 1;
    distribution[idx] = (distribution[idx] ?? 0) + 1;
  }
  // rows 按时间倒序传入：从最近一局往前数连胜
  let currentStreak = 0;
  for (const row of rows) {
    if (row.status !== 'won') break;
    currentStreak += 1;
  }
  let bestStreak = 0;
  let running = 0;
  for (const row of [...rows].reverse()) {
    if (row.status === 'won') {
      running += 1;
      bestStreak = Math.max(bestStreak, running);
    } else {
      running = 0;
    }
  }
  const totalGuesses = wins.reduce((sum, w) => sum + w.guess_count, 0);
  return {
    played,
    won: wins.length,
    winRate: played === 0 ? 0 : Math.round((wins.length / played) * 1000) / 1000,
    avgGuesses: wins.length === 0 ? null : Math.round((totalGuesses / wins.length) * 100) / 100,
    bestGuesses: wins.length === 0 ? null : Math.min(...wins.map((w) => w.guess_count)),
    currentStreak,
    bestStreak,
    distribution,
  };
}

export function getStats(userId: number, maxGuesses: number): AccountStats {
  const rows = db()
    .prepare('SELECT mode, status, guess_count, created_at FROM game_records WHERE user_id = ? ORDER BY created_at DESC, id DESC')
    .all(userId) as unknown as SoloRow[];
  const matchRows = db()
    .prepare('SELECT result FROM match_records WHERE user_id = ?')
    .all(userId) as unknown as Array<{ result: string }>;
  const won = matchRows.filter((r) => r.result === 'won').length;
  const lost = matchRows.filter((r) => r.result === 'lost').length;
  const draw = matchRows.filter((r) => r.result === 'draw').length;
  return {
    solo: soloStats(rows, maxGuesses),
    daily: soloStats(
      rows.filter((r) => r.mode === 'daily'),
      maxGuesses
    ),
    match: {
      played: matchRows.length,
      won,
      lost,
      draw,
      winRate: matchRows.length === 0 ? 0 : Math.round((won / matchRows.length) * 1000) / 1000,
    },
  };
}

export interface SoloHistoryItem {
  id: number;
  mode: 'free' | 'daily';
  difficulty: Difficulty;
  status: SoloOutcome;
  guessCount: number;
  answerId: number;
  answerName: string;
  durationMs: number;
  dateKey: string | null;
  createdAt: number;
}

export interface MatchHistoryItem {
  id: number;
  roomCode: string;
  boType: number;
  difficulty: Difficulty;
  result: MatchOutcome;
  ownScore: number;
  rivalScore: number;
  opponents: string[];
  reason: string;
  createdAt: number;
}

function parseOpponents(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

export function getHistory(
  userId: number,
  limit = 20
): { games: SoloHistoryItem[]; matches: MatchHistoryItem[] } {
  const capped = Math.min(Math.max(Math.trunc(limit), 1), 100);
  const games = (
    db()
      .prepare(
        `SELECT id, mode, difficulty, status, guess_count, answer_id, answer_name, duration_ms, date_key, created_at
         FROM game_records WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ?`
      )
      .all(userId, capped) as unknown as Array<{
      id: number;
      mode: SoloHistoryItem['mode'];
      difficulty: SoloHistoryItem['difficulty'];
      status: SoloOutcome;
      guess_count: number;
      answer_id: number;
      answer_name: string;
      duration_ms: number;
      date_key: string | null;
      created_at: number;
    }>
  ).map((r) => ({
    id: r.id,
    mode: r.mode,
    difficulty: r.difficulty,
    status: r.status,
    guessCount: r.guess_count,
    answerId: r.answer_id,
    answerName: r.answer_name,
    durationMs: r.duration_ms,
    dateKey: r.date_key,
    createdAt: r.created_at,
  }));
  const matches = (
    db()
      .prepare(
        `SELECT id, room_code, bo_type, difficulty, result, own_score, rival_score, opponents, reason, created_at
         FROM match_records WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ?`
      )
      .all(userId, capped) as unknown as Array<{
      id: number;
      room_code: string;
      bo_type: number;
      difficulty: MatchHistoryItem['difficulty'];
      result: MatchOutcome;
      own_score: number;
      rival_score: number;
      opponents: string;
      reason: string;
      created_at: number;
    }>
  ).map((r) => ({
    id: r.id,
    roomCode: r.room_code,
    boType: r.bo_type,
    difficulty: r.difficulty,
    result: r.result,
    ownScore: r.own_score,
    rivalScore: r.rival_score,
    opponents: parseOpponents(r.opponents),
    reason: r.reason,
    createdAt: r.created_at,
  }));
  return { games, matches };
}

/** 排行榜：按猜中局数排序，仅统计有战绩的用户 */
export interface LeaderboardEntry {
  username: string;
  won: number;
  played: number;
  avgGuesses: number | null;
}

export function getLeaderboard(limit = 10): LeaderboardEntry[] {
  const capped = Math.min(Math.max(Math.trunc(limit), 1), 50);
  return (
    db()
      .prepare(
        `SELECT u.username AS username,
                sum(CASE WHEN g.status = 'won' THEN 1 ELSE 0 END) AS won,
                count(*) AS played,
                avg(CASE WHEN g.status = 'won' THEN g.guess_count END) AS avg_guesses
         FROM game_records g JOIN users u ON u.id = g.user_id
         GROUP BY g.user_id
         HAVING won > 0
         ORDER BY won DESC, avg_guesses ASC
         LIMIT ?`
      )
      .all(capped) as unknown as Array<{
      username: string;
      won: number;
      played: number;
      avg_guesses: number | null;
    }>
  ).map((r) => ({
    username: r.username,
    won: Number(r.won),
    played: Number(r.played),
    avgGuesses: r.avg_guesses === null ? null : Math.round(Number(r.avg_guesses) * 100) / 100,
  }));
}
