/** 后端错误码 -> 中文提示 */
const MESSAGES: Record<string, string> = {
  SESSION_NOT_FOUND: '对局已过期或不存在，请重新开始',
  GAME_FINISHED: '本局已结束',
  CHARACTER_NOT_FOUND: '找不到这个角色',
  DUPLICATE_GUESS: '这个角色已经猜过了',
  INVALID_PAYLOAD: '请求参数不合法',
  NOT_FOUND: '接口不存在',
  INTERNAL_ERROR: '服务端出错了，请稍后再试',
  REQUEST_FAILED: '请求失败，请检查网络',
};

export function errorMessage(code: string): string {
  return MESSAGES[code] ?? '出现未知错误';
}
