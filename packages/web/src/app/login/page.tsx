"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Zap, Mail, Lock, LogIn, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 已登录直接跳转
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/editor");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("请输入邮箱和密码");
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/editor");
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setSubmitting(false);
    }
  };

  // 加载中（验证 token）
  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      {/* 背景效果 */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse,rgba(201,168,124,0.04)_0%,transparent_70%)]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-[radial-gradient(ellipse,rgba(107,155,151,0.03)_0%,transparent_70%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-4">
            <div
              className="h-12 w-12 rounded-xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, #C9A87C 0%, #A8896A 100%)",
              }}
            >
              <Zap size={24} className="text-text-inverse" />
            </div>
            <div className="absolute -inset-2 rounded-2xl bg-accent/20 blur-xl opacity-50" />
          </div>
          <h1 className="font-heading font-bold text-2xl text-text-primary">
            管理后台
          </h1>
          <p className="mt-1 text-sm text-text-tertiary">
            登录以管理博客内容
          </p>
        </div>

        {/* 登录表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 错误提示 */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}

          {/* 邮箱 */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-heading font-medium text-text-tertiary mb-1.5">
              <Mail size={12} />
              邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              autoComplete="email"
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-border bg-bg-elevated/60 text-text-primary text-sm font-body placeholder:text-text-tertiary/40 outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10 transition-all"
            />
          </div>

          {/* 密码 */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-heading font-medium text-text-tertiary mb-1.5">
              <Lock size={12} />
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-xl border border-border bg-bg-elevated/60 text-text-primary text-sm font-body placeholder:text-text-tertiary/40 outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10 transition-all"
            />
          </div>

          {/* 登录按钮 */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-heading font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background:
                "linear-gradient(135deg, #C9A87C 0%, #A8896A 100%)",
              color: "#0A0E1A",
            }}
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <LogIn size={16} />
            )}
            {submitting ? "登录中..." : "登录"}
          </button>
        </form>

        {/* 返回首页 */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-xs text-text-tertiary hover:text-accent transition-colors font-heading"
          >
            ← 返回首页
          </a>
        </div>
      </motion.div>
    </div>
  );
}
