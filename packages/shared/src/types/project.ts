// ============================================================
// 项目相关类型
// ============================================================

/** 项目数据 */
export interface Project {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  github?: string;
  demo?: string;
  stars?: number;
  forks?: number;
  featured: boolean;
  status: "draft" | "published";
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** 创建项目请求 */
export interface CreateProjectInput {
  title: string;
  description: string;
  techStack?: string[];
  github?: string;
  demo?: string;
  stars?: number;
  forks?: number;
  featured?: boolean;
  status?: "draft" | "published";
  sortOrder?: number;
}

/** 更新项目请求 */
export interface UpdateProjectInput {
  title?: string;
  description?: string;
  techStack?: string[];
  github?: string;
  demo?: string;
  stars?: number;
  forks?: number;
  featured?: boolean;
  status?: "draft" | "published";
  sortOrder?: number;
}
