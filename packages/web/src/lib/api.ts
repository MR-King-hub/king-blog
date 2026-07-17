/**
 * 🔗 API 客户端 — 前端调用后端的统一入口
 *
 * 为什么要封装？
 *   1. 统一管理 API 地址（改一处，全局生效）
 *   2. 统一处理错误（不用每个组件自己 try-catch）
 *   3. 统一携带 token（登录后自动带上身份凭证）
 *   4. 类型安全（用 @relayagent/shared 的类型定义）
 */

import type {
  ApiResponse,
  ApiError,
  Article,
  ArticleMeta,
  CreateArticleInput,
  UpdateArticleInput,
  ListArticlesParams,
  PaginatedResponse,
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  SiteProfile,
  UpdateSiteProfileInput,
} from "@relayagent/shared";

// ── API 基地址 ─────────────────────────────────
// 开发时：http://localhost:3001
// 生产时：通过环境变量 NEXT_PUBLIC_API_URL 配置
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// ── Token 管理 ──────────────────────────────────
// 把 token 存在 localStorage 里，页面刷新后还在
function getToken(): string | null {
  if (typeof window === "undefined") return null; // 服务端渲染时没有 localStorage
  return localStorage.getItem("relayagent_token");
}

export function setToken(token: string) {
  localStorage.setItem("relayagent_token", token);
}

export function removeToken() {
  localStorage.removeItem("relayagent_token");
}

// ── 通用请求函数 ────────────────────────────────
/**
 * 封装 fetch，自动处理：
 *   - JSON 序列化/反序列化
 *   - 携带 Authorization header
 *   - 错误统一处理
 */
async function request<T>(
  path: string,
  options: RequestInit & { noAuth?: boolean } = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const { noAuth, ...fetchOptions } = options;
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };

  // 如果有 token 且不是公开接口，自动带上
  if (token && !noAuth) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  // 安全解析 JSON（防止非 JSON 响应导致崩溃）
  let data: Record<string, unknown>;
  try {
    data = await res.json();
  } catch {
    throw new ApiRequestError(
      `请求失败 (HTTP ${res.status})`,
      "PARSE_ERROR",
      res.status
    );
  }

  // 后端返回 { success: false, error: {...} } 时，抛出错误
  if (!res.ok || !data.success) {
    // 🔑 全局 401 拦截：token 无效/过期时，自动清除
    if (res.status === 401) {
      removeToken();
      // 仅在需要登录的页面（/admin）才跳转到登录页
      // /chat 等公开页面访客也能访问，不应因 401 跳走
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        if (path.startsWith("/admin")) {
          window.location.href = "/login";
        }
      }
    }

    const err = data as unknown as ApiError;
    throw new ApiRequestError(
      err.error?.message || "请求失败",
      err.error?.code || "UNKNOWN_ERROR",
      res.status
    );
  }

  // 返回 data 字段（后端格式：{ success: true, data: ... }）
  return (data as unknown as ApiResponse<T>).data;
}

/** 自定义错误类，方便组件里判断错误类型 */
export class ApiRequestError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.code = code;
    this.status = status;
  }
}

// ══════════════════════════════════════════════════════════════
// 📝 文章 API
// ══════════════════════════════════════════════════════════════

