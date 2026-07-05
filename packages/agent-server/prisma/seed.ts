/**
 * 数据库种子脚本
 * 用法: pnpm db:seed
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.js";
import { getDefaultProfileSeedData } from "../src/data/default-profile.js";
import { getDefaultAgentSeedData } from "../src/data/default-agent-config.js";

// ── Admin 用户 ──
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const nickname = process.env.ADMIN_NICKNAME || "管理员";

if (!email || !password) {
  console.error("❌ 请在 .env 中设置 ADMIN_EMAIL 和 ADMIN_PASSWORD");
  process.exit(1);
}

const userExists = await prisma.user.findUnique({ where: { email } });
if (!userExists) {
  const hash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { email, passwordHash: hash, nickname, role: "admin" } });
  console.log(`✅ Admin: ${email}`);
} else {
  console.log(`⏭️  Admin 已存在: ${email}`);
}

// ── Agent 配置（单例） ──
const profileSeed = getDefaultProfileSeedData();
const cfgExists = await prisma.agentConfig.findUnique({ where: { id: "default" } });
if (!cfgExists) {
  await prisma.agentConfig.create({ data: getDefaultAgentSeedData(profileSeed.name) });
  console.log("✅ AgentConfig 默认配置");
} else if (!cfgExists.systemPrompt.trim()) {
  await prisma.agentConfig.update({
    where: { id: "default" },
    data: getDefaultAgentSeedData(profileSeed.name),
  });
  console.log("✅ AgentConfig 补全默认 systemPrompt");
} else {
  console.log("⏭️  AgentConfig 已存在");
}

// ── 站点个人资料（单例） ──
const profileExists = await prisma.siteProfile.findUnique({
  where: { id: "default" },
});
if (!profileExists) {
  await prisma.siteProfile.create({ data: getDefaultProfileSeedData() });
  console.log("✅ SiteProfile 默认资料");
} else {
  console.log("⏭️  SiteProfile 已存在");
}

console.log("🎉 seed 完成");
process.exit(0);
