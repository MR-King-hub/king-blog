import { Hono } from "hono";
import { auth, requireAdmin } from "../middleware/auth.js";
import { profileService } from "../services/profile.service.js";
import type { AppEnv } from "../types.js";
import type { UpdateSiteProfileInput } from "@relayagent/shared";

export const profileRoutes = new Hono<AppEnv>();

// GET / — 公开读取站点个人资料
profileRoutes.get("/", async (c) => {
  const profile = await profileService.get();
  return c.json({ success: true, data: profile });
});

// PUT / — 更新个人资料（需管理员）
profileRoutes.put("/", auth, requireAdmin, async (c) => {
  const body = await c.req.json<UpdateSiteProfileInput>();
  const profile = await profileService.update(body);
  return c.json({ success: true, data: profile });
});
