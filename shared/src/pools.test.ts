import { describe, it, expect } from 'vitest';
import {
  DAILY_DIFFICULTY,
  DIFFICULTIES,
  DIFFICULTY_META,
  EIGHT_TITLES,
  FOUR_CLASSICS,
  difficultyLabel,
  getAnswerPool,
  getGuessableCharacters,
  pickDailyAnswer,
  pickRandomAnswer,
  searchCharacters,
  findCharacterByName,
  toDateKey,
  isDifficulty,
} from './pools.js';
import { CHARACTERS } from './characters.js';

describe('answer pools', () => {
  it('easy pool covers exactly the four classics, all characters', () => {
    const pool = getAnswerPool('easy');
    expect(pool.length).toBeGreaterThan(0);
    expect(new Set(pool.map((c) => c.title))).toEqual(new Set(FOUR_CLASSICS));
    expect(pool).toHaveLength(CHARACTERS.filter((c) => FOUR_CLASSICS.includes(c.title)).length);
    expect(pool.some((c) => !c.isMain)).toBe(true);
  });

  it('normal pool is every heroine across all titles', () => {
    const pool = getAnswerPool('normal');
    expect(pool.every((c) => c.isMain)).toBe(true);
    expect(pool).toHaveLength(CHARACTERS.filter((c) => c.isMain).length);
  });

  it('hard pool covers the eight titles and contains the easy pool', () => {
    const pool = getAnswerPool('hard');
    expect(new Set(pool.map((c) => c.title))).toEqual(new Set(EIGHT_TITLES));
    const easyIds = new Set(getAnswerPool('easy').map((c) => c.id));
    expect([...easyIds].every((id) => pool.some((c) => c.id === id))).toBe(true);
    expect(pool.some((c) => !c.isMain)).toBe(true);
  });

  it('hell pool contains every character', () => {
    expect(getAnswerPool('hell')).toHaveLength(CHARACTERS.length);
  });

  it('every difficulty has a non-empty pool', () => {
    for (const d of DIFFICULTIES) {
      expect(getAnswerPool(d).length).toBeGreaterThan(0);
    }
  });

  it('guessable list always contains every character', () => {
    expect(getGuessableCharacters()).toHaveLength(CHARACTERS.length);
  });

  it('random answer comes from the requested pool', () => {
    for (let i = 0; i < 30; i += 1) {
      expect(pickRandomAnswer('normal').isMain).toBe(true);
      expect(FOUR_CLASSICS).toContain(pickRandomAnswer('easy').title);
      expect(EIGHT_TITLES).toContain(pickRandomAnswer('hard').title);
    }
  });

  it('character ids are unique', () => {
    expect(new Set(CHARACTERS.map((c) => c.id)).size).toBe(CHARACTERS.length);
  });
});

describe('daily answer', () => {
  it('is stable for the same date', () => {
    const a = pickDailyAnswer('2026-08-30');
    const b = pickDailyAnswer('2026-08-30');
    expect(a.id).toBe(b.id);
  });

  it('varies across dates', () => {
    const ids = new Set(
      ['2026-08-30', '2026-08-31', '2026-09-01', '2026-09-02', '2026-09-03'].map(
        (d) => pickDailyAnswer(d).id
      )
    );
    expect(ids.size).toBeGreaterThan(1);
  });

  it('always draws from every character regardless of difficulty', () => {
    expect(DAILY_DIFFICULTY).toBe('hell');
    expect(getAnswerPool(DAILY_DIFFICULTY)).toHaveLength(CHARACTERS.length);
    const ids = new Set(CHARACTERS.map((c) => c.id));
    for (const d of ['2026-08-30', '2026-09-15', '2027-01-01']) {
      expect(ids.has(pickDailyAnswer(d).id)).toBe(true);
    }
  });

  it('reaches characters outside the narrower pools over time', () => {
    const easyIds = new Set(getAnswerPool('easy').map((c) => c.id));
    const keys = Array.from({ length: 400 }, (_, i) => `2026-01-${i}`);
    expect(keys.some((k) => !easyIds.has(pickDailyAnswer(k).id))).toBe(true);
  });

  it('formats date keys as YYYY-MM-DD', () => {
    expect(toDateKey(new Date(2026, 7, 5))).toBe('2026-08-05');
  });
});

describe('search', () => {
  it('finds characters by chinese name', () => {
    const hits = searchCharacters('宁宁');
    expect(hits.some((c) => c.name === '绫地宁宁')).toBe(true);
  });

  it('finds characters by japanese name', () => {
    const hits = searchCharacters('綾地');
    expect(hits.some((c) => c.name === '绫地宁宁')).toBe(true);
  });

  it('returns empty for blank keyword and respects the limit', () => {
    expect(searchCharacters('   ')).toHaveLength(0);
    expect(searchCharacters('a', 3).length).toBeLessThanOrEqual(3);
  });

  it('resolves exact names in both languages', () => {
    expect(findCharacterByName('绫地宁宁')?.id).toBe(1);
    expect(findCharacterByName('綾地寧々')?.id).toBe(1);
    expect(findCharacterByName('不存在的角色')).toBeUndefined();
  });
});

describe('difficulty guard', () => {
  it('accepts known values only', () => {
    expect(isDifficulty('easy')).toBe(true);
    expect(isDifficulty('normal')).toBe(true);
    expect(isDifficulty('hard')).toBe(true);
    expect(isDifficulty('hell')).toBe(true);
    expect(isDifficulty('heroine')).toBe(false);
    expect(isDifficulty('full')).toBe(false);
    expect(isDifficulty(1)).toBe(false);
  });

  it('exposes a tier name and label for each difficulty', () => {
    for (const d of DIFFICULTIES) {
      expect(DIFFICULTY_META[d].tier).not.toBe('');
      expect(DIFFICULTY_META[d].label).not.toBe('');
      expect(difficultyLabel(d)).toBe(DIFFICULTY_META[d].label);
    }
  });

  it('passes unknown legacy values through when labelling', () => {
    expect(difficultyLabel('heroine')).toBe('heroine');
  });
});
