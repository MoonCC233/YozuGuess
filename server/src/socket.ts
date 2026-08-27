import type { Server, Socket } from 'socket.io';
import { z } from 'zod';
import {
  applyGuess,
  createRoom,
  findRoomByPlayerKey,
  getRoom,
  publicRoom,
  resetMatch,
  startRound,
  tickRooms,
  type BoType,
  type GameMode,
  type RoomPlayer,
  type StoredRoom,
} from './roomStore.js';
import { getCharacter, hiddenGuess } from '@yozu/shared';

interface PlayerMeta {
  key: string;
  name: string;
}

const joinSchema = z.object({
  code: z.string().length(5),
  name: z.string().min(1).max(16),
  asSpectator: z.boolean().optional(),
});
const rejoinSchema = z.object({ code: z.string().length(5), key: z.string().min(1) });
const guessSchema = z.object({ characterId: z.number().int().positive() });
const createSchema = z.object({
  name: z.string().min(1).max(16),
  boType: z.union([z.literal(1), z.literal(3), z.literal(5), z.literal(7)]),
  gameMode: z.enum(['bo', 'relay']),
  roundDurationMs: z.number().int().positive().default(120000),
});

function emitRoom(io: Server, room: StoredRoom) {
  for (const p of [...room.players, ...room.spectators]) {
    if (!p.socketId) continue;
    io.to(p.socketId).emit('room:state', publicRoom(room, p.key));
  }
}

/** 安全解析 socket 负载；失败时通过 ack 返回错误，避免未捕获异常导致整个服务崩溃 */
function safeParse<T>(
  schema: z.ZodType<T>,
  payload: unknown,
  ack?: (res: any) => void
): T | null {
  const result = schema.safeParse(payload);
  if (!result.success) {
    ack?.({ error: 'INVALID_PAYLOAD', details: result.error.issues });
    return null;
  }
  return result.data;
}

