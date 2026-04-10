/**
 * 🚨 统一错误处理中间件
 *
 * 为什么需要统一错误处理？
 *
 *   没有它的时候：
 *     - 某个 Handler 里忘了 try-catch → 服务直接崩溃或返回难看的 500 页面
 *     - 每个 Handler 都要写 try-catch → 大量重复代码
 *     - 错误格式不统一 → 前端不好处理
 *
 *   有了它之后：
 *     - 一个中间件兜底所有错误
 *     - 返回统一格式的错误响应
 *     - Handler 里可以直接 throw，不用每个都 try-catch
 *     - 还能记录错误日志，方便排查
 *
 * 工作原理：
 *   这个中间件包裹了 next()，如果后续的中间件或 Handler 抛出异常，
 *   就会被这里的 catch 捕获。
 *
 *   请求流程：
 *     errorHandler → [其他中间件] → [Handler]
 *                                      ↓ 抛异常
 *     errorHandler ← ← ← ← ← ← ← ← ←
 *        ↓
 *     catch 捕获，返回统一错误响应
 */

import type { ErrorHandler } from "hono";

/**
 * 自定义业务错误类
 *
 * 为什么要自定义错误类？
 *   原生的 Error 只有 message，没有 HTTP 状态码和错误码。
 *   在业务代码中 throw new AppError(400, "VALIDATION_ERROR", "标题不能为空")
 *   错误处理中间件就能知道该返回什么状态码。
 */
export class AppError extends Error {
  constructor(
    /** HTTP 状态码，如 400、401、403、404、500 */
    public statusCode: number,
    /** 业务错误码，如 "NOT_FOUND"、"VALIDATION_ERROR" */
    public code: string,
    /** 人类可读的错误描述 */
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Hono 的全局错误处理器
 *
 * 当任何 Handler 或中间件抛出异常时，Hono 会自动调用这个函数
 */
export const errorHandler: ErrorHandler = (err, c) => {
  // 在控制台记录错误（生产环境应该接入日志系统）
  console.error(`❌ [${c.get("requestId") || "unknown"}] Error:`, err);

  // 判断是不是我们自定义的业务错误
  if (err instanceof AppError) {
    return c.json(
      {
        success: false,
        error: {
          code: err.code,
          message: err.message,
        },
      },
      err.statusCode as 400 | 401 | 403 | 404 | 500
    );
  }

  // 不是业务错误 → 说明是代码 Bug 或意外情况，返回 500
  return c.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        // 生产环境不要暴露真实错误信息给客户端（防止泄露实现细节）
        // 这里简化处理，实际应该根据环境判断
        message:
          process.env.NODE_ENV === "production"
            ? "Internal server error"
            : err.message || "Internal server error",
      },
    },
    500
  );
};
