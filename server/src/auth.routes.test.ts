import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import { closeDatabase, useMemoryDatabase } from './db.js';
import { resetSessions } from './gameStore.js';
import { resetRateLimits } from './rateLimit.js';
import { recordMatch, recordSoloGame, register } from './accounts.js';

const app = createApp();

beforeEach(() => {
  useMemoryDatabase();
  resetSessions();
  resetRateLimits();
});

afterEach(() => {
  closeDatabase();
});

const CREDENTIALS = { username: '柚子社长', password: 'hunter2hunter2' };

/** supertest 不带 cookie jar，手工把 Set-Cookie 里的会话取出来复用 */
function sessionCookie(res: request.Response): string {
  const raw = res.headers['set-cookie'];
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const found = list.find((c) => c.startsWith('yozu_session='));
  if (!found) throw new Error('missing session cookie');
  return found.split(';')[0]!;
}

async function signUp(body = CREDENTIALS): Promise<string> {
  const res = await request(app).post('/api/auth/register').send(body).expect(201);
  return sessionCookie(res);
}

describe('auth endpoints', () => {
  it('registers a user and returns a session cookie', async () => {
    const res = await request(app).post('/api/auth/register').send(CREDENTIALS).expect(201);
    expect(res.body.user).toMatchObject({ username: CREDENTIALS.username });
    expect(res.body.user.id).toBeGreaterThan(0);
    expect(res.body.user).not.toHaveProperty('passwordHash');
    const cookie = sessionCookie(res);
    expect(cookie).toMatch(/^yozu_session=.+/);
    const header = (res.headers['set-cookie'] as unknown as string[]).join(';');
    expect(header).toMatch(/HttpOnly/i);
    expect(header).toMatch(/SameSite=Lax/i);
  });

  it('rejects a short password and a taken username', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'someone', password: 'short' })
      .expect(400, { code: 'PASSWORD_WEAK' });
    await signUp();
    await request(app)
      .post('/api/auth/register')
      .send({ ...CREDENTIALS, password: 'anotherpassword' })
      .expect(409, { code: 'USERNAME_TAKEN' });
  });

  it('rejects an invalid username and a malformed payload', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'has space', password: 'hunter2hunter2' })
      .expect(400, { code: 'USERNAME_INVALID' });
    await request(app).post('/api/auth/register').send({}).expect(400, { code: 'INVALID_PAYLOAD' });
  });

  it('logs in with the right password and refuses the wrong one', async () => {
    await signUp();
    const ok = await request(app).post('/api/auth/login').send(CREDENTIALS).expect(200);
    expect(ok.body.user.username).toBe(CREDENTIALS.username);
    expect(sessionCookie(ok)).toBeTruthy();
    await request(app)
      .post('/api/auth/login')
      .send({ ...CREDENTIALS, password: 'wrongpassword' })
      .expect(401, { code: 'INVALID_CREDENTIALS' });
  });

  it('does not reveal whether an unknown username exists', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({ username: 'nobodyhere', password: 'hunter2hunter2' })
      .expect(401, { code: 'INVALID_CREDENTIALS' });
  });

  it('reports the current user only with a valid cookie', async () => {
    const cookie = await signUp();
    await request(app).get('/api/auth/me').expect(200, { user: null });
    const me = await request(app).get('/api/auth/me').set('Cookie', cookie).expect(200);
    expect(me.body.user.username).toBe(CREDENTIALS.username);
    await request(app)
      .get('/api/auth/me')
      .set('Cookie', 'yozu_session=not-a-real-token')
      .expect(200, { user: null });
  });

  it('logout clears the cookie and invalidates the session', async () => {
    const cookie = await signUp();
    const out = await request(app).post('/api/auth/logout').set('Cookie', cookie).expect(200);
    expect((out.headers['set-cookie'] as unknown as string[]).join(';')).toMatch(/yozu_session=;/);
    await request(app).get('/api/auth/me').set('Cookie', cookie).expect(200, { user: null });
  });

  it('changes the password and revokes other sessions', async () => {
    const first = await signUp();
    const second = sessionCookie(
      await request(app).post('/api/auth/login').send(CREDENTIALS).expect(200)
    );
    await request(app)
      .post('/api/auth/password')
      .set('Cookie', second)
      .send({ currentPassword: CREDENTIALS.password, newPassword: 'brandnewsecret' })
      .expect(200, { ok: true });
    // 发起改密的会话继续可用，其他会话被踢下线
    const me = await request(app).get('/api/auth/me').set('Cookie', second).expect(200);
    expect(me.body.user.username).toBe(CREDENTIALS.username);
    await request(app).get('/api/auth/me').set('Cookie', first).expect(200, { user: null });
    await request(app)
      .post('/api/auth/login')
      .send({ ...CREDENTIALS, password: 'brandnewsecret' })
      .expect(200);
  });

  it('rejects a password change with the wrong current password', async () => {
    const cookie = await signUp();
    await request(app)
      .post('/api/auth/password')
      .set('Cookie', cookie)
      .send({ currentPassword: 'notmypassword', newPassword: 'brandnewsecret' })
      .expect(401, { code: 'INVALID_CREDENTIALS' });
  });

  it('renames the account and keeps the session usable', async () => {
    const cookie = await signUp();
    const res = await request(app)
      .post('/api/auth/username')
      .set('Cookie', cookie)
      .send({ username: '柚子新社长' })
      .expect(200);
    expect(res.body.user).toMatchObject({ username: '柚子新社长' });
    const me = await request(app).get('/api/auth/me').set('Cookie', cookie).expect(200);
    expect(me.body.user.username).toBe('柚子新社长');
    await request(app)
      .post('/api/auth/login')
      .send({ username: '柚子新社长', password: CREDENTIALS.password })
      .expect(200);
    await request(app).post('/api/auth/login').send(CREDENTIALS).expect(401);
  });

  it('rejects a rename to a taken or malformed username', async () => {
    const cookie = await signUp();
    await signUp({ username: '别人家的名字', password: 'hunter2hunter2' });
    await request(app)
      .post('/api/auth/username')
      .set('Cookie', cookie)
      .send({ username: '别人家的名字' })
      .expect(409, { code: 'USERNAME_TAKEN' });
    await request(app)
      .post('/api/auth/username')
      .set('Cookie', cookie)
      .send({ username: 'x' })
      .expect(400, { code: 'USERNAME_INVALID' });
    await request(app)
      .post('/api/auth/username')
      .set('Cookie', cookie)
      .send({})
      .expect(400, { code: 'INVALID_PAYLOAD' });
  });

  it('requires login for the protected endpoints', async () => {
    await request(app)
      .post('/api/auth/password')
      .send({ currentPassword: 'hunter2hunter2', newPassword: 'brandnewsecret' })
      .expect(401, { code: 'UNAUTHORIZED' });
    await request(app).post('/api/auth/username').send({ username: '路人' }).expect(401, {
      code: 'UNAUTHORIZED',
    });
    await request(app).get('/api/me/stats').expect(401, { code: 'UNAUTHORIZED' });
    await request(app).get('/api/me/history').expect(401, { code: 'UNAUTHORIZED' });
  });
});

