/**
 * 📦 中间件统一导出
 *
 * 把所有中间件从这个文件集中导出，
 * app.ts 只需要 import { requestId, errorHandler } from "./middleware/index.js"
 * 不用关心每个中间件在哪个文件里
 */

export { requestId } from "./request-id.js";
export { errorHandler, AppError } from "./error-handler.js";
export { auth, generateToken } from "./auth.js";
