-- Link a meeting brief to the inbound estimate that produced it.
ALTER TABLE "OfficeJob" ADD COLUMN IF NOT EXISTS "inquiryId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "OfficeJob_inquiryId_key" ON "OfficeJob"("inquiryId");
