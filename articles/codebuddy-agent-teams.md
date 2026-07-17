# Agent Teams：多智能体小队到底在干什么

> 本文讲 **Agent Teams**（AI 多智能体协作）：不是拉真人进组，也不是商业套餐名。成员全是程序拉起的 Agent。以 CodeBuddy CLI 的行为作对照，但讲的是可迁移设计，不是源码导读。

---

## 它解决什么问题

单会话 Agent 默认是**串行**的。需要帮手时，常见做法是再拉起一个 **subagent**（例如 Explore：搜仓库、查文档）。它干完，把结果经一次 tool result 交回主对话，然后结束——不会留下来跟你或其他 Agent 多轮协作。

这很像：喊人跑腿一趟，递完结果就走。

当你想要的是：

- 几个 Agent **同时**查不同方向  
- 中间还能互相问一句、补一刀  
- 你只跟其中一个「对外接口」说话  

一次性 subagent 就不够了。你需要的是开一个小团队：有人牵头，有人干活，彼此用 **mailbox**（先投递、对方 idle 再看）联系，活可以挂在共享的 **Task List** 上。

**Agent Teams** 就是这类组织方式的产品名。

---

## 谁是谁，怎么建起来

| 角色 | 白话 |
|------|------|
| **Lead** | 你当前这个聊天窗口。对外汇报、拆活、汇总 |
| **Teammate** | 有名字的后台 Agent，各自一份独立对话 |
| **mailbox** | Teammate ↔ Lead / Teammate ↔ Teammate 的异步消息通道：投递即返回，对方空闲后再处理 |
| **Task List** | 共享待办：可认领、改 status，减少口头分工撞车 |

**创建**通常两步：

1. **建队**：当前会话变成 Lead——这时往往还没有工人  
2. **拉人**：按角色 spawn Teammate（UX、架构、挑刺……），每人领到一段初始 **prompt**

产品里你可以一句话说完（「组个队：一个 UX、一个架构、一个挑刺」），底下仍是「先建队、再拉人」。

对人你几乎只跟 **Lead** 聊。不写 `@某人`，消息进 Lead；要指名，才 `@名字`（或让 Lead 转发）。

---

## 上下文从哪来：独立 session，不是共用历史

每个 Teammate 都是**独立一份对话**，不和 Lead 共用同一页 history。

Teammate 通常拿得到的：

- Lead 写的那段初始 **prompt**（最重要）  
- 项目环境：规则、工具、skills——像新开一个正常 session  
- `subagent_type` 对应的角色说明与工具集  
- Teams 协作规矩（要用 mailbox 汇报，而不是假定 Lead「听见」了纯文本）

默认**拿不到**的：

- 你跟 Lead 之前闲聊的整段记录  

所以：想让 Teammate 干好，靠 **prompt 把活写清楚**。这和 **fork**（把父对话活跃历史注进去）是两种设计；正式 Teammate 通常走前者。

---

## 跑起来什么样

### 时间线

```text
你开口要组队
    → 建队：当前会话 = Lead
    → spawn 2～N 个 Teammate（各自后台跑）
    → 并行干活
    → 做完或卡住 → SendMessage(recipient=名字) 写入对方 mailbox
    → 对方 idle 后再开一轮处理这条消息
    → 你继续只跟 Lead 聊，或 @某人
    → 收工：停 Teammate → 清队
```

### 往 mailbox 投递：怎么实现的？怎么分清给 Lead 还是别人？

核心机制就一件事：**调用方显式写出收件人名**。没有隐式「默认寄给队长」的魔法路由。

模型侧用的工具大致是 `SendMessage`，关键字段：

| 字段 | 作用 |
|------|------|
| `type` | `message`（点对点）/ `broadcast`（每人一份）/ 关机与 plan 审批等控制消息 |
| `recipient` | **收件人名字**（`message` 必填） |
| `content` / `summary` | 正文与 UI 预览 |

**名字怎么约定：**

- Lead 在队里的规范名固定是 **`team-lead`**；别名 **`main`** 会解析成 `team-lead`
- 每个 Teammate 在 spawn 时带的 **`name`**（如 `ux`、`arch`）就是他的地址
- 名单会写进团队配置，并出现在 Lead / Teammate 的协作提示里，模型靠这份 roster 填 `recipient`

所以「给队长还是给别的 Agent」= **`recipient` 填谁**：

```text
SendMessage({ type: "message", recipient: "team-lead", ... })  → Lead
SendMessage({ type: "message", recipient: "ux", ... })         → 名叫 ux 的 Teammate
SendMessage({ type: "broadcast", ... })                       → 每个成员各写一份（通常不含滥发语义上的自循环细节，以实现为准）
```

**落盘形态（一种常见实现）：**  
队目录下每人一个 inbox 文件，例如按成员名分文件；`send` = 读出数组 → push 一条（含 `from`、正文、时间）→ 写回。投递成功工具立刻返回，**并不同步跑收件人的下一轮推理**。

