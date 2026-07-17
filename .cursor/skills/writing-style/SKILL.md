---
name: writing-style
description: >-
  Write technical blog posts and explainers in Shizhe's personal voice:
  principle-first, project-informed but project-agnostic, plain language over
  APIs and function names. Use when drafting or rewriting articles under
  articles/, 技术博客, 原理文, 设计解读, or when the user asks to explain a system
  for readers who should not need the codebase.
---

# Writing style（个人技术写作）

写技术文章、原理文、产品/设计解读时遵循本 skill。先从代码/项目里把原理搞清楚，写出来时要脱离具体仓库，讲一般性设计。

## 核心立场

1. **从项目学原理，用原理讲通用事**  
   调查阶段：可以啃路径、类名、工具调用。  
   成文阶段：抽象成「问题 → 组织方式 → 运行时行为 → 代价」，不要以函数名/文件路径当骨架。

2. **默认读者没打开过你的仓库**  
   他们要带走的是可迁移的心智模型，不是你今天看的那个 package 地图。

3. **人话优先，实现垫底**  
   正文能用时间线、对照、类比说清的，就不贴调用链。实现细节进「附录 / 给对源码感兴趣的人」，或干脆省略。

## 成文骨架（默认）

按读者追问顺序排，而不是按代码目录排：

1. **它解决什么**（对比「没有它时」）
2. **怎么建起来 / 谁对谁说话**（创建、职责）
3. **上下文从哪来、不共享什么**
4. **跑起来什么样**（并行？唤醒？失败了怎样）
5. **何时用、何时别用、代价**（token、协调、竞态）
6. （可选）**和相近机制的对照表**
7. （可选）**实现笔记附录**——这里才允许出现具体符号名

缺一可以少写，但不要一上来就列 `FooBarService`。

## 语言与结构

| 要做 | 不要做 |
|------|--------|
| 先一句结论，再展开 | 开篇堆背景和包名 |
| 专有名词首次出现时括号一句白话 | 连续抛未定义术语 |
| 时间线 / 表 /「可以想成…」 | 大段伪代码冒充原理 |
| 短段、短句；一段一个点 | 「综上所述」「一句话总结」套话收尾 |
| 业界已有英文词就直接用（subagent、mailbox、Lead、Task List），首次可附半句白话 | 硬译成「短命子任务」「邮箱传话」等自造黑话 |
| 中文叙述 + 英文术语；后文固定用英文词，不要中英来回换 | 同一概念换三套叫法 |

中文为主；该用英文的术语不要羞于用英文。

## 项目信息怎么用

- **正文**：角色、生命周期、通信模型、状态放哪、和替代方案比什么。  
- **脚注或附录**：仓库名、基线路径、「某 CLI 里大致对应 TeamCreate」这类锚定——给想对照源码的人，不是给主读者的主线。  
- **禁止**让正文读起来像代码导读：`XxxTool.execute`、`~/.foo/bar.json`、interceptor 名连篇。

自检：「删掉所有函数名和路径后，文章还能独立成立吗？」不能就还没抽象到位。

## 改写已有晦涩稿时

1. 抽出 3～5 个「人话问题」（创建？上下文？调度？并行？）  
2. 按骨架重写正文  
3. 原实现段落降为附录或删掉  
4. 读一遍：是否仍像在教某一个 repo，而不是在讲一类设计

## 声音样本（目标气质）

**差（实现笔记腔）：**

> `SendMessageTool.execute` 写入 `TeamMailboxImpl`，经 `TeamInboxDispatchService` 在 idle 时 `agentService.run`……

**好（原理腔）：**

> A 往 B 的 mailbox 投一条消息，并不会当场把 B 当函数调起来，只是写入 inbox；B idle 后再开一轮自己的对话处理。所以这是异步协作，不是 `await B()`。

调查时可以很细；写给读者时要像后者。

## 何时可放宽

- 用户明确说要「实现走读 / 给贡献者的内部笔记」→ 可保留符号名，但仍先给原理提纲。  
- 变更日志、API 文档 → 本 skill 不覆盖。
