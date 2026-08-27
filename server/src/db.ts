import { DatabaseSync } from 'node:sqlite';
import { Pool } from 'pg';
import { databaseUrl, isPostgres, sqlitePath } from './config.js';

/**
 * 轻量数据库封装（替代 Knex，避免 better-sqlite3 的原生编译依赖）：
 * - 本地开发：Node 24 内置的 node:sqlite（单文件，零编译）
 * - 生产（设置了 DATABASE_URL）：PostgreSQL
 * 仅暴露本项目用到的少量查询能力。
 */

let sqliteDb: DatabaseSync | null = null;
let pgPool: Pool | null = null;

function getSqlite(): DatabaseSync {
  if (!sqliteDb) {
    sqliteDb = new DatabaseSync(sqlitePath);
    sqliteDb.exec('PRAGMA journal_mode = WAL;');
  }
  return sqliteDb;
}

function getPg(): Pool {
  if (!pgPool) pgPool = new Pool({ connectionString: databaseUrl });
  return pgPool;
}

export type Row = Record<string, any>;

/** 将 `?` 占位符转换为 pg 的 `$n` 占位符（sqlite 仍使用 `?`）。 */
function toPgSql(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

export async function all(sql: string, params: any[] = []): Promise<Row[]> {
  if (isPostgres) {
    const { rows } = await getPg().query(toPgSql(sql), params);
    return rows;
  }
  return getSqlite().prepare(sql).all(...params) as Row[];
}

export async function get(sql: string, params: any[] = []): Promise<Row | undefined> {
  if (isPostgres) {
    const { rows } = await getPg().query(toPgSql(sql), params);
    return rows[0];
  }
  return getSqlite().prepare(sql).get(...params) as Row | undefined;
}

export async function run(sql: string, params: any[] = []): Promise<{ changes: number }> {
  if (isPostgres) {
    const r = await getPg().query(toPgSql(sql), params);
    return { changes: r.rowCount ?? 0 };
  }
  const r = getSqlite().prepare(sql).run(...params) as { changes: number };
  return { changes: r.changes };
}

/** 插入并返回自增主键 id。 */
export async function insertReturningId(sql: string, params: any[] = []): Promise<number> {
  if (isPostgres) {
    const { rows } = await getPg().query(toPgSql(sql) + ' RETURNING id', params);
    return Number(rows[0].id);
  }
  const r = getSqlite().prepare(sql).run(...params) as { lastInsertRowid: number | bigint };
  return Number(r.lastInsertRowid);
}

export async function closeDb(): Promise<void> {
  if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = null;
  }
  if (pgPool) {
    await pgPool.end();
    pgPool = null;
  }
}

export type Db = any;
