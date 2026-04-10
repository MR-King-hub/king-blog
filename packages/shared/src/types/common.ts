// ============================================================
// 通用类型
// ============================================================

/** 通用 API 成功响应 */
export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
}

/** 通用 API 错误响应 */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/** API 响应联合类型 */
export type ApiResult<T = unknown> = ApiResponse<T> | ApiError;
