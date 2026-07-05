-- CreateTable
CREATE TABLE "site_profile" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "name" TEXT NOT NULL DEFAULT 'Shizhe',
    "tagline" TEXT NOT NULL DEFAULT 'Full-stack · AI Explorer',
    "headline" TEXT NOT NULL DEFAULT 'Hi, 我是',
    "heroSubtitle" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '中国',
    "role" TEXT NOT NULL DEFAULT '全栈工程师',
    "experienceLabel" TEXT NOT NULL DEFAULT '6+ 年经验',
    "bioParagraphs" TEXT NOT NULL DEFAULT '[]',
    "timeline" TEXT NOT NULL DEFAULT '[]',
    "skillCategories" TEXT NOT NULL DEFAULT '[]',
    "interests" TEXT NOT NULL DEFAULT '[]',
    "socialLinks" TEXT NOT NULL DEFAULT '[]',
    "heroBento" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
