"use client";

/**
 * 🔐 认证状态管理
 *
 * 提供全局的登录状态，任何组件都可以通过 useAuth() 获取：
 *   - user     当前用户信息（null 表示未登录）
 *   - loading  是否正在验证 token
 *   - isAdmin  是否是管理员
 *   - login()  登录
 *   - logout() 登出
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { authApi, setToken, removeToken, type AuthUser } from "./api";

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // 启动时验证已有 token
  useEffect(() => {
    authApi
      .me()
      .then((u) => setUser(u))
      .catch(() => {
        // token 无效或过期，清理掉
        removeToken();
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: u, token } = await authApi.login(email, password);
    setToken(token);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin: user?.role === "admin",
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth 必须在 AuthProvider 内使用");
  }
  return ctx;
}
