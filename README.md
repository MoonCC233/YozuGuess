<div align="center">

<img src="https://proxy.mooncc.eu.cc/https://raw.githubusercontent.com/MoonCC233/YozuGuess/refs/heads/main/client/public/favicon-192.png" alt="柚一把" width="120" height="120">

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
| 自由练习 | 每局随机抽取答案，可无限重开，难度自选 |
| 每日一柚 | 当天所有玩家同一个答案，按本地日期切换；**不分难度**，固定从全作品全角色（167 位）中抽题 |
| 联机对战 | 房间内多人同题竞速，BO1 / BO3 / BO5 / BO7，详见[联机对战](#联机对战) |

### 难度

四档阶层，只作用于自由练习与联机对战：

| 阶层 | 花名 | 答案池 | 人数 |
| --- | --- | --- | --- |
| 简单模式 | `? !弱弱! ?` | 四大名著全角色（魔女的夜宴、千恋*万花、RIDDLE JOKER、星光咖啡馆与死神之蝶） | 45 |
| 普通模式 | `⚡电 电⚡` | 全部作品的可攻略角色 | 72 |
| 困难模式 | `雑魚♥~` | 四大名著 + 天使☆嚣嚣 RE-BOOT、LimeLight Lemonade Jam、天色幻想岛、DRACU-RIOT! 共八部全角色 | 101 |
| 地狱模式 | `柚~来~` | 全部作品全角色，含男主角与配角 | 167 |

四档都允许猜任意角色，方便用池外配角试探属性。

接口取值为 `easy` / `normal` / `hard` / `hell`。`POST /api/game/start` 传 `mode: 'daily'` 时会忽略 `difficulty`，一律按 `/api/meta` 里的 `dailyDifficulty`（即 `hell`）出题，落库的战绩也记这一档。早期版本的 `heroine` / `full` 由迁移（`user_version` 2）改写成四档；随后普通与困难整体互换，历史记录也由迁移（`user_version` 3）跟着换，仍指向当初玩的那个答案池。

## 联机对战

在首页点「联机对战」进入大厅，建房或用 **5 位房间号**加入。房间通过 Socket.IO 实时同步，状态只存在服务端内存中。

**联机对战需要登录账号**：房间里显示的名字直接取自账号用户名，未登录时 `room:create` / `room:join` 会返回 `AUTH_REQUIRED`。想换个显示名，到账号中心改用户名即可（见[账号与战绩](#账号与战绩)）。同一账号不能同时占两个座位。单人模式不受影响，仍可匿名玩。

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
| `room:create` | C → S | `{ boType, difficulty }` | 建房（需登录，名字取账号用户名；`difficulty` 取 `easy` / `normal` / `hard` / `hell`），返回 `{ code, key, room }` |
| `room:join` | C → S | `{ code, spectator }` | 加入房间（需登录），返回 `{ code, key, room }` |
| `room:rejoin` | C → S | `{ code, key }` | 断线重连认领座位 |
| `room:start` | C → S | — | 房主开始下一小局（整场已结束时自动先重置） |
| `room:reset` | C → S | — | 房主重置比分回等待状态 |
| `room:guess` | C → S | `{ characterId }` | 提交猜测，返回 `{ feedback, roundOver }` |
| `room:leave` | C → S | — | 离开房间 |
| `room:state` | S → C | `PublicRoom` | 房间快照推送，按各自视角定制，`revision` 自增可用于丢弃乱序消息 |

错误码：`INVALID_PAYLOAD`、`AUTH_REQUIRED`、`ROOM_NOT_FOUND`、`ROOM_FULL`、`ROOM_IN_PROGRESS`、`NAME_TAKEN`（同一账号已在房内）、`PLAYER_NOT_FOUND`、`NOT_HOST`、`NEED_MORE_PLAYERS`、`NOT_PLAYING`、`SPECTATOR_CANNOT_GUESS`、`ALREADY_DONE`、`GUESS_LIMIT_REACHED`、`DUPLICATE_GUESS`、`CHARACTER_NOT_FOUND`、`RATE_LIMITED`、`TOO_MANY_ROOMS`。

## 账号与战绩

账号对单人模式是**可选**的：不登录也能玩，只是不留记录。**联机对战必须登录**，因为房间里的名字直接取自账号用户名。登录后单人对局与联机对战会自动落库，可在个人主页查看统计与历史。

### 认证方式

- 密码用 Node 内置 `scrypt` 加盐哈希存储（每个用户独立随机盐），校验走定时安全比较
- 会话令牌存在 `httpOnly` + `sameSite=lax` 的 `yozu_session` cookie 中，前端读不到，登录态通过 `GET /api/auth/me` 探测
- 修改密码会吊销该账号的**其他**所有会话，当前设备保持登录
- 用户名 2-16 位（中英文、数字、下划线、连字符），大小写不敏感去重；密码至少 8 位
- 认证类接口按 IP 独立限流（默认 20 次 / 窗口），防暴力撞库

### 修改用户名

在账号中心可随时改用户名。用户名同时是**登录名**和**联机显示名**，所以：

- 改完之后必须用新用户名登录，旧名立即释放给别人
- 改名不影响任何现有会话（不需要重新登录），也不改动已产生的战绩
- 排行榜实时关联 `users` 表，改名后立刻显示新名字
- 历史对战记录里的对手名是当时的快照，不会跟着改

### 统计口径

| 规则 | 说明 |
| --- | --- |
| 匿名局不记录 | 未登录时开的单人局不会写入任何战绩（联机必须登录，不存在匿名场） |
| 每日一柚每天只计第一次 | 靠数据库唯一索引保证，同一天重开不会刷数据；每日局固定记为地狱模式（全角色池） |
| 自由练习每局都记 | 想刷多少局都行 |
| 放弃看答案算一局 | 状态记为 `revealed`，计入场次但不计胜 |
| 联机重赛单独计一场 | 房主重置比分后是新的一场 |
| 弃权双方都留记录 | 逃跑者记败绩，留下的人记胜绩 |
| 排行榜口径 | 按单人猜中局数排序，同分时平均猜测次数少的靠前 |

### 数据表

SQLite 文件默认落在 `server/data/yozu.db`（`DB_PATH` 可改），首次启动自动建表。结构版本记在 `PRAGMA user_version` 里，启动时按需增量迁移。

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
| `node scripts/build-portraits.mjs` | 重新生成角色立绘 webp（仅在替换源图后需要，见[立绘资源](#立绘资源)） |
| `node scripts/build-favicon.mjs` | 从 `logo-1.png` 重新生成 favicon（仅在换 Logo 后需要，见[站点图标](#站点图标)） |

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
| `GET /api/meta` | 最大猜测次数、作品元数据、四档难度描述（`difficulties`）、各档答案池大小（`poolSizes`）与每日一柚固定档位（`dailyDifficulty`） |
| `GET /api/characters` | 猜测用角色列表（仅 `id` / `name` / `nameJp`，不含答案属性） |
| `GET /api/characters/search?q=` | 按中/日文名模糊搜索 |
| `GET /api/codex` | 图鉴：完整角色资料 + 声优同人化名 |
| `POST /api/game/start` | 开始对局，body: `{ mode, difficulty }`，`difficulty` 取 `easy` / `normal` / `hard` / `hell`；`mode: 'daily'` 时忽略 `difficulty`，固定用全角色池 |
| `GET /api/game/:sessionId` | 读取进行中的对局（未结束时不返回答案） |
| `POST /api/game/guess` | 提交猜测，body: `{ sessionId, characterId }` |
| `POST /api/game/reveal` | 放弃并公布答案，body: `{ sessionId }` |
| `POST /api/auth/register` | 注册并登录，body: `{ username, password }` |
| `POST /api/auth/login` | 登录，body: `{ username, password }` |
| `POST /api/auth/logout` | 登出，吊销当前会话 |
| `GET /api/auth/me` | 当前登录用户，未登录返回 `{ user: null }` |
| `POST /api/auth/password` | 改密，body: `{ currentPassword, newPassword }`，会吊销其他会话 |
| `POST /api/auth/username` | 改用户名，body: `{ username }`，返回 `{ user }`，不影响现有会话 |
| `GET /api/me/stats` | 单人 / 每日 / 联机三组统计（需登录） |
| `GET /api/me/history?limit=` | 最近单人对局与联机对战（需登录，上限 100） |
| `GET /api/leaderboard?limit=` | 排行榜，无需登录 |

错误码：`SESSION_NOT_FOUND`、`GAME_FINISHED`、`CHARACTER_NOT_FOUND`、`DUPLICATE_GUESS`、`INVALID_PAYLOAD`、`NOT_FOUND`、`INTERNAL_ERROR`、`RATE_LIMITED`、`UNAUTHORIZED`、`INVALID_CREDENTIALS`、`USERNAME_TAKEN`、`USERNAME_INVALID`、`PASSWORD_WEAK`。
联机对战不走 REST，全部通过 Socket.IO 事件完成，见[联机对战](#联机对战)。

## 数据

- [`shared/src/characters.ts`](shared/src/characters.ts) —— 柚子社全 13 作共 167 位角色，字段取自萌娘百科
- [`shared/src/divide.json`](shared/src/divide.json) —— 声优化名分组（同一位声优在不同作品的署名），用于「接近」判定
- [`client/public/portraits/`](client/public/portraits) —— 角色立绘，全 167 位角色各两档 webp（`card/` 高 400，`thumb/` 高 128，统一 3:4），按角色 id 命名

猜测时若两个角色的 CV 是同一位声优的不同化名，声优列判为 🟨 接近；占位值 `无`（男主角）与 `未知` 不参与同人判定。

### 立绘资源

[`scripts/build-portraits.mjs`](scripts/build-portraits.mjs) 负责把立绘源图转成前端消费的 webp。源图目录 `yuz_char_img/`（按发售年份分子目录，文件名为角色中文名）不入库，脚本产物已提交，日常开发无需重跑。

```bash
pnpm --filter @yozu/shared build   # 脚本读取 shared/dist/characters.js
node scripts/build-portraits.mjs
```

脚本按**角色中文名**匹配 `CHARACTERS` 取 id（源图目录年份与作品年份并不一致，不能按目录推断作品），同时生成 [`client/src/portraitIds.json`](client/src/portraitIds.json) 供前端判断某角色是否有立绘。任一文件名匹配不上角色时脚本会列出清单并非零退出。

处理流程分五步：抹掉黑色衬底 → **裁掉底部版权水印** → trim 掉透明留白 → **统一裁成 3:4** → 缩放出两档 webp。

少数源图是从 CG 上抠下来的，人物背后留了一层不透明的黑色衬底（`朝雾春奈`、`海老原水濑`），直接压 webp 会在卡片里显示成一块黑底。脚本只对「边框整圈都不透明、且这圈基本全黑」的图动手，从边框向内泛洪把连通的暗色像素改成透明——绝大多数源图本来就带透明留白，边框环的不透明占比很低，会被前置判定挡掉，不会误伤深色头发或深色背景的立绘；人物身上被头发圈住的暗色区域与边框不连通，也不会被掏空。

早期作品有一批 250x300 的源图在最底部压了一行 `©20xx YUZUSOFT` 之类的版权水印（`久岛佳苗`、`市杵宍姬命` 等 26 张）。250x300 比 3:4 更宽，`frameToAspect` 会裁两侧保全高，水印必然残留，所以必须主动裁底。难点在于把 1px 笔画的小字和「深色衣摆／深色背景」区分开：单看暗色像素占比，穿黑衣的角色比真有水印的还高。`findWatermarkTop` 的判据是**横向中值滤波**——窗口 7 的中值会抹掉 1px 宽的笔画、但整块色区的中值不变，因此 `|亮度 - 横向中值| > 26` 的像素基本只剩细笔画；再按行统计笔画密度，在底部找一段 6~14 行的高密度带，并要求密度不低于 0.1、且至少是上方 24 行基线的 3 倍。定位到峰值后还要向上扩张到密度回落至基线附近，否则字的上沿会留下一条残影。水印常压在人物轮廓外的透明区域上，所以统计前先 `flatten` 到中灰底，否则这部分笔画会被 alpha 吃掉。判据在全部 167 张源图上与逐张肉眼核对完全一致（26 命中 / 141 未命中），产物用同一判据复扫为 0 残留。

源图纵横比差异很大（trim 后 0.38~1.46），少数是带实心背景的 CG 横向裁图，若不统一比例，宽图在 `aspect-ratio: 3/4` 的卡片里会被压成一条横带、下方留大片空白。裁切规则是宽图取顶部区域不透明像素的横向中位数当作人物头部位置、据此裁掉两侧，高图则保留顶部。`ASPECT` 常量必须与 `styles.css` 里 `.portrait-card` 的 `aspect-ratio` 保持一致。

立绘目前覆盖全部 167 位角色。若将来新增角色而立绘缺位，`Portrait` 组件会渲染姓名首字占位，布局不会塌陷。

图鉴支持卡片与表格两种视图，切换状态存 localStorage：卡片视图用 `card` 档立绘，表格视图用 `thumb` 档。

### 站点图标

页头 Logo 有四张（[`client/public/logos/`](client/public/logos)），每次页面加载随机轮换一张，见 [`client/src/brandLogo.ts`](client/src/brandLogo.ts)。浏览器标签页图标需要固定，所以 [`scripts/build-favicon.mjs`](scripts/build-favicon.mjs) 固定取 `logo-1.png` 生成：

| 产物 | 用途 |
| --- | --- |
| `favicon.ico` | 内嵌 16/32/48 三帧 PNG，兼容旧浏览器与 `/favicon.ico` 默认请求 |
| `favicon-32.png` | 现代浏览器标签页 |
| `favicon-192.png` | Android 主屏图标 |
| `apple-touch-icon.png` | iOS 添加到主屏幕，180x180 且压平为不透明（iOS 会把透明区渲染成黑色） |

产物在 `client/public/` 下，随 vite 原样拷进 `client/dist/`，由 server 的静态托管直接提供。四个文件都已提交，换 Logo 后重跑脚本即可。本 README 顶部的标题图标也复用 `favicon-192.png`。

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
├── storage.ts       # localStorage 持久化（房间 / 对局 / 主题 / 图鉴视图）
├── portraits.ts     # 角色 id -> 立绘 URL
├── MetaContext.tsx  # 全局元数据
├── AuthContext.tsx  # 登录态与账号操作
├── components/      # GuessBoard / GuessInputBar / Portrait / Toast
└── pages/           # Home / Game / MultiLobby / MultiRoom / Codex / Rules / Login / Profile / Leaderboard
scripts
├── build-portraits.mjs  # 立绘源图 -> 两档 webp
└── build-favicon.mjs    # logo-1.png -> favicon.ico / png / apple-touch-icon
```

## 致谢

玩法参考 [shnlfriberg/csgofriberg](https://github.com/shnlfriberg/csgofriberg)（弗一把）。
