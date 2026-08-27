import { Router } from 'express';
import { all as dbAll, get as dbGet, run as dbRun } from './db.js';
import { z } from 'zod';
import {
  CHARACTERS,
  compareGuess,
  getCharacter,
  getEnabledCharacters,
  MAX_GUESSES,
} from '@yozu/shared';
import {
  answerView,
  createSingleGame,
  dailyTargetId,
  deleteSingleGame,
  getDailyGame,
  getSingleGame,
  getReplay,
  listReplays,
  randomTargetId,
  saveReplay,
  saveSingleGame,
  setDailyGame,
} from './store.js';
import { optionalAuth } from './middleware/auth.js';
import authRouter from './routes/auth.js';

const router = Router();

// 账户系统
router.use('/auth', authRouter);

// 角色列表（用于搜索/选择）
router.get('/characters', (_req, res) => {
  res.json(
    getEnabledCharacters().map((c) => ({
      id: c.id,
      name: c.name,
      nameJp: c.nameJp,
      title: c.title,
      rank: c.rank,
      isMain: c.isMain,
    }))
  );
});

// 数据图鉴：返回全部角色完整设定
router.get('/database', (_req, res) => {
  res.json(getEnabledCharacters());
});

// 单人：开始新对局
const startSchema = z.object({ mode: z.enum(['classic', 'easy']).default('classic') });
router.post('/game/start', (req, res) => {
  const { mode } = startSchema.parse(req.body);
  const id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  // easy 模式只从女主角池抽，classic 全池
  const pool = getEnabledCharacters().filter((c) => (mode === 'easy' ? c.isMain : true));
  const targetId = pool[Math.floor(Math.random() * pool.length)].id;
  const game = createSingleGame(id, targetId, mode);
  res.json({ id: game.id, maxGuesses: MAX_GUESSES, mode });
});

// 单人：猜测
const guessSchema = z.object({ characterId: z.number().int().positive() });
router.post('/game/:id/guess', (req, res) => {
  const game = getSingleGame(req.params.id);
  if (!game) return res.status(404).json({ code: 'GAME_NOT_FOUND' });
  if (game.finished) return res.status(400).json({ code: 'GAME_FINISHED' });
  const { characterId } = guessSchema.parse(req.body);
  const guess = getCharacter(characterId);
  if (!guess) return res.status(404).json({ code: 'CHARACTER_NOT_FOUND' });
  if (game.guesses.some((g) => g.characterId === characterId)) {
    return res.status(400).json({ code: 'ALREADY_GUESSED' });
  }
  const target = getCharacter(game.targetCharacterId)!;
  const feedback = compareGuess(guess, target);
  game.guesses.push(feedback);
  game.guessTimes.push(Math.max(0, Math.floor(Date.now() - game.createdAt)));
  const finished = feedback.correct || game.guesses.length >= MAX_GUESSES;
  game.status = feedback.correct ? 'won' : finished ? 'lost' : 'playing';
  game.finished = finished;
  if (!finished) {
    saveSingleGame(game);
  } else {
    deleteSingleGame(game.id);
    saveReplay({
      id: game.id,
      mode: game.mode,
      date: new Date().toISOString().slice(0, 10),
      createdAt: game.createdAt,
      finishedAt: Date.now(),
      targetCharacterId: game.targetCharacterId,
      guesses: game.guesses,
      guessTimes: game.guessTimes,
      status: game.status as 'won' | 'lost',
      guessCount: game.guesses.length,
    });
  }
  res.json({
    feedback,
    status: game.status,
    guessCount: game.guesses.length,
    maxGuesses: MAX_GUESSES,
    answer: finished ? answerView(target) : undefined,
  });
});

// 单人：查看答案（判负）
router.post('/game/:id/reveal', (req, res) => {
  const game = getSingleGame(req.params.id);
  if (!game) return res.status(404).json({ code: 'GAME_NOT_FOUND' });
  const target = getCharacter(game.targetCharacterId)!;
  game.finished = true;
  game.status = 'lost';
  deleteSingleGame(game.id);
  res.json({ answer: answerView(target) });
});

