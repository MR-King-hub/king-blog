/**
 * Prisma 7 配置文件
 *
 * Prisma 7 把数据库连接 URL 从 schema.prisma 移到了这里。
 * 这样做是为了关注点分离：
 *   - schema.prisma → 只定义数据模型（表结构）
 *   - prisma.config.ts → 配置连接信息（给 CLI 用，如 migrate / generate）
 *   - PrismaClient 构造函数 → 传入 adapter（给运行时用）
 */

import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

// 默认使用 ./data/relayagent.db，可通过 DATABASE_URL 环境变量覆盖
const databaseUrl = process.env.DATABASE_URL || "file:./data/relayagent.db";

export default defineConfig({
  schema: path.join(import.meta.dirname, "prisma", "schema.prisma"),
  datasource: {
    url: databaseUrl,
  },
});
