import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MAX_GUESSES } from '@yozu/shared';
import { closeDatabase, useMemoryDatabase } from './db.js';
import {
  authenticate,
  changePassword,
  changeUsername,
  getHistory,
  getLeaderboard,
  getStats,
  getUserById,
  login,
  logout,
  recordMatch,
  recordSoloGame,
  register,
  sweepSessions,
} from './accounts.js';

beforeEach(() => {
  useMemoryDatabase();
});

afterEach(() => {
  closeDatabase();
});

function signUp(name = '柚子', password = 'hunter2hunter2'): { id: number; token: string } {
  const created = register(name, password);
  if (!created.ok) throw new Error(created.error);
  return { id: created.value.user.id, token: created.value.token };
}

function soloInput(over: Partial<Parameters<typeof recordSoloGame>[0]> = {}) {
  return {
    userId: 1,
    mode: 'free' as const,
    difficulty: 'easy' as const,
    status: 'won' as const,
    guessCount: 3,
    answerId: 1,
    answerName: '绫地宁宁',
    durationMs: 42_000,
    dateKey: null,
    ...over,
  };
}

describe('register', () => {
  it('creates a user and hands back a working session', () => {
    const created = register('柚子', 'hunter2hunter2');
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.value.user.username).toBe('柚子');
    expect(created.value.expiresAt).toBeGreaterThan(Date.now());
    expect(authenticate(created.value.token)?.id).toBe(created.value.user.id);
  });

  it('rejects a taken username regardless of case', () => {
    register('Yuzu', 'hunter2hunter2');
    const again = register('YUZU', 'hunter2hunter2');
    expect(again).toEqual({ ok: false, error: 'USERNAME_TAKEN' });
  });

  it.each(['', 'a', 'a'.repeat(17), 'bad name', 'nope!'])('rejects invalid username %j', (name) => {
    expect(register(name, 'hunter2hunter2')).toEqual({ ok: false, error: 'USERNAME_INVALID' });
  });

  it('rejects short passwords', () => {
    expect(register('柚子', 'short')).toEqual({ ok: false, error: 'PASSWORD_WEAK' });
  });

  it('never stores the password in clear text', () => {
    const db = useMemoryDatabase();
    register('柚子', 'hunter2hunter2');
    const row = db.prepare('SELECT password_hash FROM users WHERE id = 1').get() as { password_hash: string };
    expect(row.password_hash).not.toContain('hunter2hunter2');
    expect(row.password_hash.startsWith('scrypt$')).toBe(true);
  });
});

describe('login', () => {
  it('accepts the right password and updates last login', () => {
    signUp();
    const session = login('柚子', 'hunter2hunter2');
    expect(session.ok).toBe(true);
    if (!session.ok) return;
    expect(session.value.user.lastLoginAt).not.toBeNull();
  });

  it('is case-insensitive on the username', () => {
    signUp('Yuzu');
    expect(login('yUzU', 'hunter2hunter2').ok).toBe(true);
  });

  it('rejects a wrong password and an unknown user with the same error', () => {
    signUp();
    expect(login('柚子', 'wrongpassword')).toEqual({ ok: false, error: 'INVALID_CREDENTIALS' });
    expect(login('nobody', 'hunter2hunter2')).toEqual({ ok: false, error: 'INVALID_CREDENTIALS' });
  });

  it('issues independent sessions that can be revoked one at a time', () => {
    signUp();
    const a = login('柚子', 'hunter2hunter2');
    const b = login('柚子', 'hunter2hunter2');
    if (!a.ok || !b.ok) throw new Error('login failed');
    logout(a.value.token);
    expect(authenticate(a.value.token)).toBeNull();
    expect(authenticate(b.value.token)?.id).toBe(b.value.user.id);
  });
});

describe('authenticate', () => {
  it('rejects unknown, empty and expired tokens', () => {
    const { token } = signUp();
    expect(authenticate(undefined)).toBeNull();
    expect(authenticate('')).toBeNull();
    expect(authenticate('not-a-token')).toBeNull();
    const db = useMemoryDatabase();
    void db;
    expect(authenticate(token)).toBeNull();
  });

  it('drops a session once it expires', () => {
    const db = useMemoryDatabase();
    const { token } = signUp();
    db.prepare('UPDATE auth_sessions SET expires_at = ?').run(Date.now() - 1);
    expect(authenticate(token)).toBeNull();
    const left = db.prepare('SELECT count(*) AS n FROM auth_sessions').get() as { n: number };
    expect(left.n).toBe(0);
  });

  it('sweeps expired sessions in bulk', () => {
    const db = useMemoryDatabase();
    signUp('aa');
    signUp('bb');
    db.prepare('UPDATE auth_sessions SET expires_at = ?').run(Date.now() - 1);
    expect(sweepSessions()).toBe(2);
  });
});

