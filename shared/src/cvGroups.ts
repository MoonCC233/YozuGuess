import divide from './divide.json' with { type: 'json' };

/** 同一位声优在不同作品中使用的化名分组。
 * key 为声优真名（或可识别的标识），value 为其在角色数据中出现过的化名列表。
 * 数据来源：shared/src/divide.json（唯一数据源）。
 */
export const CV_ALIAS_GROUPS: Record<string, string[]> = divide as Record<string, string[]>;

/** 不参与"同一人"判定的占位值（男主角无 CV / CV 未公开） */
const CV_PLACEHOLDERS = new Set(['无', '未知', '']);

/** 化名 -> 声优分组 key 的反向索引 */
const ALIAS_TO_GROUP: Map<string, string> = (() => {
  const map = new Map<string, string>();
  for (const [person, aliases] of Object.entries(CV_ALIAS_GROUPS)) {
    for (const alias of aliases) {
      if (CV_PLACEHOLDERS.has(alias)) continue;
      map.set(alias, person);
    }
  }
  return map;
})();

/** 取某个化名所属的声优分组 key；无分组或为占位值时返回 null */
export function getCvGroup(cv: string): string | null {
  if (CV_PLACEHOLDERS.has(cv)) return null;
  return ALIAS_TO_GROUP.get(cv) ?? null;
}

/** 判断两个化名是否为同一位声优（不含完全相同的情况） */
export function isSameCvPerson(a: string, b: string): boolean {
  if (a === b) return false;
  const ga = getCvGroup(a);
  if (!ga) return false;
  return ga === getCvGroup(b);
}

/** 取某个化名的同人化名列表（不含自身） */
export function getCvAliases(cv: string): string[] {
  const group = getCvGroup(cv);
  if (!group) return [];
  return (CV_ALIAS_GROUPS[group] ?? []).filter((a) => a !== cv);
}
