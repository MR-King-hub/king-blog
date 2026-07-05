import { prisma } from "../lib/prisma.js";
import type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
} from "@relayagent/shared";

class ProjectStore {
  private toProject(row: {
    id: string;
    title: string;
    description: string;
    techStack: string;
    github: string | null;
    demo: string | null;
    stars: number;
    forks: number;
    featured: boolean;
    status: string;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
  }): Project {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      techStack: row.techStack ? JSON.parse(row.techStack) : [],
      github: row.github ?? undefined,
      demo: row.demo ?? undefined,
      stars: row.stars || undefined,
      forks: row.forks || undefined,
      featured: row.featured,
      status: row.status as "draft" | "published",
      sortOrder: row.sortOrder,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async list(status?: string): Promise<Project[]> {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const rows = await prisma.project.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    });

    return rows.map((r) => this.toProject(r));
  }

  async getById(id: string): Promise<Project | null> {
    const row = await prisma.project.findUnique({ where: { id } });
    if (!row) return null;
    return this.toProject(row);
  }

  async create(input: CreateProjectInput): Promise<Project> {
    const row = await prisma.project.create({
      data: {
        title: input.title,
        description: input.description,
        techStack: JSON.stringify(input.techStack || []),
        github: input.github,
        demo: input.demo,
        stars: input.stars || 0,
        forks: input.forks || 0,
        featured: input.featured || false,
        status: input.status || "draft",
        sortOrder: input.sortOrder ?? 0,
      },
    });
    return this.toProject(row);
  }

  async update(id: string, input: UpdateProjectInput): Promise<Project | null> {
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) return null;

    const row = await prisma.project.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.techStack !== undefined && { techStack: JSON.stringify(input.techStack) }),
        ...(input.github !== undefined && { github: input.github }),
        ...(input.demo !== undefined && { demo: input.demo }),
        ...(input.stars !== undefined && { stars: input.stars }),
        ...(input.forks !== undefined && { forks: input.forks }),
        ...(input.featured !== undefined && { featured: input.featured }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      },
    });
    return this.toProject(row);
  }

  async remove(id: string): Promise<boolean> {
    try {
      await prisma.project.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}

export const projectStore = new ProjectStore();
