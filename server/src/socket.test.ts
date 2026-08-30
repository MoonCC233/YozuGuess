import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { io as connect, type Socket as ClientSocket } from 'socket.io-client';
import { CHARACTERS, MAX_GUESSES, getCharacter, type PublicRoom } from '@yozu/shared';
import { createServerBundle, type YozuServer } from './server.js';
import { closeDatabase, useMemoryDatabase } from './db.js';
import { register } from './accounts.js';
import { getRoom, resetRooms } from './roomEngine.js';
import { resetRateLimits } from './rateLimit.js';

let server: YozuServer;
let url: string;
const clients: ClientSocket[] = [];

beforeEach(async () => {
  useMemoryDatabase();
  resetRooms();
  resetRateLimits();
  server = createServerBundle();
  await new Promise<void>((resolve) => server.http.listen(0, resolve));
  const address = server.http.address();
  if (typeof address === 'object' && address !== null) url = `http://127.0.0.1:${address.port}`;
});

afterEach(async () => {
  for (const c of clients.splice(0)) c.disconnect();
  await server.close();
  closeDatabase();
});

function cookieOf(res: request.Response): string {
  const raw = res.headers['set-cookie'];
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const found = list.find((c) => c.startsWith('yozu_session='));
  if (!found) throw new Error('missing session cookie');
  return found.split(';')[0]!;
}

/** 联机全部要求登录，测试里先建号再拿会话 cookie */
async function signIn(username: string): Promise<string> {
  const created = register(username, 'hunter2hunter2');
  if (!created.ok) throw new Error(created.error);
  const res = await request(server.http)
    .post('/api/auth/login')
    .send({ username, password: 'hunter2hunter2' })
    .expect(200);
  return cookieOf(res);
}

function client(cookie?: string): Promise<ClientSocket> {
  const socket = connect(url, {
    transports: ['websocket'],
    forceNew: true,
    ...(cookie ? { extraHeaders: { Cookie: cookie } } : {}),
  });
  clients.push(socket);
  return new Promise((resolve, reject) => {
    socket.on('connect', () => resolve(socket));
    socket.on('connect_error', reject);
  });
}

/** 登录并直接建立一条带会话的 socket 连接 */
async function signedClient(username: string): Promise<ClientSocket> {
  return client(await signIn(username));
}

type AckOk<T> = { ok: true; data: T };
type AckErr = { ok: false; error: string };

function emit<T>(socket: ClientSocket, event: string, payload?: unknown): Promise<AckOk<T> | AckErr> {
  return new Promise((resolve) => {
    socket.emit(event, payload ?? {}, (res: AckOk<T> | AckErr) => resolve(res));
  });
}

/** 等待下一次 room:state 推送 */
function nextState(socket: ClientSocket): Promise<PublicRoom> {
  return new Promise((resolve) => socket.once('room:state', resolve));
}

/**
 * 等待满足条件的 room:state。
 * 广播与 ack 走不同连接，到达顺序没有保证，因此按条件筛选而不是只取下一条。
 */
function waitForState(
  socket: ClientSocket,
  predicate: (room: PublicRoom) => boolean,
  timeoutMs = 2000
): Promise<PublicRoom> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off('room:state', onState);
      reject(new Error('timed out waiting for room:state'));
    }, timeoutMs);
    function onState(room: PublicRoom) {
      if (!predicate(room)) return;
      clearTimeout(timer);
      socket.off('room:state', onState);
      resolve(room);
    }
    socket.on('room:state', onState);
  });
}

interface JoinData {
  code: string;
  key: string;
  room: PublicRoom;
}

async function makeMatch(boType: 1 | 3 | 5 | 7 = 3) {
  const hostSocket = await signedClient('主机');
  const guestSocket = await signedClient('客人');
  const created = await emit<JoinData>(hostSocket, 'room:create', {
    boType,
    difficulty: 'easy',
  });
  if (!created.ok) throw new Error(created.error);
  const joined = await emit<JoinData>(guestSocket, 'room:join', {
    code: created.data.code,
  });
  if (!joined.ok) throw new Error(joined.error);
  // 建房时用随机答案，测试里直接读服务端房间状态拿答案
  const room = getRoom(created.data.code)!;
  return {
    hostSocket,
    guestSocket,
    code: created.data.code,
    hostKey: created.data.key,
    guestKey: joined.data.key,
    room,
  };
}

