import { describe, it, expect } from 'vitest';
import {
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
  it('heroine pool only contains heroines and is non-empty', () => {
    const pool = getAnswerPool('heroine');
    expect(pool.length).toBeGreaterThan(0);
    expect(pool.every((c) => c.isMain)).toBe(true);
    expect(pool.length).toBeLessThan(CHARACTERS.length);
  });

  it('full pool contains every character', () => {
    expect(getAnswerPool('full')).toHaveLength(CHARACTERS.length);
  });

  it('guessable list always contains every character', () => {
    expect(getGuessableCharacters()).toHaveLength(CHARACTERS.length);
  });

  it('random answer comes from the requested pool', () => {
    for (let i = 0; i < 30; i += 1) {
      expect(pickRandomAnswer('heroine').isMain).toBe(true);
    }
  });

  it('character ids are unique', () => {
    expect(new Set(CHARACTERS.map((c) => c.id)).size).toBe(CHARACTERS.length);
  });
});

describe('daily answer', () => {
  it('is stable for the same date and difficulty', () => {
    const a = pickDailyAnswer('heroine', '2026-08-30');
    const b = pickDailyAnswer('heroine', '2026-08-30');
    expect(a.id).toBe(b.id);
  });

  it('varies across dates', () => {
    const ids = new Set(
      ['2026-08-30', '2026-08-31', '2026-09-01', '2026-09-02', '2026-09-03'].map(
        (d) => pickDailyAnswer('heroine', d).id
      )
    );
    expect(ids.size).toBeGreaterThan(1);
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
    expect(isDifficulty('heroine')).toBe(true);
    expect(isDifficulty('full')).toBe(true);
    expect(isDifficulty('hard')).toBe(false);
    expect(isDifficulty(1)).toBe(false);
  });
});
