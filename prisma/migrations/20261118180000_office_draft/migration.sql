-- CreateTable
CREATE TABLE "CustomerFolder" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "folderUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficeDraft" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "driveFileId" TEXT NOT NULL DEFAULT '',
    "driveUrl" TEXT NOT NULL DEFAULT '',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficeDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerFolder_customerName_key" ON "CustomerFolder"("customerName");

-- CreateIndex
CREATE INDEX "OfficeDraft_customerName_idx" ON "OfficeDraft"("customerName");

-- AddForeignKey
ALTER TABLE "OfficeDraft" ADD CONSTRAINT "OfficeDraft_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
