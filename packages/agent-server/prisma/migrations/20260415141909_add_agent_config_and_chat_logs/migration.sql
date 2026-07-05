-- CreateTable
CREATE TABLE "agent_config" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "name" TEXT NOT NULL DEFAULT 'AI 助手',
    "greeting" TEXT NOT NULL DEFAULT '👋 你好！我是 Shizhe 的 AI 助手，有什么可以帮你的吗？',
    "systemPrompt" TEXT NOT NULL DEFAULT '',
    "modelName" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    "temperature" REAL NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 2000,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "rateLimit" INTEGER NOT NULL DEFAULT 20,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "chat_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "ip" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "chat_logs_sessionId_idx" ON "chat_logs"("sessionId");

-- CreateIndex
CREATE INDEX "chat_logs_ip_createdAt_idx" ON "chat_logs"("ip", "createdAt");
