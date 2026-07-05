import { projectStore } from "../store/project-store.js";
import { AppError } from "../middleware/error-handler.js";
import type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
} from "@blog/shared";

class ProjectService {
  async list(status?: string): Promise<Project[]> {
    return projectStore.list(status);
  }

  async getById(id: string): Promise<Project> {
    const project = await projectStore.getById(id);
    if (!project) {
      throw new AppError(404, "NOT_FOUND", `项目 "${id}" 不存在`);
    }
    return project;
  }

  async create(input: CreateProjectInput): Promise<Project> {
    if (!input.title?.trim()) {
      throw new AppError(400, "VALIDATION_ERROR", "项目标题不能为空");
    }
    if (!input.description?.trim()) {
      throw new AppError(400, "VALIDATION_ERROR", "项目描述不能为空");
    }
    return projectStore.create(input);
  }

  async update(id: string, input: UpdateProjectInput): Promise<Project> {
    const project = await projectStore.update(id, input);
    if (!project) {
      throw new AppError(404, "NOT_FOUND", `项目 "${id}" 不存在`);
    }
    return project;
  }

  async remove(id: string): Promise<void> {
    const deleted = await projectStore.remove(id);
    if (!deleted) {
      throw new AppError(404, "NOT_FOUND", `项目 "${id}" 不存在`);
    }
  }
}

export const projectService = new ProjectService();
