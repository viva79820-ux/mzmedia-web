ALTER TABLE "Customer" ADD COLUMN "pmId" TEXT;

CREATE INDEX "Customer_pmId_idx" ON "Customer"("pmId");

ALTER TABLE "Customer" ADD CONSTRAINT "Customer_pmId_fkey" FOREIGN KEY ("pmId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
