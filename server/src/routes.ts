import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import {
  CHARACTERS,
  GAME_TITLES,
  MAX_GUESSES,
  getAnswerPool,
  getCvAliases,
  searchCharacters,
  type Character,
} from '@yozu/shared';
import { getGame, revealAnswer, startGame, submitGuess } from './gameStore.js';
import { rateLimit } from './rateLimit.js';
import { config } from './config.js';

const readLimit = rateLimit({
  name: 'read',
  limit: config.readRateLimit,
  windowMs: config.rateLimitWindowMs,
});
const writeLimit = rateLimit({
  name: 'write',
  limit: config.writeRateLimit,
  windowMs: config.rateLimitWindowMs,
});

const startSchema = z.object({
  mode: z.enum(['free', 'daily']).default('free'),
  difficulty: z.enum(['heroine', 'full']).default('heroine'),
});

const guessSchema = z.object({
  sessionId: z.string().min(1),
  characterId: z.number().int().positive(),
});

const sessionSchema = z.object({
  sessionId: z.string().min(1),
});

/** 猜测列表用的精简角色（不含发色/瞳色等答案属性，避免直接查表作弊） */
function toListItem(c: Character): { id: number; name: string; nameJp: string } {
  return { id: c.id, name: c.name, nameJp: c.nameJp };
}

export const api: ExpressRouter = Router();

api.get('/health', (_req, res) => {
  res.json({ ok: true });
});

api.get('/meta', readLimit, (_req, res) => {
  res.json({
    maxGuesses: MAX_GUESSES,
    titles: GAME_TITLES,
    poolSizes: {
      heroine: getAnswerPool('heroine').length,
      full: getAnswerPool('full').length,
    },
    totalCharacters: CHARACTERS.length,
  });
});

api.get('/characters', readLimit, (_req, res) => {
  res.json({ characters: CHARACTERS.map(toListItem) });
});

api.get('/characters/search', readLimit, (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q : '';
  res.json({ characters: searchCharacters(q).map(toListItem) });
});

/** 图鉴：完整角色资料，供玩家查阅（不涉及进行中的对局） */
api.get('/codex', readLimit, (_req, res) => {
  res.json({
    characters: CHARACTERS.map((c) => ({ ...c, cvAliases: getCvAliases(c.cv) })),
    titles: GAME_TITLES,
  });
});

api.post('/game/start', writeLimit, (req, res) => {
  const parsed = startSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ code: 'INVALID_PAYLOAD' });
    return;
  }
  const state = startGame(parsed.data.mode, parsed.data.difficulty);
  res.status(201).json({ state });
});

api.get('/game/:sessionId', readLimit, (req, res) => {
  const sessionId = String(req.params.sessionId ?? '');
  const state = getGame(sessionId);
  if (!state) {
    res.status(404).json({ code: 'SESSION_NOT_FOUND' });
    return;
  }
  res.json({ state });
});

api.post('/game/guess', writeLimit, (req, res) => {
  const parsed = guessSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ code: 'INVALID_PAYLOAD' });
    return;
  }
  const result = submitGuess(parsed.data.sessionId, parsed.data.characterId);
  if (!result.ok) {
    res.status(result.error === 'SESSION_NOT_FOUND' ? 404 : 400).json({ code: result.error });
    return;
  }
  res.json({ state: result.state, feedback: result.feedback });
});

api.post('/game/reveal', writeLimit, (req, res) => {
  const parsed = sessionSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ code: 'INVALID_PAYLOAD' });
    return;
  }
  const result = revealAnswer(parsed.data.sessionId);
  if (!result.ok) {
    res.status(404).json({ code: result.error });
    return;
  }
  res.json({ state: result.state });
});
