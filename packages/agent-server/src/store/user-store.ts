/**
 * 👤 用户存储层（Prisma + SQLite 版本）
 *
 * 职责：纯粹的数据存取，不包含业务逻辑。
 * 密码哈希和验证也放在这里，因为它们和数据存储强耦合。
 */

import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";

/** 用户角色 */
export type UserRole = "admin" | "user";

/** 返回给前端的安全用户信息（不含密码哈希） */
export interface SafeUser {
  id: string;
  email: string;
  nickname: string;
  role: UserRole;
  createdAt: string;
}

class UserStore {
  /** Prisma 用户对象转安全用户信息 */
  private toSafe(user: {
    id: string;
    email: string;
    nickname: string;
    role: string;
    createdAt: Date;
  }): SafeUser {
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      role: user.role as UserRole,
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

  /** 验证密码 */
  async verifyPassword(
    user: { passwordHash: string },
    password: string
  ): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }
}

export const userStore = new UserStore();
