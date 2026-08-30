import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { MIGRATION_SQL, migrate, openDatabase } from './db.js';

let db: DatabaseSync;

beforeEach(() => {
  db = openDatabase(':memory:');
});

afterEach(() => {
  db.close();
});

function tableNames(): string[] {
  return (db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as Array<{ name: string }>)
    .map((r) => r.name)
    .sort();
}

describe('database migrations', () => {
  it('creates every table and stamps the schema version', () => {
    expect(tableNames()).toContain('users');
    expect(tableNames()).toContain('auth_sessions');
    expect(tableNames()).toContain('game_records');
    expect(tableNames()).toContain('match_records');
    const row = db.prepare('PRAGMA user_version').get() as { user_version: number };
    expect(row.user_version).toBeGreaterThan(0);
  });

  it('is idempotent when reopened', () => {
    const before = (db.prepare('PRAGMA user_version').get() as { user_version: number }).user_version;
    const again = openDatabase(':memory:');
    const after = (again.prepare('PRAGMA user_version').get() as { user_version: number }).user_version;
    again.close();
    expect(after).toBe(before);
  });

  it('rejects duplicate usernames case-insensitively', () => {
    const insert = db.prepare(
      'INSERT INTO users (username, username_lower, password_hash, created_at) VALUES (?, ?, ?, ?)'
    );
    insert.run('Yuzu', 'yuzu', 'hash', Date.now());
    expect(() => insert.run('YUZU', 'yuzu', 'hash', Date.now())).toThrow();
  });

  it('cascades session and record deletion when a user is removed', () => {
    db.prepare(
      'INSERT INTO users (id, username, username_lower, password_hash, created_at) VALUES (1, ?, ?, ?, ?)'
    ).run('柚子', '柚子', 'hash', Date.now());
    db.prepare(
      'INSERT INTO auth_sessions (id, user_id, created_at, expires_at, last_seen_at) VALUES (?, 1, ?, ?, ?)'
    ).run('token', Date.now(), Date.now() + 1000, Date.now());
    db.prepare('DELETE FROM users WHERE id = 1').run();
    const left = db.prepare('SELECT count(*) AS n FROM auth_sessions').get() as { n: number };
    expect(left.n).toBe(0);
  });

  it('keeps only one daily record per user per date but allows many free games', () => {
    db.prepare(
      'INSERT INTO users (id, username, username_lower, password_hash, created_at) VALUES (1, ?, ?, ?, ?)'
    ).run('柚子', '柚子', 'hash', Date.now());
    const insert = db.prepare(
      `INSERT INTO game_records
        (user_id, mode, difficulty, status, guess_count, answer_id, answer_name, duration_ms, date_key, created_at)
       VALUES (1, ?, 'easy', 'won', 3, 1, '绫地宁宁', 1000, ?, ?)`
    );
    insert.run('daily', '2026-08-30', Date.now());
    expect(() => insert.run('daily', '2026-08-30', Date.now())).toThrow();
    insert.run('free', null, Date.now());
    insert.run('free', null, Date.now());
    const count = db.prepare('SELECT count(*) AS n FROM game_records').get() as { n: number };
    expect(count.n).toBe(3);
  });

  it('maps the two legacy difficulty values onto the tier that keeps their meaning', () => {
    // 手工建一个只跑到第 1 版的旧库
    const legacy = new DatabaseSync(':memory:');
    legacy.exec('PRAGMA foreign_keys = ON');
    legacy.exec(MIGRATION_SQL[0]!);
    legacy.exec('PRAGMA user_version = 1');
    legacy
      .prepare('INSERT INTO users (id, username, username_lower, password_hash, created_at) VALUES (1, ?, ?, ?, ?)')
      .run('柚子', '柚子', 'hash', Date.now());
    const game = legacy.prepare(
      `INSERT INTO game_records
        (user_id, mode, difficulty, status, guess_count, answer_id, answer_name, duration_ms, date_key, created_at)
       VALUES (1, 'free', ?, 'won', 3, 1, '绫地宁宁', 1000, NULL, ?)`
    );
    game.run('heroine', Date.now());
    game.run('full', Date.now());
    legacy
      .prepare(
        `INSERT INTO match_records
          (user_id, room_code, bo_type, difficulty, result, own_score, rival_score, opponents, reason, created_at)
         VALUES (1, 'ABCDE', 3, ?, 'won', 2, 0, '[]', 'guessed', ?)`
      )
      .run('heroine', Date.now());

    migrate(legacy);

    const games = legacy.prepare('SELECT difficulty FROM game_records ORDER BY id').all() as Array<{
      difficulty: string;
    }>;
    // 旧 heroine 是「全作品可攻略」，互换后归到 normal；旧 full 是「全作品全角色」，仍是 hell
    expect(games.map((r) => r.difficulty)).toEqual(['normal', 'hell']);
    const match = legacy.prepare('SELECT difficulty FROM match_records').get() as { difficulty: string };
    expect(match.difficulty).toBe('normal');
    const version = legacy.prepare('PRAGMA user_version').get() as { user_version: number };
    expect(version.user_version).toBe(MIGRATION_SQL.length);
    legacy.close();
  });

  it('swaps normal and hard records without collapsing them together', () => {
    // 建一个已经跑到第 2 版（四档但未互换）的库
    const old = new DatabaseSync(':memory:');
    old.exec('PRAGMA foreign_keys = ON');
    old.exec(MIGRATION_SQL[0]!);
    old.exec(MIGRATION_SQL[1]!);
    old.exec('PRAGMA user_version = 2');
    old
      .prepare('INSERT INTO users (id, username, username_lower, password_hash, created_at) VALUES (1, ?, ?, ?, ?)')
      .run('柚子', '柚子', 'hash', Date.now());
    const game = old.prepare(
      `INSERT INTO game_records
        (user_id, mode, difficulty, status, guess_count, answer_id, answer_name, duration_ms, date_key, created_at)
       VALUES (1, 'free', ?, 'won', 3, 1, '绫地宁宁', 1000, NULL, ?)`
    );
    for (const d of ['easy', 'normal', 'hard', 'hell']) game.run(d, Date.now());
    const match = old.prepare(
      `INSERT INTO match_records
        (user_id, room_code, bo_type, difficulty, result, own_score, rival_score, opponents, reason, created_at)
       VALUES (1, 'ABCDE', 3, ?, 'won', 2, 0, '[]', 'guessed', ?)`
    );
    match.run('normal', Date.now());
    match.run('hard', Date.now());

    migrate(old);

    const games = old.prepare('SELECT difficulty FROM game_records ORDER BY id').all() as Array<{
      difficulty: string;
    }>;
    expect(games.map((r) => r.difficulty)).toEqual(['easy', 'hard', 'normal', 'hell']);
    const matches = old.prepare('SELECT difficulty FROM match_records ORDER BY id').all() as Array<{
      difficulty: string;
    }>;
    expect(matches.map((r) => r.difficulty)).toEqual(['hard', 'normal']);
    expect(
      (old.prepare("SELECT count(*) AS n FROM game_records WHERE difficulty = 'swap_tmp'").get() as { n: number }).n
    ).toBe(0);
    old.close();
  });
});