describe('changePassword', () => {
  it('requires the current password', () => {
    const { id, token } = signUp();
    expect(changePassword(id, 'nope', 'brandnewpass', token)).toEqual({
      ok: false,
      error: 'INVALID_CREDENTIALS',
    });
  });

  it('rejects a weak replacement', () => {
    const { id, token } = signUp();
    expect(changePassword(id, 'hunter2hunter2', 'tiny', token)).toEqual({
      ok: false,
      error: 'PASSWORD_WEAK',
    });
  });

  it('switches the password and revokes the other sessions', () => {
    const { id, token } = signUp();
    const other = login('柚子', 'hunter2hunter2');
    if (!other.ok) throw new Error('login failed');
    const changed = changePassword(id, 'hunter2hunter2', 'brandnewpass', token);
    expect(changed.ok).toBe(true);
    expect(login('柚子', 'hunter2hunter2').ok).toBe(false);
    expect(login('柚子', 'brandnewpass').ok).toBe(true);
    expect(authenticate(token)?.id).toBe(id);
    expect(authenticate(other.value.token)).toBeNull();
  });
});

describe('changeUsername', () => {
  it('renames the account and lets the new name log in', () => {
    const { id, token } = signUp();
    const renamed = changeUsername(id, '新柚子');
    expect(renamed.ok).toBe(true);
    if (!renamed.ok) return;
    expect(renamed.value.username).toBe('新柚子');
    expect(getUserById(id)?.username).toBe('新柚子');
    expect(login('新柚子', 'hunter2hunter2').ok).toBe(true);
    expect(login('柚子', 'hunter2hunter2').ok).toBe(false);
    // 改名不该踢掉当前会话
    expect(authenticate(token)?.id).toBe(id);
  });

  it('allows a case-only change of your own name', () => {
    const created = register('Yuzu', 'hunter2hunter2');
    if (!created.ok) throw new Error(created.error);
    const renamed = changeUsername(created.value.user.id, 'YUZU');
    expect(renamed.ok).toBe(true);
    if (!renamed.ok) return;
    expect(renamed.value.username).toBe('YUZU');
  });

  it('rejects a name taken by someone else, ignoring case', () => {
    signUp('先来的');
    const { id } = signUp('后来的');
    expect(changeUsername(id, '先来的')).toEqual({ ok: false, error: 'USERNAME_TAKEN' });
  });

  it('rejects malformed names', () => {
    const { id } = signUp();
    expect(changeUsername(id, 'x')).toEqual({ ok: false, error: 'USERNAME_INVALID' });
    expect(changeUsername(id, '带 空格')).toEqual({ ok: false, error: 'USERNAME_INVALID' });
    expect(changeUsername(id, 'a'.repeat(17))).toEqual({ ok: false, error: 'USERNAME_INVALID' });
  });

  it('rejects an unknown user', () => {
    expect(changeUsername(9999, '幽灵')).toEqual({ ok: false, error: 'UNAUTHORIZED' });
  });

  it('shows the new name on the leaderboard', () => {
    const { id } = signUp('旧名');
    recordSoloGame(soloInput({ userId: id, status: 'won' }));
    expect(changeUsername(id, '新名').ok).toBe(true);
    expect(getLeaderboard().map((e) => e.username)).toEqual(['新名']);
  });
});

