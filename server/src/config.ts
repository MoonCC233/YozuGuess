/** 服务端运行配置，全部可通过环境变量覆盖 */
export const config = {
  port: Number(process.env.PORT ?? 3000),
  /** 单人对局在内存中的存活时间（毫秒），默认 30 分钟无操作过期 */
  sessionTtlMs: Number(process.env.SESSION_TTL_MS ?? 30 * 60 * 1000),
  /** 内存中同时保留的最大对局数，防止无限增长 */
  maxSessions: Number(process.env.MAX_SESSIONS ?? 5000),
  /** 生产模式下托管的前端静态目录（相对仓库根） */
  clientDist: process.env.CLIENT_DIST ?? '../client/dist',
  /** 限流：读接口每分钟上限 */
  readRateLimit: Number(process.env.READ_RATE_LIMIT ?? 300),
  /** 限流：写接口（开局/猜测/公布答案）每分钟上限 */
  writeRateLimit: Number(process.env.WRITE_RATE_LIMIT ?? 120),
  /** 限流窗口长度（毫秒） */
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60 * 1000),
  /** 单局对战每小局时长（毫秒） */
  roundDurationMs: Number(process.env.ROUND_DURATION_MS ?? 120 * 1000),
  /** 小局之间的结算间歇（毫秒） */
  intermissionMs: Number(process.env.INTERMISSION_MS ?? 8 * 1000),
  /** 房间无活动后回收的时间（毫秒） */
  roomTtlMs: Number(process.env.ROOM_TTL_MS ?? 60 * 60 * 1000),
  /** 内存中同时保留的最大房间数 */
  maxRooms: Number(process.env.MAX_ROOMS ?? 500),
  /** SQLite 数据库文件路径（相对 `server/`），`:memory:` 表示内存库 */
  dbPath: process.env.DB_PATH ?? 'data/yozu.db',
  /** 登录会话有效期（毫秒），默认 30 天 */
  authSessionTtlMs: Number(process.env.AUTH_SESSION_TTL_MS ?? 30 * 24 * 60 * 60 * 1000),
  /** 会话 cookie 是否只走 HTTPS，生产环境建议开启 */
  authCookieSecure: process.env.AUTH_COOKIE_SECURE === 'true',
} as const;
