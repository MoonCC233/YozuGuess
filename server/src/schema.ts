import { all, run, get } from './db.js';
import { isPostgres } from './config.js';

/**
 * 账户系统表结构（模仿 csgofriberg，但适配 YozuGuess 的 SQLite/Postgres 双栈）。
 * - users：注册用户（bcrypt 密码哈希 + JWT token_version 失效机制）
 * - guest_accounts：匿名访客（用于未登录时记录战绩，登录后认领）
 * - results：单人/每日对局结果（归属到用户或访客）
 */

async function hasTable(t: string): Promise<boolean> {
  if (isPostgres) {
    const row = await get('SELECT 1 FROM information_schema.tables WHERE table_name = ?', [t]);
    return Boolean(row);
  }
  const row = await get("SELECT name FROM sqlite_master WHERE type='table' AND name = ?", [t]);
  return Boolean(row);
}

export async function ensureSchema(): Promise<void> {
  if (!(await hasTable('users'))) {
    if (isPostgres) {
      await run(`CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(20) NOT NULL UNIQUE,
        display_id VARCHAR(16) NOT NULL,
        password_hash VARCHAR(128) NOT NULL,
        role VARCHAR(8) NOT NULL DEFAULT 'user',
        token_version INTEGER NOT NULL DEFAULT 0,
        email VARCHAR(320),
        email_verified_at TIMESTAMP,
        banned_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT now()
      )`);
      await run('CREATE INDEX idx_users_username ON users (username)');
    } else {
      await run(`CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        display_id TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        token_version INTEGER NOT NULL DEFAULT 0,
        email TEXT,
        email_verified_at TEXT,
        banned_at TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`);
      await run('CREATE INDEX idx_users_username ON users (username)');
    }
  }

  if (!(await hasTable('guest_accounts'))) {
    if (isPostgres) {
      await run(`CREATE TABLE guest_accounts (
        id SERIAL PRIMARY KEY,
        guest_key VARCHAR(64) NOT NULL UNIQUE,
        display_id VARCHAR(16) NOT NULL,
        banned_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        last_seen_at TIMESTAMP NOT NULL DEFAULT now()
      )`);
      await run('CREATE INDEX idx_guest_banned_seen ON guest_accounts (banned_at, last_seen_at)');
    } else {
      await run(`CREATE TABLE guest_accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guest_key TEXT NOT NULL UNIQUE,
        display_id TEXT NOT NULL,
        banned_at TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`);
      await run('CREATE INDEX idx_guest_banned_seen ON guest_accounts (banned_at, last_seen_at)');
    }
  }

  if (!(await hasTable('results'))) {
    if (isPostgres) {
      await run(`CREATE TABLE results (
        id SERIAL PRIMARY KEY,
        mode VARCHAR(16) NOT NULL,
        won BOOLEAN NOT NULL,
        guess_count INTEGER NOT NULL,
        user_id INTEGER,
        guest_key VARCHAR(64),
        created_at TIMESTAMP NOT NULL DEFAULT now()
      )`);
      await run('CREATE INDEX idx_results_user ON results (user_id, created_at)');
      await run('CREATE INDEX idx_results_guest ON results (guest_key, created_at)');
    } else {
      await run(`CREATE TABLE results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mode TEXT NOT NULL,
        won INTEGER NOT NULL,
        guess_count INTEGER NOT NULL,
        user_id INTEGER,
        guest_key TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`);
      await run('CREATE INDEX idx_results_user ON results (user_id, created_at)');
      await run('CREATE INDEX idx_results_guest ON results (guest_key, created_at)');
    }
  }
}