describe('solo records and stats', () => {
  it('starts empty', () => {
    const { id } = signUp();
    const stats = getStats(id, MAX_GUESSES);
    expect(stats.solo.played).toBe(0);
    expect(stats.solo.avgGuesses).toBeNull();
    expect(stats.solo.winRate).toBe(0);
    expect(stats.solo.distribution).toHaveLength(MAX_GUESSES);
  });

  it('aggregates wins, averages and the guess distribution', () => {
    const { id } = signUp();
    recordSoloGame(soloInput({ userId: id, guessCount: 2 }));
    recordSoloGame(soloInput({ userId: id, guessCount: 4 }));
    recordSoloGame(soloInput({ userId: id, status: 'lost', guessCount: MAX_GUESSES }));
    const stats = getStats(id, MAX_GUESSES);
    expect(stats.solo.played).toBe(3);
    expect(stats.solo.won).toBe(2);
    expect(stats.solo.winRate).toBeCloseTo(0.667, 3);
    expect(stats.solo.avgGuesses).toBe(3);
    expect(stats.solo.bestGuesses).toBe(2);
    expect(stats.solo.distribution[1]).toBe(1);
    expect(stats.solo.distribution[3]).toBe(1);
  });

  it('tracks the current and best win streaks', () => {
    const { id } = signUp();
    // 时间顺序：胜 胜 负 胜
    recordSoloGame(soloInput({ userId: id }));
    recordSoloGame(soloInput({ userId: id }));
    recordSoloGame(soloInput({ userId: id, status: 'lost' }));
    recordSoloGame(soloInput({ userId: id }));
    const stats = getStats(id, MAX_GUESSES);
    expect(stats.solo.currentStreak).toBe(1);
    expect(stats.solo.bestStreak).toBe(2);
  });

  it('keeps daily stats separate from free play', () => {
    const { id } = signUp();
    recordSoloGame(soloInput({ userId: id }));
    recordSoloGame(soloInput({ userId: id, mode: 'daily', dateKey: '2026-08-30' }));
    const stats = getStats(id, MAX_GUESSES);
    expect(stats.solo.played).toBe(2);
    expect(stats.daily.played).toBe(1);
  });

  it('records only the first daily attempt per day', () => {
    const { id } = signUp();
    expect(recordSoloGame(soloInput({ userId: id, mode: 'daily', dateKey: '2026-08-30' }))).toBe(true);
    expect(recordSoloGame(soloInput({ userId: id, mode: 'daily', dateKey: '2026-08-30' }))).toBe(false);
    expect(recordSoloGame(soloInput({ userId: id, mode: 'daily', dateKey: '2026-08-31' }))).toBe(true);
    expect(getStats(id, MAX_GUESSES).daily.played).toBe(2);
  });

  it('ignores records for a user that does not exist', () => {
    expect(recordSoloGame(soloInput({ userId: 999 }))).toBe(false);
  });
});

describe('match records and stats', () => {
  it('counts wins, losses and draws', () => {
    const { id } = signUp();
    const base = {
      userId: id,
      roomCode: 'ABCDE',
      boType: 3 as const,
      difficulty: 'easy' as const,
      ownScore: 2,
      rivalScore: 1,
      opponents: ['对手'],
      reason: 'score' as const,
    };
    recordMatch({ ...base, result: 'won' });
    recordMatch({ ...base, result: 'lost', ownScore: 1, rivalScore: 2 });
    recordMatch({ ...base, result: 'draw', ownScore: 1, rivalScore: 1 });
    const stats = getStats(id, MAX_GUESSES).match;
    expect(stats).toMatchObject({ played: 3, won: 1, lost: 1, draw: 1 });
    expect(stats.winRate).toBeCloseTo(0.333, 3);
  });
});

describe('history', () => {
  it('returns newest first and caps the size', () => {
    const { id } = signUp();
    for (let i = 1; i <= 5; i += 1) recordSoloGame(soloInput({ userId: id, guessCount: i }));
    const { games } = getHistory(id, 3);
    expect(games).toHaveLength(3);
    expect(games[0]!.guessCount).toBe(5);
    expect(games[0]!.answerName).toBe('绫地宁宁');
  });

  it('round-trips the opponent list', () => {
    const { id } = signUp();
    recordMatch({
      userId: id,
      roomCode: 'ABCDE',
      boType: 3,
      difficulty: 'easy',
      result: 'won',
      ownScore: 2,
      rivalScore: 0,
      opponents: ['小明', '小红'],
      reason: 'score',
    });
    expect(getHistory(id).matches[0]!.opponents).toEqual(['小明', '小红']);
  });

  it('never leaks another user history', () => {
    const a = signUp('aa');
    const b = signUp('bb');
    recordSoloGame(soloInput({ userId: a.id }));
    expect(getHistory(b.id).games).toHaveLength(0);
  });
});

describe('leaderboard', () => {
  it('ranks by wins then by average guesses and skips users without wins', () => {
    const slow = signUp('slow');
    const fast = signUp('fast');
    const none = signUp('none');
    recordSoloGame(soloInput({ userId: slow.id, guessCount: 6 }));
    recordSoloGame(soloInput({ userId: fast.id, guessCount: 2 }));
    recordSoloGame(soloInput({ userId: none.id, status: 'lost', guessCount: MAX_GUESSES }));
    const board = getLeaderboard();
    expect(board.map((e) => e.username)).toEqual(['fast', 'slow']);
    expect(board[0]!.avgGuesses).toBe(2);
  });
});

describe('getUserById', () => {
  it('returns null for a missing user', () => {
    expect(getUserById(999)).toBeNull();
  });
});
