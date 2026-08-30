import { io, type Socket } from 'socket.io-client';
import type { PublicRoom, RoomErrorCode, GuessFeedback, BoType, Difficulty } from '@yozu/shared';

export type SocketResponse<T> = { ok: true; data: T } | { ok: false; error: RoomErrorCode };

export interface RoomHandshake {
  code: string;
  key: string;
  room: PublicRoom;
}

export interface GuessAck {
  feedback: GuessFeedback;
  roundOver: boolean;
}

export class RoomError extends Error {
  constructor(readonly code: RoomErrorCode) {
    super(code);
    this.name = 'RoomError';
  }
}

let socket: Socket | null = null;

/** 惰性建立唯一连接，页面间复用 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io({ path: '/socket.io', transports: ['websocket', 'polling'], autoConnect: true });
  }
  return socket;
}

const ACK_TIMEOUT_MS = 8000;

/** 把 socket ack 包装成 Promise，失败时抛 RoomError */
export function emit<T>(event: string, payload?: unknown): Promise<T> {
  const s = getSocket();
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('SOCKET_TIMEOUT'));
    }, ACK_TIMEOUT_MS);

    s.emit(event, payload ?? {}, (response: SocketResponse<T>) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      if (response && response.ok) resolve(response.data);
      else reject(new RoomError(response ? response.error : 'INVALID_PAYLOAD'));
    });
  });
}

export function createRoom(input: { name: string; boType: BoType; difficulty: Difficulty }): Promise<RoomHandshake> {
  return emit<RoomHandshake>('room:create', input);
}

export function joinRoom(input: { code: string; name: string; spectator: boolean }): Promise<RoomHandshake> {
  return emit<RoomHandshake>('room:join', input);
}

export function rejoinRoom(input: { code: string; key: string }): Promise<RoomHandshake> {
  return emit<RoomHandshake>('room:rejoin', input);
}

export function startRound(): Promise<{ room: PublicRoom }> {
  return emit<{ room: PublicRoom }>('room:start');
}

export function resetMatch(): Promise<{ room: PublicRoom }> {
  return emit<{ room: PublicRoom }>('room:reset');
}

export function guess(characterId: number): Promise<GuessAck> {
  return emit<GuessAck>('room:guess', { characterId });
}

export function leaveRoom(): Promise<{ left: boolean }> {
  return emit<{ left: boolean }>('room:leave');
}
