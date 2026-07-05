"use client";

/**
 * 💬 独立全屏聊天页面
 *
 * 基于 Vercel AI SDK v6 (`useChat`) + AI Elements 组件实现。
 * 后端返回 Data Stream Protocol 格式，前端自动解析。
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  CopyIcon,
  CheckIcon,
  MessageSquare,
  RotateCcw,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  ChevronRight,
} from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { chatApi, taskApi, type ChatAgentConfig, type TaskChannelMessage, type ChatHistoryMessage, type PendingQuestion } from "@/lib/api";
import { useTaskChannel } from "@/lib/use-task-notifications";
import { nanoid } from "nanoid";
import Navbar from "@/components/Navbar";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// ── 建议问题（带图标标签） ─────────────────────────
const SUGGESTED_QUESTIONS = [
  { text: "你能介绍一下 Shizhe 的技术栈吗？", icon: "🛠" },
  { text: "他做过哪些有意思的项目？", icon: "🚀" },
  { text: "最近在研究什么技术？", icon: "🔬" },
  { text: "可以看看他的博客有什么文章吗？", icon: "📝" },
];

// ── 复制按钮 ────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <MessageAction tooltip={copied ? "已复制" : "复制"} onClick={handleCopy}>
      {copied ? (
        <CheckIcon className="size-3.5 text-teal" />
      ) : (
        <CopyIcon className="size-3.5" />
      )}
    </MessageAction>
  );
}

// ── AI 头像 ─────────────────────────────────────────
function AiAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeMap = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-14 w-14",
  };
  const iconSize = { sm: 10, md: 14, lg: 24 };

  return (
    <div
      className={`${sizeMap[size]} shrink-0 rounded-xl flex items-center justify-center shadow-sm text-white relative`}
      style={{
        background: "linear-gradient(135deg, #C9A87C 0%, #A8896A 100%)",
      }}
    >
      <Sparkles size={iconSize[size]} />
    </div>
  );
}

// ── 欢迎屏幕 ────────────────────────────────────────
function WelcomeScreen({
  config,
  onSend,
}: {
  config: ChatAgentConfig;
  onSend: (text: string) => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-8 md:py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-xl w-full"
      >
        {/* Agent 头像 */}
        <div className="relative inline-block mb-5">
          <AiAvatar size="lg" />
          <div className="absolute -inset-3 rounded-3xl bg-accent/8 blur-2xl -z-10" />
          <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-bg-primary ring-2 ring-emerald-400/20" />
        </div>

        <h1 className="text-xl md:text-2xl font-heading font-bold text-text-primary mb-2 tracking-tight">
          {config.name}
        </h1>
        <p className="text-sm text-text-secondary leading-relaxed mb-1.5 max-w-md mx-auto">
          {config.greeting}
        </p>
        <p className="text-[11px] text-text-tertiary mb-8 font-heading tracking-wide">
          AI 驱动 · 多轮对话 · 回答仅供参考
        </p>

        {/* 建议问题 — 卡片网格 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg mx-auto"
        >
          {SUGGESTED_QUESTIONS.map((q, i) => (
            <motion.button
              key={q.text}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.08, duration: 0.4 }}
              onClick={() => onSend(q.text)}
              className="group flex items-start gap-3 px-4 py-3 rounded-xl border border-border/60 bg-bg-surface/40 backdrop-blur-sm text-left transition-all duration-300 hover:border-accent/25 hover:bg-bg-surface/70 hover:shadow-[0_4px_20px_rgba(201,168,124,0.06)] cursor-pointer"
            >
              <span className="text-base mt-0.5 shrink-0">{q.icon}</span>
              <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors leading-relaxed font-heading">
                {q.text}
              </span>
            </motion.button>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

// ── Task 侧边栏 — 右侧独立对话 Agent ────────────
function TaskSidebar({
  taskMessages,
  pendingQuestion,
  hasTask,
  sendMessage,
  isBusy,
  onClose,
}: {
  taskMessages: TaskChannelMessage[];
  pendingQuestion: PendingQuestion | null;
  hasTask: boolean;
  sendMessage: (message: string) => Promise<void>;
  isBusy: boolean;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [taskMessages.length]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isBusy) return;
    setInput("");
    await sendMessage(trimmed);
  };

  return (
    <motion.aside
      initial={{ x: 380 }}
      animate={{ x: 0 }}
      exit={{ x: 380 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="shrink-0 w-[380px] h-full border-l border-border/40 bg-bg-primary flex flex-col pt-24 pb-4"
    >
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-500 to-emerald-500 flex items-center justify-center shadow-sm">
            <ClipboardList size={14} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-heading font-semibold text-text-primary leading-tight">协调助手</h3>
            <p className="text-[10px] text-text-tertiary font-heading">帮您和作者沟通</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-bg-surface transition-colors text-text-tertiary hover:text-text-primary cursor-pointer"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* 消息区域 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {taskMessages.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
                <MessageSquare size={18} className="text-amber-400" />
              </div>
              <p className="text-xs text-text-tertiary font-heading">正在为您协调，请稍候...</p>
            </div>
          </div>
        )}

        {taskMessages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "user" ? (
              <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-accent/10 border border-accent/15 px-3.5 py-2.5">
                <p className="text-sm text-text-primary leading-relaxed">{msg.content}</p>
              </div>
            ) : msg.role === "assistant" ? (
              <div className="max-w-[80%]">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="h-5 w-5 rounded-md bg-gradient-to-br from-amber-500 to-emerald-500 flex items-center justify-center">
                    <ClipboardList size={10} className="text-white" />
                  </div>
                  <span className="text-[10px] text-text-tertiary font-heading">协调助手</span>
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-bg-surface/80 border border-border/30 px-3.5 py-2.5">
                  <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ) : (
              // system 状态消息
              <div className="w-full text-center py-1">
                <span className="text-[10px] text-text-tertiary/50 font-heading">{msg.content}</span>
              </div>
            )}
          </div>
        ))}

        {/* 打字中 */}
        {isBusy && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-bg-surface/80 border border-border/30 px-3.5 py-2.5">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-text-tertiary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-text-tertiary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-text-tertiary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 输入框 */}
      <div className="shrink-0 border-t border-border/30 p-3 pb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="输入消息..."
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-bg-surface border border-border text-text-primary text-sm focus:border-accent/40 focus:outline-none transition-colors"
            disabled={isBusy}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isBusy}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40 transition-all shrink-0 cursor-pointer"
            style={{ background: "linear-gradient(135deg, #C9A87C 0%, #A8896A 100%)" }}
          >
            发送
          </button>
        </div>
      </div>
    </motion.aside>
  );
}

