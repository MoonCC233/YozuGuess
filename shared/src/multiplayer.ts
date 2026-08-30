import type { GuessFeedback } from './types.js';
import type { HiddenAttributeFeedback } from './gameService.js';
import type { Difficulty } from './pools.js';

/** 赛制：BO1 / BO3 / BO5 / BO7 */
export type BoType = 1 | 3 | 5 | 7;

export const BO_TYPES: BoType[] = [1, 3, 5, 7];

export function isBoType(value: unknown): value is BoType {
  return typeof value === 'number' && (BO_TYPES as number[]).includes(value);
}

/** 拿下整场需要的小局胜利数（BO3 需 2 胜，BO5 需 3 胜） */
export function winsNeeded(boType: BoType): number {
  return Math.ceil(boType / 2);
}

/** 房间状态：等待开局 / 小局进行中 / 小局结算间歇 / 整场结束 */
export type RoomStatus = 'waiting' | 'playing' | 'roundEnd' | 'finished';

/** 小局结束原因 */
export type RoundEndReason =
  | 'solved' // 有人猜中
  | 'exhausted' // 所有人机会用尽且无人猜中
  | 'timeout' // 小局倒计时结束
  | 'forfeit'; // 对手离开

/** 整场结束原因 */
export type MatchEndReason = 'score' | 'forfeit';

/** 对手/旁观视角下被隐藏数值的猜测反馈 */
export interface HiddenGuessFeedback {
  hidden: true;
  correct: boolean;
  attributes: Record<keyof GuessFeedback['attributes'], HiddenAttributeFeedback>;
}

/** 房间中一位玩家的公开信息 */
export interface PublicPlayer {
  key: string;
  name: string;
  connected: boolean;
  spectator: boolean;
  isHost: boolean;
  score: number;
  guessCount: number;
  /** 本小局是否已结束作答（猜中或用完机会） */
  done: boolean;
  /** 本小局是否已猜中 */
  solved: boolean;
  /** 自己/旁观者看到完整反馈，对手看到隐藏反馈 */
  guesses: Array<GuessFeedback | HiddenGuessFeedback>;
}

export interface RoundResult {
  round: number;
  winnerKey: string | null;
  reason: RoundEndReason;
  /** 小局结束后公布的答案 */
  answer: { id: number; name: string; nameJp: string } | null;
}

export interface MatchResult {
  winnerKey: string | null;
  reason: MatchEndReason;
}

/** 下发给客户端的房间快照 */
export interface PublicRoom {
  code: string;
  boType: BoType;
  difficulty: Difficulty;
  status: RoomStatus;
  round: number;
  maxGuesses: number;
  winsNeeded: number;
  roundDurationMs: number;
  /** 小局结束的绝对时间戳（毫秒），未在小局中时为 null */
  roundEndsAt: number | null;
  /** 下一小局自动开始的绝对时间戳（毫秒） */
  nextRoundAt: number | null;
  players: PublicPlayer[];
  spectators: Array<{ key: string; name: string; connected: boolean }>;
  roundResult: RoundResult | null;
  matchResult: MatchResult | null;
  /** 每次状态变化自增，客户端可用于丢弃过期快照 */
  revision: number;
  /** 当前观察者自己的 key */
  viewerKey: string;
}

/** socket 错误码 */
export type RoomErrorCode =
  | 'INVALID_PAYLOAD'
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'ROOM_IN_PROGRESS'
  | 'NAME_TAKEN'
  | 'PLAYER_NOT_FOUND'
  | 'NOT_HOST'
  | 'NEED_MORE_PLAYERS'
  | 'NOT_PLAYING'
  | 'SPECTATOR_CANNOT_GUESS'
  | 'ALREADY_DONE'
  | 'GUESS_LIMIT_REACHED'
  | 'DUPLICATE_GUESS'
  | 'CHARACTER_NOT_FOUND'
  | 'RATE_LIMITED'
  | 'TOO_MANY_ROOMS'
  | 'AUTH_REQUIRED';

/** 房间人数上限（玩家，不含旁观） */
export const MAX_ROOM_PLAYERS = 8;
/** 旁观人数上限 */
export const MAX_ROOM_SPECTATORS = 20;