// 每日挑战：获取/开始当天对局
router.get('/daily', (req, res) => {
  const date = new Date().toISOString().slice(0, 10);
  let game = getDailyGame(date);
  if (!game) {
    game = createSingleGame(`d_${date}`, dailyTargetId(date), 'daily');
    setDailyGame(date, game);
  }
  res.json({
    date,
    maxGuesses: MAX_GUESSES,
    guessCount: game.guesses.length,
    status: game.status,
    finished: game.finished,
  });
});

router.post('/daily/guess', (req, res) => {
  const date = new Date().toISOString().slice(0, 10);
  let game = getDailyGame(date);
  if (!game) {
    game = createSingleGame(`d_${date}`, dailyTargetId(date), 'daily');
    setDailyGame(date, game);
  }
  if (game.finished) return res.status(400).json({ code: 'GAME_FINISHED' });
  const { characterId } = guessSchema.parse(req.body);
  const guess = getCharacter(characterId);
  if (!guess) return res.status(404).json({ code: 'CHARACTER_NOT_FOUND' });
  if (game.guesses.some((g) => g.characterId === characterId)) {
    return res.status(400).json({ code: 'ALREADY_GUESSED' });
  }
  const target = getCharacter(game.targetCharacterId)!;
  const feedback = compareGuess(guess, target);
  game.guesses.push(feedback);
  const finished = feedback.correct || game.guesses.length >= MAX_GUESSES;
  game.status = feedback.correct ? 'won' : finished ? 'lost' : 'playing';
  game.finished = finished;
  if (finished) {
    saveReplay({
      id: game.id,
      mode: 'daily',
      date: new Date().toISOString().slice(0, 10),
      createdAt: game.createdAt,
      finishedAt: Date.now(),
      targetCharacterId: game.targetCharacterId,
      guesses: game.guesses,
      guessTimes: game.guessTimes,
      status: game.status as 'won' | 'lost',
      guessCount: game.guesses.length,
    });
  }
  res.json({
    feedback,
    status: game.status,
    guessCount: game.guesses.length,
    maxGuesses: MAX_GUESSES,
    answer: finished ? answerView(target) : undefined,
  });
});

// 统计：记录一局结果（归属到登录用户或匿名访客）
const recordSchema = z.object({
  mode: z.enum(['classic', 'easy', 'daily']),
  won: z.boolean(),
  guessCount: z.number().int().min(1).max(MAX_GUESSES),
});
router.post('/stats/record', optionalAuth, async (req, res) => {
  const parsed = recordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ code: 'INVALID_BODY' });
  const { mode, won, guessCount } = parsed.data;
  const user = (req as any).user as { id: number } | undefined;
  const guestKey = (req as any).guestKey as string | undefined;
  await dbRun(
    `INSERT INTO results (mode, won, guess_count, user_id, guest_key)
     VALUES (?, ?, ?, ?, ?)`,
    [mode, won ? 1 : 0, guessCount, user?.id ?? null, user ? null : (guestKey ?? null)]
  );
  res.json({ ok: true });
});

router.get('/stats/summary', async (_req, res) => {
  const row = await dbGet('SELECT COUNT(*) AS count FROM results');
  const total = Number(row?.count ?? 0);
  res.json({ totalGuesses: total, characters: CHARACTERS.length });
});

// 排行榜（按胜场，登录用户用 display_id，匿名用访客名）
router.post('/leaderboard/record', optionalAuth, async (req, res) => {
  const parsed = z.object({ won: z.boolean() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ code: 'INVALID_BODY' });
  const { won } = parsed.data;
  const user = (req as any).user as { id: number; username: string } | undefined;
  const guestKey = (req as any).guestKey as string | undefined;
  if (!user && !guestKey) return res.json({ ok: true });
  await dbRun(
    `INSERT INTO results (mode, won, guess_count, user_id, guest_key)
     VALUES ('leaderboard', ?, 0, ?, ?)`,
    [won ? 1 : 0, user?.id ?? null, user ? null : guestKey]
  );
  res.json({ ok: true });
});