// ── 聊天主体 ──────────────────────────────────────
function ChatThread({ config, sessionId, setSessionId }: {
  config: ChatAgentConfig;
  sessionId: string | null;
  setSessionId: (sid: string | null) => void;
}) {
  const [input, setInput] = useState("");

  // sessionId ref 供 transport body 闭包读取（避免 stale closure）
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: `${API_BASE}/api/chat`,
      body: () => ({
        sessionId: sessionIdRef.current || undefined,
      }),
    }),
  });
  const isEmpty = messages.length === 0;

  // 是否正在等待 AI 响应
  const isBusy = status === "streaming" || status === "submitted";

  // ── 页面刷新时恢复历史消息 ─────────────────────
  const historyLoadedRef = useRef(false);
  useEffect(() => {
    if (!sessionId || historyLoadedRef.current || messages.length > 0) return;
    historyLoadedRef.current = true;

    chatApi.getHistory(sessionId).then((history) => {
      if (history.length === 0) return;

      // 只恢复主对话消息（taskId=null），task 消息通过轮询 hook 恢复
      const mainMessages = history.filter((msg) => !msg.taskId);
      if (mainMessages.length === 0) return;

      const uiMessages = mainMessages.map((msg: ChatHistoryMessage) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        parts: [{ type: "text" as const, text: msg.content }],
      }));

      setMessages(uiMessages);
    }).catch(() => {
      // 恢复失败不阻塞，静默处理
    });
  }, [sessionId, messages.length, setMessages]);

  // 发送消息（AI 响应中时禁止发送，避免打断前一轮导致空气泡）
  const handleSend = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isBusy) return;
      // 首次发消息时初始化 sessionId
      if (!sessionId) {
        const newSid = nanoid();
        setSessionId(newSid);
        localStorage.setItem("chat_session_id", newSid);
      }
      sendMessage({ text: trimmed });
      setInput("");
    },
    [sendMessage, isBusy, sessionId]
  );

  // 新对话
  const handleNewChat = useCallback(() => {
    stop();
    setMessages([]);
    setInput("");
    // 新对话生成新 sessionId
    const newSid = nanoid();
    setSessionId(newSid);
    localStorage.setItem("chat_session_id", newSid);
  }, [stop, setMessages]);

  // Task 通知直接渲染（hook 内部已做去重，notifications 是累积的）

  return (
    <main className="flex flex-1 flex-col min-h-0 min-w-0 pt-24 pb-4 px-4 sm:px-6 lg:px-8 font-heading">
      {/* 消息区域 */}
      <Conversation className="flex-1 min-h-0">
        <ConversationContent className="gap-5 p-2 md:p-4 w-full max-w-[min(56rem,100%)] mx-auto">
          {/* 空状态 */}
          {isEmpty && <WelcomeScreen config={config} onSend={handleSend} />}

          {/* 顶部 Agent 标识 */}
          <AnimatePresence>
            {!isEmpty && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-2 py-2 mb-1"
              >
                <AiAvatar size="sm" />
                <span className="text-[11px] font-heading text-text-tertiary tracking-wide">
                  {config.name} · 对话中
                </span>
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* 消息列表 */}
          {messages.map((msg, msgIdx) => (
            <motion.div
              key={`${msg.id}-${msgIdx}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                ease: [0.16, 1, 0.3, 1],
                delay: msgIdx === messages.length - 1 ? 0.05 : 0,
              }}
            >
              <Message from={msg.role}>
                {/* AI 消息 */}
                {msg.role === "assistant" && (
                  <div className="flex items-start gap-3">
                    <AiAvatar size="md" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-heading font-medium text-text-tertiary block mb-2 tracking-wide">
                        AI 助手
                      </span>
                      <MessageContent
                        className="text-text-secondary chat-prose"
                        loading={
                          msgIdx === messages.length - 1 &&
                          (status === "streaming" || status === "submitted") &&
                          !msg.parts.some((p) => p.type === "text" && p.text.length > 0)
                        }
                      >
                        {(() => {
                          const hasText = msg.parts.some(
                            (p) => p.type === "text" && p.text.length > 0
                          );
                          const isLastMsg = msgIdx === messages.length - 1;
                          const isStillLoading =
                            isLastMsg && (status === "streaming" || status === "submitted");

                          // AI 消息内容为空且已经不在加载中 → 显示错误提示
                          if (!hasText && !isStillLoading) {
                            return (
                              <span className="text-text-tertiary italic text-sm">
                                抱歉，AI 未能生成回复，请重新提问试试 🙏
                              </span>
                            );
                          }

                          return msg.parts.map((part, i) => {
                            if (part.type === "text") {
                              return (
                                <MessageResponse key={`${msg.id}-${i}`}>
                                  {part.text}
                                </MessageResponse>
                              );
                            }
                            return null;
                          });
                        })()}
                      </MessageContent>
                      {/* 操作按钮 — 非流式时显示 */}
                      {status !== "streaming" &&
                        msg.parts.some(
                          (p) => p.type === "text" && p.text
                        ) && (
                          <MessageActions className="mt-2.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                            <CopyButton
                              text={msg.parts
                                .filter(
                                  (p): p is { type: "text"; text: string } =>
                                    p.type === "text"
                                )
                                .map((p) => p.text)
                                .join("")}
                            />
                          </MessageActions>
                        )}
                    </div>
                  </div>
                )}

                {/* 用户消息 */}
                {msg.role === "user" && (
                  <MessageContent className="bg-accent/8 text-text-primary border border-accent/15 rounded-2xl rounded-tr-md px-4 py-3 whitespace-pre-wrap text-sm leading-relaxed">
                    {msg.parts.map((part, i) => {
                      if (part.type === "text") {
                        return <span key={`${msg.id}-${i}`}>{part.text}</span>;
                      }
                      return null;
                    })}
                  </MessageContent>
                )}
              </Message>
            </motion.div>
          ))}

          {/* 思考中/加载中 — submitted 且最后一条是用户消息（AI 尚未开始回复）时显示 */}
          <AnimatePresence>
            {status === "submitted" &&
              messages.length > 0 &&
              messages[messages.length - 1].role === "user" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <Message from="assistant">
                    <div className="flex items-start gap-3">
                      <AiAvatar size="md" />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-[11px] font-heading font-medium text-text-tertiary block mb-1.5 tracking-wide">
                          AI 助手
                        </span>
                        <MessageContent
                          className="text-text-secondary chat-prose"
                          loading
                        />
                      </div>
                    </div>
                  </Message>
                </motion.div>
              )}
          </AnimatePresence>
        </ConversationContent>

        {/* 滚动到底部按钮 */}
        <ConversationScrollButton className="bg-bg-surface/90 backdrop-blur-md border-border/60 text-text-tertiary hover:text-text-primary hover:border-accent/25 shadow-lg transition-all duration-200" />
      </Conversation>

      {/* 输入区域 */}
      <div className="shrink-0 pt-3 pb-2 w-full max-w-[min(56rem,100%)] mx-auto">
        {/* 新对话按钮 */}
        <AnimatePresence>
          {!isEmpty && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center mb-2 px-1"
            >
              <button
                onClick={handleNewChat}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-heading text-text-tertiary hover:text-accent hover:bg-accent/5 transition-all duration-200 cursor-pointer"
              >
                <RotateCcw size={11} />
                新对话
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PromptInput */}
        <div className="dark">
          <PromptInput
            onSubmit={({ text }) => {
              if (!isBusy) handleSend(text);
            }}
            className="chat-prompt-input rounded-2xl border border-border/50 bg-bg-surface/80 backdrop-blur-md transition-[border-color,box-shadow] duration-200 ease-out focus-within:border-accent/40 focus-within:shadow-[0_0_0_1.5px_rgba(201,168,124,0.2),0_0_16px_rgba(201,168,124,0.05)]"
          >
            <PromptInputTextarea
              placeholder="输入你的问题...（Enter 发送）"
              className="text-sm text-text-primary placeholder:text-text-tertiary/70 bg-transparent border-none min-h-10"
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                // AI 响应中时阻止回车发送（Shift+Enter 换行不影响）
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  isBusy
                ) {
                  e.preventDefault();
                }
              }}
            />
            <PromptInputFooter className="border-t-0 p-2">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-text-tertiary/50 font-heading hidden sm:inline">
                  Shift+Enter 换行
                </span>
              </div>
              <PromptInputSubmit
                status={status}
                onStop={stop}
                className="rounded-xl text-white hover:shadow-lg hover:shadow-accent/20 transition-all duration-200"
                style={{
                  background:
                    "linear-gradient(135deg, #C9A87C 0%, #A8896A 100%)",
                }}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>

        <div className="text-[10px] text-text-tertiary/60 text-center mt-2.5 font-heading tracking-wide">
          AI 生成内容仅供参考，不代表作者本人观点
        </div>
      </div>
    </main>
  );
}

// ── 默认配置（无需等待接口返回即可渲染） ─────────────
const DEFAULT_CONFIG: ChatAgentConfig = {
  enabled: true,
  name: "Shizhe 的 AI 助手",
  greeting: "你好！我是 Shizhe 的 AI 助手，有什么想了解的尽管问我 😊",
};

// ── 主页面 ──────────────────────────────────────────
export default function ChatPage() {
  const [config, setConfig] = useState<ChatAgentConfig>(DEFAULT_CONFIG);
  const [disabled, setDisabled] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // sessionId 提升到 ChatPage，共享给 ChatThread 和 TaskSidebar
  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("chat_session_id");
  });


  // Task 通道
  const { taskMessages, pendingQuestion, hasTask, sendMessage: sendTaskMessage, isBusy: taskBusy } = useTaskChannel({
    sessionId,
    onTaskResolved: () => {
      // 作者回复在协调助手侧边栏展示，无需刷新主对话
      setSidebarOpen(true);
    },
  });

  // 有 task 时自动展开侧边栏
  useEffect(() => {
    if (hasTask) setSidebarOpen(true);
  }, [hasTask]);

  useEffect(() => {
    chatApi
      .getConfig()
      .then((cfg) => {
        setConfig(cfg);
        if (!cfg.enabled) setDisabled(true);
      })
      .catch(() => {});
  }, []);

  if (disabled) {
    return (
      <div className="h-screen bg-bg-primary flex flex-col dark overflow-hidden">
        <Navbar />
        <div className="flex flex-1 items-center justify-center min-h-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="relative inline-block mb-5">
              <div className="h-16 w-16 rounded-2xl bg-bg-surface flex items-center justify-center border border-border/50 mx-auto">
                <MessageSquare size={28} className="text-text-tertiary" />
              </div>
            </div>
            <h2 className="text-lg font-heading font-semibold text-text-primary mb-2">
              AI 助手暂未开放
            </h2>
            <p className="text-sm text-text-secondary mb-6 max-w-xs mx-auto leading-relaxed">
              管理员尚未启用 AI 对话功能，请稍后再来。
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-bg-primary flex flex-col dark overflow-hidden">
      <Navbar />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* 主聊天区域 */}
        <ChatThread config={config} sessionId={sessionId} setSessionId={setSessionId} />

        {/* Task 侧边栏 */}
        <AnimatePresence>
          {hasTask && sidebarOpen && (
            <TaskSidebar
              taskMessages={taskMessages}
              pendingQuestion={pendingQuestion}
              hasTask={hasTask}
              sendMessage={sendTaskMessage}
              isBusy={taskBusy}
              onClose={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* 侧边栏关闭时的打开按钮 */}
      <AnimatePresence>
        {hasTask && !sidebarOpen && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={() => setSidebarOpen(true)}
            className="fixed right-4 top-1/2 -translate-y-1/2 z-40 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-bg-surface/90 backdrop-blur-md border border-border/50 shadow-lg hover:border-accent/30 transition-all cursor-pointer"
          >
            <ClipboardList size={14} className="text-amber-400" />
            <span className="text-xs font-heading text-text-primary">协调</span>
            {pendingQuestion && (
              <span className="inline-flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