**谁在听：**

- Lead：轮询 / idle 时把 inbox 里未读消息变成一轮新的 user 侧输入再 `run`
- Teammate：同理；若已停工，常见做法是 resume 原 transcript 再处理

**你在 UI 里 `@ux`：**  
那是人 → 指定 session 的入口，和 Agent 调 `SendMessage(recipient: "ux")` 是同一套命名空间，但路径不同：前者是你的输入路由，后者是 Agent 工具写 mailbox。

**怎样确认没寄错：**  
看工具参数里的 `recipient`（以及 UI 上消息气泡的 to）。实现里也会用会话上的 `teamContext.memberName` 标 **from**，避免把 Teammate 误标成 `team-lead`。名字对不上时，有的实现仍先写入对应 inbox 文件（接收方上线再取），并在 tool result 里提示「当时 roster 里没有这个名字」——方便模型自纠拼写。

### 往 mailbox 投递，会立刻调起对方吗？

**不会。**  
Send = 写入 inbox 就返回。对方忙就排队；idle（或已结束又被新消息 wake）再处理。这是异步协作，不是 `await teammate()`。

### Teammate 跑在哪：backend 怎么实现的

mailbox / Lead / `name` 管**怎么协作**；**backend** 管每个 Teammate **实际跑在哪**。这是 Teams 专用抽象（`ITeammateBackend`）：统一 `spawn` / `kill` / `isAlive`，消息一律仍走文件 mailbox。独立进程那一路会复用「fork 后台 CLI」等已有能力，但 Backend 接口本身不是给普通 subagent 用的。

#### 1. 选型（设计上的自动检测）

`TeammateBackendRegistry` 的意图：

```text
in-process 可用？
  ├─ 是 → in-process（默认、最轻）
  └─ 否（--swarm 或 CODEBUDDY_DISABLE_INPROCESS_TEAMMATES=1）
        ├─ tmux 可用 → tmux（独立进程 + pane 可视化）
        └─ 否则 → detached-process（独立进程，始终可兜底）
```

**接线现状：** 默认拉人路径（`Agent` → `TeamMember.spawn`）往往**直接**用 in-process，不一定每次 `getBackend()`。`--swarm` / env 会让 in-process 的 `isAvailable()` 变 false；是否真切到 detached/tmux，取决于调用方有没有走 Registry。三类 Backend 和 Registry **代码都在**；以你手头版本的接线为准。

#### 2. in-process（默认路径在干什么）

```text
TeamMember.spawn
  → InProcessTeammateBackend.spawn
       → AgentTask.init({
            detached: true,              // 不阻塞 Lead 这一次工具返回
            teamContext: { teamName, memberName, … },
            isFormalTeamMember: true,  // abort 等与 Lead 解耦
            prompt: 包一层 <teammate-message from=team-lead>…
         })
       → taskManager.registerTask(task)
       → task.execute()                // fire-and-forget
  → TeamMember.startMailboxPolling()   // Lead 进程里轮询该成员 inbox
```

同进程、多份 session / AgentTask，靠事件循环 **异步重叠**（等 LLM/IO 时别人能往前），不是一 Agent 一 OS 线程。mailbox poll 在 **Lead 侧 TeamMember** 上：读到信 → queue / wake / 必要时 resume 原 transcript 再 `run`。

#### 3. detached-process（独立进程）

```text
DetachedProcessTeammateBackend.spawn
  → DaemonProcessManager.forkBgSession(
       子进程: --serve --teammate-mode
               --team-name … --agent-name …
               [--leader-endpoint …]
     )
  → 初始 prompt 写入该成员 mailbox 文件
  → 返回 pid / logPath

子进程:
  TeammateMailboxLifecycle 发现 --teammate-mode
  → 自己的 session + teamContext
  → 自己轮询 mailbox → agentService.runDefault(…)
```

真 OS 进程；Kill：SIGTERM → 超时 SIGKILL。审批常走 **Permission Bridge**（子进程 HTTP 打回 Lead）。Lead 侧**不再**为该成员做 mailbox poll——改由子进程自己消费。

#### 4. tmux

再开 pane 跑同类独立 CLI，接近 detached + 终端可视化。Lead 若不在 tmux，常退回 detached。

#### 5. 和「同时跑」

| 模式 | 「同时」含义 |
|------|----------------|
| in-process | 同事件循环上多 session 交错；墙钟上可多个「进行中」 |
| detached / tmux | 多进程，各自事件循环 |

协作语义不变：仍是显式 `recipient` + 文件 inbox + idle 再 run。换 backend ≠ 换 mailbox 协议。

#### 6. detached 子进程怎么管、怎么杀；Lead 挂了怎么办

**正常收工（推荐）：**

