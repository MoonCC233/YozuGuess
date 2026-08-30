import { randomUUID } from 'node:crypto';
import {
  MAX_GUESSES,
  MAX_ROOM_PLAYERS,
  MAX_ROOM_SPECTATORS,
  compareGuess,
  getCharacter,
  hiddenGuess,
  pickRandomAnswer,
  winsNeeded,
  type BoType,
  type Character,
  type Difficulty,
  type GuessFeedback,
  type MatchResult,
  type PublicPlayer,
  type PublicRoom,
  type RoomErrorCode,
  type RoomStatus,
  type RoundEndReason,
  type RoundResult,
} from '@yozu/shared';
import { config } from './config.js';
import { recordMatch } from './accounts.js';

export interface RoomPlayer {
  key: string;
  name: string;
  socketId: string | null;
  connected: boolean;
  spectator: boolean;
  isHost: boolean;
  score: number;
  guesses: GuessFeedback[];
  /** 本小局猜中的时间戳，未猜中为 null */
  solvedAt: number | null;
  /** 本小局是否已经不能再猜（猜中或用完机会） */
  done: boolean;
  joinedAt: number;
  /** 加入时的登录用户，未登录为 null；整场结束时用来落库 */
  userId: number | null;
}

export interface Room {
  code: string;
  boType: BoType;
  difficulty: Difficulty;
  status: RoomStatus;
  round: number;
  answerId: number;
  roundStartedAt: number | null;
  roundEndsAt: number | null;
  nextRoundAt: number | null;
  players: RoomPlayer[];
  roundResult: RoundResult | null;
  matchResult: MatchResult | null;
  revision: number;
  updatedAt: number;
  /** 整场战绩是否已落库，防止重复写入 */
  recorded: boolean;
  /** 答案选取函数，测试时可注入以获得确定性 */
  pickAnswer: (difficulty: Difficulty) => Character;
}

const rooms = new Map<string, Room>();

/** 去掉容易混淆的 0/O/1/I，便于口头传达房间码 */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    let code = '';
    for (let i = 0; i < 5; i += 1) {
      code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
    if (!rooms.has(code)) return code;
  }
  throw new Error('failed to allocate room code');
}

function touch(room: Room, now = Date.now()): void {
  room.revision += 1;
  room.updatedAt = now;
}

function activePlayers(room: Room): RoomPlayer[] {
  return room.players.filter((p) => !p.spectator);
}

function spectators(room: Room): RoomPlayer[] {
  return room.players.filter((p) => p.spectator);
}

/** 回收过期房间；超出上限时淘汰最旧的 */
function sweep(now = Date.now()): void {
  for (const [code, room] of rooms) {
    if (now - room.updatedAt > config.roomTtlMs) rooms.delete(code);
  }
  if (rooms.size <= config.maxRooms) return;
  const oldestFirst = [...rooms.values()].sort((a, b) => a.updatedAt - b.updatedAt);
  for (let i = 0; i < rooms.size - config.maxRooms; i += 1) {
    const victim = oldestFirst[i];
    if (victim) rooms.delete(victim.code);
  }
}

function makePlayer(opts: {
  name: string;
  socketId: string | null;
  spectator: boolean;
  isHost: boolean;
  now: number;
  userId?: number | null;
}): RoomPlayer {
  return {
    key: randomUUID(),
    name: opts.name,
    socketId: opts.socketId,
    connected: opts.socketId !== null,
    spectator: opts.spectator,
    isHost: opts.isHost,
    score: 0,
    guesses: [],
    solvedAt: null,
    done: false,
    joinedAt: opts.now,
    userId: opts.userId ?? null,
  };
}

export type RoomResult<T> = { ok: true; value: T } | { ok: false; error: RoomErrorCode };

function fail<T>(error: RoomErrorCode): RoomResult<T> {
  return { ok: false, error };
}

