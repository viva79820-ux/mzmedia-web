-- AlterTable
ALTER TABLE "WorkSlot" ADD COLUMN "inboxItemId" TEXT;

-- CreateTable
CREATE TABLE "InboxItem" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL DEFAULT '',
    "quantity" INTEGER NOT NULL,
    "doneCriteria" TEXT NOT NULL DEFAULT '',
    "month" TEXT NOT NULL,
    "driveUrl" TEXT NOT NULL DEFAULT '',
    "sourceSentence" TEXT NOT NULL DEFAULT '',
    "kind" TEXT NOT NULL DEFAULT '업무',
    "reason" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT '접수',
    "assigneeId" TEXT,
    "startDate" TEXT NOT NULL DEFAULT '',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InboxItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkSlot_inboxItemId_idx" ON "WorkSlot"("inboxItemId");

-- CreateIndex
CREATE INDEX "InboxItem_kind_status_idx" ON "InboxItem"("kind", "status");

-- CreateIndex
CREATE INDEX "InboxItem_month_idx" ON "InboxItem"("month");

-- AddForeignKey
ALTER TABLE "WorkSlot" ADD CONSTRAINT "WorkSlot_inboxItemId_fkey" FOREIGN KEY ("inboxItemId") REFERENCES "InboxItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboxItem" ADD CONSTRAINT "InboxItem_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboxItem" ADD CONSTRAINT "InboxItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
