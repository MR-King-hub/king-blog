import type {
  Article,
  ArticleMeta,
  CreateArticleInput,
  ListArticlesParams,
  PaginatedResponse,
  Project,
  CreateProjectInput,
  UpdateArticleInput,
  UpdateProjectInput,
  SiteProfile,
  UpdateSiteProfileInput,
} from "@relayagent/shared";

interface ApiSuccess<T> {
  success: true;
  data: T;
}

interface ApiError {
  success: false;
  error?: { code?: string; message?: string };
}

export class BlogApiClient {
  private token: string | null = null;

  constructor(
    private readonly baseUrl: string,
    private readonly email: string,
    private readonly password: string,
  ) {}

  private async login(): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: this.email, password: this.password }),
    });

    const body = (await res.json()) as ApiSuccess<{ token: string }> | ApiError;
    if (!res.ok || !body.success) {
      const message =
        !body.success && body.error?.message
          ? body.error.message
          : `登录失败 (${res.status})`;
      throw new Error(message);
    }

    this.token = body.data.token;
  }

  private async ensureAuth(): Promise<string> {
    if (!this.token) {
      await this.login();
    }
    return this.token!;
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
    retry = true,
  ): Promise<T> {
    const token = await this.ensureAuth();
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...init.headers,
      },
    });

    if (res.status === 401 && retry) {
      this.token = null;
      await this.login();
      return this.request<T>(path, init, false);
    }

    const body = (await res.json()) as ApiSuccess<T> | ApiError;
    if (!res.ok || !body.success) {
      const message =
        !body.success && body.error?.message
          ? body.error.message
          : `请求失败 (${res.status}) ${path}`;
      throw new Error(message);
    }

    return body.data;
  }

  private async publicGet<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`);
    const body = (await res.json()) as ApiSuccess<T> | ApiError;
    if (!res.ok || !body.success) {
      const message =
        !body.success && body.error?.message
          ? body.error.message
          : `请求失败 (${res.status}) ${path}`;
      throw new Error(message);
    }
    return body.data;
  }

  async listArticles(
    params: ListArticlesParams = {},
  ): Promise<PaginatedResponse<ArticleMeta>> {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.pageSize) query.set("pageSize", String(params.pageSize));
    if (params.status) query.set("status", params.status);
    if (params.tag) query.set("tag", params.tag);
    if (params.category) query.set("category", params.category);
    if (params.search) query.set("search", params.search);

    const qs = query.toString();
    return this.request<PaginatedResponse<ArticleMeta>>(
      `/api/articles${qs ? `?${qs}` : ""}`,
      { method: "GET" },
    );
  }

  async getArticle(slug: string): Promise<Article> {
    return this.request<Article>(`/api/articles/${encodeURIComponent(slug)}`, {
      method: "GET",
    });
  }

  async createArticle(input: CreateArticleInput): Promise<Article> {
    return this.request<Article>("/api/articles", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async updateArticle(
    slug: string,
    input: UpdateArticleInput,
  ): Promise<Article> {
    return this.request<Article>(
      `/api/articles/${encodeURIComponent(slug)}`,
      {
        method: "PUT",
        body: JSON.stringify(input),
      },
    );
  }

  async deleteArticle(slug: string): Promise<void> {
    await this.request<{ message: string }>(
      `/api/articles/${encodeURIComponent(slug)}`,
      { method: "DELETE" },
    );
  }

  async listProjects(status?: string): Promise<Project[]> {
    const qs = status ? `?status=${encodeURIComponent(status)}` : "";
    return this.request<Project[]>(`/api/projects${qs}`, { method: "GET" });
  }

  async getProject(id: string): Promise<Project> {
    return this.request<Project>(`/api/projects/${encodeURIComponent(id)}`, {
      method: "GET",
    });
  }

  async createProject(input: CreateProjectInput): Promise<Project> {
    return this.request<Project>("/api/projects", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async updateProject(
    id: string,
    input: UpdateProjectInput,
  ): Promise<Project> {
    return this.request<Project>(`/api/projects/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  }

  async deleteProject(id: string): Promise<void> {
    await this.request<{ message: string }>(
      `/api/projects/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
  }

  async getProfile(): Promise<SiteProfile> {
    return this.publicGet<SiteProfile>("/api/profile");
  }

  async updateProfile(input: UpdateSiteProfileInput): Promise<SiteProfile> {
    return this.request<SiteProfile>("/api/profile", {
      method: "PUT",
      body: JSON.stringify(input),
    });
  }
}

export function createBlogApiClientFromEnv(): BlogApiClient {
  const baseUrl =
    process.env.RELAYAGENT_API_URL ||
    process.env.BLOG_API_URL ||
    "http://localhost:3001";
  const email =
    process.env.RELAYAGENT_ADMIN_EMAIL ||
    process.env.BLOG_ADMIN_EMAIL ||
    process.env.ADMIN_EMAIL;
  const password =
    process.env.RELAYAGENT_ADMIN_PASSWORD ||
    process.env.BLOG_ADMIN_PASSWORD ||
    process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "缺少 RELAYAGENT_ADMIN_EMAIL 或 RELAYAGENT_ADMIN_PASSWORD 环境变量",
    );
  }

  return new BlogApiClient(baseUrl, email, password);
}

export function formatJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}
