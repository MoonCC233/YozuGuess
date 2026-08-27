import { describe, it, expect } from 'vitest';
import { compareGuess, hiddenGuess, MAX_GUESSES } from './gameService.js';
import type { Character } from './types.js';

function make(partial: Partial<Character> & Pick<Character, 'id' | 'name'>): Character {
  return {
    nameJp: '',
    title: 'sannabitch',
    rank: 1,
    bakusen: 16,
    hair: '黑',
    eyes: '蓝',
    isMain: true,
    ...partial,
  } as Character;
}

const target = make({
  id: 1,
  name: '目标',
  title: 'sannabitch',
  rank: 1,
  bakusen: 16,
  hair: '黑',
  eyes: '蓝',
});

describe('compareGuess', () => {
  it('exact match is correct on every attribute', () => {
    const fb = compareGuess(target, target);
    expect(fb.correct).toBe(true);
    for (const key of Object.keys(fb.attributes) as Array<keyof typeof fb.attributes>) {
      expect(fb.attributes[key].level).toBe('correct');
    }
  });

  it('different id is not correct even with identical attributes', () => {
    const other = make({ id: 2, name: '其他', title: 'sannabitch' });
    const fb = compareGuess(other, target);
    expect(fb.correct).toBe(false);
  });

  it('text attributes are correct only on exact equality', () => {
    const other = make({ id: 2, name: '其他', title: 'sengoku', hair: '金', eyes: '红' });
    const fb = compareGuess(other, target);
    expect(fb.attributes.title.level).toBe('wrong');
    expect(fb.attributes.hair.level).toBe('wrong');
    expect(fb.attributes.eyes.level).toBe('wrong');
  });

  it('bakusen within close range yields close with direction hint', () => {
    const other = make({ id: 2, name: '其他', bakusen: 18 }); // diff 2 <= 3
    const fb = compareGuess(other, target);
    expect(fb.attributes.bakusen.level).toBe('close');
    expect(fb.attributes.bakusen.hint).toBe('lower'); // target fewer -> guess should go lower
  });

  it('bakusen far outside range yields wrong with direction hint', () => {
    const other = make({ id: 2, name: '其他', bakusen: 30 });
    const fb = compareGuess(other, target);
    expect(fb.attributes.bakusen.level).toBe('wrong');
    expect(fb.attributes.bakusen.hint).toBe('lower');
  });

  it('rank within close range yields close with direction hint', () => {
    const other = make({ id: 2, name: '其他', rank: 15 }); // diff 14 <= 20
    const fb = compareGuess(other, target);
    expect(fb.attributes.rank.level).toBe('close');
    expect(fb.attributes.rank.hint).toBe('lower');
  });

  it('titleYear derived from GAME_TITLES; different title yields wrong', () => {
    const other = make({ id: 2, name: '其他', title: 'limelight' }); // 2023 vs 2015
    const fb = compareGuess(other, target);
    expect(fb.attributes.titleYear.level).toBe('wrong');
    expect(fb.attributes.titleYear.hint).toBe('lower'); // target year earlier
  });
});

describe('hiddenGuess', () => {
  it('strips values but keeps level and hint', () => {
    const other = make({ id: 2, name: '其他', bakusen: 30 });
    const hidden = hiddenGuess(compareGuess(other, target));
    expect(hidden.hidden).toBe(true);
    expect(hidden.correct).toBe(false);
    expect((hidden.attributes.bakusen as any).value).toBeUndefined();
    expect(hidden.attributes.bakusen.level).toBe('wrong');
    expect(hidden.attributes.bakusen.hint).toBe('lower');
  });
});

describe('constants', () => {
  it('allows 8 guesses', () => {
    expect(MAX_GUESSES).toBe(8);
  });
});
