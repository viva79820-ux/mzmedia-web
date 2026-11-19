-- CreateTable
CREATE TABLE "WorkSlot" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "createdById" TEXT,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT '배정됨',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkSlot_assigneeId_date_idx" ON "WorkSlot"("assigneeId", "date");

-- CreateIndex
CREATE INDEX "WorkSlot_date_idx" ON "WorkSlot"("date");

-- AddForeignKey
ALTER TABLE "WorkSlot" ADD CONSTRAINT "WorkSlot_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkSlot" ADD CONSTRAINT "WorkSlot_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
