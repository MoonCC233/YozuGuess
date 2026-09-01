import { describe, it, expect } from 'vitest';
import { compareGuess, hiddenGuess, MAX_GUESSES } from './gameService.js';
import type { Character } from './types.js';
import { GAME_TITLES } from './types.js';

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
    expect(fb.attributes.hair.level).toBe('wrong'); // 金 vs 黑：不同色系
    expect(fb.attributes.eyes.level).toBe('wrong'); // 红 vs 蓝：不同色系
  });

  it('hair in the same color family yields close', () => {
    const orangeTarget = make({ id: 1, name: '目标', hair: '橙' });
    const yellowGuess = make({ id: 2, name: '其他', hair: '黄' });
    const fb = compareGuess(yellowGuess, orangeTarget);
    expect(fb.attributes.hair.level).toBe('close');
    expect(fb.attributes.hair.value).toBe('黄');
    expect(fb.attributes.hair.hint).toBeUndefined();
  });

  it('eyes in the same color family yields close', () => {
    const redTarget = make({ id: 1, name: '目标', eyes: '深红' });
    const pinkGuess = make({ id: 2, name: '其他', eyes: '红' });
    expect(compareGuess(pinkGuess, redTarget).attributes.eyes.level).toBe('close');
  });

  it('未知 eyes never yields close', () => {
    const unknownTarget = make({ id: 1, name: '目标', eyes: '未知' });
    const blueGuess = make({ id: 2, name: '其他', eyes: '蓝' });
    expect(compareGuess(blueGuess, unknownTarget).attributes.eyes.level).toBe('wrong');
  });

  it('identical colors still yield correct, not close', () => {
    const other = make({ id: 2, name: '其他', hair: '黑', eyes: '蓝' });
    const fb = compareGuess(other, target);
    expect(fb.attributes.hair.level).toBe('correct');
    expect(fb.attributes.eyes.level).toBe('correct');
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
    const other = make({ id: 2, name: '其他', rank: '二号位' }); // 阶梯上相邻
    const fb = compareGuess(other, target);
    expect(fb.attributes.rank.level).toBe('close');
    expect(fb.attributes.rank.hint).toBe('higher'); // 答案是一号位，位次更靠前
  });

  it('rank far outside range yields wrong with direction hint', () => {
    const other = make({ id: 2, name: '其他', rank: '五号位' });
    const fb = compareGuess(other, target);
    expect(fb.attributes.rank.level).toBe('wrong');
    expect(fb.attributes.rank.hint).toBe('higher');
  });

  it('主角 sits above 一号位 on the rank ladder', () => {
    const heroTarget = make({ id: 1, name: '男主', rank: '主角' });
    const first = make({ id: 2, name: '一号位角色', rank: '一号位' });
    const fb = compareGuess(first, heroTarget);
    expect(fb.attributes.rank.level).toBe('close');
    expect(fb.attributes.rank.hint).toBe('higher'); // 答案（主角）比一号位更靠前

    const reverse = compareGuess(heroTarget, first);
    expect(reverse.attributes.rank.hint).toBe('lower'); // 答案（一号位）比主角更靠后
  });

  it('次要 and 配角 are adjacent and both weaker than 号位', () => {
    const supportTarget = make({ id: 1, name: '目标', rank: '次要' });
    const extra = make({ id: 2, name: '配角角色', rank: '配角' });
    const fb = compareGuess(extra, supportTarget);
    expect(fb.attributes.rank.level).toBe('close');
    expect(fb.attributes.rank.hint).toBe('higher'); // 次要比配角更靠前

    const seventh = make({ id: 3, name: '七号位角色', rank: '七号位' });
    const near = compareGuess(seventh, supportTarget);
    expect(near.attributes.rank.level).toBe('close'); // 七号位与次要相邻
    expect(near.attributes.rank.hint).toBe('lower'); // 答案（次要）比七号位更靠后
  });

  it('配角 vs 一号位 is wrong with an upward hint', () => {
    const extra = make({ id: 2, name: '配角角色', rank: '配角' });
    const fb = compareGuess(extra, target); // target 是一号位
    expect(fb.attributes.rank.level).toBe('wrong');
    expect(fb.attributes.rank.hint).toBe('higher');
  });

  it('identical non-ordinal ranks still yield correct', () => {
    const sameText = compareGuess(
      make({ id: 3, name: '同类', rank: '配角' }),
      make({ id: 4, name: '目标2', rank: '配角' })
    );
    expect(sameText.attributes.rank.level).toBe('correct');
    expect(sameText.attributes.rank.hint).toBeUndefined();
  });

  it('unknown rank labels fall back to exact text match', () => {
    const weird = make({ id: 2, name: '其他', rank: '客串' });
    const fb = compareGuess(weird, target);
    expect(fb.attributes.rank.level).toBe('wrong');
    expect(fb.attributes.rank.hint).toBeUndefined();
  });

  it('六号位 keeps 五号位 and 七号位 from being adjacent', () => {
    const fifth = make({ id: 2, name: '五号位角色', rank: '五号位' });
    const seventhTarget = make({ id: 1, name: '七号位目标', rank: '七号位' });
    expect(compareGuess(fifth, seventhTarget).attributes.rank.level).toBe('wrong');
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

describe('GAME_TITLES', () => {
  it('lists titles in chronological release order', () => {
    const years = Object.values(GAME_TITLES).map((t) => t.year);
    for (let i = 1; i < years.length; i += 1) {
      expect(years[i]!).toBeGreaterThanOrEqual(years[i - 1]!);
    }
  });

  it('uses the actual release year of each title', () => {
    expect(GAME_TITLES.braban.year).toBe(2006);
    expect(GAME_TITLES.exe.year).toBe(2007);
    expect(GAME_TITLES.limelight.year).toBe(2023);
  });
});
