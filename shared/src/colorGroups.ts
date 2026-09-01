/** 发色 / 瞳色的同色系分组。
 *
 * 猜测时若发色（或瞳色）与答案不完全相同，但属于同一色系，则判为「接近」（黄色）。
 * 一个颜色可以同时属于多个色系（如「棕橙挑染」既属暖黄系也属棕褐系），
 * 只要两个颜色共享任意一个色系即视为接近。
 *
 * 分组按色相划分，刻意不把「黑」与「白」放进同一组：
 * 无彩色拆成「暗色系（黑/灰）」与「亮色系（白/银/灰）」，让灰色成为两者的桥梁。
 */
export const COLOR_FAMILIES: Record<string, string[]> = {
  // 红粉系：红与粉同属红色相，深浅不同
  red: ['红', '深红', '粉', '粉红', '紫粉接发', '蓝粉渐变'],
  // 紫系
  purple: ['紫', '紫灰', '紫粉接发'],
  // 蓝系（含偏蓝的青）
  blue: ['蓝', '青', '蓝粉渐变'],
  // 绿系（含偏绿的青与灰绿）
  green: ['绿', '灰绿', '青'],
  // 暖黄系：黄 / 金 / 橙 / 橘
  yellow: ['黄', '金', '橙', '橘', '棕橙挑染'],
  // 棕褐系
  brown: ['棕', '褐', '茶', '棕橙挑染'],
  // 无彩色暗部
  dark: ['黑', '灰', '紫灰'],
  // 无彩色亮部
  light: ['白', '银', '灰'],
  // 灰调
  gray: ['灰', '紫灰', '灰绿'],
};

/** 不参与同色系判定的占位值 */
const COLOR_PLACEHOLDERS = new Set(['未知', '']);

/** 颜色 -> 所属色系集合 */
const COLOR_TO_FAMILIES: Map<string, Set<string>> = (() => {
  const map = new Map<string, Set<string>>();
  for (const [family, colors] of Object.entries(COLOR_FAMILIES)) {
    for (const color of colors) {
      if (COLOR_PLACEHOLDERS.has(color)) continue;
      const set = map.get(color) ?? new Set<string>();
      set.add(family);
      map.set(color, set);
    }
  }
  return map;
})();

/** 取某个颜色所属的色系列表；占位值或未收录时返回空数组 */
export function getColorFamilies(color: string): string[] {
  if (COLOR_PLACEHOLDERS.has(color)) return [];
  return [...(COLOR_TO_FAMILIES.get(color) ?? [])];
}

/** 判断两个颜色是否同色系（不含完全相同的情况） */
export function isSameColorFamily(a: string, b: string): boolean {
  if (a === b) return false;
  if (COLOR_PLACEHOLDERS.has(a) || COLOR_PLACEHOLDERS.has(b)) return false;
  const fa = COLOR_TO_FAMILIES.get(a);
  const fb = COLOR_TO_FAMILIES.get(b);
  if (!fa || !fb) return false;
  for (const family of fa) {
    if (fb.has(family)) return true;
  }
  return false;
}

/** 取与某个颜色同色系的其他颜色（用于说明与测试） */
export function getSameFamilyColors(color: string): string[] {
  const families = COLOR_TO_FAMILIES.get(color);
  if (!families) return [];
  const result = new Set<string>();
  for (const family of families) {
    for (const other of COLOR_FAMILIES[family] ?? []) {
      if (other !== color) result.add(other);
    }
  }
  return [...result];
}
