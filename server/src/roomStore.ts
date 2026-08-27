import { randomUUID } from 'node:crypto';
import { compareGuess, getCharacter, getEnabledCharacters, hiddenGuess, MAX_GUESSES } from '@yozu/shared';
import type { GuessFeedback } from '@yozu/shared';

export type BoType = 1 | 3 | 5 | 7;
export type GameMode = 'bo' | 'relay';

export interface RoomPlayer {
  key: string;
  name: string;
  socketId: string | null;
  connected: boolean;
  score: number;
  guesses: GuessFeedback[];
  guessTimes: number[];
  lastGuessAt: number;
  eliminated: boolean;
  skipped: boolean;
  isHost: boolean;
  spectator: boolean;
}

export interface StoredRoom {
  code: string;
  hostKey: string;
  boType: BoType;
  gameMode: GameMode;
  roundDurationMs: number;
  status: 'waiting' | 'playing' | 'roundEnd' | 'finished';
  round: number;
  roundEndsAt: number | null;
  nextRoundAt: number | null;
  targetCharacterId: number;
  players: RoomPlayer[];
  spectators: RoomPlayer[];
  matchResult: { winnerKey: string | null; reason: string; forfeitedKey: null | string } | null;
  roundResult: { winnerKey: string | null; reason: string } | null;
  revision: number;
}

const rooms = new Map<string, StoredRoom>();

export function createRoom(opts: {
  hostName: string;
  boType: BoType;
  gameMode: GameMode;
  roundDurationMs: number;
}): StoredRoom {
  const code = generateCode();
  const hostKey = randomUUID();
  const room: StoredRoom = {
    code,
    hostKey,
    boType: opts.boType,
    gameMode: opts.gameMode,
    roundDurationMs: opts.roundDurationMs,
    status: 'waiting',
    round: 0,
    roundEndsAt: null,
    nextRoundAt: null,
    targetCharacterId: 0,
    players: [
      {
        key: hostKey,
        name: opts.hostName,
        socketId: null,
        connected: false,
        score: 0,
        guesses: [],
        guessTimes: [],
        lastGuessAt: 0,
        eliminated: false,
        skipped: false,
        isHost: true,
        spectator: false,
      },
    ],
    spectators: [],
    matchResult: null,
    roundResult: null,
    revision: 0,
  };
  rooms.set(code, room);
  return room;
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  do {
    code = '';
    for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  } while (rooms.has(code));
  return code;
}

export function getRoom(code: string): StoredRoom | undefined {
  return rooms.get(code);
}

export function findRoomByPlayerKey(key: string): StoredRoom | undefined {
  for (const room of rooms.values()) {
    if (room.players.some((p) => p.key === key) || room.spectators.some((p) => p.key === key)) {
      return room;
    }
  }
  return undefined;
}

export function startRound(room: StoredRoom): void {
  const pool = getEnabledCharacters().filter((c) => c.isMain);
  room.targetCharacterId = pool[Math.floor(Math.random() * pool.length)].id;
  room.round += 1;
  room.roundEndsAt = Date.now() + room.roundDurationMs;
  room.nextRoundAt = null;
  room.status = 'playing';
  for (const p of room.players) {
    p.guesses = [];
    p.guessTimes = [];
    p.lastGuessAt = 0;
    p.skipped = false;
    p.eliminated = false;
  }
  room.roundResult = null;
  room.revision += 1;
}

/**
 * 结束当前小局：判定胜者（先猜中者胜；都未猜中则猜中数多者胜；相同则平局），
 * 进入 roundEnd 间歇状态，并安排自动开始下一小局（除非整场已结束）。
 */
export function endRound(room: StoredRoom): void {
  if (room.status !== 'playing') return;
  const correcters = room.players.filter((p) => p.guesses.some((g) => g.correct));
  let winnerKey: string | null = null;
  let reason = 'draw';
  if (correcters.length === 1) {
    winnerKey = correcters[0].key;
    reason = 'correct';
  } else if (correcters.length > 1) {
    // 多人同时猜中：用时最短者胜
    let best: RoomPlayer | null = null;
    for (const p of correcters) {
      const t = p.guessTimes[p.guesses.findIndex((g) => g.correct)] ?? Number.MAX_SAFE_INTEGER;
      if (!best || t < (best.guessTimes[best.guesses.findIndex((g) => g.correct)] ?? Number.MAX_SAFE_INTEGER)) {
        best = p;
      }
    }
    winnerKey = best?.key ?? null;
    reason = 'correct';
  } else {
    // 无人猜中：猜中数（这里都是 0）相同，比较已猜次数少者（更接近答案）胜
    let best: RoomPlayer | null = null;
    for (const p of room.players) {
      if (!best || p.guesses.length < best.guesses.length) best = p;
    }
    if (best && room.players.every((p) => p.guesses.length === best!.guesses.length)) {
      winnerKey = null;
      reason = 'draw';
    } else {
      winnerKey = best?.key ?? null;
      reason = 'fewest-guesses';
    }
  }
  if (winnerKey) {
    const w = room.players.find((p) => p.key === winnerKey);
    if (w) {
      w.score += 1;
      const needed = Math.ceil(room.boType / 2);
      if (w.score >= needed) {
        room.status = 'finished';
        room.roundEndsAt = null;
        room.nextRoundAt = null;
        room.matchResult = { winnerKey, reason: 'score', forfeitedKey: null };
        room.revision += 1;
        return;
      }
    }
  }
  room.status = 'roundEnd';
  room.roundEndsAt = null;
  room.nextRoundAt = Date.now() + 8000;
  room.roundResult = { winnerKey, reason };
  room.revision += 1;
}