export function createRoom(opts: {
  hostName: string;
  boType: BoType;
  difficulty: Difficulty;
  socketId?: string | null;
  roundDurationMs?: number;
  pickAnswer?: (difficulty: Difficulty) => Character;
  now?: number;
  userId?: number | null;
}): RoomResult<{ room: Room; player: RoomPlayer }> {
  const now = opts.now ?? Date.now();
  sweep(now);
  if (rooms.size >= config.maxRooms) return fail('TOO_MANY_ROOMS');
  const host = makePlayer({
    name: opts.hostName,
    socketId: opts.socketId ?? null,
    spectator: false,
    isHost: true,
    now,
    userId: opts.userId ?? null,
  });
  const room: Room = {
    code: generateCode(),
    boType: opts.boType,
    difficulty: opts.difficulty,
    status: 'waiting',
    round: 0,
    answerId: 0,
    roundStartedAt: null,
    roundEndsAt: null,
    nextRoundAt: null,
    players: [host],
    roundResult: null,
    matchResult: null,
    revision: 1,
    updatedAt: now,
    recorded: false,
    pickAnswer: opts.pickAnswer ?? pickRandomAnswer,
  };
  rooms.set(room.code, room);
  return { ok: true, value: { room, player: host } };
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code.toUpperCase());
}

export function findRoomByPlayerKey(key: string): Room | undefined {
  if (key === '') return undefined;
  for (const room of rooms.values()) {
    if (room.players.some((p) => p.key === key)) return room;
  }
  return undefined;
}

export function joinRoom(
  code: string,
  opts: {
    name: string;
    socketId: string | null;
    spectator: boolean;
    now?: number;
    userId?: number | null;
  }
): RoomResult<{ room: Room; player: RoomPlayer }> {
  const now = opts.now ?? Date.now();
  const room = getRoom(code);
  if (!room) return fail('ROOM_NOT_FOUND');

  const asSpectator = opts.spectator || room.status !== 'waiting';
  if (asSpectator && spectators(room).length >= MAX_ROOM_SPECTATORS) return fail('ROOM_FULL');
  if (!asSpectator && activePlayers(room).length >= MAX_ROOM_PLAYERS) return fail('ROOM_FULL');
  // 昵称来自账号，所以同一账号重复进房按 userId 判重；无账号的调用回退到按名字判重
  const userId = opts.userId ?? null;
  if (userId !== null) {
    if (room.players.some((p) => p.userId === userId && p.connected)) return fail('NAME_TAKEN');
  } else if (room.players.some((p) => p.name === opts.name && p.connected)) {
    return fail('NAME_TAKEN');
  }

  const player = makePlayer({
    name: opts.name,
    socketId: opts.socketId,
    spectator: asSpectator,
    isHost: false,
    now,
    userId,
  });
  // 已开局后加入的人只能旁观，本小局不参与作答
  if (asSpectator) {
    player.done = true;
  }
  room.players.push(player);
  touch(room, now);
  return { ok: true, value: { room, player } };
}

/** 断线重连：用之前的 key 重新绑定 socket */
export function rejoinRoom(
  code: string,
  key: string,
  socketId: string,
  now = Date.now()
): RoomResult<{ room: Room; player: RoomPlayer }> {
  const room = getRoom(code);
  if (!room) return fail('ROOM_NOT_FOUND');
  const player = room.players.find((p) => p.key === key);
  if (!player) return fail('PLAYER_NOT_FOUND');
  player.socketId = socketId;
  player.connected = true;
  touch(room, now);
  return { ok: true, value: { room, player } };
}

/** 主机移交给下一位仍在线的玩家 */
function reassignHost(room: Room): void {
  if (activePlayers(room).some((p) => p.isHost)) return;
  const next = activePlayers(room).find((p) => p.connected) ?? activePlayers(room)[0];
  if (next) next.isHost = true;
}

/**
 * 整场结束时给每个登录玩家写一条战绩。
 * 靠 room.recorded 保证一场只写一次；resetMatch 会把标记清掉，让再来一局重新计。
 * extra 用于收录已经离开 players 数组的玩家，弃权者也该留下这条败绩。
 */
