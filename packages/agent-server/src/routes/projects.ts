import { Hono } from "hono";
import { auth, requireAdmin } from "../middleware/auth.js";
import { projectService } from "../services/project.service.js";
import type { AppEnv } from "../types.js";
import type { CreateProjectInput, UpdateProjectInput } from "@relayagent/shared";

export const projectRoutes = new Hono<AppEnv>();

// GET / — 项目列表（公开）
projectRoutes.get("/", async (c) => {
  const status = c.req.query("status") || undefined;
  const projects = await projectService.list(status);
  return c.json({ success: true, data: projects });
});

// GET /:id — 项目详情（公开）
projectRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const project = await projectService.getById(id);
  return c.json({ success: true, data: project });
});

// POST / — 创建项目（需管理员）
projectRoutes.post("/", auth, requireAdmin, async (c) => {
  const body = await c.req.json<CreateProjectInput>();
  const project = await projectService.create(body);
  return c.json({ success: true, data: project }, 201);
});

// PUT /:id — 更新项目（需管理员）
projectRoutes.put("/:id", auth, requireAdmin, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<UpdateProjectInput>();
  const project = await projectService.update(id, body);
  return c.json({ success: true, data: project });
});

// DELETE /:id — 删除项目（需管理员）
projectRoutes.delete("/:id", auth, requireAdmin, async (c) => {
  const id = c.req.param("id");
  await projectService.remove(id);
  return c.json({ success: true, data: { message: "已删除" } });
});