describe('socket handshake', () => {
  it('creates and joins a room, broadcasting state to everyone', async () => {
    const hostSocket = await signedClient('主机');
    const created = await emit<JoinData>(hostSocket, 'room:create', {});
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.data.code).toMatch(/^[A-Z2-9]{5}$/);
    expect(created.data.room.players).toHaveLength(1);
    expect(created.data.room.boType).toBe(3);

    const guestSocket = await signedClient('客人');
    const pushed = nextState(hostSocket);
    const joined = await emit<JoinData>(guestSocket, 'room:join', {
      code: created.data.code.toLowerCase(),
    });
    expect(joined.ok).toBe(true);
    const state = await pushed;
    expect(state.players.map((p) => p.name)).toEqual(['主机', '客人']);
  });

  it('requires an account before creating or joining a room', async () => {
    const anon = await client();
    expect(await emit(anon, 'room:create', {})).toEqual({ ok: false, error: 'AUTH_REQUIRED' });

    const hostSocket = await signedClient('房主');
    const created = await emit<JoinData>(hostSocket, 'room:create', {});
    if (!created.ok) throw new Error(created.error);
    expect(await emit(anon, 'room:join', { code: created.data.code })).toEqual({
      ok: false,
      error: 'AUTH_REQUIRED',
    });
  });

  it('rejects the same account joining a room twice', async () => {
    const cookie = await signIn('分身');
    const first = await client(cookie);
    const created = await emit<JoinData>(first, 'room:create', {});
    if (!created.ok) throw new Error(created.error);
    const second = await client(cookie);
    expect(await emit(second, 'room:join', { code: created.data.code })).toEqual({
      ok: false,
      error: 'NAME_TAKEN',
    });
  });

  it('validates payloads and reports unknown rooms', async () => {
    const socket = await signedClient('校验');
    expect(await emit(socket, 'room:create', { boType: 2 })).toEqual({ ok: false, error: 'INVALID_PAYLOAD' });
    expect(await emit(socket, 'room:join', { code: 'ABC' })).toEqual({
      ok: false,
      error: 'INVALID_PAYLOAD',
    });
    expect(await emit(socket, 'room:join', { code: 'ZZZZZ' })).toEqual({
      ok: false,
      error: 'ROOM_NOT_FOUND',
    });
  });

  it('only lets the host start, and needs two players', async () => {
    const hostSocket = await signedClient('主机');
    const created = await emit<JoinData>(hostSocket, 'room:create', {});
    if (!created.ok) return;
    expect(await emit(hostSocket, 'room:start')).toEqual({ ok: false, error: 'NEED_MORE_PLAYERS' });

    const guestSocket = await signedClient('客人');
    await emit(guestSocket, 'room:join', { code: created.data.code });
    expect(await emit(guestSocket, 'room:start')).toEqual({ ok: false, error: 'NOT_HOST' });
    const started = await emit<{ room: PublicRoom }>(hostSocket, 'room:start');
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    expect(started.data.room.status).toBe('playing');
    expect(started.data.room.round).toBe(1);
  });
});

