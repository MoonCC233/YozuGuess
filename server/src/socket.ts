import type { Server, Socket } from 'socket.io';
import { z } from 'zod';
import { type GuessFeedback, type PublicRoom, type RoomErrorCode } from '@yozu/shared';
import {
  applyGuess,
  createRoom,
  findRoomByPlayerKey,
  joinRoom,
  leaveRoom,
  markDisconnected,
  publicRoom,
  rejoinRoom,
  resetMatch,
  startRound,
  tickRooms,
  type Room,
} from './roomEngine.js';
import { consume } from './rateLimit.js';
import { config } from './config.js';
import { authenticate } from './accounts.js';
import { readSessionToken } from './auth.js';

export type Ack<T> = (response: { ok: true; data: T } | { ok: false; error: RoomErrorCode }) => void;

const nameSchema = z.string().trim().min(1).max(16);

const createSchema = z.object({
  name: nameSchema,
  boType: z.union([z.literal(1), z.literal(3), z.literal(5), z.literal(7)]).default(3),
  difficulty: z.enum(['heroine', 'full']).default('heroine'),
});

const joinSchema = z.object({
  code: z.string().trim().length(5),
  name: nameSchema,
  spectator: z.boolean().default(false),
});

const rejoinSchema = z.object({
  code: z.string().trim().length(5),
  key: z.string().min(1),
});

const guessSchema = z.object({
  characterId: z.number().int().positive(),
});

/** socket 上下文：记录该连接当前认领的玩家 key */
interface SocketMeta {
  key: string;
}

function reply<T>(ack: unknown, response: { ok: true; data: T } | { ok: false; error: RoomErrorCode }): void {
  if (typeof ack === 'function') (ack as Ack<T>)(response);
}

/** 向房间内每个人推送定制过的房间快照（各自视角） */
export function broadcastRoom(io: Server, room: Room): void {
  for (const player of room.players) {
    if (!player.socketId) continue;
    io.to(player.socketId).emit('room:state', publicRoom(room, player.key) satisfies PublicRoom);
  }
}

function limited(socket: Socket, name: string, limit: number): boolean {
  const identity = socket.handshake.address ?? socket.id;
  return !consume(`socket:${name}`, identity, limit, config.rateLimitWindowMs).allowed;
}

/**
 * 从握手 cookie 里认出登录用户。
 * 每次建房/加入时重新解析，长连接期间登出不影响已在进行的这一场。
 */
function socketUserId(socket: Socket): number | null {
  const token = readSessionToken(socket.handshake.headers.cookie);
  return authenticate(token)?.id ?? null;
}

