// 角色与反馈相关的共享类型定义

/** 作品（柚子社全部 13 部 Galgame） */
export type GameTitle =
  | 'braban' // 管乐恋曲! -The bonds of melody-
  | 'exe' // E×E
  | 'natsora' // 夏空彼方
  | 'tenran' // 天神乱漫
  | 'noble' // Noble☆Works
  | 'dracu' // DRACU-RIOT!
  | 'ailenote' // 天色幻想岛
  | 'sannabitch' // 魔女的夜宴
  | 'sengoku' // 千恋*万花
  | 'riddle' // RIDDLE JOKER
  | 'stella' // 星光咖啡馆与死神之蝶
  | 'rebo' // 天使☆嚣嚣 RE-BOOT!
  | 'limelight'; // LimeLight Lemonade Jam

/** 发色 */
export type HairColor =
  | '黑'
  | '棕'
  | '金'
  | '银'
  | '蓝'
  | '红'
  | '紫'
  | '粉'
  | '白'
  | '绿';

/** 瞳色 */
export type EyeColor =
  | '蓝'
  | '红'
  | '绿'
  | '棕'
  | '金'
  | '紫'
  | '黑'
  | '异色';

/** 角色数据模型
 * 猜谜维度：角色名(name, 行标签) / 角色位次(rank) / 发色(hair) / 瞳色(eyes) / 作品年份(titleYear) / 爆闪次数(bakusen) / 声优(cv)
 */
export interface Character {
  id: number;
  name: string; // 中文名
  nameJp: string; // 日文名
  title: GameTitle;
  rank: string; // 角色位次（女主角为数字字符串如 '1'；次要角色为 '次要'）
  bakusen: number; // 爆闪次数（成人向名场面计数，占位数据）
  hair: HairColor;
  eyes: EyeColor;
  cv: string; // 声优（配音演员），未知时为 '未知'
  isMain: boolean; // 是否女主角/主要可猜角色
}

/** 反馈等级 */
export type FeedbackLevel = 'correct' | 'close' | 'wrong';

/** 单属性反馈 */
export interface AttributeFeedback {
  value: string | number | boolean;
  level: FeedbackLevel;
  hint?: 'higher' | 'lower';
}

/** 一次猜测的完整反馈 */
export interface GuessFeedback {
  characterId: number;
  name: string;
  correct: boolean;
  attributes: {
    title: AttributeFeedback; // 作品（用于行内徽标，文本型）
    rank: AttributeFeedback; // 角色位次（数值型）
    hair: AttributeFeedback; // 发色（文本型）
    eyes: AttributeFeedback; // 瞳色（文本型）
    titleYear: AttributeFeedback; // 作品年份（数值型）
    bakusen: AttributeFeedback; // 爆闪次数（数值型）
    cv: AttributeFeedback; // 声优（文本型）
  };
}

export const GAME_TITLES: Record<GameTitle, { zh: string; jp: string; short: string; year: number }> = {
  braban: { zh: '管乐恋曲!', jp: 'ぶらばん! -The bonds of melody-', short: '管乐', year: 2009 },
  exe: { zh: 'E×E', jp: 'エグゼ', short: 'E×E', year: 2007 },
  natsora: { zh: '夏空彼方', jp: '夏空カナタ', short: '夏空', year: 2008 },
  tenran: { zh: '天神乱漫', jp: '天神乱漫', short: '天神', year: 2009 },
  noble: { zh: 'Noble☆Works', jp: 'のーぶる☆わーくす', short: 'Noble', year: 2010 },
  dracu: { zh: 'DRACU-RIOT!', jp: 'DRACU-RIOT!', short: 'DRACU', year: 2012 },
  ailenote: { zh: '天色幻想岛', jp: '天色*アイルノーツ', short: '天色', year: 2013 },
  sannabitch: { zh: '魔女的夜宴', jp: 'サノバウィッチ', short: '夜宴', year: 2015 },
  sengoku: { zh: '千恋*万花', jp: '千恋＊万花', short: '万花', year: 2016 },
  riddle: { zh: 'RIDDLE JOKER', jp: 'RIDDLE JOKER', short: 'RIDDLE', year: 2018 },
  stella: { zh: '星光咖啡馆与死神之蝶', jp: '喫茶ステラと死神の蝶', short: 'Stella', year: 2019 },
  rebo: { zh: '天使☆嚣嚣 RE-BOOT!', jp: '天使☆騒々 RE-BOOT!', short: '天使', year: 2020 },
  limelight: { zh: 'LimeLight Lemonade Jam', jp: 'ライムライト・レモネードジャム', short: 'Lime', year: 2023 },
};

export const HAIR_COLORS: HairColor[] = ['黑', '棕', '金', '银', '蓝', '红', '紫', '粉', '白', '绿'];
export const EYE_COLORS: EyeColor[] = ['蓝', '红', '绿', '棕', '金', '紫', '黑', '异色'];
