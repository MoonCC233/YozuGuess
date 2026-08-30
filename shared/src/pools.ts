import type { Character, GameTitle } from './types.js';
import { CHARACTERS } from './characters.js';

/** 猜谜难度，从易到难四个阶层 */
export const DIFFICULTIES = ['easy', 'normal', 'hard', 'hell'] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];

/** 「四大名著」：夜宴、万花、RIDDLE、Stella */
export const FOUR_CLASSICS: GameTitle[] = ['sannabitch', 'sengoku', 'riddle', 'stella'];

/** 普通模式的八部作品：四大名著 + 天使、Lime、天色、DRACU */
export const EIGHT_TITLES: GameTitle[] = [
  ...FOUR_CLASSICS,
  'rebo',
  'limelight',
  'ailenote',
  'dracu',
];

export interface DifficultyMeta {
  id: Difficulty;
  /** 阶层名，如「简单模式」 */
  tier: string;
  /** 花名，界面上的主标签 */
  label: string;
  /** 一句话说明答案池范围 */
  desc: string;
  /** 限定的作品，null 表示全部作品 */
  titles: GameTitle[] | null;
  /** 是否只抽可攻略角色 */
  heroineOnly: boolean;
}

export const DIFFICULTY_META: Record<Difficulty, DifficultyMeta> = {
  easy: {
    id: 'easy',
    tier: '简单模式',
    label: '? !弱弱! ?',
    desc: '四大名著全角色',
    titles: FOUR_CLASSICS,
    heroineOnly: false,
  },
  normal: {
    id: 'normal',
    tier: '普通模式',
    label: '雑魚♥~',
    desc: '八部作品全角色',
    titles: EIGHT_TITLES,
    heroineOnly: false,
  },
  hard: {
    id: 'hard',
    tier: '困难模式',
    label: '⚡电 电⚡',
    desc: '全作品可攻略角色',
    titles: null,
    heroineOnly: true,
  },
  hell: {
    id: 'hell',
    tier: '地狱模式',
    label: '柚~来~',
    desc: '全作品全角色',
    titles: null,
    heroineOnly: false,
  },
};

export function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === 'string' && (DIFFICULTIES as readonly string[]).includes(value);
}

/** 难度花名；遇到历史遗留的未知值时原样返回 */
export function difficultyLabel(value: string): string {
  return isDifficulty(value) ? DIFFICULTY_META[value].label : value;
}

/** 答案池：按难度筛选可作为谜题答案的角色 */
export function getAnswerPool(difficulty: Difficulty): Character[] {
  const meta = DIFFICULTY_META[difficulty];
  const titles = meta.titles;
  return CHARACTERS.filter(
    (c) => (!meta.heroineOnly || c.isMain) && (titles === null || titles.includes(c.title))
  );
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
