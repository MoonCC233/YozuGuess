/** 服务端运行配置，全部可通过环境变量覆盖 */
export const config = {
  port: Number(process.env.PORT ?? 3000),
  /** 单人对局在内存中的存活时间（毫秒），默认 30 分钟无操作过期 */
  sessionTtlMs: Number(process.env.SESSION_TTL_MS ?? 30 * 60 * 1000),
  /** 内存中同时保留的最大对局数，防止无限增长 */
  maxSessions: Number(process.env.MAX_SESSIONS ?? 5000),
  /** 生产模式下托管的前端静态目录（相对仓库根） */
  clientDist: process.env.CLIENT_DIST ?? '../client/dist',
} as const;