describe('socket gameplay', () => {
  it('gives the guesser full feedback and the opponent a hidden one', async () => {
    const { hostSocket, guestSocket, guestKey, room } = await makeMatch(5);
    await emit(hostSocket, 'room:start');
    const wrong = CHARACTERS.find((c) => c.id !== room.answerId)!;

    const hostSees = waitForState(hostSocket, (r) => r.players.some((p) => p.guessCount > 0));
    const guessed = await emit<{ feedback: { name: string }; roundOver: boolean }>(guestSocket, 'room:guess', {
      characterId: wrong.id,
    });
    expect(guessed.ok).toBe(true);
    if (!guessed.ok) return;
    expect(guessed.data.feedback.name).toBe(wrong.name);
    expect(guessed.data.roundOver).toBe(false);

    const state = await hostSees;
    const opponent = state.players.find((p) => p.key === guestKey)!;
    expect(opponent.guessCount).toBe(1);
    expect(opponent.guesses[0]).toMatchObject({ hidden: true });
    expect(JSON.stringify(opponent.guesses)).not.toContain(wrong.name);
  });

  it('rejects guesses before the round starts and duplicates during it', async () => {
    const { hostSocket, room } = await makeMatch();
    const some = CHARACTERS[0]!;
    expect(await emit(hostSocket, 'room:guess', { characterId: some.id })).toEqual({
      ok: false,
      error: 'NOT_PLAYING',
    });
    await emit(hostSocket, 'room:start');
    const wrong = CHARACTERS.find((c) => c.id !== room.answerId)!;
    expect((await emit(hostSocket, 'room:guess', { characterId: wrong.id })).ok).toBe(true);
    expect(await emit(hostSocket, 'room:guess', { characterId: wrong.id })).toEqual({
      ok: false,
      error: 'DUPLICATE_GUESS',
    });
    expect(await emit(hostSocket, 'room:guess', { characterId: -1 })).toEqual({
      ok: false,
      error: 'INVALID_PAYLOAD',
    });
  });

  it('ends the round and reveals the answer to both sides when solved', async () => {
    const { hostSocket, guestSocket, hostKey, room } = await makeMatch(5);
    await emit(hostSocket, 'room:start');
    const answer = getCharacter(room.answerId)!;
    const guestSees = waitForState(guestSocket, (r) => r.status === 'roundEnd');
    const res = await emit<{ roundOver: boolean }>(hostSocket, 'room:guess', { characterId: answer.id });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.roundOver).toBe(true);

    const state = await guestSees;
    expect(state.status).toBe('roundEnd');
    expect(state.roundResult).toMatchObject({ round: 1, winnerKey: hostKey, reason: 'solved' });
    expect(state.roundResult?.answer?.id).toBe(answer.id);
    expect(state.players.find((p) => p.key === hostKey)?.score).toBe(1);
  });

  it('finishes a BO1 match in one round', async () => {
    const { hostSocket, hostKey, room } = await makeMatch(1);
    await emit(hostSocket, 'room:start');
    const answer = getCharacter(room.answerId)!;
    const pushed = waitForState(hostSocket, (r) => r.status === 'finished');
    await emit(hostSocket, 'room:guess', { characterId: answer.id });
    const state = await pushed;
    expect(state.status).toBe('finished');
    expect(state.matchResult).toEqual({ winnerKey: hostKey, reason: 'score' });
  });

  it('marks a player done after MAX_GUESSES', async () => {
    const { hostSocket, hostKey, room } = await makeMatch(5);
    await emit(hostSocket, 'room:start');
    const wrong = CHARACTERS.filter((c) => c.id !== room.answerId).slice(0, MAX_GUESSES);
    for (const c of wrong) {
      expect((await emit(hostSocket, 'room:guess', { characterId: c.id })).ok).toBe(true);
    }
    expect(await emit(hostSocket, 'room:guess', { characterId: room.answerId })).toEqual({
      ok: false,
      error: 'GUESS_LIMIT_REACHED',
    });
    expect(getRoom(room.code)!.players.find((p) => p.key === hostKey)!.done).toBe(true);
  });

  it('lets spectators watch with full feedback but not guess', async () => {
    const { hostSocket, code, room } = await makeMatch(5);
    const watcher = await signedClient('观众');
    const joined = await emit<JoinData>(watcher, 'room:join', { code, spectator: true });
    expect(joined.ok).toBe(true);
    await emit(hostSocket, 'room:start');
    const wrong = CHARACTERS.find((c) => c.id !== room.answerId)!;
    const watcherSees = waitForState(watcher, (r) => r.players.some((p) => p.guessCount > 0));
    await emit(hostSocket, 'room:guess', { characterId: wrong.id });
    const state = await watcherSees;
    expect(state.spectators).toHaveLength(1);
    expect(state.players[0]!.guesses[0]).not.toHaveProperty('hidden');
    expect(await emit(watcher, 'room:guess', { characterId: wrong.id })).toEqual({
      ok: false,
      error: 'SPECTATOR_CANNOT_GUESS',
    });
  });
});

describe('socket resilience', () => {
  it('reconnects with the stored player key', async () => {
    const { guestSocket, code, guestKey } = await makeMatch();
    guestSocket.disconnect();
    const revived = await client();
    const back = await emit<JoinData>(revived, 'room:rejoin', { code, key: guestKey });
    expect(back.ok).toBe(true);
    if (!back.ok) return;
    expect(back.data.room.players.find((p) => p.key === guestKey)?.connected).toBe(true);
    expect(await emit(revived, 'room:rejoin', { code, key: 'nope' })).toEqual({
      ok: false,
      error: 'PLAYER_NOT_FOUND',
    });
  });

  it('awards the match to the survivor when the opponent leaves mid-round', async () => {
    const { hostSocket, guestSocket, hostKey } = await makeMatch(3);
    await emit(hostSocket, 'room:start');
    const pushed = waitForState(hostSocket, (r) => r.status === 'finished');
    await emit(guestSocket, 'room:leave');
    const state = await pushed;
    expect(state.status).toBe('finished');
    expect(state.matchResult).toEqual({ winnerKey: hostKey, reason: 'forfeit' });
  });

  it('resets the match for a rematch on host request', async () => {
    const { hostSocket, guestSocket, room } = await makeMatch(1);
    await emit(hostSocket, 'room:start');
    await emit(hostSocket, 'room:guess', { characterId: room.answerId });
    expect(await emit(guestSocket, 'room:reset')).toEqual({ ok: false, error: 'NOT_HOST' });
    const reset = await emit<{ room: PublicRoom }>(hostSocket, 'room:reset');
    expect(reset.ok).toBe(true);
    if (!reset.ok) return;
    expect(reset.data.room.status).toBe('waiting');
    expect(reset.data.room.players.every((p) => p.score === 0)).toBe(true);
  });

  it('flags a disconnect to the remaining players', async () => {
    const { hostSocket, guestSocket, guestKey } = await makeMatch();
    const pushed = waitForState(hostSocket, (r) => r.players.some((p) => p.key === guestKey && !p.connected));
    guestSocket.disconnect();
    const state = await pushed;
    expect(state.players.find((p) => p.key === guestKey)?.connected).toBe(false);
  });
});
