import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { io as connect, type Socket as ClientSocket } from 'socket.io-client';
import { CHARACTERS, MAX_GUESSES, getCharacter, pickDailyAnswer, toDateKey, type PublicRoom } from '@yozu/shared';
import { createServerBundle, type YozuServer } from './server.js';
import { closeDatabase, useMemoryDatabase } from './db.js';
import { getHistory, getStats, register } from './accounts.js';
import { resetSessions } from './gameStore.js';
import { getRoom, resetRooms } from './roomEngine.js';
import { resetRateLimits } from './rateLimit.js';

let server: YozuServer;
let url: string;
const clients: ClientSocket[] = [];

beforeEach(async () => {
  useMemoryDatabase();
  resetSessions();
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

async function signIn(username: string): Promise<{ id: number; cookie: string }> {
  const created = register(username, 'hunter2hunter2');
  if (!created.ok) throw new Error(created.error);
  const res = await request(server.http)
    .post('/api/auth/login')
    .send({ username, password: 'hunter2hunter2' })
    .expect(200);
  return { id: created.value.user.id, cookie: cookieOf(res) };
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

type Ack<T> = { ok: true; data: T } | { ok: false; error: string };

function emit<T>(socket: ClientSocket, event: string, payload?: unknown): Promise<Ack<T>> {
  return new Promise((resolve) => {
    socket.emit(event, payload ?? {}, (res: Ack<T>) => resolve(res));
  });
}

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

describe('solo game recording', () => {
  it('records a win for a signed-in player', async () => {
    const { id, cookie } = await signIn('记录者');
    const answer = pickDailyAnswer('easy', toDateKey(new Date()));
    const start = await request(server.http)
      .post('/api/game/start')
      .set('Cookie', cookie)
      .send({ mode: 'daily', difficulty: 'easy' })
      .expect(201);
    await request(server.http)
      .post('/api/game/guess')
      .set('Cookie', cookie)
      .send({ sessionId: start.body.state.sessionId, characterId: answer.id })
      .expect(200);

    const stats = getStats(id, MAX_GUESSES);
    expect(stats.solo).toMatchObject({ played: 1, won: 1, bestGuesses: 1 });
    expect(stats.daily).toMatchObject({ played: 1, won: 1 });
    const { games } = getHistory(id);
    expect(games[0]).toMatchObject({ status: 'won', mode: 'daily', answerId: answer.id, guessCount: 1 });
  });

  it('records a loss after running out of guesses', async () => {
    const { id, cookie } = await signIn('输家');
    const answer = pickDailyAnswer('easy', toDateKey(new Date()));
    const start = await request(server.http)
      .post('/api/game/start')
      .set('Cookie', cookie)
      .send({ mode: 'daily', difficulty: 'easy' })
      .expect(201);
    const wrong = CHARACTERS.filter((c) => c.id !== answer.id).slice(0, MAX_GUESSES);
    for (const c of wrong) {
      await request(server.http)
        .post('/api/game/guess')
        .set('Cookie', cookie)
        .send({ sessionId: start.body.state.sessionId, characterId: c.id })
        .expect(200);
    }
    const stats = getStats(id, MAX_GUESSES);
    expect(stats.solo).toMatchObject({ played: 1, won: 0, winRate: 0 });
  });

  it('records a reveal and does not double count it', async () => {
    const { id, cookie } = await signIn('放弃者');
    const start = await request(server.http)
      .post('/api/game/start')
      .set('Cookie', cookie)
      .send({ mode: 'free', difficulty: 'easy' })
      .expect(201);
    await request(server.http)
      .post('/api/game/reveal')
      .set('Cookie', cookie)
      .send({ sessionId: start.body.state.sessionId })
      .expect(200);
    await request(server.http)
      .post('/api/game/reveal')
      .set('Cookie', cookie)
      .send({ sessionId: start.body.state.sessionId })
      .expect(200);
    const { games } = getHistory(id);
    expect(games).toHaveLength(1);
    expect(games[0]!.status).toBe('revealed');
  });

  it('keeps only the first daily result but records every free game', async () => {
    const { id, cookie } = await signIn('每日党');
    const answer = pickDailyAnswer('easy', toDateKey(new Date()));
    for (let i = 0; i < 2; i += 1) {
      const start = await request(server.http)
        .post('/api/game/start')
        .set('Cookie', cookie)
        .send({ mode: 'daily', difficulty: 'easy' })
        .expect(201);
      await request(server.http)
        .post('/api/game/guess')
        .set('Cookie', cookie)
        .send({ sessionId: start.body.state.sessionId, characterId: answer.id })
        .expect(200);
    }
    expect(getStats(id, MAX_GUESSES).daily.played).toBe(1);

    for (let i = 0; i < 2; i += 1) {
      const start = await request(server.http)
        .post('/api/game/start')
        .set('Cookie', cookie)
        .send({ mode: 'free', difficulty: 'easy' })
        .expect(201);
      await request(server.http)
        .post('/api/game/reveal')
        .set('Cookie', cookie)
        .send({ sessionId: start.body.state.sessionId })
        .expect(200);
    }
    expect(getStats(id, MAX_GUESSES).solo.played).toBe(3);
  });

  it('records nothing for an anonymous player', async () => {
    const start = await request(server.http)
      .post('/api/game/start')
      .send({ mode: 'free', difficulty: 'easy' })
      .expect(201);
    await request(server.http)
      .post('/api/game/reveal')
      .send({ sessionId: start.body.state.sessionId })
      .expect(200);
    const { id } = await signIn('旁人');
    expect(getStats(id, MAX_GUESSES).solo.played).toBe(0);
  });
});

describe('match recording', () => {
  it('records a win and a loss when a BO1 match ends', async () => {
    const host = await signIn('房主');
    const guest = await signIn('挑战者');
    const hostSocket = await client(host.cookie);
    const guestSocket = await client(guest.cookie);
    const created = await emit<{ code: string; key: string }>(hostSocket, 'room:create', {
      boType: 1,
      difficulty: 'easy',
    });
    if (!created.ok) throw new Error(created.error);
    const joined = await emit<{ key: string }>(guestSocket, 'room:join', {
      code: created.data.code,
    });
    if (!joined.ok) throw new Error(joined.error);

    await emit(hostSocket, 'room:start');
    const room = getRoom(created.data.code)!;
    const answer = getCharacter(room.answerId)!;
    const finished = waitForState(hostSocket, (r) => r.status === 'finished');
    await emit(hostSocket, 'room:guess', { characterId: answer.id });
    await finished;

    expect(getStats(host.id, MAX_GUESSES).match).toMatchObject({ played: 1, won: 1, lost: 0 });
    expect(getStats(guest.id, MAX_GUESSES).match).toMatchObject({ played: 1, won: 0, lost: 1 });
    const { matches } = getHistory(host.id);
    expect(matches[0]).toMatchObject({
      roomCode: created.data.code,
      boType: 1,
      result: 'won',
      ownScore: 1,
      rivalScore: 0,
      opponents: ['挑战者'],
      reason: 'score',
    });
  });

  it('records a forfeit for both sides when the opponent leaves', async () => {
    const host = await signIn('留守');
    const guest = await signIn('逃跑');
    const hostSocket = await client(host.cookie);
    const guestSocket = await client(guest.cookie);
    const created = await emit<{ code: string }>(hostSocket, 'room:create', { boType: 3 });
    if (!created.ok) throw new Error(created.error);
    await emit(guestSocket, 'room:join', { code: created.data.code });
    await emit(hostSocket, 'room:start');

    const finished = waitForState(hostSocket, (r) => r.status === 'finished');
    await emit(guestSocket, 'room:leave');
    await finished;

    expect(getStats(host.id, MAX_GUESSES).match).toMatchObject({ played: 1, won: 1 });
    const away = getHistory(guest.id).matches;
    expect(away[0]).toMatchObject({ result: 'lost', reason: 'forfeit' });
  });

  it('records a fresh row for a rematch', async () => {
    const host = await signIn('再战');
    const guest = await signIn('陪练');
    const hostSocket = await client(host.cookie);
    const guestSocket = await client(guest.cookie);
    const created = await emit<{ code: string }>(hostSocket, 'room:create', { boType: 1 });
    if (!created.ok) throw new Error(created.error);
    await emit(guestSocket, 'room:join', { code: created.data.code });

    for (let i = 0; i < 2; i += 1) {
      await emit(hostSocket, 'room:start');
      const room = getRoom(created.data.code)!;
      const finished = waitForState(hostSocket, (r) => r.status === 'finished');
      await emit(hostSocket, 'room:guess', { characterId: room.answerId });
      await finished;
      if (i === 0) await emit(hostSocket, 'room:reset');
    }

    expect(getStats(host.id, MAX_GUESSES).match).toMatchObject({ played: 2, won: 2 });
  });

  it('refuses to open a room for anonymous sockets', async () => {
    const hostSocket = await client();
    expect(await emit(hostSocket, 'room:create', { boType: 1 })).toEqual({
      ok: false,
      error: 'AUTH_REQUIRED',
    });
  });

  it('records the renamed username in the opponent snapshot', async () => {
    const host = await signIn('登录方');
    const guest = await signIn('旧名字');
    const hostSocket = await client(host.cookie);
    const guestSocket = await client(guest.cookie);
    // 改名后再进房，房间里应该用新名字
    await request(server.http)
      .post('/api/auth/username')
      .set('Cookie', guest.cookie)
      .send({ username: '新名字' })
      .expect(200);

    const created = await emit<{ code: string }>(hostSocket, 'room:create', { boType: 1 });
    if (!created.ok) throw new Error(created.error);
    await emit(guestSocket, 'room:join', { code: created.data.code });
    await emit(hostSocket, 'room:start');
    const room = getRoom(created.data.code)!;
    const finished = waitForState(hostSocket, (r) => r.status === 'finished');
    await emit(hostSocket, 'room:guess', { characterId: room.answerId });
    await finished;

    const { matches } = getHistory(host.id);
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({ result: 'won', opponents: ['新名字'] });
  });
});
