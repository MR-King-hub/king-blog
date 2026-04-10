/**
 * ⚙️ 服务配置文件
 *
 * 为什么要用环境变量？
 *   - 敏感信息（API Key、数据库密码）不能写死在代码里
 *   - 不同环境（本地开发、测试、生产）的配置不同
 *   - .env 文件不会提交到 Git，保证安全
 *
 * 使用方式：
 *   1. 复制 .env.example 为 .env
 *   2. 在 .env 里填写实际值
 *   3. dotenv 会在启动时把 .env 里的值加载到 process.env 中
 */

import dotenv from "dotenv";
import path from "path";

// 加载 .env 文件中的环境变量到 process.env
dotenv.config();

/**
 * 统一导出配置对象
 *
 * 为什么不直接在代码里用 process.env.xxx？
 *   1. 集中管理 — 所有配置在一个地方，改起来方便
 *   2. 类型安全 — process.env 的值都是 string | undefined，这里做了转换
 *   3. 默认值   — 提供合理的默认值，不配也能跑
 *   4. 可验证   — 后面可以加校验逻辑，启动时就发现配置缺失
 */
export const config = {
  /** 服务端口号，默认 3001 */
  port: parseInt(process.env.PORT || "3001", 10),

  /** OpenAI API Key，用于 LangChain 调用 GPT 模型 */
  openaiApiKey: process.env.OPENAI_API_KEY || "",

  /** 数据存储目录，文章文件等都存在这里 */
  dataDir: path.resolve(process.env.DATA_DIR || "./data"),

  /**
   * JWT 密钥 — 用于签名和验证 token
   *
   * ⚠️ 重要安全事项：
   *   - 生产环境必须设置一个足够长、足够随机的密钥
   *   - 绝不能提交到 Git
   *   - 如果密钥泄露，所有已签发的 token 都不可信，需要更换密钥
   *   - 这里的默认值仅用于本地开发
   */
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me-in-production",
};