function persistMatch(room: Room, extra: RoomPlayer[] = []): void {
  if (room.recorded || room.status !== 'finished') return;
  room.recorded = true;
  const contenders = [...activePlayers(room), ...extra.filter((p) => !p.spectator)];
  const winnerKey = room.matchResult?.winnerKey ?? null;
  const reason = room.matchResult?.reason ?? 'score';
  for (const player of contenders) {
    if (player.userId === null) continue;
    const rivals = contenders.filter((p) => p.key !== player.key);
    const rivalScore = rivals.reduce((best, p) => Math.max(best, p.score), 0);
    const result = winnerKey === null ? 'draw' : winnerKey === player.key ? 'won' : 'lost';
    recordMatch({
      userId: player.userId,
      roomCode: room.code,
      boType: room.boType,
      difficulty: room.difficulty,
      result,
      ownScore: player.score,
      rivalScore,
      opponents: rivals.map((p) => p.name),
      reason,
    });
  }
}

export function leaveRoom(key: string, now = Date.now()): Room | undefined {
  const room = findRoomByPlayerKey(key);
  if (!room) return undefined;
  const quitter = room.players.find((p) => p.key === key);
  room.players = room.players.filter((p) => p.key !== key);
  if (room.players.length === 0) {
    rooms.delete(room.code);
    return room;
  }
  reassignHost(room);
  // 对战中只剩一名玩家：判对手弃权，整场结束
  if (room.status === 'playing' && activePlayers(room).length === 1) {
    const survivor = activePlayers(room)[0]!;
    finishRound(room, survivor.key, 'forfeit', now);
    room.status = 'finished';
    room.roundEndsAt = null;
    room.nextRoundAt = null;
    room.matchResult = { winnerKey: survivor.key, reason: 'forfeit' };
    persistMatch(room, quitter ? [quitter] : []);
  }
  touch(room, now);
  return room;
}

export function markDisconnected(socketId: string, now = Date.now()): Room | undefined {
  for (const room of rooms.values()) {
    const player = room.players.find((p) => p.socketId === socketId);
    if (!player) continue;
    player.connected = false;
    player.socketId = null;
    touch(room, now);
    return room;
  }
  return undefined;
}

export function startRound(room: Room, now = Date.now()): RoomResult<Room> {
  if (activePlayers(room).length < 2) return fail('NEED_MORE_PLAYERS');
  if (room.status === 'finished') resetMatch(room, now);
  const answer = room.pickAnswer(room.difficulty);
  room.answerId = answer.id;
  room.round += 1;
  room.status = 'playing';
  room.roundStartedAt = now;
  room.roundEndsAt = now + config.roundDurationMs;
  room.nextRoundAt = null;
  room.roundResult = null;
  for (const p of room.players) {
    p.guesses = [];
    p.solvedAt = null;
    // 旁观者不参与作答
    p.done = p.spectator;
  }
  touch(room, now);
  return { ok: true, value: room };
}

/** 一次猜测的接近度打分：完全一致 2 分，接近 1 分，用于无人猜中时判定「谁更接近」 */
function proximityScore(feedback: GuessFeedback): number {
  return Object.values(feedback.attributes).reduce((sum, a) => {
    if (a.level === 'correct') return sum + 2;
    if (a.level === 'close') return sum + 1;
    return sum;
  }, 0);
}

function bestAttributeScore(player: RoomPlayer): number {
  return player.guesses.reduce((best, g) => Math.max(best, proximityScore(g)), 0);
}

/**
 * 小局结束判定：
 * 1. 有人猜中 -> 最早猜中者胜
 * 2. 无人猜中 -> 只在真正猜过的人之间比较：单次猜测命中属性最多者胜；
 *    再平则用了更少次数者胜；仍平（或全场没人猜过）则本小局平局
 */