export interface ApplyGuessResult {
  kind: 'applied' | 'duplicate' | 'error';
  code?: string;
  feedback?: GuessFeedback;
  correct?: boolean;
  shouldFinish?: boolean;
  matchOver?: boolean;
  round?: number;
  revision?: number;
}

export function applyGuess(
  room: StoredRoom,
  playerKey: string,
  characterId: number
): ApplyGuessResult {
  const player = room.players.find((p) => p.key === playerKey);
  if (!player) return { kind: 'error', code: 'PLAYER_NOT_FOUND' };
  if (player.eliminated) return { kind: 'error', code: 'PLAYER_ELIMINATED' };
  if (player.guesses.length >= MAX_GUESSES) return { kind: 'error', code: 'GUESS_LIMIT_REACHED' };
  if (player.guesses.some((g) => g.characterId === characterId)) {
    return { kind: 'duplicate', feedback: player.guesses.find((g) => g.characterId === characterId)! };
  }
  const guess = getCharacter(characterId);
  const target = getCharacter(room.targetCharacterId);
  if (!guess || !target) return { kind: 'error', code: 'CHARACTER_NOT_FOUND' };

  const feedback = compareGuess(guess, target);
  player.guesses.push(feedback);
  player.guessTimes.push(Math.max(0, Math.floor(Date.now() - (room.roundEndsAt ?? Date.now()))));
  player.lastGuessAt = Date.now();

  const shouldFinish = feedback.correct || player.guesses.length >= MAX_GUESSES;
  room.revision += 1;
  return {
    kind: 'applied',
    feedback,
    correct: feedback.correct,
    shouldFinish,
    round: room.round,
    revision: room.revision,
  };
}

export function publicRoom(room: StoredRoom, viewerKey: string) {
  const viewer = [...room.players, ...room.spectators].find((p) => p.key === viewerKey);
  const isSpectator = viewer?.spectator ?? false;
  return {
    code: room.code,
    boType: room.boType,
    gameMode: room.gameMode,
    roundDurationMs: room.roundDurationMs,
    status: room.status,
    round: room.round,
    roundEndsAt: room.roundEndsAt,
    nextRoundAt: room.nextRoundAt,
    targetCharacterId: isSpectator ? room.targetCharacterId : undefined,
    players: room.players.map((p) => {
      const isSelf = p.key === viewerKey;
      // 自己看到完整反馈；对手/旁观看到隐藏版（仅等级+方向）
      const guesses = isSelf || isSpectator
        ? p.guesses
        : p.guesses.map((g) => hiddenGuess(g));
      return {
        key: p.key,
        name: p.name,
        connected: p.connected,
        score: p.score,
        guessCount: p.guesses.length,
        eliminated: p.eliminated,
        skipped: p.skipped,
        isHost: p.isHost,
        spectator: p.spectator,
        guesses,
      };
    }),
    spectators: room.spectators.map((s) => ({ key: s.key, name: s.name, connected: s.connected })),
    matchResult: room.matchResult,
    roundResult: room.roundResult,
    revision: room.revision,
  };
}

/** 重置整场比分，用于"再来一局" */
export function resetMatch(room: StoredRoom): void {
  room.round = 0;
  room.matchResult = null;
  room.roundResult = null;
  for (const p of room.players) {
    p.score = 0;
    p.guesses = [];
    p.guessTimes = [];
    p.lastGuessAt = 0;
    p.eliminated = false;
    p.skipped = false;
  }
  room.revision += 1;
}

/**
 * 由定时器每秒调用：处理小局超时结束、间歇自动开下一局。
 * 返回本 tick 内状态发生变化的房间，便于调用方统一广播。
 */
export function tickRooms(): StoredRoom[] {
  const changed: StoredRoom[] = [];
  const now = Date.now();
  for (const room of rooms.values()) {
    if (room.status === 'playing' && room.roundEndsAt && now >= room.roundEndsAt) {
      endRound(room);
      changed.push(room);
    } else if (room.status === 'roundEnd' && room.nextRoundAt && now >= room.nextRoundAt) {
      startRound(room);
      changed.push(room);
    }
  }
  return changed;
}
