-- CreateTable
CREATE TABLE "UsageMonth" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "yearMonth" TEXT NOT NULL,
    "drafts" INTEGER NOT NULL DEFAULT 0,
    "sends" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'free',
    "draftLimit" INTEGER NOT NULL DEFAULT 50,
    "sendLimit" INTEGER NOT NULL DEFAULT 10,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "UsageMonth_userId_yearMonth_idx" ON "UsageMonth"("userId", "yearMonth");

-- CreateIndex
CREATE UNIQUE INDEX "UsageMonth_userId_yearMonth_key" ON "UsageMonth"("userId", "yearMonth");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_userId_key" ON "Plan"("userId");
