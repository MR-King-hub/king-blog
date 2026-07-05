"use client";

/**
 * 💬 浮动聊天气泡
 *
 * 右下角浮动按钮，点击跳转到独立的 /chat 对话页面。
 * 在 /chat 页面本身隐藏。
 */

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { MessageCircle } from "lucide-react";
import { chatApi, type ChatAgentConfig } from "@/lib/api";

export default function ChatWidget() {
  const pathname = usePathname();
  const [config, setConfig] = useState<ChatAgentConfig | null>(null);
  const [hovered, setHovered] = useState(false);

  // 加载 Agent 配置
  useEffect(() => {
    chatApi
      .getConfig()
      .then(setConfig)
      .catch(() => {
        // Agent 未配置或不可用
      });
  }, []);

  // 在 /chat 页面隐藏气泡
  if (pathname === "/chat") return null;

  // Agent 未启用则不显示
  if (!config?.enabled) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* 悬浮提示 */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, x: 8, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap"
          >
            <div className="px-3.5 py-2 rounded-xl bg-bg-surface/95 backdrop-blur-md border border-border shadow-lg text-xs font-heading text-text-secondary">
              💬 和 AI 助手聊聊
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 气泡按钮 */}
      <motion.a
        href="/chat"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 400, damping: 25 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        className="relative block h-14 w-14 rounded-full shadow-lg border border-accent/30 transition-shadow hover:shadow-xl hover:shadow-accent/20"
        style={{
          background: "linear-gradient(135deg, #C9A87C 0%, #A8896A 100%)",
        }}
      >
        <span className="absolute inset-0 flex items-center justify-center">
          <MessageCircle size={24} className="text-white" />
        </span>
        {/* 呼吸光圈 */}
        <span className="absolute inset-0 rounded-full bg-accent/20 animate-ping" />
      </motion.a>
    </div>
  );
}
