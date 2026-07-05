-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_agent_config" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "name" TEXT NOT NULL DEFAULT 'AI 助手',
    "greeting" TEXT NOT NULL DEFAULT '👋 你好！我是 Shizhe 的 AI 助手，有什么可以帮你的吗？',
    "systemPrompt" TEXT NOT NULL DEFAULT '',
    "modelName" TEXT NOT NULL DEFAULT 'glm-5',
    "temperature" REAL NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 2000,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "rateLimit" INTEGER NOT NULL DEFAULT 20,
    "wecomBotId" TEXT NOT NULL DEFAULT '',
    "wecomBotSecret" TEXT NOT NULL DEFAULT '',
    "wecomOwnerUserId" TEXT NOT NULL DEFAULT '',
    "wecomGroupChatId" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_agent_config" ("createdAt", "enabled", "greeting", "id", "maxTokens", "modelName", "name", "rateLimit", "systemPrompt", "temperature", "updatedAt") SELECT "createdAt", "enabled", "greeting", "id", "maxTokens", "modelName", "name", "rateLimit", "systemPrompt", "temperature", "updatedAt" FROM "agent_config";
DROP TABLE "agent_config";
ALTER TABLE "new_agent_config" RENAME TO "agent_config";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
