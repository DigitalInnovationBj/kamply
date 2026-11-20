-- CreateTable
CREATE TABLE "admin_email" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "ctaLabel" TEXT,
    "ctaUrl" TEXT,
    "audience" TEXT NOT NULL,
    "recipients" INTEGER NOT NULL,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "sentById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_email_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_email_createdAt_idx" ON "admin_email"("createdAt");

-- AddForeignKey
ALTER TABLE "admin_email" ADD CONSTRAINT "admin_email_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "ai_run" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "url" TEXT,
    "ok" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_run_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_run_userId_createdAt_idx" ON "ai_run"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "ai_run" ADD CONSTRAINT "ai_run_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
