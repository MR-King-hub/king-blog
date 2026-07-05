"use client";

/**
 * ⚙️ Agent 配置管理页面
 *
 * 管理员可以在这里配置个人 AI 助手的：
 *   - 名称和打招呼语
 *   - 系统提示词（Agent 人设）
 *   - 模型参数（模型、温度、最大 token）
 *   - 开关和频率限制
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Save,
  Loader2,
  ToggleLeft,
  ToggleRight,
  ArrowLeft,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { agentConfigApi, type FullAgentConfig, type WeComDiscoveryStatus } from "@/lib/api";
import Navbar from "@/components/Navbar";

export default function AgentConfigPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [config, setConfig] = useState<FullAgentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [discoveryStatus, setDiscoveryStatus] = useState<WeComDiscoveryStatus | null>(null);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const discoverAbortRef = useRef<AbortController | null>(null);

  // 加载配置
  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const data = await agentConfigApi.get();
      setConfig(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载配置失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return; // 还在验证 token，等一下

    if (!isAdmin) {
      // 非管理员：不需要加载配置，直接跳转
      setLoading(false);
      router.push("/login");
      return;
    }

    loadConfig();
  }, [isAdmin, authLoading, router, loadConfig]);

  // 保存配置
  const handleSave = async () => {
    if (!config) return;

    try {
      setSaving(true);
      setError(null);
      const updated = await agentConfigApi.update(config);
      setConfig(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof FullAgentConfig>(
    key: K,
    value: FullAgentConfig[K]
  ) => {
    if (!config) return;
    setConfig({ ...config, [key]: value });
  };

  const applyDiscoveryStatus = useCallback((status: WeComDiscoveryStatus) => {
    setDiscoveryStatus(status);
    setConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ...(status.ownerUserId ? { wecomOwnerUserId: status.ownerUserId } : {}),
        ...(status.groupChatId ? { wecomGroupChatId: status.groupChatId } : {}),
      };
    });
  }, []);

  const stopDiscover = useCallback(async () => {
    discoverAbortRef.current?.abort();
    discoverAbortRef.current = null;
    setDiscovering(false);
    try {
      await agentConfigApi.stopWeComDiscover();
    } catch {
      // 连接已断开时忽略
    }
  }, []);

  const startDiscover = async () => {
    if (!config?.wecomBotId || !config?.wecomBotSecret) {
      setDiscoveryError("请先填写 Bot ID 和 Secret");
      return;
    }

    setDiscoveryError(null);
    setDiscovering(true);
    setDiscoveryStatus(null);

    const controller = new AbortController();
    discoverAbortRef.current = controller;

    try {
      await agentConfigApi.discoverWecom({
        botId: config.wecomBotId,
        botSecret: config.wecomBotSecret,
        signal: controller.signal,
        onStatus: applyDiscoveryStatus,
        onError: (msg) => setDiscoveryError(msg),
      });
    } catch (e) {
      if (controller.signal.aborted) return;
      setDiscoveryError(e instanceof Error ? e.message : "自动获取失败");
    } finally {
      if (discoverAbortRef.current === controller) {
        discoverAbortRef.current = null;
        setDiscovering(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      discoverAbortRef.current?.abort();
      agentConfigApi.stopWeComDiscover().catch(() => {});
    };
  }, []);

  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-28 flex items-center justify-center">
          <Loader2 className="animate-spin text-accent" size={32} />
        </main>
      </>
    );
  }

  if (!config) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-28 flex items-center justify-center">
          <div className="text-center text-text-secondary">
            <p className="text-lg">配置加载失败</p>
            <p className="text-sm mt-2">请先运行 <code className="text-accent">pnpm db:seed</code></p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-bg-surface transition-all"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-heading font-bold text-text-primary flex items-center gap-2">
                  <Bot size={24} className="text-accent" />
                  Agent 配置
                </h1>
                <p className="text-sm text-text-tertiary mt-1">
                  配置你的个人 AI 助手的人设和行为
                </p>
              </div>
            </div>
            <button
              onClick={loadConfig}
              className="p-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-bg-surface transition-all"
              title="重新加载"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {/* 提示 */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              配置已保存
            </div>
          )}

          {/* 表单 */}
          <div className="space-y-6">
            {/* 基本信息 */}
            <section className="rounded-2xl border border-border bg-bg-surface/50 p-6">
              <h2 className="text-lg font-heading font-semibold text-text-primary mb-4">
                基本信息
              </h2>
              <div className="space-y-4">
                {/* 开关 */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-text-primary">
                      启用 AI 助手
                    </label>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      关闭后访客将看不到聊天入口
                    </p>
                  </div>
                  <button
                    onClick={() => updateField("enabled", !config.enabled)}
                    className={`transition-colors ${config.enabled ? "text-accent" : "text-text-tertiary"}`}
                  >
                    {config.enabled ? (
                      <ToggleRight size={32} />
                    ) : (
                      <ToggleLeft size={32} />
                    )}
                  </button>
                </div>

                {/* 名称 */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    名称
                  </label>
                  <input
                    type="text"
                    value={config.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-primary border border-border text-text-primary text-sm focus:border-accent/40 focus:outline-none transition-colors"
                    placeholder="如：Shizhe 的 AI 助手"
                  />
                </div>

                {/* 打招呼语 */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    打招呼语
                  </label>
                  <textarea
                    value={config.greeting}
                    onChange={(e) => updateField("greeting", e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-primary border border-border text-text-primary text-sm focus:border-accent/40 focus:outline-none transition-colors resize-none"
                    placeholder="访客打开聊天窗口时看到的第一条消息"
                  />
                </div>
              </div>
            </section>

            {/* 系统提示词 */}
            <section className="rounded-2xl border border-border bg-bg-surface/50 p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-heading font-semibold text-text-primary mb-2">
                    系统提示词
                  </h2>
                  <p className="text-xs text-text-tertiary leading-relaxed">
                    定义 AI 助手的人设与行为。支持{" "}
                    <code className="text-accent/80">{"{ownerName}"}</code>{" "}
                    占位符，对话时会替换为站点资料中的名字。博客文章会在对话时自动补充，无需写在这里。
                  </p>
                </div>
                {config.defaultSystemPrompt && (
                  <button
                    type="button"
                    onClick={() =>
                      updateField("systemPrompt", config.defaultSystemPrompt!)
                    }
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-heading text-text-tertiary hover:text-accent hover:bg-accent/5 border border-border/60 transition-colors cursor-pointer"
                  >
                    <RefreshCw size={12} />
                    恢复默认
                  </button>
                )}
              </div>
              <textarea
                value={config.systemPrompt}
                onChange={(e) => updateField("systemPrompt", e.target.value)}
                rows={14}
                className="w-full px-4 py-3 rounded-xl bg-bg-primary border border-border text-text-primary text-sm font-mono leading-relaxed focus:border-accent/40 focus:outline-none transition-colors resize-y"
                placeholder="你是博主 {ownerName} 个人博客上的 AI 助手..."
              />
            </section>

            {/* 模型参数 */}
            <section className="rounded-2xl border border-border bg-bg-surface/50 p-6">
              <h2 className="text-lg font-heading font-semibold text-text-primary mb-4">
                模型参数
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 模型 */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    模型
                  </label>
                  <select
                    value={config.modelName}
                    onChange={(e) => updateField("modelName", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-primary border border-border text-text-primary text-sm focus:border-accent/40 focus:outline-none transition-colors"
                  >
                    {!config.modelName.includes("/") &&
                      !["gpt-4o-mini", "gpt-4o"].includes(config.modelName) && (
                        <option value={config.modelName}>
                          {config.modelName}（旧简写，建议更换）
                        </option>
                      )}
                    <optgroup label="硅基流动 SiliconFlow">
                      <option value="deepseek-ai/DeepSeek-V3.2">DeepSeek V3.2（推荐）</option>
                      <option value="deepseek-ai/DeepSeek-V3">DeepSeek V3</option>
                      <option value="Qwen/Qwen3-235B-A22B-Instruct-2507">Qwen3 235B</option>
                      <option value="THUDM/glm-4-9b-chat">GLM-4 9B</option>
                      <option value="Pro/zai-org/GLM-4.7">GLM-4.7</option>
                    </optgroup>
                    <optgroup label="OpenAI（需 api.openai.com）">
                      <option value="gpt-4o-mini">GPT-4o Mini</option>
                      <option value="gpt-4o">GPT-4o</option>
                    </optgroup>
                  </select>
                  <p className="mt-1 text-xs text-text-secondary">
                    模型 ID 需与 LLM_BASE_URL 提供商一致；未配置时用 .env 中的 LLM_MODEL。
                  </p>
                </div>

                {/* 温度 */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    温度: {config.temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={config.temperature}
                    onChange={(e) =>
                      updateField("temperature", parseFloat(e.target.value))
                    }
                    className="w-full accent-accent"
                  />
                  <div className="flex justify-between text-[10px] text-text-tertiary mt-1">
                    <span>严谨 (0)</span>
                    <span>均衡 (0.7)</span>
                    <span>创造 (2)</span>
                  </div>
                </div>

                {/* 最大 Tokens */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    最大输出 Tokens
                  </label>
                  <input
                    type="number"
                    value={config.maxTokens}
                    onChange={(e) =>
                      updateField("maxTokens", parseInt(e.target.value) || 2000)
                    }
                    min={100}
                    max={8000}
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-primary border border-border text-text-primary text-sm focus:border-accent/40 focus:outline-none transition-colors"
                  />
                </div>

                {/* 频率限制 */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    每 IP 每天限制（次）
                  </label>
                  <input
                    type="number"
                    value={config.rateLimit}
                    onChange={(e) =>
                      updateField("rateLimit", parseInt(e.target.value) || 20)
                    }
                    min={1}
                    max={1000}
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-primary border border-border text-text-primary text-sm focus:border-accent/40 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </section>

            {/* 企微通知 */}
            <section className="rounded-2xl border border-border bg-bg-surface/50 p-6">
              <h2 className="text-lg font-heading font-semibold text-text-primary mb-2 flex items-center gap-2">
                <MessageSquare size={18} className="text-accent" />
                企微通知
              </h2>
              <p className="text-xs text-text-tertiary mb-4">
                配置企业微信智能机器人，当访客发起面试/合作等请求时，通过企微实时通知你。
                <a
                  href="https://open.work.weixin.qq.com/help2/pc/cat?doc_id=21661"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline ml-1"
                >
                  配置指南 →
                </a>
              </p>
              <div className="space-y-4">
                {/* Bot ID */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Bot ID
                  </label>
                  <input
                    type="text"
                    value={config.wecomBotId || ""}
                    onChange={(e) => updateField("wecomBotId", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-primary border border-border text-text-primary text-sm font-mono focus:border-accent/40 focus:outline-none transition-colors"
                    placeholder="在企微管理后台 → 智能机器人 → API 模式中获取"
                  />
                </div>

                {/* Secret */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Secret
                  </label>
                  <input
                    type="password"
                    value={config.wecomBotSecret || ""}
                    onChange={(e) => updateField("wecomBotSecret", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-primary border border-border text-text-primary text-sm font-mono focus:border-accent/40 focus:outline-none transition-colors"
                    placeholder="长连接专用密钥"
                  />
                </div>

                {/* 自动获取 ID */}
                <div className="rounded-xl border border-border bg-bg-primary/50 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-text-primary">自动获取 UserID / ChatID</p>
                      <p className="text-xs text-text-tertiary mt-1">
                        点击开始后，去企微给机器人发消息（单聊或群聊均可），系统会自动填入下方字段。
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {discovering ? (
                        <button
                          type="button"
                          onClick={stopDiscover}
                          className="px-3 py-1.5 rounded-lg border border-border text-xs text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors"
                        >
                          停止
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={startDiscover}
                          disabled={!config.wecomBotId || !config.wecomBotSecret}
                          className="px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          开始自动获取
                        </button>
                      )}
                    </div>
                  </div>

                  {discovering && (
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <Loader2 size={14} className="animate-spin text-accent" />
                      {discoveryStatus?.connected
                        ? "已连接，等待你在企微发消息..."
                        : "正在连接企微..."}
                    </div>
                  )}

                  {discoveryError && (
                    <p className="text-xs text-red-400">{discoveryError}</p>
                  )}

                  {discoveryStatus?.pushTarget && (
                    <div className="text-xs text-green-400 space-y-0.5">
                      <p>已发现推送目标，字段已自动填入（记得点保存）。</p>
                      {discoveryStatus.ownerUserId && (
                        <p className="font-mono text-text-secondary">UserID: {discoveryStatus.ownerUserId}</p>
                      )}
                      {discoveryStatus.groupChatId && (
                        <p className="font-mono text-text-secondary">ChatID: {discoveryStatus.groupChatId}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Owner UserID */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      你的 UserID
                      <span className="text-text-tertiary font-normal ml-1">(自动获取)</span>
                    </label>
                    <input
                      type="text"
                      value={config.wecomOwnerUserId || ""}
                      onChange={(e) => updateField("wecomOwnerUserId", e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-bg-primary border border-border text-text-primary text-sm font-mono focus:border-accent/40 focus:outline-none transition-colors"
                      placeholder="给机器人发条消息即可自动获取"
                    />
                    <p className="text-[10px] text-text-tertiary mt-1">
                      单聊：给机器人私聊发消息即可获取
                    </p>
                  </div>

                  {/* 群聊 ChatID */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      群聊 ChatID
                      <span className="text-text-tertiary font-normal ml-1">(自动获取)</span>
                    </label>
                    <input
                      type="text"
                      value={config.wecomGroupChatId || ""}
                      onChange={(e) => updateField("wecomGroupChatId", e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-bg-primary border border-border text-text-primary text-sm font-mono focus:border-accent/40 focus:outline-none transition-colors"
                      placeholder="把机器人拉入群后自动获取"
                    />
                    <p className="text-[10px] text-text-tertiary mt-1">
                      群聊：拉机器人入群并 @ 它发消息即可获取
                    </p>
                  </div>
                </div>

                {/* 连接状态提示 */}
                {config.wecomBotId && config.wecomBotSecret ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/5 border border-green-500/15">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="text-xs text-green-400">
                      Bot 凭证已填写 — 保存后生产环境通知生效
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/5 border border-yellow-500/15">
                    <span className="inline-block h-2 w-2 rounded-full bg-yellow-400" />
                    <span className="text-xs text-yellow-400/80">
                      未配置 — 访客请求将仅记录日志，不会推送通知
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* 保存按钮 */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-white text-sm font-heading font-semibold hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {saving ? "保存中..." : "保存配置"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
