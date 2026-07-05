"use client";

/**
 * 📋 useTaskChannel — Task Coordinator 对话通道（SSE 长连接）
 *
 * 通过 EventSource 订阅后端的 SSE 流，替代之前的 3 秒轮询。
 * 首次连接时收到 init 事件（全量数据），后续增量推送。
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { taskApi, type TaskChannelMessage, type PendingQuestion } from "./api";

/** Array.findLastIndex polyfill */
function findLastIndex<T>(arr: T[], predicate: (item: T) => boolean): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) return i;
  }
  return -1;
}

interface UseTaskChannelOptions {
  sessionId: string | null;
  /** task 解决时触发（owner 在企微回复完毕） */
  onTaskResolved?: () => void;
}

interface UseTaskChannelReturn {
  taskMessages: TaskChannelMessage[];
  pendingQuestion: PendingQuestion | null;
  hasTask: boolean;
  loading: boolean;
  /** 发送消息给 Task Coordinator（流式） */
  sendMessage: (message: string) => Promise<void>;
  /** 是否正在等待 AI 回复 */
  isBusy: boolean;
}

export function useTaskChannel(
  options: UseTaskChannelOptions
): UseTaskChannelReturn {
  const { sessionId, onTaskResolved } = options;
  const [taskMessages, setTaskMessages] = useState<TaskChannelMessage[]>([]);
  const [pendingQuestion, setPendingQuestion] = useState<PendingQuestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const esRef = useRef<EventSource | null>(null);

  // SSE 长连接订阅
  useEffect(() => {
    if (!sessionId) return;

    setLoading(true);
    const es = taskApi.subscribe(sessionId);
    esRef.current = es;

    // 初始全量数据
    es.addEventListener("init", (e) => {
      try {
        const data = JSON.parse(e.data);
        setTaskMessages(data.messages || []);
        setPendingQuestion(data.pendingQuestion || null);
      } catch {}
      setLoading(false);
    });

    // 增量消息
    es.addEventListener("task_message", (e) => {
      try {
        const msg = JSON.parse(e.data) as TaskChannelMessage;
        setTaskMessages((prev) => {
          // 去重：已有相同 id 的真实消息
          if (prev.some((m) => m.id === msg.id)) return prev;
          // 从末尾向前查找匹配的临时消息并替换
          // （同 role + 同 taskId + id 以 temp 开头）
          const lastTempIdx = findLastIndex(
            prev,
            (m) => m.id.startsWith("temp") && m.role === msg.role && m.taskId === msg.taskId
          );
          if (lastTempIdx !== -1) {
            const updated = [...prev];
            updated[lastTempIdx] = msg;
            return updated;
          }
          return [...prev, msg];
        });
      } catch {}
    });

    // task 状态更新（pendingQuestion 变更、resolved 等）
    es.addEventListener("task_update", (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log("[TaskChannel] task_update:", data);
        if (data.pendingQuestion) {
          setPendingQuestion(data.pendingQuestion);
        }
        if (data.status === "resolved") {
          setPendingQuestion(null);
          console.log("[TaskChannel] 触发 onTaskResolved");
          onTaskResolved?.();
        }
      } catch {}
    });

    es.onerror = () => {
      // EventSource 会自动重连，无需手动处理
      setLoading(false);
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [sessionId]);

  // sessionId 变更时重置
  useEffect(() => {
    setTaskMessages([]);
    setPendingQuestion(null);
  }, [sessionId]);

  const sendMessage = useCallback(async (message: string) => {
    const taskId = pendingQuestion?.taskId || taskMessages.find(m => m.taskId)?.taskId;
    if (!taskId || !sessionId) return;

    setIsBusy(true);

    // 乐观添加用户消息
    const tempUserMsg: TaskChannelMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: message,
      taskId,
      createdAt: new Date().toISOString(),
    };
    setTaskMessages(prev => [...prev, tempUserMsg]);

    // 流式添加 AI 回复
    const tempAiId = `temp-ai-${Date.now()}`;
    let aiContent = "";

    try {
      await taskApi.sendTaskMessage(
        taskId,
        sessionId,
        message,
        (token) => {
          aiContent += token;
          setTaskMessages(prev => {
            const existing = prev.find(m => m.id === tempAiId);
            if (existing) {
              return prev.map(m => m.id === tempAiId ? { ...m, content: aiContent } : m);
            } else {
              return [...prev, {
                id: tempAiId,
                role: "assistant" as const,
                content: aiContent,
                taskId,
                createdAt: new Date().toISOString(),
              }];
            }
          });
        },
        () => {
          // 完成后 SSE 会自动推送真实消息，无需手动拉取
        }
      );
    } catch (err) {
      console.error("Task message failed:", err);
    } finally {
      setIsBusy(false);
    }
  }, [pendingQuestion, taskMessages, sessionId]);

  const hasTask = taskMessages.length > 0 || !!pendingQuestion;

  return { taskMessages, pendingQuestion, hasTask, loading, sendMessage, isBusy };
}
