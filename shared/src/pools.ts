import type { Character } from './types.js';
import { CHARACTERS } from './characters.js';

/** 猜谜难度：
 * - heroine：仅可攻略女主角（isMain=true），适合新手
 * - full：全部角色（含男主角、配角），完整版
 */
export type Difficulty = 'heroine' | 'full';

export const DIFFICULTIES: Difficulty[] = ['heroine', 'full'];

export function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === 'string' && (DIFFICULTIES as string[]).includes(value);
}

/** 答案池：按难度筛选可作为谜题答案的角色 */
export function getAnswerPool(difficulty: Difficulty): Character[] {
  if (difficulty === 'heroine') return CHARACTERS.filter((c) => c.isMain);
  return CHARACTERS;
}

/** 可猜列表：任何难度都允许猜全部角色（便于用配角试探属性） */
export function getGuessableCharacters(): Character[] {
  return CHARACTERS;
}

/** 随机取一个答案 */
export function pickRandomAnswer(difficulty: Difficulty): Character {
  const pool = getAnswerPool(difficulty);
  const picked = pool[Math.floor(Math.random() * pool.length)];
  if (!picked) throw new Error('answer pool is empty');
  return picked;
}

/** 32 位 FNV-1a，用于每日谜题的稳定散列 */
function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** 每日谜题：同一天 + 同一难度得到固定答案 */
export function pickDailyAnswer(difficulty: Difficulty, dateKey: string): Character {
  const pool = getAnswerPool(difficulty);
  if (pool.length === 0) throw new Error('answer pool is empty');
  const index = fnv1a(`${dateKey}:${difficulty}`) % pool.length;
  const picked = pool[index];
  if (!picked) throw new Error('answer pool is empty');
  return picked;
}

/** 以本地日期生成 YYYY-MM-DD 形式的每日 key */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 按中/日文名模糊搜索角色 */
export function searchCharacters(keyword: string, limit = 12): Character[] {
  const q = keyword.trim().toLowerCase();
  if (q === '') return [];
  const hits = CHARACTERS.filter(
    (c) => c.name.toLowerCase().includes(q) || c.nameJp.toLowerCase().includes(q)
  );
  return hits.slice(0, limit);
}

/** 按中/日文名精确定位角色（用于文本猜测） */
export function findCharacterByName(name: string): Character | undefined {
  const q = name.trim();
  if (q === '') return undefined;
  return CHARACTERS.find((c) => c.name === q || c.nameJp === q);
}
