-- CreateTable
CREATE TABLE "Worker" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hourlyWage" INTEGER NOT NULL DEFAULT 10320,
    "holidayPayEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Worker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WageMonth" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "hourlyWage" INTEGER NOT NULL,
    "holidayPayEnabled" BOOLEAN NOT NULL,
    "hoursByDate" JSONB NOT NULL,
    "memo" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WageMonth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Worker_name_idx" ON "Worker"("name");

-- CreateIndex
CREATE UNIQUE INDEX "WageMonth_workerId_year_month_key" ON "WageMonth"("workerId", "year", "month");

-- CreateIndex
CREATE INDEX "WageMonth_year_month_idx" ON "WageMonth"("year", "month");

-- AddForeignKey
ALTER TABLE "WageMonth" ADD CONSTRAINT "WageMonth_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
