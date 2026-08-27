import { CHARACTERS, getCharacter, getEnabledCharacters } from '@yozu/shared';

// 内存版游戏状态存储（演示用，生产可替换为 Redis/Postgres）
// 单人进行中对局保存在内存，30 分钟无操作自动过期

export interface SingleGameState {
  id: string;
  targetCharacterId: number;
  mode: 'classic' | 'easy' | 'daily';
  guesses: import('@yozu/shared').GuessFeedback[];
  guessTimes: number[];
  createdAt: number;
  finished: boolean;
  status: 'playing' | 'won' | 'lost';
}

const singleGames = new Map<string, SingleGameState>();
const dailyGames = new Map<string, SingleGameState>(); // key: date

export function createSingleGame(id: string, targetId: number, mode: 'classic' | 'easy' | 'daily' = 'classic'): SingleGameState {
  const game: SingleGameState = {
    id,
    targetCharacterId: targetId,
    mode,
    guesses: [],
    guessTimes: [],
    createdAt: Date.now(),
    finished: false,
    status: 'playing',
  };
  singleGames.set(id, game);
  return game;
}

export function getSingleGame(id: string): SingleGameState | undefined {
  return singleGames.get(id);
}

export function saveSingleGame(game: SingleGameState): void {
  singleGames.set(game.id, game);
}

export function deleteSingleGame(id: string): void {
  singleGames.delete(id);
}

export function getDailyGame(date: string): SingleGameState | undefined {
  return dailyGames.get(date);
}

export function setDailyGame(date: string, game: SingleGameState): void {
  dailyGames.set(date, game);
}

// 每日目标：用日期做种子，保证当天所有人目标一致
export function dailyTargetId(date: string): number {
  const pool = getEnabledCharacters().filter((c) => c.isMain);
  let hash = 0;
  for (let i = 0; i < date.length; i++) hash = (hash * 31 + date.charCodeAt(i)) >>> 0;
  return pool[hash % pool.length].id;
}

// 随机目标（单人模式）
export function randomTargetId(): number {
  const pool = getEnabledCharacters().filter((c) => c.isMain);
  return pool[Math.floor(Math.random() * pool.length)].id;
}

export function answerView(target: import('@yozu/shared').Character) {
  return {
    id: target.id,
    name: target.name,
    nameJp: target.nameJp,
    title: target.title,
    rank: target.rank,
    bakusen: target.bakusen,
    hair: target.hair,
    eyes: target.eyes,
    cv: target.cv,
  };
}

// ── 回放记录（对局结束后保留，用于复盘） ──
export interface ReplayRecord {
  id: string;
  mode: 'classic' | 'easy' | 'daily';
  date: string; // YYYY-MM-DD
  createdAt: number;
  finishedAt: number;
  targetCharacterId: number;
  guesses: import('@yozu/shared').GuessFeedback[];
  guessTimes: number[]; // 每次猜测距开始的毫秒数
  status: 'won' | 'lost';
  guessCount: number;
}

const replays = new Map<string, ReplayRecord>();

export function saveReplay(record: ReplayRecord): void {
  replays.set(record.id, record);
}

export function listReplays(): ReplayRecord[] {
  return Array.from(replays.values()).sort((a, b) => b.finishedAt - a.finishedAt);
}

export function getReplay(id: string): ReplayRecord | undefined {
  return replays.get(id);
}

export { CHARACTERS, getCharacter, getEnabledCharacters };
