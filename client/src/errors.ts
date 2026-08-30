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
  ROOM_NOT_FOUND: '房间不存在或已解散',
  ROOM_FULL: '房间人数已满',
  ROOM_IN_PROGRESS: '对局已开始，只能以旁观身份加入',
  NAME_TAKEN: '这个账号已经在房间里了',
  PLAYER_NOT_FOUND: '找不到你的座位，请重新加入',
  NOT_HOST: '只有房主可以操作',
  NEED_MORE_PLAYERS: '至少需要两名玩家才能开始',
  NOT_PLAYING: '当前不在小局进行中',
  SPECTATOR_CANNOT_GUESS: '旁观者不能猜',
  ALREADY_DONE: '你本小局已经结束了',
  GUESS_LIMIT_REACHED: '猜测次数已用完',
  RATE_LIMITED: '操作太频繁，请稍后再试',
  TOO_MANY_ROOMS: '服务器房间已满，请稍后再试',
  AUTH_REQUIRED: '联机对战需要先登录账号',
  SOCKET_TIMEOUT: '服务器没有响应，请检查网络',
  INVALID_CREDENTIALS: '用户名或密码不正确',
  USERNAME_TAKEN: '这个用户名已经被注册了',
  USERNAME_INVALID: '用户名需 2-16 位，只能用中英文、数字、下划线或连字符',
  PASSWORD_WEAK: '密码至少 8 位',
  UNAUTHORIZED: '请先登录',
};

export function errorMessage(code: string): string {
  return MESSAGES[code] ?? '出现未知错误';
}