```text
Lead / 你
  → SendMessage(type=shutdown_request, recipient=某人)
  → Teammate 收信 → 交活 → shutdown_response → 自己停 / 退出
  → 众人 idle 后 TeamDelete
       → registry.destroyAll()  → 对每个成员 forceKill
            → detached: SIGTERM → 等一会 → SIGKILL
       → 删掉队目录 / task 目录
```

`TeamDelete` **会拒绝**还有人 `isActive()` 的队——避免半道把正在跑的活砍掉。所以期望是先温柔关机，再删队。

**中途强杀（Lead 还活着）：**

- `TeamMember.forceKill` → `backend.kill(backendId)`，pid 还在 Lead 进程的 map 里就能信号杀掉  
- UI Escape 等也会走注册表里的 forceKill（正式 Teammate 不跟 Lead 的 abort 链绑死，所以要直接杀成员）  
- `keepWakeable: true`（默认）时还可被新 mailbox 消息 respawn；`false` 是永久关

**Lead 进程退出时：**

| 情况 | 行为 |
|------|------|
| **auto-team**（后台自动建的那种） | 退出钩子里会 `destroyAll()` + `deleteTeam()`，尽量把成员一起清掉 |
| **普通 TeamCreate 的队** | 退出钩子里主要是 `cleanupSessionTeams()`：**清磁盘上的 team/task 目录**，防 `~/.codebuddy/teams` 堆僵尸文件夹 |
| **fork 形态** | `forkBgSession` 用 **`detached: true` + `unref()`**：子进程**不跟父进程同生共死**，父挂了子可以继续活 |

因此：Lead **被强杀 / 崩掉** 时，detached Teammate **有可能变孤儿**——mailbox 目录可能已被清掉，子进程 poll 不到新活，跑完当前轮或收 SIGTERM 后自己 `process.exit`；审批若还靠 Permission Bridge，Lead 没了会连不上。这不是「父子进程组一起没」的模型，而是 **显式 kill + 磁盘清理 + 尽量优雅 shutdown**。

运维直觉：别指望关 Lead 窗口自动等价于杀光所有 detached Teammate；正式收工走 **shutdown_request → TeamDelete**；异常退出后可用进程列表 / teammate 日志核对是否还有残留 pid。

### broadcast 能否「各自认领」？

Teammate **可以并行**。**broadcast** 只是每人 inbox 里都出现同一条消息，各自被叫醒——**不是** Task List 自动拆单。

更稳的分活：

1. 用 Task List 拆成多条 task  
2. Teammate claim（写 owner、改 status）  
3. broadcast 最多喊一声「板上有新任务」

只靠「你们自己分」+ broadcast，容易抢同一块或漏块。

### 和一次性 subagent 比

| | subagent | Agent Teams |
|--|----------|-------------|
| 生命周期 | 干完就散 | 可协作一段时间 |
| 通信 | 基本一次 tool result 交回 | 可多轮 mailbox；可共享 Task List |
| 你怎么感知 | 助手愣一下带回结果 | 多个命名 Teammate 在后台 |
| Token | 相对低 | 更高（每人独立上下文） |

---

## 何时用，何时别用，代价

**适合：** 并行调研、模块分头改、多假设排查、需要持续协作。

**不适合：** 强顺序流水线、多人抢同一文件、高耦合串行——协调成本会吃掉并行。

**代价：**

- Token：按 Teammate 数涨  
- 协调：prompt / Task List 拆不好 = 重复或空洞  
- 心智：独立 session + 异步 mailbox，不是多线程函数调用  

只要「搜一下就回」，用 subagent 通常更便宜。

---

## 设计上真正关键的两笔账

借鉴 Teams 时先想清：

1. **要不要 peer 互发？**  
   只要树状派工（只向 Lead 汇报），协议可以更简单；平行 session 要互提需求，才值得上 mailbox。

2. **协作状态放哪？**  
   多轮感通常来自**外存上的消息与成员身份**（文件或 DB），而不是多个 Agent 卡在同一次 LLM run 里互相 await。进程重启后消息还在，才能 idle 再处理。

并行 ← 多个独立 session（默认同进程异步重叠；可选独立进程 backend）；协作 ← mailbox 协议；对人入口 ← 唯一的 Lead 窗口。

---

## 产品侧怎么控（CodeBuddy CLI）

| 意图 | 常见做法 |
|------|----------|
| 跟某人说 | `@成员名` |
| broadcast | `@all` |
| 看状态 | 输入区附近：谁在跑 / 谁完成 |
| 只跟 Lead 说 | 不 @，或切回主会话 |
| 散伙 | 「清理团队」（先停活跃 Teammate） |

```text
我要设计一个追踪代码 TODO 的 CLI。
创建一个团队：一个 UX、一个架构、一个专门挑刺。
```

人数、更小模型、改码前先交 plan 等人审——都是建队/拉人上的旋钮，不是另一种架构。