function judgeRound(room: Room): { winnerKey: string | null; reason: RoundEndReason } {
  const players = activePlayers(room);
  const solved = players.filter((p) => p.solvedAt !== null);
  if (solved.length > 0) {
    const first = solved.reduce((a, b) => (a.solvedAt! <= b.solvedAt! ? a : b));
    return { winnerKey: first.key, reason: 'solved' };
  }
  const allDone = players.every((p) => p.done);
  const reason: RoundEndReason = allDone ? 'exhausted' : 'timeout';

  // 一次都没猜的人不参与评比，否则「挂机」反而会赢
  const candidates = players.filter((p) => p.guesses.length > 0);
  if (candidates.length === 0) return { winnerKey: null, reason };

  const ranked = [...candidates].sort((a, b) => {
    const scoreDiff = bestAttributeScore(b) - bestAttributeScore(a);
    if (scoreDiff !== 0) return scoreDiff;
    return a.guesses.length - b.guesses.length;
  });
  const top = ranked[0]!;
  // 谁都没蒙对任何属性时不分胜负
  if (bestAttributeScore(top) === 0) return { winnerKey: null, reason };
  const runnerUp = ranked[1];
  const tied =
    runnerUp !== undefined &&
    bestAttributeScore(runnerUp) === bestAttributeScore(top) &&
    runnerUp.guesses.length === top.guesses.length;
  if (tied) return { winnerKey: null, reason };
  return { winnerKey: top.key, reason };
}

function answerSummary(room: Room): RoundResult['answer'] {
  const answer = getCharacter(room.answerId);
  if (!answer) return null;
  return { id: answer.id, name: answer.name, nameJp: answer.nameJp };
}

/** 记分并写入小局结果，不负责决定房间后续状态 */
function finishRound(room: Room, winnerKey: string | null, reason: RoundEndReason, now: number): void {
  room.roundResult = { round: room.round, winnerKey, reason, answer: answerSummary(room) };
  if (!winnerKey) return;
  const winner = room.players.find((p) => p.key === winnerKey);
  if (winner) winner.score += 1;
  void now;
}

/** 结束当前小局：记分、判断整场是否结束、安排下一小局 */
export function endRound(room: Room, now = Date.now()): Room {
  if (room.status !== 'playing') return room;
  const { winnerKey, reason } = judgeRound(room);
  finishRound(room, winnerKey, reason, now);

  const target = winsNeeded(room.boType);
  const champion = activePlayers(room).find((p) => p.score >= target);
  const roundsPlayedOut = room.round >= room.boType;

  if (champion) {
    room.status = 'finished';
    room.matchResult = { winnerKey: champion.key, reason: 'score' };
    room.roundEndsAt = null;
    room.nextRoundAt = null;
    persistMatch(room);
  } else if (roundsPlayedOut) {
    // 打满赛制局数仍未有人达到胜利数：按总比分决出，比分相同则平局
    const ranked = [...activePlayers(room)].sort((a, b) => b.score - a.score);
    const top = ranked[0];
    const second = ranked[1];
    const drawn = top && second && top.score === second.score;
    room.status = 'finished';
    room.matchResult = { winnerKey: drawn ? null : (top?.key ?? null), reason: 'score' };
    room.roundEndsAt = null;
    room.nextRoundAt = null;
    persistMatch(room);
  } else {
    room.status = 'roundEnd';
    room.roundEndsAt = null;
    room.nextRoundAt = now + config.intermissionMs;
  }
  touch(room, now);
  return room;
}

export interface GuessOutcome {
  room: Room;
  feedback: GuessFeedback;
  roundOver: boolean;
}