export function registerSocket(io: Server): () => void {
  const timer = setInterval(() => {
    for (const room of tickRooms()) broadcastRoom(io, room);
  }, 1000);
  timer.unref?.();

  io.on('connection', (socket: Socket) => {
    const meta: SocketMeta = { key: '' };

    socket.on('room:create', (payload: unknown, ack: unknown) => {
      if (limited(socket, 'create', 10)) return reply(ack, { ok: false, error: 'RATE_LIMITED' });
      const parsed = createSchema.safeParse(payload ?? {});
      if (!parsed.success) return reply(ack, { ok: false, error: 'INVALID_PAYLOAD' });
      const created = createRoom({
        hostName: parsed.data.name,
        boType: parsed.data.boType,
        difficulty: parsed.data.difficulty,
        socketId: socket.id,
        userId: socketUserId(socket),
      });
      if (!created.ok) return reply(ack, { ok: false, error: created.error });
      const { room, player } = created.value;
      meta.key = player.key;
      void socket.join(room.code);
      reply(ack, { ok: true, data: { code: room.code, key: player.key, room: publicRoom(room, player.key) } });
    });

    socket.on('room:join', (payload: unknown, ack: unknown) => {
      if (limited(socket, 'join', 30)) return reply(ack, { ok: false, error: 'RATE_LIMITED' });
      const parsed = joinSchema.safeParse(payload ?? {});
      if (!parsed.success) return reply(ack, { ok: false, error: 'INVALID_PAYLOAD' });
      const joined = joinRoom(parsed.data.code.toUpperCase(), {
        name: parsed.data.name,
        socketId: socket.id,
        spectator: parsed.data.spectator,
        userId: socketUserId(socket),
      });
      if (!joined.ok) return reply(ack, { ok: false, error: joined.error });
      const { room, player } = joined.value;
      meta.key = player.key;
      void socket.join(room.code);
      broadcastRoom(io, room);
      reply(ack, { ok: true, data: { code: room.code, key: player.key, room: publicRoom(room, player.key) } });
    });

    socket.on('room:rejoin', (payload: unknown, ack: unknown) => {
      if (limited(socket, 'join', 30)) return reply(ack, { ok: false, error: 'RATE_LIMITED' });
      const parsed = rejoinSchema.safeParse(payload ?? {});
      if (!parsed.success) return reply(ack, { ok: false, error: 'INVALID_PAYLOAD' });
      const back = rejoinRoom(parsed.data.code.toUpperCase(), parsed.data.key, socket.id);
      if (!back.ok) return reply(ack, { ok: false, error: back.error });
      const { room, player } = back.value;
      meta.key = player.key;
      void socket.join(room.code);
      broadcastRoom(io, room);
      reply(ack, { ok: true, data: { code: room.code, key: player.key, room: publicRoom(room, player.key) } });
    });

    socket.on('room:start', (_payload: unknown, ack: unknown) => {
      const room = findRoomByPlayerKey(meta.key);
      if (!room) return reply(ack, { ok: false, error: 'ROOM_NOT_FOUND' });
      const me = room.players.find((p) => p.key === meta.key);
      if (!me?.isHost) return reply(ack, { ok: false, error: 'NOT_HOST' });
      if (room.status === 'finished') resetMatch(room);
      const started = startRound(room);
      if (!started.ok) return reply(ack, { ok: false, error: started.error });
      broadcastRoom(io, room);
      reply(ack, { ok: true, data: { room: publicRoom(room, meta.key) } });
    });

    socket.on('room:reset', (_payload: unknown, ack: unknown) => {
      const room = findRoomByPlayerKey(meta.key);
      if (!room) return reply(ack, { ok: false, error: 'ROOM_NOT_FOUND' });
      const me = room.players.find((p) => p.key === meta.key);
      if (!me?.isHost) return reply(ack, { ok: false, error: 'NOT_HOST' });
      resetMatch(room);
      broadcastRoom(io, room);
      reply(ack, { ok: true, data: { room: publicRoom(room, meta.key) } });
    });

    socket.on('room:guess', (payload: unknown, ack: unknown) => {
      if (limited(socket, 'guess', 120)) return reply(ack, { ok: false, error: 'RATE_LIMITED' });
      const room = findRoomByPlayerKey(meta.key);
      if (!room) return reply(ack, { ok: false, error: 'ROOM_NOT_FOUND' });
      const parsed = guessSchema.safeParse(payload ?? {});
      if (!parsed.success) return reply(ack, { ok: false, error: 'INVALID_PAYLOAD' });
      const result = applyGuess(room, meta.key, parsed.data.characterId);
      if (!result.ok) return reply(ack, { ok: false, error: result.error });
      broadcastRoom(io, room);
      reply<{ feedback: GuessFeedback; roundOver: boolean }>(ack, {
        ok: true,
        data: { feedback: result.value.feedback, roundOver: result.value.roundOver },
      });
    });

    socket.on('room:leave', (_payload: unknown, ack: unknown) => {
      const room = leaveRoom(meta.key);
      meta.key = '';
      if (room) {
        void socket.leave(room.code);
        broadcastRoom(io, room);
      }
      reply(ack, { ok: true, data: { left: true } });
    });

    socket.on('disconnect', () => {
      const room = markDisconnected(socket.id);
      if (room) broadcastRoom(io, room);
    });
  });

  return () => clearInterval(timer);
}
