import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, '../..');
const envPath = path.join(repoRoot, '.env');
if (fs.existsSync(envPath)) {
  // 轻量读取 .env，避免引入额外依赖
  const text = fs.readFileSync(envPath, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

const configuredJwtSecret = process.env.JWT_SECRET?.trim();
const unsafeJwtSecrets = new Set(['dev-secret', 'change-me-in-production']);
export const jwtSecret =
  configuredJwtSecret && !unsafeJwtSecrets.has(configuredJwtSecret)
    ? configuredJwtSecret
    : crypto.randomBytes(48).toString('base64url');

export const bcryptRounds = Number(process.env.BCRYPT_ROUNDS || 10);

// 本地开发用 SQLite；生产（设置了 DATABASE_URL）用 PostgreSQL
export const databaseUrl = process.env.DATABASE_URL?.trim() || '';
export const isPostgres = databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://');

const dataDir = path.join(repoRoot, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
export const sqlitePath = process.env.SQLITE_PATH?.trim() || path.join(dataDir, 'yozu.db');

// Cookie 域名：生产可设置，本地留空（同站）
export const cookieDomain = process.env.COOKIE_DOMAIN?.trim() || undefined;
export const isProduction = process.env.NODE_ENV === 'production';
