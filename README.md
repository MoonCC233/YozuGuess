<div align="center">

# 柚一把 (YozuGuess)

**柚子社（ゆずソフト）全作品角色猜谜游戏 —— 类 Wordle 玩法**

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React 18](https://img.shields.io/badge/React_18-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![pnpm workspaces](https://img.shields.io/badge/pnpm-workspaces-F69220?logo=pnpm&logoColor=white)

[玩法](#玩法) · [快速开始](#快速开始) · [接口](#接口) · [数据](#数据) · [项目结构](#项目结构)

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

### 难度

| 难度 | 答案池 |
| --- | --- |
| 简单版 | 仅可攻略女主角（72 位） |
| 完整版 | 全部角色，含男主角与配角（167 位） |

两种难度都允许猜任意角色，方便用配角试探属性。

## 快速开始

**环境要求**：Node.js ≥ 20、pnpm。无需数据库，进行中的对局保存在服务端内存中（默认 30 分钟无操作过期）。

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
| `SESSION_TTL_MS` | `1800000` | 对局在内存中的存活时间 |
| `MAX_SESSIONS` | `5000` | 同时保留的最大对局数 |
| `CLIENT_DIST` | `../client/dist` | 托管的前端产物目录（相对 `server/dist`） |

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

错误码：`SESSION_NOT_FOUND`、`GAME_FINISHED`、`CHARACTER_NOT_FOUND`、`DUPLICATE_GUESS`、`INVALID_PAYLOAD`、`NOT_FOUND`、`INTERNAL_ERROR`。

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
└── pools.ts         # 难度答案池、每日谜题、名字搜索
server/src
├── config.ts        # 环境配置
├── gameStore.ts     # 内存对局存储（TTL + 容量淘汰）
├── routes.ts        # REST 接口 + zod 校验
└── app.ts           # Express 应用与静态托管
client/src
├── api.ts           # fetch 封装与错误码
├── MetaContext.tsx  # 全局元数据
├── components/      # GuessBoard / GuessInputBar / Toast
└── pages/           # Home / Game / Codex / Rules
```

## 致谢

玩法参考 [shnlfriberg/csgofriberg](https://github.com/shnlfriberg/csgofriberg)（弗一把）。
