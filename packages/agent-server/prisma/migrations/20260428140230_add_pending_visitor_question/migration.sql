-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_pending_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "visitorRequest" TEXT NOT NULL,
    "proposal" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'waiting_owner',
    "imMessageId" TEXT,
    "ownerReply" TEXT,
    "finalReply" TEXT,
    "deliveredVia" TEXT,
    "visitorEmail" TEXT,
    "conversationHistory" TEXT NOT NULL DEFAULT '[]',
    "visitorMessages" TEXT NOT NULL DEFAULT '[]',
    "pendingVisitorQuestion" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME
);
INSERT INTO "new_pending_tasks" ("conversationHistory", "createdAt", "deliveredVia", "finalReply", "id", "imMessageId", "ownerReply", "proposal", "resolvedAt", "sessionId", "status", "type", "visitorEmail", "visitorMessages", "visitorRequest") SELECT "conversationHistory", "createdAt", "deliveredVia", "finalReply", "id", "imMessageId", "ownerReply", "proposal", "resolvedAt", "sessionId", "status", "type", "visitorEmail", "visitorMessages", "visitorRequest" FROM "pending_tasks";
DROP TABLE "pending_tasks";
ALTER TABLE "new_pending_tasks" RENAME TO "pending_tasks";
CREATE INDEX "pending_tasks_sessionId_idx" ON "pending_tasks"("sessionId");
CREATE INDEX "pending_tasks_imMessageId_idx" ON "pending_tasks"("imMessageId");
CREATE INDEX "pending_tasks_status_idx" ON "pending_tasks"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