export function applyGuess(
  room: Room,
  playerKey: string,
  characterId: number,
  now = Date.now()
): RoomResult<GuessOutcome> {
  if (room.status !== 'playing') return fail('NOT_PLAYING');
  const player = room.players.find((p) => p.key === playerKey);
  if (!player) return fail('PLAYER_NOT_FOUND');
  if (player.spectator) return fail('SPECTATOR_CANNOT_GUESS');
  if (player.guesses.length >= MAX_GUESSES) return fail('GUESS_LIMIT_REACHED');
  if (player.done) return fail('ALREADY_DONE');
  if (player.guesses.some((g) => g.characterId === characterId)) return fail('DUPLICATE_GUESS');

  const guessed = getCharacter(characterId);
  const answer = getCharacter(room.answerId);
  if (!guessed || !answer) return fail('CHARACTER_NOT_FOUND');

  const feedback = compareGuess(guessed, answer);
  player.guesses.push(feedback);
  if (feedback.correct) {
    player.solvedAt = now;
    player.done = true;
  } else if (player.guesses.length >= MAX_GUESSES) {
    player.done = true;
  }
  touch(room, now);

  // 有人猜中，或所有参赛者都已作答完毕 -> 立即结束小局
  const roundOver = feedback.correct || activePlayers(room).every((p) => p.done);
  if (roundOver) endRound(room, now);
  return { ok: true, value: { room, feedback, roundOver } };
}

export function resetMatch(room: Room, now = Date.now()): Room {
  room.round = 0;
  room.status = 'waiting';
  room.answerId = 0;
  room.roundStartedAt = null;
  room.roundEndsAt = null;
  room.nextRoundAt = null;
  room.roundResult = null;
  room.matchResult = null;
  room.recorded = false;
  for (const p of room.players) {
    p.score = 0;
    p.guesses = [];
    p.solvedAt = null;
    p.done = p.spectator;
  }
  touch(room, now);
  return room;
}

/** 由定时器驱动：处理小局超时与间歇后自动开下一局，返回状态变化的房间 */
export function tickRooms(now = Date.now()): Room[] {
  const changed: Room[] = [];
  for (const room of rooms.values()) {
    if (room.status === 'playing' && room.roundEndsAt !== null && now >= room.roundEndsAt) {
      endRound(room, now);
      changed.push(room);
    } else if (room.status === 'roundEnd' && room.nextRoundAt !== null && now >= room.nextRoundAt) {
      const started = startRound(room, now);
      if (!started.ok) {
        // 人数不足无法继续，直接结束整场
        room.status = 'finished';
        room.nextRoundAt = null;
        const top = [...activePlayers(room)].sort((a, b) => b.score - a.score)[0];
        room.matchResult = { winnerKey: top?.key ?? null, reason: 'forfeit' };
        persistMatch(room);
        touch(room, now);
      }
      changed.push(room);
    }
  }
  return changed;
}

function toPublicPlayer(player: RoomPlayer, viewer: RoomPlayer | undefined, revealAll: boolean): PublicPlayer {
  const showFull = revealAll || viewer?.spectator === true || viewer?.key === player.key;
  return {
    key: player.key,
    name: player.name,
    connected: player.connected,
    spectator: player.spectator,
    isHost: player.isHost,
    score: player.score,
    guessCount: player.guesses.length,
    done: player.done,
    solved: player.solvedAt !== null,
    guesses: showFull ? player.guesses : player.guesses.map((g) => hiddenGuess(g)),
  };
}

/** 生成给指定观察者的房间快照；小局结束后对所有人揭示完整反馈 */
export function publicRoom(room: Room, viewerKey: string): PublicRoom {
  const viewer = room.players.find((p) => p.key === viewerKey);
  const revealAll = room.status === 'roundEnd' || room.status === 'finished';
  return {
    code: room.code,
    boType: room.boType,
    difficulty: room.difficulty,
    status: room.status,
    round: room.round,
    maxGuesses: MAX_GUESSES,
    winsNeeded: winsNeeded(room.boType),
    roundDurationMs: config.roundDurationMs,
    roundEndsAt: room.roundEndsAt,
    nextRoundAt: room.nextRoundAt,
    players: activePlayers(room).map((p) => toPublicPlayer(p, viewer, revealAll)),
    spectators: spectators(room).map((s) => ({ key: s.key, name: s.name, connected: s.connected })),
    roundResult: room.roundResult,
    matchResult: room.matchResult,
    revision: room.revision,
    viewerKey,
  };
}

export function roomCount(): number {
  return rooms.size;
}

/** 仅用于测试：清空全部房间 */
export function resetRooms(): void {
  rooms.clear();
}
