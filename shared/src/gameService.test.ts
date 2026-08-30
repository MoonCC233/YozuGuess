import { describe, it, expect } from 'vitest';
import { compareGuess, hiddenGuess, MAX_GUESSES } from './gameService.js';
import type { Character } from './types.js';

function make(partial: Partial<Character> & Pick<Character, 'id' | 'name'>): Character {
  return {
    nameJp: '',
    title: 'sannabitch',
    rank: '一号位',
    bakusen: 16,
    hair: '黑',
    eyes: '蓝',
    cv: '未知',
    isMain: true,
    ...partial,
  } as Character;
}

const target = make({
  id: 1,
  name: '目标',
  title: 'sannabitch',
  rank: '一号位',
  bakusen: 16,
  hair: '黑',
  eyes: '蓝',
  cv: '未知',
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
    const other = make({ id: 2, name: '其他', rank: '二号位' }); // diff 1 <= 1
    const fb = compareGuess(other, target);
    expect(fb.attributes.rank.level).toBe('close');
    expect(fb.attributes.rank.hint).toBe('lower');
  });

  it('rank far outside range yields wrong with direction hint', () => {
    const other = make({ id: 2, name: '其他', rank: '五号位' });
    const fb = compareGuess(other, target);
    expect(fb.attributes.rank.level).toBe('wrong');
    expect(fb.attributes.rank.hint).toBe('lower');
  });

  it('non-ordinal rank falls back to exact text match', () => {
    const other = make({ id: 2, name: '其他', rank: '配角' });
    const fb = compareGuess(other, target);
    expect(fb.attributes.rank.level).toBe('wrong');
    expect(fb.attributes.rank.hint).toBeUndefined();

    const sameText = compareGuess(make({ id: 3, name: '同类', rank: '配角' }), make({ id: 4, name: '目标2', rank: '配角' }));
    expect(sameText.attributes.rank.level).toBe('correct');
  });

  it('different cv alias of the same seiyuu yields close', () => {
    const nene = make({ id: 10, name: '绫地宁宁', cv: '桐谷华' });
    const other = make({ id: 11, name: '沢泽同人', cv: '沢泽砂羽' });
    const fb = compareGuess(other, nene);
    expect(fb.attributes.cv.level).toBe('close');
    expect(fb.attributes.cv.hint).toBeUndefined();
  });

  it('same cv alias yields correct, unrelated cv yields wrong', () => {
    const nene = make({ id: 10, name: '绫地宁宁', cv: '桐谷华' });
    expect(compareGuess(make({ id: 12, name: '同声优', cv: '桐谷华' }), nene).attributes.cv.level).toBe('correct');
    expect(compareGuess(make({ id: 13, name: '无关', cv: '风音' }), nene).attributes.cv.level).toBe('wrong');
  });

  it('cv placeholders are never treated as the same person', () => {
    const unknown = make({ id: 14, name: '未知声优', cv: '未知' });
    expect(compareGuess(make({ id: 15, name: '男主', cv: '无' }), unknown).attributes.cv.level).toBe('wrong');
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
