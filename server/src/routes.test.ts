import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { CHARACTERS, MAX_GUESSES, pickDailyAnswer, toDateKey } from '@yozu/shared';
import { createApp } from './app.js';
import { resetSessions } from './gameStore.js';

const app = createApp();

beforeEach(() => {
  resetSessions();
});

async function startGame(body: Record<string, unknown> = {}) {
  const res = await request(app).post('/api/game/start').send(body).expect(201);
  return res.body.state as {
    sessionId: string;
    status: string;
    remaining: number;
    maxGuesses: number;
    answer: unknown;
  };
}

describe('meta endpoints', () => {
  it('reports health', async () => {
    await request(app).get('/api/health').expect(200, { ok: true });
  });

  it('exposes pool sizes and max guesses', async () => {
    const res = await request(app).get('/api/meta').expect(200);
    expect(res.body.maxGuesses).toBe(MAX_GUESSES);
    expect(res.body.totalCharacters).toBe(CHARACTERS.length);
    expect(res.body.poolSizes.full).toBe(CHARACTERS.length);
    expect(res.body.poolSizes.heroine).toBeGreaterThan(0);
  });

  it('character list hides answer attributes', async () => {
    const res = await request(app).get('/api/characters').expect(200);
    expect(res.body.characters).toHaveLength(CHARACTERS.length);
    expect(Object.keys(res.body.characters[0]).sort()).toEqual(['id', 'name', 'nameJp']);
  });

  it('search matches by name', async () => {
    const res = await request(app).get('/api/characters/search?q=宁宁').expect(200);
    expect(res.body.characters.some((c: { name: string }) => c.name === '绫地宁宁')).toBe(true);
  });

  it('codex exposes full profiles with cv aliases', async () => {
    const res = await request(app).get('/api/codex').expect(200);
    const nene = res.body.characters.find((c: { id: number }) => c.id === 1);
    expect(nene.hair).toBe('白');
    expect(nene.cvAliases).toContain('沢泽砂羽');
  });

  it('returns 404 json for unknown api routes', async () => {
    await request(app).get('/api/nope').expect(404, { code: 'NOT_FOUND' });
  });
});

describe('game lifecycle', () => {
  it('starts a game without leaking the answer', async () => {
    const state = await startGame({ mode: 'free', difficulty: 'heroine' });
    expect(state.status).toBe('playing');
    expect(state.answer).toBeNull();
    expect(state.remaining).toBe(MAX_GUESSES);
  });

  it('rejects invalid start payloads', async () => {
    await request(app)
      .post('/api/game/start')
      .send({ difficulty: 'nightmare' })
      .expect(400, { code: 'INVALID_PAYLOAD' });
  });

  it('returns feedback for a guess and keeps it in state', async () => {
    const state = await startGame();
    const res = await request(app)
      .post('/api/game/guess')
      .send({ sessionId: state.sessionId, characterId: 1 })
      .expect(200);
    expect(res.body.feedback.characterId).toBe(1);
    expect(res.body.feedback.attributes.hair.value).toBe('白');
    expect(res.body.state.guesses).toHaveLength(1);
    expect(res.body.state.remaining).toBe(MAX_GUESSES - 1);
  });

  it('rejects duplicate guesses', async () => {
    const state = await startGame();
    await request(app).post('/api/game/guess').send({ sessionId: state.sessionId, characterId: 1 }).expect(200);
    await request(app)
      .post('/api/game/guess')
      .send({ sessionId: state.sessionId, characterId: 1 })
      .expect(400, { code: 'DUPLICATE_GUESS' });
  });

  it('rejects unknown characters and unknown sessions', async () => {
    const state = await startGame();
    await request(app)
      .post('/api/game/guess')
      .send({ sessionId: state.sessionId, characterId: 99999 })
      .expect(400, { code: 'CHARACTER_NOT_FOUND' });
    await request(app)
      .post('/api/game/guess')
      .send({ sessionId: 'nope', characterId: 1 })
      .expect(404, { code: 'SESSION_NOT_FOUND' });
    await request(app).get('/api/game/nope').expect(404, { code: 'SESSION_NOT_FOUND' });
  });

  it('wins when guessing the daily answer and reveals it', async () => {
    const dateKey = toDateKey(new Date());
    const answer = pickDailyAnswer('heroine', dateKey);
    const state = await startGame({ mode: 'daily', difficulty: 'heroine' });
    const res = await request(app)
      .post('/api/game/guess')
      .send({ sessionId: state.sessionId, characterId: answer.id })
      .expect(200);
    expect(res.body.feedback.correct).toBe(true);
    expect(res.body.state.status).toBe('won');
    expect(res.body.state.answer.id).toBe(answer.id);
  });

  it('locks the game after a win', async () => {
    const answer = pickDailyAnswer('heroine', toDateKey(new Date()));
    const state = await startGame({ mode: 'daily', difficulty: 'heroine' });
    await request(app)
      .post('/api/game/guess')
      .send({ sessionId: state.sessionId, characterId: answer.id })
      .expect(200);
    const other = CHARACTERS.find((c) => c.id !== answer.id)!;
    await request(app)
      .post('/api/game/guess')
      .send({ sessionId: state.sessionId, characterId: other.id })
      .expect(400, { code: 'GAME_FINISHED' });
  });

  it('loses after MAX_GUESSES wrong guesses and exposes the answer', async () => {
    const answer = pickDailyAnswer('heroine', toDateKey(new Date()));
    const state = await startGame({ mode: 'daily', difficulty: 'heroine' });
    const wrong = CHARACTERS.filter((c) => c.id !== answer.id).slice(0, MAX_GUESSES);
    let last;
    for (const c of wrong) {
      last = await request(app)
        .post('/api/game/guess')
        .send({ sessionId: state.sessionId, characterId: c.id })
        .expect(200);
    }
    expect(last!.body.state.status).toBe('lost');
    expect(last!.body.state.remaining).toBe(0);
    expect(last!.body.state.answer.id).toBe(answer.id);
  });

  it('reveal marks an unfinished game as revealed', async () => {
    const state = await startGame();
    const res = await request(app)
      .post('/api/game/reveal')
      .send({ sessionId: state.sessionId })
      .expect(200);
    expect(res.body.state.status).toBe('revealed');
    expect(res.body.state.answer).not.toBeNull();
    await request(app)
      .post('/api/game/reveal')
      .send({ sessionId: 'nope' })
      .expect(404, { code: 'SESSION_NOT_FOUND' });
  });

  it('daily mode uses the same answer across sessions', async () => {
    const a = await startGame({ mode: 'daily', difficulty: 'full' });
    const b = await startGame({ mode: 'daily', difficulty: 'full' });
    const ra = await request(app).post('/api/game/reveal').send({ sessionId: a.sessionId }).expect(200);
    const rb = await request(app).post('/api/game/reveal').send({ sessionId: b.sessionId }).expect(200);
    expect(ra.body.state.answer.id).toBe(rb.body.state.answer.id);
  });

  it('resumes an in-progress game by session id', async () => {
    const state = await startGame();
    await request(app).post('/api/game/guess').send({ sessionId: state.sessionId, characterId: 2 }).expect(200);
    const res = await request(app).get(`/api/game/${state.sessionId}`).expect(200);
    expect(res.body.state.guesses).toHaveLength(1);
    expect(res.body.state.answer).toBeNull();
  });
});