router.get('/leaderboard', async (_req, res) => {
  const rows = await dbAll(
    `SELECT user_id, guest_key,
            COUNT(*) AS plays,
            SUM(CASE WHEN won THEN 1 ELSE 0 END) AS wins
     FROM results
     WHERE user_id IS NOT NULL OR guest_key IS NOT NULL
     GROUP BY user_id, guest_key
     ORDER BY wins DESC, plays DESC
     LIMIT 20`
  );
  const list = rows.map((r: any) => ({
    name: r.user_id ? `用户#${r.user_id}` : `访客#${String(r.guest_key ?? '').slice(0, 5)}`,
    wins: Number(r.wins ?? 0),
    plays: Number(r.plays ?? 0),
  }));
  res.json(list);
});

// ── 回放 ──
router.get('/replays', (_req, res) => {
  const list = listReplays().map((r) => ({
    id: r.id,
    mode: r.mode,
    date: r.date,
    status: r.status,
    guessCount: r.guessCount,
    targetCharacterId: r.targetCharacterId,
  }));
  res.json(list);
});

router.get('/replays/:id', (req, res) => {
  const replay = getReplay(req.params.id);
  if (!replay) return res.status(404).json({ code: 'REPLAY_NOT_FOUND' });
  const target = getCharacter(replay.targetCharacterId);
  res.json({
    ...replay,
    answer: target ? answerView(target) : null,
  });
});

// ── 详细统计 ──
router.get('/stats/detail', async (_req, res) => {
  const all = listReplays();
  const resultRows = await dbAll(
    `SELECT mode, won, guess_count FROM results WHERE mode IN ('classic', 'easy', 'daily')`
  );
  const totalGames = all.length + resultRows.length;
  const replayWins = all.filter((r) => r.status === 'won').length;
  const dbWins = resultRows.filter((r: any) => r.won).length;
  const wins = replayWins + dbWins;
  const totalGuesses =
    all.reduce((a, r) => a + r.guessCount, 0) +
    resultRows.reduce((a: number, r: any) => a + Number(r.guess_count), 0);
  const avgGuesses = totalGames ? Math.round((totalGuesses / totalGames) * 10) / 10 : 0;
  const winRate = totalGames ? Math.round((wins / totalGames) * 100) : 0;

  // 各角色被猜次数 / 命中次数（来自内存回放）
  const byCharacter = new Map<number, { guessed: number; won: number }>();
  for (const r of all) {
    for (const g of r.guesses) {
      const e = byCharacter.get(g.characterId) ?? { guessed: 0, won: 0 };
      e.guessed += 1;
      if (g.correct) e.won += 1;
      byCharacter.set(g.characterId, e);
    }
  }
  const characterStats = Array.from(byCharacter.entries())
    .map(([id, v]) => {
      const c = getCharacter(id);
      return {
        id,
        name: c?.name ?? String(id),
        title: c?.title ?? '',
        guessed: v.guessed,
        won: v.won,
      };
    })
    .sort((a, b) => b.guessed - a.guessed)
    .slice(0, 10);

  // 按作品分布（已玩对局的目标作品）
  const byTitle = new Map<string, number>();
  for (const r of all) {
    const c = getCharacter(r.targetCharacterId);
    if (c) byTitle.set(c.title, (byTitle.get(c.title) ?? 0) + 1);
  }
  const titleStats = Array.from(byTitle.entries()).map(([title, count]) => ({ title, count }));

  res.json({
    totalGames,
    wins,
    losses: totalGames - wins,
    winRate,
    totalGuesses,
    avgGuesses,
    characterStats,
    titleStats,
  });
});

export default router;