export function registerSocket(io: Server) {
  // 每秒驱动小局计时与间歇自动开下一局
  const timer = setInterval(() => {
    const changed = tickRooms();
    for (const room of changed) {
      emitRoom(io, room);
      if (room.status === 'roundEnd' || room.status === 'finished') {
        const target = getCharacter(room.targetCharacterId);
        for (const p of [...room.players, ...room.spectators]) {
          if (!p.socketId) continue;
          io.to(p.socketId).emit('room:round:end', {
            round: room.round,
            result: room.roundResult,
            matchResult: room.matchResult,
            answer: target
              ? { id: target.id, name: target.name, nameJp: target.nameJp, title: target.title, rank: target.rank }
              : null,
          });
        }
      }
    }
  }, 1000);
  io.on('connection', (socket: Socket) => {
    const meta: PlayerMeta = { key: '', name: '' };

    socket.on('room:create', (payload, ack) => {
      const parsed = safeParse(createSchema, payload, ack);
      if (!parsed) return;
      const { name, boType, gameMode, roundDurationMs } = parsed;
      const room = createRoom({ hostName: name, boType: boType as BoType, gameMode: gameMode as GameMode, roundDurationMs: roundDurationMs ?? 120000 });
      const player = room.players[0];
      player.socketId = socket.id;
      player.connected = true;
      meta.key = player.key;
      meta.name = name;
      socket.join(room.code);
      ack?.({ code: room.code, key: player.key, room: publicRoom(room, player.key) });
    });

    socket.on('room:join', (payload, ack) => {
      const parsed = safeParse(joinSchema, payload, ack);
      if (!parsed) return;
      const { code, name, asSpectator } = parsed;
      const room = getRoom(code);
      if (!room) return ack?.({ error: 'ROOM_NOT_FOUND' });
      if (room.status === 'playing' && !asSpectator) return ack?.({ error: 'ROOM_IN_PROGRESS' });

      // 同一 socket 已在房间内（大厅加入后跳转到房间页、或 StrictMode 重复挂载）时复用，避免重复玩家
      const existing = [...room.players, ...room.spectators].find((p) => p.socketId === socket.id);
      if (existing) {
        existing.connected = true;
        existing.name = name;
        existing.spectator = Boolean(asSpectator);
        meta.key = existing.key;
        meta.name = name;
        socket.join(room.code);
        ack?.({ code: room.code, key: existing.key, room: publicRoom(room, existing.key) });
        emitRoom(io, room);
        return;
      }

      const key = `${socket.id}_${Math.random().toString(36).slice(2, 7)}`;
      const player: RoomPlayer = {
        key,
        name,
        socketId: socket.id,
        connected: true,
        score: 0,
        guesses: [],
        guessTimes: [],
        lastGuessAt: 0,
        eliminated: false,
        skipped: false,
        isHost: false,
        spectator: Boolean(asSpectator),
      };
      if (asSpectator) room.spectators.push(player);
      else room.players.push(player);
      meta.key = key;
      meta.name = name;
      socket.join(room.code);
      ack?.({ code: room.code, key, room: publicRoom(room, key) });
      emitRoom(io, room);
    });

    // 断线重连：用之前保存的 key 重新认领身份
    socket.on('room:rejoin', (payload, ack) => {
      const parsed = safeParse(rejoinSchema, payload, ack);
      if (!parsed) return;
      const { code, key } = parsed;
      const room = getRoom(code);
      if (!room) return ack?.({ error: 'ROOM_NOT_FOUND' });
      const player = [...room.players, ...room.spectators].find((p) => p.key === key);
      if (!player) return ack?.({ error: 'PLAYER_NOT_FOUND' });
      player.socketId = socket.id;
      player.connected = true;
      meta.key = key;
      meta.name = player.name;
      socket.join(room.code);
      ack?.({ code: room.code, key, room: publicRoom(room, key) });
    });

    socket.on('room:start', (_payload, ack) => {
      const room = findRoomByPlayerKey(meta.key);
      if (!room) return ack?.({ error: 'ROOM_NOT_FOUND' });
      const me = room.players.find((p) => p.key === meta.key);
      if (!me?.isHost) return ack?.({ error: 'NOT_HOST' });
      if (room.players.length < 2) return ack?.({ error: 'NEED_MORE_PLAYERS' });
      if (room.status === 'finished') resetMatch(room);
      startRound(room);
      emitRoom(io, room);
      ack?.({ ok: true });
    });

    socket.on('room:guess', (payload, ack) => {
      const room = findRoomByPlayerKey(meta.key);
      if (!room) return ack?.({ error: 'ROOM_NOT_FOUND' });
      if (room.status !== 'playing') return ack?.({ error: 'NOT_PLAYING' });
      const parsed = safeParse(guessSchema, payload, ack);
      if (!parsed) return;
      const { characterId } = parsed;
      const result = applyGuess(room, meta.key, characterId);
      if (result.kind === 'error') return ack?.({ error: result.code });
      if (result.kind === 'duplicate') return ack?.({ duplicate: true, feedback: result.feedback });

      // 广播给所有玩家（对手看到隐藏版反馈）
      for (const p of [...room.players, ...room.spectators]) {
        if (!p.socketId) continue;
        const isSelf = p.key === meta.key;
        const isSpectator = p.spectator;
        io.to(p.socketId).emit('room:guess:applied', {
          round: result.round,
          correct: result.correct,
          shouldFinish: result.shouldFinish,
          revision: result.revision,
          feedback: isSelf || isSpectator ? result.feedback : hiddenGuess(result.feedback!),
        });
      }
      emitRoom(io, room);
      ack?.({ ok: true });
    });

    socket.on('room:leave', () => {
      const room = findRoomByPlayerKey(meta.key);
      if (!room) return;
      room.players = room.players.filter((p) => p.key !== meta.key);
      room.spectators = room.spectators.filter((p) => p.key !== meta.key);
      socket.leave(room.code);
      emitRoom(io, room);
    });

    socket.on('disconnect', () => {
      const room = findRoomByPlayerKey(meta.key);
      if (!room) return;
      const player = [...room.players, ...room.spectators].find((p) => p.key === meta.key);
      if (player) player.connected = false;
      emitRoom(io, room);
    });
  });

  // 进程退出时清理定时器
  io.engine.on('close', () => clearInterval(timer));
}
