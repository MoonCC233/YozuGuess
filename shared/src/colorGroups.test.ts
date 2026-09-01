import { describe, it, expect } from 'vitest';
import { getColorFamilies, getSameFamilyColors, isSameColorFamily } from './colorGroups.js';
import { HAIR_COLORS, EYE_COLORS } from './types.js';

describe('isSameColorFamily', () => {
  it('identical colors are not "same family" (they are exact matches)', () => {
    expect(isSameColorFamily('橙', '橙')).toBe(false);
    expect(isSameColorFamily('蓝', '蓝')).toBe(false);
  });

  it('warm yellow family: 橙 / 黄 / 金 / 橘 are mutually close', () => {
    expect(isSameColorFamily('黄', '橙')).toBe(true);
    expect(isSameColorFamily('橙', '金')).toBe(true);
    expect(isSameColorFamily('橘', '黄')).toBe(true);
  });

  it('red family covers 红 / 深红 / 粉 / 粉红', () => {
    expect(isSameColorFamily('红', '深红')).toBe(true);
    expect(isSameColorFamily('粉', '粉红')).toBe(true);
    expect(isSameColorFamily('红', '粉')).toBe(true);
  });

  it('brown family covers 棕 / 褐 / 茶', () => {
    expect(isSameColorFamily('棕', '褐')).toBe(true);
    expect(isSameColorFamily('褐', '茶')).toBe(true);
  });

  it('青 bridges blue and green', () => {
    expect(isSameColorFamily('青', '蓝')).toBe(true);
    expect(isSameColorFamily('青', '绿')).toBe(true);
  });

  it('灰 bridges dark and light achromatic colors', () => {
    expect(isSameColorFamily('灰', '黑')).toBe(true);
    expect(isSameColorFamily('灰', '白')).toBe(true);
    expect(isSameColorFamily('白', '银')).toBe(true);
  });

  it('黑 and 白 are not the same family', () => {
    expect(isSameColorFamily('黑', '白')).toBe(false);
  });

  it('distant hues are not close', () => {
    expect(isSameColorFamily('蓝', '红')).toBe(false);
    expect(isSameColorFamily('黄', '黑')).toBe(false);
    expect(isSameColorFamily('绿', '棕')).toBe(false);
  });

  it('gradient / highlight colors join both of their hue families', () => {
    expect(isSameColorFamily('蓝粉渐变', '蓝')).toBe(true);
    expect(isSameColorFamily('蓝粉渐变', '粉')).toBe(true);
    expect(isSameColorFamily('紫粉接发', '紫')).toBe(true);
    expect(isSameColorFamily('紫粉接发', '粉')).toBe(true);
    expect(isSameColorFamily('棕橙挑染', '棕')).toBe(true);
    expect(isSameColorFamily('棕橙挑染', '橙')).toBe(true);
    expect(isSameColorFamily('紫灰', '紫')).toBe(true);
    expect(isSameColorFamily('紫灰', '灰')).toBe(true);
  });

  it('未知 never counts as close', () => {
    expect(isSameColorFamily('未知', '蓝')).toBe(false);
    expect(isSameColorFamily('蓝', '未知')).toBe(false);
    expect(isSameColorFamily('未知', '未知')).toBe(false);
  });

  it('is symmetric for every pair of known colors', () => {
    const all = [...new Set([...HAIR_COLORS, ...EYE_COLORS])] as string[];
    for (const a of all) {
      for (const b of all) {
        expect(isSameColorFamily(a, b)).toBe(isSameColorFamily(b, a));
      }
    }
  });
});

describe('getColorFamilies', () => {
  it('covers every hair and eye color except the 未知 placeholder', () => {
    const all = [...new Set([...HAIR_COLORS, ...EYE_COLORS])] as string[];
    for (const color of all) {
      if (color === '未知') {
        expect(getColorFamilies(color)).toEqual([]);
        continue;
      }
      expect(getColorFamilies(color).length).toBeGreaterThan(0);
    }
  });
});

describe('getSameFamilyColors', () => {
  it('excludes the queried color itself', () => {
    expect(getSameFamilyColors('橙')).not.toContain('橙');
  });

  it('returns 黄 / 金 / 橘 for 橙', () => {
    const near = getSameFamilyColors('橙');
    expect(near).toContain('黄');
    expect(near).toContain('金');
    expect(near).toContain('橘');
  });

  it('returns an empty list for unknown colors', () => {
    expect(getSameFamilyColors('未知')).toEqual([]);
    expect(getSameFamilyColors('不存在的颜色')).toEqual([]);
  });
});