export const articleApi = {
  /** 获取文章列表 */
  list(params?: ListArticlesParams): Promise<PaginatedResponse<ArticleMeta>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
    if (params?.status) searchParams.set("status", params.status);
    if (params?.tag) searchParams.set("tag", params.tag);
    if (params?.category) searchParams.set("category", params.category);
    if (params?.search) searchParams.set("search", params.search);

    const qs = searchParams.toString();
    return request(`/api/articles${qs ? `?${qs}` : ""}`);
  },

  /** 获取文章详情 */
  getBySlug(slug: string): Promise<Article> {
    return request(`/api/articles/${slug}`);
  },

  /** 创建文章 */
  create(input: CreateArticleInput): Promise<Article> {
    return request("/api/articles", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  /** 更新文章 */
  update(slug: string, input: UpdateArticleInput): Promise<Article> {
    return request(`/api/articles/${slug}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  /** 删除文章 */
  delete(slug: string): Promise<{ message: string }> {
    return request(`/api/articles/${slug}`, {
      method: "DELETE",
    });
  },
};

// ══════════════════════════════════════════════════════════════
// 📦 项目 API
// ══════════════════════════════════════════════════════════════

export const projectApi = {
  list(status?: string): Promise<Project[]> {
    const qs = status ? `?status=${status}` : "";
    return request(`/api/projects${qs}`);
  },

  getById(id: string): Promise<Project> {
    return request(`/api/projects/${id}`);
  },

  create(input: CreateProjectInput): Promise<Project> {
    return request("/api/projects", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  update(id: string, input: UpdateProjectInput): Promise<Project> {
    return request(`/api/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  delete(id: string): Promise<{ message: string }> {
    return request(`/api/projects/${id}`, {
      method: "DELETE",
    });
  },
};

// ══════════════════════════════════════════════════════════════
// 👤 站点个人资料 API
// ══════════════════════════════════════════════════════════════

export const profileApi = {
  get(): Promise<SiteProfile> {
    return request("/api/profile", { noAuth: true });
  },

  update(input: UpdateSiteProfileInput): Promise<SiteProfile> {
    return request("/api/profile", {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },
};

// ══════════════════════════════════════════════════════════════
// 🔑 认证 API
// ══════════════════════════════════════════════════════════════

export interface AuthUser {
  id: string;
  email: string;
  nickname: string;
  role: "admin" | "user";
}

interface AuthResponse {
  user: AuthUser;
  token: string;
}

export const authApi = {
  /** 登录 */
  login(email: string, password: string): Promise<AuthResponse> {
    return request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  /** 获取当前用户 */
  me(): Promise<AuthUser> {
    return request("/api/auth/me");
  },
};

// ══════════════════════════════════════════════════════════════
// 🤖 Agent API（SSE 流式）
// ══════════════════════════════════════════════════════════════

interface AgentChatOptions {
  agentType: string;
  message: string;
  sessionId?: string;
  context?: Record<string, unknown>;
  /** 收到文本片段时的回调 */
  onToken?: (token: string) => void;
  /** 流结束时的回调 */
  onDone?: (sessionId: string) => void;
  /** 出错时的回调 */
  onError?: (error: string) => void;
}

export const agentApi = {
  /**
   * 与 Agent 对话（SSE 流式）
   *
   * 使用 EventSource 的方式读取流式响应，
   * 通过回调函数逐步返回 AI 生成的文字。
   */
  async chat(options: AgentChatOptions): Promise<void> {
    const { agentType, message, sessionId, context, onToken, onDone, onError } = options;
    const token = getToken();

    const res = await fetch(`${API_BASE}/api/agents/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ agentType, message, sessionId, context }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      onError?.(data?.error?.message || "请求失败");
      return;
    }

    // 读取 SSE 流
    const reader = res.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE 格式：每条消息以 \n\n 分隔
      const messages = buffer.split("\n\n");
      buffer = messages.pop() || ""; // 最后一个可能不完整，留在 buffer 里

      for (const msg of messages) {
        const lines = msg.trim().split("\n");
        let event = "";
        let data = "";

        for (const line of lines) {
          if (line.startsWith("event: ")) event = line.slice(7);
          if (line.startsWith("data: ")) data = line.slice(6);
        }

        if (!data) continue;

        try {
          const parsed = JSON.parse(data);

          if (event === "token") {
            onToken?.(parsed.data || "");
          } else if (event === "done") {
            onDone?.(parsed.sessionId || "");
          } else if (event === "error") {
            onError?.(parsed.error || "未知错误");
          }
        } catch {
          // JSON 解析失败，跳过
        }
      }
    }
  },
};

// ══════════════════════════════════════════════════════════════
// 💬 访客聊天 API（无需登录）
// ══════════════════════════════════════════════════════════════

/** Agent 公开配置 */
export interface ChatAgentConfig {
  enabled: boolean;
  name: string;
  greeting: string;
}

/** 聊天历史消息（后端 ChatLogEntry 的子集） */
export interface ChatHistoryMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  taskId: string | null;
  createdAt: string;
}

/** Agent 完整配置（管理端） */
export interface FullAgentConfig {
  name: string;
  greeting: string;
  systemPrompt: string;
  defaultSystemPrompt?: string;
  defaultSystemPromptTemplate?: string;
  /** 环境变量 LLM_MODEL 的默认值 */
  defaultModelName?: string;
  /** 实际调用时解析出的模型 ID */
  effectiveModelName?: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  enabled: boolean;
  rateLimit: number;
  // 企微通知
  wecomBotId: string;
  wecomBotSecret: string;
  wecomOwnerUserId: string;
  wecomGroupChatId: string;
  updatedAt: string;
}

export interface WeComDiscoveryStatus {
  listening: boolean;
  connected: boolean;
  ownerUserId: string | null;
  groupChatId: string | null;
  pushTarget: string | null;
}

interface VisitorChatOptions {
  message: string;
  sessionId?: string;
  signal?: AbortSignal;
  onToken?: (token: string) => void;
  onDone?: (sessionId: string) => void;
  onError?: (error: string) => void;
}

export const chatApi = {
  /** 获取 Agent 公开配置（公开接口，不需要 token） */
  async getConfig(): Promise<ChatAgentConfig> {
    return request("/api/chat/config", { noAuth: true });
  },

  /** 获取会话历史消息（刷新后恢复对话） */
  async getHistory(sessionId: string): Promise<ChatHistoryMessage[]> {
    return request(`/api/chat/history/${sessionId}`, { noAuth: true });
  },

  /** 访客与 AI 对话（SSE 流式，无需登录） */
  async chat(options: VisitorChatOptions): Promise<void> {
    const { message, sessionId, signal, onToken, onDone, onError } = options;

    const res = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, sessionId }),
      signal,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      onError?.(data?.error?.message || "请求失败");
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const messages = buffer.split("\n\n");
      buffer = messages.pop() || "";

      for (const msg of messages) {
        const lines = msg.trim().split("\n");
        let event = "";
        let data = "";

        for (const line of lines) {
          if (line.startsWith("event: ")) event = line.slice(7);
          if (line.startsWith("data: ")) data = line.slice(6);
        }

        if (!data) continue;

        try {
          const parsed = JSON.parse(data);
          if (event === "token") {
            onToken?.(parsed.data || "");
          } else if (event === "done") {
            onDone?.(parsed.sessionId || "");
          } else if (event === "error") {
            onError?.(parsed.error || "未知错误");
          }
        } catch {
          // 跳过
        }
      }
    }
  },
};

// ══════════════════════════════════════════════════════════════
// ⚙️ Agent 配置管理 API（管理端，需要登录）
// ══════════════════════════════════════════════════════════════

export const agentConfigApi = {
  /** 获取完整 Agent 配置 */
  get(): Promise<FullAgentConfig> {
    return request("/api/admin/agent-config");
  },

  /** 更新 Agent 配置 */
  update(input: Partial<FullAgentConfig>): Promise<FullAgentConfig> {
    return request("/api/admin/agent-config", {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  /** 停止企微 ID 自动发现 */
  stopWeComDiscover(): Promise<WeComDiscoveryStatus> {
    return request("/api/admin/agent-config/wecom/discover", {
      method: "DELETE",
    });
  },

  /** 开始企微 ID 自动发现（SSE 流） */
  async discoverWecom(options: {
    botId: string;
    botSecret: string;
    signal?: AbortSignal;
    onStatus: (status: WeComDiscoveryStatus) => void;
    onError?: (message: string) => void;
  }): Promise<void> {
    const { botId, botSecret, signal, onStatus, onError } = options;
    const token = getToken();

    const res = await fetch(`${API_BASE}/api/admin/agent-config/wecom/discover`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ botId, botSecret }),
      signal,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      onError?.(data?.error?.message || "启动自动获取失败");
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() || "";

      for (const chunk of chunks) {
        const lines = chunk.split("\n");
        let event = "message";
        let data = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) event = line.slice(7);
          if (line.startsWith("data: ")) data = line.slice(6);
        }
        if (event === "status" && data) {
          onStatus(JSON.parse(data) as WeComDiscoveryStatus);
        }
      }
    }
  },
};

// ══════════════════════════════════════════════════════════════
// 📋 Task 通知 API（访客端，轮询新任务通知）
// ══════════════════════════════════════════════════════════════

/** Task 通道消息 */
export interface TaskChannelMessage {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
  taskId: string | null;
  createdAt: string;
}

/** Sub Agent 待访客回答的追问 */
export interface PendingQuestion {
  taskId: string;
  question: string;
  taskType: string;
}

/** 通知轮询响应 */
export interface NotificationPollResult {
  messages: TaskChannelMessage[];
  pendingQuestion: PendingQuestion | null;
}

/** 待办任务 */
export interface PendingTask {
  id: string;
  sessionId: string;
  type: string;
  visitorRequest: string;
  proposal: string;
  status: string;
  finalReply: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export const taskApi = {
  /**
   * 订阅 task 通道的 SSE 长连接
   * 返回 EventSource 实例，调用方自行管理生命周期
   */
  subscribe(sessionId: string): EventSource {
    return new EventSource(
      `${API_BASE}/api/chat/notifications/${sessionId}/stream`
    );
  },

  /** Task Coordinator 对话（流式） */
  async sendTaskMessage(
    taskId: string,
    sessionId: string,
    message: string,
    onToken?: (token: string) => void,
    onDone?: () => void,
  ): Promise<void> {
    const res = await fetch(`${API_BASE}/api/chat/task/${taskId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, sessionId }),
    });

    if (!res.ok) return;

    const reader = res.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("0:")) {
          try {
            const text = JSON.parse(line.slice(2));
            onToken?.(text);
          } catch {}
        } else if (line.startsWith("d:")) {
          onDone?.();
        }
      }
    }
  },

  /** 获取会话的所有任务 */
  async getTasks(sessionId: string): Promise<PendingTask[]> {
    return request(`/api/chat/tasks/${sessionId}`, { noAuth: true });
  },
};
