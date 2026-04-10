/**
 * Prisma 7 配置文件
 *
 * Prisma 7 把数据库连接 URL 从 schema.prisma 移到了这里。
 * 这样做是为了关注点分离：
 *   - schema.prisma → 只定义数据模型（表结构）
 *   - prisma.config.ts → 配置连接信息
 */

import { defineConfig } from "prisma/config";

export default defineConfig({
  datasource: {
    // SQLite 数据库文件路径（相对于项目根目录）
    url: "file:./data/blog.db",
  },
});
