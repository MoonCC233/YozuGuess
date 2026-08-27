import type {
  AttributeFeedback,
  Character,
  GuessFeedback,
  FeedbackLevel,
} from './types.js';
import { GAME_TITLES } from './types.js';

export const MAX_GUESSES = 8;

// 数值型属性的"接近"阈值
const BAKUSEN_CLOSE_RANGE = 3;
const RANK_CLOSE_RANGE = 20; // 角色位次接近阈值
const YEAR_CLOSE_RANGE = 3; // 作品年份接近阈值

/** 文本型属性：完全一致才 correct */
function textAttr(guess: string, target: string): AttributeFeedback {
  return { value: guess, level: guess === target ? 'correct' : 'wrong' };
}

/** 数值型属性：相等 correct；差值在范围内 close 并带方向；否则 wrong 带方向 */
function numberAttr(
  guessVal: number,
  targetVal: number,
  closeRange: number
): AttributeFeedback {
  if (guessVal === targetVal) return { value: guessVal, level: 'correct' };
  const level = Math.abs(guessVal - targetVal) <= closeRange ? 'close' : 'wrong';
  return {
    value: guessVal,
    level,
    hint: targetVal > guessVal ? 'higher' : 'lower',
  };
}

/** 位次属性：字符串形式。女主角为数字字符串（如 '1'），可数值比较并带接近提示；
 * 次要角色为 '次要'，按文本精确匹配处理。 */
function rankAttr(guessVal: string, targetVal: string): AttributeFeedback {
  const gNum = Number(guessVal);
  const tNum = Number(targetVal);
  const bothNumeric = !Number.isNaN(gNum) && !Number.isNaN(tNum) && guessVal.trim() !== '' && targetVal.trim() !== '';
  if (bothNumeric) return numberAttr(gNum, tNum, RANK_CLOSE_RANGE);
  return textAttr(guessVal, targetVal);
}

/** 逐属性对比猜测角色与目标角色，产出反馈 */
export function compareGuess(guess: Character, target: Character): GuessFeedback {
  const correct = guess.id === target.id;
  return {
    characterId: guess.id,
    name: guess.name,
    correct,
    attributes: {
      title: textAttr(guess.title, target.title),
      rank: rankAttr(guess.rank, target.rank),
      hair: textAttr(guess.hair, target.hair),
      eyes: textAttr(guess.eyes, target.eyes),
      titleYear: numberAttr(GAME_TITLES[guess.title].year, GAME_TITLES[target.title].year, YEAR_CLOSE_RANGE),
      bakusen: numberAttr(guess.bakusen, target.bakusen, BAKUSEN_CLOSE_RANGE),
      cv: textAttr(guess.cv, target.cv),
    },
  };
}

/** 用于多人模式：隐藏具体数值，只保留等级与方向（避免泄露答案） */
export interface HiddenAttributeFeedback {
  level: FeedbackLevel;
  hint?: 'higher' | 'lower';
}

export function hiddenGuess(feedback: GuessFeedback): {
  hidden: true;
  correct: boolean;
  attributes: Record<keyof GuessFeedback['attributes'], HiddenAttributeFeedback>;
} {
  const hide = ({ level, hint }: AttributeFeedback): HiddenAttributeFeedback => ({
    level,
    ...(hint ? { hint } : {}),
  });
  return {
    hidden: true,
    correct: feedback.correct,
    attributes: {
      title: hide(feedback.attributes.title),
      rank: hide(feedback.attributes.rank),
      hair: hide(feedback.attributes.hair),
      eyes: hide(feedback.attributes.eyes),
      titleYear: hide(feedback.attributes.titleYear),
      bakusen: hide(feedback.attributes.bakusen),
      cv: hide(feedback.attributes.cv),
    },
  };
}
