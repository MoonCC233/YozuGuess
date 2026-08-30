import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { config } from './config.js';

/**
 * 每一项是一次不可逆的结构升级，靠 PRAGMA user_version 记录已应用到第几项。
 * 只能往后追加，不要修改已发布的条目。
 */
const MIGRATIONS: string[] = [
  // 1: 账号、登录会话、单人战绩、联机战绩
  `
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    username_lower TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    last_login_at INTEGER
  );

  CREATE TABLE auth_sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    last_seen_at INTEGER NOT NULL
  );
  CREATE INDEX idx_auth_sessions_user ON auth_sessions(user_id);
  CREATE INDEX idx_auth_sessions_expires ON auth_sessions(expires_at);

  CREATE TABLE game_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mode TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    status TEXT NOT NULL,
    guess_count INTEGER NOT NULL,
    answer_id INTEGER NOT NULL,
    answer_name TEXT NOT NULL,
    duration_ms INTEGER NOT NULL,
    date_key TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX idx_game_records_user ON game_records(user_id, created_at DESC);
  -- 每日一柚每人每天只留一条成绩
  CREATE UNIQUE INDEX idx_game_records_daily ON game_records(user_id, date_key)
    WHERE date_key IS NOT NULL;

  CREATE TABLE match_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_code TEXT NOT NULL,
    bo_type INTEGER NOT NULL,
    difficulty TEXT NOT NULL,
    result TEXT NOT NULL,
    own_score INTEGER NOT NULL,
    rival_score INTEGER NOT NULL,
    opponents TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX idx_match_records_user ON match_records(user_id, created_at DESC);
  `,
];

function resolveDbPath(file: string): string {
  if (file === ':memory:') return file;
  const here = path.dirname(fileURLToPath(import.meta.url));
  const resolved = path.isAbsolute(file) ? file : path.resolve(here, '..', file);
  mkdirSync(path.dirname(resolved), { recursive: true });
  return resolved;
}

function migrate(db: DatabaseSync): void {
  const row = db.prepare('PRAGMA user_version').get() as { user_version?: number } | undefined;
  const current = Number(row?.user_version ?? 0);
  for (let version = current; version < MIGRATIONS.length; version += 1) {
    db.exec('BEGIN');
    try {
      db.exec(MIGRATIONS[version]!);
      // PRAGMA 不支持绑定参数，版本号来自数组下标而非外部输入
      db.exec(`PRAGMA user_version = ${version + 1}`);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }
}

/** 打开（必要时创建）一个已完成迁移的数据库 */
export function openDatabase(file: string): DatabaseSync {
  const resolved = resolveDbPath(file);
  const db = new DatabaseSync(resolved, { enableForeignKeyConstraints: true });
  if (resolved !== ':memory:') db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA busy_timeout = 5000');
  migrate(db);
  return db;
}

let instance: DatabaseSync | null = null;

/** 进程内共享的数据库连接，首次调用时惰性打开 */
export function getDb(): DatabaseSync {
  instance ??= openDatabase(config.dbPath);
  return instance;
}

export function closeDatabase(): void {
  instance?.close();
  instance = null;
}

/** 仅用于测试：把共享连接换成一个全新的内存库 */
export function useMemoryDatabase(): DatabaseSync {
  closeDatabase();
  instance = openDatabase(':memory:');
  return instance;
}
