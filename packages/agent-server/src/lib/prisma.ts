/**
 * 🔌 Prisma 客户端（数据库连接）
 *
 * 为什么要用单例？
 *   每次 new PrismaClient() 都会创建一个数据库连接池。
 *   如果每个请求都创建一个新的，连接数会暴涨，数据库扛不住。
 *   所以全局只创建一个实例，所有代码共用。
 *
 * 开发模式的特殊处理：
 *   用 tsx watch 或 nodemon 开发时，文件改动会触发热更新，
 *   模块会被重新加载，导致创建多个 PrismaClient。
 *   解决方案：把实例存到 globalThis 上（Node.js 全局对象），
 *   热更新时复用已有实例。
 */

import { PrismaClient } from "@prisma/client";

// 在 globalThis 上声明类型（TypeScript 需要）
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 如果全局已有实例就复用，没有就新建
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  // log: ["query"], // 取消注释可以打印每条 SQL，调试时很有用
});

// 非生产环境时，把实例存到全局
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