describe('account data endpoints', () => {
  it('returns empty stats for a fresh account', async () => {
    const cookie = await signUp();
    const res = await request(app).get('/api/me/stats').set('Cookie', cookie).expect(200);
    expect(res.body.stats.solo).toMatchObject({ played: 0, won: 0, winRate: 0, avgGuesses: null });
    expect(res.body.stats.match).toMatchObject({ played: 0, won: 0 });
    expect(res.body.stats.solo.distribution).toHaveLength(8);
  });

  it('reflects recorded games in stats and history', async () => {
    const cookie = await signUp();
    const me = await request(app).get('/api/auth/me').set('Cookie', cookie).expect(200);
    const userId = me.body.user.id as number;
    recordSoloGame({
      userId,
      mode: 'free',
      difficulty: 'easy',
      status: 'won',
      guessCount: 3,
      answerId: 1,
      answerName: '因幡めぐる',
      durationMs: 42_000,
      dateKey: null,
    });
    recordMatch({
      userId,
      roomCode: 'ABCD',
      boType: 3,
      difficulty: 'easy',
      result: 'won',
      ownScore: 2,
      rivalScore: 1,
      opponents: ['对手'],
      reason: 'score',
    });

    const stats = await request(app).get('/api/me/stats').set('Cookie', cookie).expect(200);
    expect(stats.body.stats.solo).toMatchObject({ played: 1, won: 1, winRate: 1, bestGuesses: 3 });
    expect(stats.body.stats.solo.distribution[2]).toBe(1);
    expect(stats.body.stats.match).toMatchObject({ played: 1, won: 1 });

    const history = await request(app).get('/api/me/history').set('Cookie', cookie).expect(200);
    expect(history.body.games).toHaveLength(1);
    expect(history.body.games[0]).toMatchObject({ answerName: '因幡めぐる', guessCount: 3 });
    expect(history.body.matches).toHaveLength(1);
    expect(history.body.matches[0]).toMatchObject({ roomCode: 'ABCD', opponents: ['对手'] });  });

  it('does not leak another account history', async () => {
    const mine = await signUp();
    const other = register('别人', 'hunter2hunter2');
    if (!other.ok) throw new Error(other.error);
    recordSoloGame({
      userId: other.value.user.id,
      mode: 'free',
      difficulty: 'easy',
      status: 'won',
      guessCount: 2,
      answerId: 2,
      answerName: '藤枝亜佐奈',
      durationMs: 1_000,
      dateKey: null,
    });
    const history = await request(app).get('/api/me/history').set('Cookie', mine).expect(200);
    expect(history.body.games).toHaveLength(0);
  });

  it('caps the history limit and tolerates junk values', async () => {
    const cookie = await signUp();
    await request(app).get('/api/me/history?limit=99999').set('Cookie', cookie).expect(200);
    await request(app).get('/api/me/history?limit=abc').set('Cookie', cookie).expect(200);
  });

  it('serves a public leaderboard ordered by wins', async () => {
    const alice = register('alice', 'hunter2hunter2');
    const bob = register('bob', 'hunter2hunter2');
    if (!alice.ok || !bob.ok) throw new Error('setup failed');
    for (let i = 0; i < 3; i += 1) {
      recordSoloGame({
        userId: alice.value.user.id,
        mode: 'free',
        difficulty: 'easy',
        status: 'won',
        guessCount: 2,
        answerId: i + 1,
        answerName: `角色${i}`,
        durationMs: 1_000,
        dateKey: null,
      });
    }
    recordSoloGame({
      userId: bob.value.user.id,
      mode: 'free',
      difficulty: 'easy',
      status: 'won',
      guessCount: 5,
      answerId: 9,
      answerName: '角色9',
      durationMs: 1_000,
      dateKey: null,
    });
    const res = await request(app).get('/api/leaderboard').expect(200);
    expect(res.body.entries[0]).toMatchObject({ username: 'alice', won: 3 });
    expect(res.body.entries[1]).toMatchObject({ username: 'bob', won: 1 });
  });
});
