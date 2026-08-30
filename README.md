<div align="center">

# 柚一把 (YozuGuess)

**柚子社（ゆずソフト）全作品角色猜谜游戏 —— 类 Wordle 玩法**

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React 18](https://img.shields.io/badge/React_18-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?logo=socketdotio&logoColor=white)
![pnpm workspaces](https://img.shields.io/badge/pnpm-workspaces-F69220?logo=pnpm&logoColor=white)

[玩法](#玩法) · [联机对战](#联机对战) · [账号与战绩](#账号与战绩) · [快速开始](#快速开始) · [接口](#接口) · [数据](#数据) · [项目结构](#项目结构)

</div>

---

## 玩法

输入角色名，系统按 **作品 / 位次 / 发色 / 瞳色 / 作品年份 / 爆闪次数 / 声优** 逐属性给出对比反馈：

- 🟩 **绿色** —— 该属性与答案完全一致
- 🟨 **黄色** —— 接近（位次相邻、年份相差 ≤3 年、爆闪次数相差 ≤3 次，或同一位声优的其他化名）
- ⬛ **灰色** —— 不一致
- ↑↓ **箭头** —— 数值型属性提示答案比你猜的更大或更小

**8 次机会**内猜出目标角色即获胜。

### 模式

| 模式 | 说明 |
| --- | --- |
| 自由练习 | 每局随机抽取答案，可无限重开 |
| 每日一柚 | 当天所有玩家同一个答案，按本地日期切换 |
| 联机对战 | 房间内多人同题竞速，BO1 / BO3 / BO5 / BO7，详见[联机对战](#联机对战) |

### 难度

| 难度 | 答案池 |
| --- | --- |
| 简单版 | 仅可攻略女主角（72 位） |
| 完整版 | 全部角色，含男主角与配角（167 位） |

两种难度都允许猜任意角色，方便用配角试探属性。

## 联机对战

在首页点「联机对战」进入大厅，填昵称后建房或用 **5 位房间号**加入。房间通过 Socket.IO 实时同步，状态只存在服务端内存中。

### 流程

1. **建房** —— 选赛制（BO1 / BO3 / BO5 / BO7）与难度，拿到房间号分享给朋友
2. **加入** —— 输入房间号；勾选「以旁观者身份加入」则只看不猜
3. **开局** —— 至少 2 名玩家就位后由房主开始，全房同一个答案，每小局默认 120 秒
4. **结算** —— 小局结束公布答案并计分，间歇 8 秒后自动开下一小局
5. **收场** —— 有人先拿到 `ceil(BO/2)` 胜即赢下整场；打满全部小局则按总比分判定。房主可「再开一场」或「重置比分」

### 小局判定

| 情况 | 结果 |
| --- | --- |
| 有人猜中 | 最早猜中者拿下小局（`solved`） |
| 无人猜中且机会用尽 | 按接近程度判定（`exhausted`） |
| 倒计时结束 | 按接近程度判定（`timeout`） |
| 对手离开房间 | 剩下的人直接赢下整场（`forfeit`） |

**接近程度**取每位玩家单次猜测的最高得分：🟩 每个 2 分、🟨 每个 1 分。得分相同则猜测次数少者胜；仍然持平、或双方都没蒙对任何属性、或一次都没猜，则本小局判平局，双方都不得分。一次都没猜过的玩家不参与比较，挂机不会赢。

### 防作弊

小局进行中你只能看到对手每次猜测的**颜色**，看不到具体角色名和属性值（棋盘显示为「？？？」）。小局结算或整场结束后才互相揭示完整反馈。房间快照从不包含答案 ID，旁观者始终能看到双方完整反馈但不能提交猜测。

### 断线重连

玩家凭 `playerKey`（存在浏览器 localStorage）重连认领原座位，比分与本小局已提交的猜测都会恢复。断线期间其他人会看到你的离线标记。房间人数上限 8 名玩家 + 20 名旁观。

### Socket 事件

客户端事件均带 ack 回调，响应形如 `{ ok: true, data }` 或 `{ ok: false, error }`。

| 事件 | 方向 | 载荷 | 说明 |
| --- | --- | --- | --- |
| `room:create` | C → S | `{ name, boType, difficulty }` | 建房，返回 `{ code, key, room }` |
| `room:join` | C → S | `{ code, name, spectator }` | 加入房间，返回 `{ code, key, room }` |
| `room:rejoin` | C → S | `{ code, key }` | 断线重连认领座位 |
| `room:start` | C → S | — | 房主开始下一小局（整场已结束时自动先重置） |
| `room:reset` | C → S | — | 房主重置比分回等待状态 |
| `room:guess` | C → S | `{ characterId }` | 提交猜测，返回 `{ feedback, roundOver }` |
| `room:leave` | C → S | — | 离开房间 |
| `room:state` | S → C | `PublicRoom` | 房间快照推送，按各自视角定制，`revision` 自增可用于丢弃乱序消息 |

错误码：`INVALID_PAYLOAD`、`ROOM_NOT_FOUND`、`ROOM_FULL`、`ROOM_IN_PROGRESS`、`NAME_TAKEN`、`PLAYER_NOT_FOUND`、`NOT_HOST`、`NEED_MORE_PLAYERS`、`NOT_PLAYING`、`SPECTATOR_CANNOT_GUESS`、`ALREADY_DONE`、`GUESS_LIMIT_REACHED`、`DUPLICATE_GUESS`、`CHARACTER_NOT_FOUND`、`RATE_LIMITED`、`TOO_MANY_ROOMS`。

## 账号与战绩

账号是**完全可选**的：不登录也能玩全部模式，只是不留记录。登录后单人对局与联机对战会自动落库，可在个人主页查看统计与历史。

### 认证方式

- 密码用 Node 内置 `scrypt` 加盐哈希存储（每个用户独立随机盐），校验走定时安全比较
- 会话令牌存在 `httpOnly` + `sameSite=lax` 的 `yozu_session` cookie 中，前端读不到，登录态通过 `GET /api/auth/me` 探测
- 修改密码会吊销该账号的**其他**所有会话，当前设备保持登录
- 用户名 2-16 位（中英文、数字、下划线、连字符），大小写不敏感去重；密码至少 8 位
- 认证类接口按 IP 独立限流（默认 20 次 / 窗口），防暴力撞库

### 统计口径

| 规则 | 说明 |
| --- | --- |
| 匿名局不记录 | 未登录时开的局不会写入任何战绩 |
| 每日一柚每天只计第一次 | 靠数据库唯一索引保证，同一天重开不会刷数据 |
| 自由练习每局都记 | 想刷多少局都行 |
| 放弃看答案算一局 | 状态记为 `revealed`，计入场次但不计胜 |
| 联机重赛单独计一场 | 房主重置比分后是新的一场 |
| 弃权双方都留记录 | 逃跑者记败绩，留下的人记胜绩 |
| 排行榜口径 | 按单人猜中局数排序，同分时平均猜测次数少的靠前 |

### 数据表

SQLite 文件默认落在 `server/data/yozu.db`（`DB_PATH` 可改），首次启动自动建表。

| 表 | 用途 |
| --- | --- |
| `users` | 用户名、密码哈希、注册与最后登录时间 |
| `auth_sessions` | 会话令牌，带过期时间与最后活跃时间，每小时清扫过期项 |
| `game_records` | 单人对局：模式、难度、结果、猜测次数、答案、用时、日期键 |
| `match_records` | 联机对战：房间号、赛制、结果、比分、对手列表、结束原因 |

## 快速开始

**环境要求**：Node.js ≥ 20（需内置 `node:sqlite`，建议 22+）、pnpm。进行中的单人对局与联机房间保存在服务端内存中（单人默认 30 分钟无操作过期，房间默认 1 小时）；账号与战绩持久化在 SQLite 文件里。

```bash
pnpm install
pnpm dev        # server: 3000, client: 5173
```

访问 http://localhost:5173 。

生产模式下 server 会自动托管 `client/dist`：

```bash
pnpm build
pnpm start      # http://localhost:3000
```

### 常用脚本

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 构建 shared 后并行启动前后端开发服务 |
| `pnpm build` | 依次构建 shared / server / client |
| `pnpm start` | 生产模式启动（server 托管 client/dist） |
| `pnpm test` | 运行 shared 与 server 的 vitest 用例 |
| `pnpm typecheck` | 全部包类型检查 |

### 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `3000` | 服务端监听端口 |
| `SESSION_TTL_MS` | `1800000` | 单人对局在内存中的存活时间 |
| `MAX_SESSIONS` | `5000` | 同时保留的最大单人对局数 |
| `CLIENT_DIST` | `../client/dist` | 托管的前端产物目录（相对 `server/dist`） |
| `READ_RATE_LIMIT` | `300` | 读接口每窗口请求上限 |
| `WRITE_RATE_LIMIT` | `120` | 写接口（开局 / 猜测 / 公布答案）每窗口上限 |
| `RATE_LIMIT_WINDOW_MS` | `60000` | 限流窗口长度 |
| `ROUND_DURATION_MS` | `120000` | 联机每小局时长 |
| `INTERMISSION_MS` | `8000` | 小局之间的结算间歇 |
| `ROOM_TTL_MS` | `3600000` | 房间无活动后回收的时间 |
| `MAX_ROOMS` | `500` | 同时保留的最大房间数 |
| `DB_PATH` | `data/yozu.db` | SQLite 数据库文件路径（相对 `server/`） |
| `AUTH_SESSION_TTL_MS` | `2592000000` | 登录会话有效期，默认 30 天 |
| `AUTH_COOKIE_SECURE` | `false` | 设为 `true` 时会话 cookie 只走 HTTPS，生产环境建议开启 |
| `AUTH_RATE_LIMIT` | `20` | 注册 / 登录 / 改密每窗口请求上限 |

限流按 IP 分桶。Socket 事件另有独立配额：建房 10 次 / 窗口，加入与重连 30 次 / 窗口，猜测 120 次 / 窗口。

## 接口

所有错误响应统一为 `{ "code": "..." }` 形式的机器可读格式。

| 端点 | 说明 |
| --- | --- |
| `GET /api/health` | 健康检查 |
| `GET /api/meta` | 最大猜测次数、作品元数据、各难度答案池大小 |
| `GET /api/characters` | 猜测用角色列表（仅 `id` / `name` / `nameJp`，不含答案属性） |
| `GET /api/characters/search?q=` | 按中/日文名模糊搜索 |
| `GET /api/codex` | 图鉴：完整角色资料 + 声优同人化名 |
| `POST /api/game/start` | 开始对局，body: `{ mode, difficulty }` |
| `GET /api/game/:sessionId` | 读取进行中的对局（未结束时不返回答案） |
| `POST /api/game/guess` | 提交猜测，body: `{ sessionId, characterId }` |
| `POST /api/game/reveal` | 放弃并公布答案，body: `{ sessionId }` |
| `POST /api/auth/register` | 注册并登录，body: `{ username, password }` |
| `POST /api/auth/login` | 登录，body: `{ username, password }` |
| `POST /api/auth/logout` | 登出，吊销当前会话 |
| `GET /api/auth/me` | 当前登录用户，未登录返回 `{ user: null }` |
| `POST /api/auth/password` | 改密，body: `{ currentPassword, newPassword }`，会吊销其他会话 |
| `GET /api/me/stats` | 单人 / 每日 / 联机三组统计（需登录） |
| `GET /api/me/history?limit=` | 最近单人对局与联机对战（需登录，上限 100） |
| `GET /api/leaderboard?limit=` | 排行榜，无需登录 |

错误码：`SESSION_NOT_FOUND`、`GAME_FINISHED`、`CHARACTER_NOT_FOUND`、`DUPLICATE_GUESS`、`INVALID_PAYLOAD`、`NOT_FOUND`、`INTERNAL_ERROR`、`RATE_LIMITED`、`UNAUTHORIZED`、`INVALID_CREDENTIALS`、`USERNAME_TAKEN`、`USERNAME_INVALID`、`PASSWORD_WEAK`。

联机对战不走 REST，全部通过 Socket.IO 事件完成，见[联机对战](#联机对战)。

## 数据

- [`shared/src/characters.ts`](shared/src/characters.ts) —— 柚子社全 13 作共 167 位角色，字段取自萌娘百科
- [`shared/src/divide.json`](shared/src/divide.json) —— 声优化名分组（同一位声优在不同作品的署名），用于「接近」判定

猜测时若两个角色的 CV 是同一位声优的不同化名，声优列判为 🟨 接近；占位值 `无`（男主角）与 `未知` 不参与同人判定。

## 项目结构

```
shared/src
├── types.ts         # Character / 反馈类型 / 作品元数据
├── characters.ts    # 角色数据集
├── divide.json      # 声优化名分组
├── cvGroups.ts      # 化名 -> 声优反向索引
├── gameService.ts   # compareGuess 逐属性判定
├── multiplayer.ts   # 房间快照 / 赛制 / 联机错误码
└── pools.ts         # 难度答案池、每日谜题、名字搜索
server/src
├── config.ts        # 环境配置
├── db.ts            # SQLite 连接与建表（node:sqlite）
├── accounts.ts      # 账号核心：scrypt 认证、会话、战绩统计
├── auth.ts          # 会话 cookie 与登录态中间件
├── gameStore.ts     # 单人对局内存存储（TTL + 容量淘汰）
├── rateLimit.ts     # 滑动窗口限流
├── routes.ts        # REST 接口 + zod 校验
├── roomEngine.ts    # 联机房间状态机与胜负判定
├── socket.ts        # Socket.IO 事件层
└── app.ts           # Express 应用与静态托管
client/src
├── api.ts           # fetch 封装与错误码
├── socket.ts        # socket.io-client 封装（ack Promise 化）
├── storage.ts       # localStorage 持久化（昵称 / 房间 / 对局）
├── MetaContext.tsx  # 全局元数据
├── AuthContext.tsx  # 登录态与账号操作
├── components/      # GuessBoard / GuessInputBar / Toast
└── pages/           # Home / Game / MultiLobby / MultiRoom / Codex / Rules / Login / Profile / Leaderboard
```

## 致谢

玩法参考 [shnlfriberg/csgofriberg](https://github.com/shnlfriberg/csgofriberg)（弗一把）。
