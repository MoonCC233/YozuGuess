import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from './db.js';

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
       VALUES (1, ?, 'heroine', 'won', 3, 1, '绫地宁宁', 1000, ?, ?)`
    );
    insert.run('daily', '2026-08-30', Date.now());
    expect(() => insert.run('daily', '2026-08-30', Date.now())).toThrow();
    insert.run('free', null, Date.now());
    insert.run('free', null, Date.now());
    const count = db.prepare('SELECT count(*) AS n FROM game_records').get() as { n: number };
    expect(count.n).toBe(3);
  });
});
