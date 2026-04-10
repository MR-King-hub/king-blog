/**
 * 👤 用户存储层（Prisma + SQLite 版本）
 *
 * 和文章 Store 一样，从文件读写改成了数据库查询。
 * 公共接口不变，上层代码无感知。
 */

import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";

/** 返回给前端的安全用户信息（不含密码哈希） */
export interface SafeUser {
  id: string;
  email: string;
  nickname: string;
  createdAt: string;
}

class UserStore {
  /** Prisma 用户对象转安全用户信息 */
  private toSafe(user: { id: string; email: string; nickname: string; createdAt: Date }): SafeUser {
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      createdAt: user.createdAt.toISOString(),
    };
  }

  /** 根据 email 查找用户（包含密码哈希，仅供内部验证用） */
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  /** 根据 ID 查找用户（返回安全信息） */
  async findById(id: string): Promise<SafeUser | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? this.toSafe(user) : null;
  }

  /** 注册新用户 */
  async create(email: string, password: string, nickname: string): Promise<SafeUser | null> {
    // 检查 email 是否已存在
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return null;

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, passwordHash, nickname },
    });

    return this.toSafe(user);
  }

  /** 验证密码 */
  async verifyPassword(user: { passwordHash: string }, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }
}

export const userStore = new UserStore();
