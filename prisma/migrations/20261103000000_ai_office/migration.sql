-- CreateTable
CREATE TABLE "OfficeJob" (
    "id" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "analysis" TEXT NOT NULL DEFAULT '',
    "report" TEXT NOT NULL DEFAULT '',
    "error" TEXT NOT NULL DEFAULT '',
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "costUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tokens" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficeJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficeStep" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "tool" TEXT NOT NULL,
    "inputJson" TEXT NOT NULL DEFAULT '{}',
    "outputJson" TEXT,
    "status" TEXT NOT NULL,
    "log" TEXT NOT NULL DEFAULT '',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "OfficeStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficeLog" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "stepId" TEXT,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfficeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficeMemory" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "jobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfficeMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficeImprovement" (
    "id" TEXT NOT NULL,
    "jobId" TEXT,
    "problem" TEXT NOT NULL,
    "proposal" TEXT NOT NULL,
    "validation" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "OfficeImprovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficeApproval" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "improvementId" TEXT,
    "summary" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "OfficeApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficePolicy" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "improvementId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfficePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficeUsage" (
    "id" TEXT NOT NULL,
    "jobId" TEXT,
    "model" TEXT NOT NULL,
    "tokensIn" INTEGER NOT NULL,
    "tokensOut" INTEGER NOT NULL,
    "costUsd" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfficeUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OfficeJob_status_createdAt_idx" ON "OfficeJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "OfficeStep_jobId_position_idx" ON "OfficeStep"("jobId", "position");

-- CreateIndex
CREATE INDEX "OfficeLog_jobId_createdAt_idx" ON "OfficeLog"("jobId", "createdAt");

-- CreateIndex
CREATE INDEX "OfficeMemory_kind_createdAt_idx" ON "OfficeMemory"("kind", "createdAt");

-- CreateIndex
CREATE INDEX "OfficeImprovement_status_createdAt_idx" ON "OfficeImprovement"("status", "createdAt");

-- CreateIndex
CREATE INDEX "OfficeApproval_jobId_status_idx" ON "OfficeApproval"("jobId", "status");

-- AddForeignKey
ALTER TABLE "OfficeStep" ADD CONSTRAINT "OfficeStep_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "OfficeJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeLog" ADD CONSTRAINT "OfficeLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "OfficeJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeMemory" ADD CONSTRAINT "OfficeMemory_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "OfficeJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeImprovement" ADD CONSTRAINT "OfficeImprovement_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "OfficeJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeApproval" ADD CONSTRAINT "OfficeApproval_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "OfficeJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeApproval" ADD CONSTRAINT "OfficeApproval_improvementId_fkey" FOREIGN KEY ("improvementId") REFERENCES "OfficeImprovement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficePolicy" ADD CONSTRAINT "OfficePolicy_improvementId_fkey" FOREIGN KEY ("improvementId") REFERENCES "OfficeImprovement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeUsage" ADD CONSTRAINT "OfficeUsage_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "OfficeJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed the rules the agent must follow before any run exists.
INSERT INTO "OfficeMemory" ("id", "kind", "title", "content", "createdAt") VALUES
('seed-rule-message', 'rule', '고객 메시지는 발송하지 않음', '이메일, 문자, DM은 초안까지만 작성합니다. 실제 발송은 대표가 직접 합니다.', CURRENT_TIMESTAMP),
('seed-rule-payment', 'rule', '결제와 계약을 바꾸지 않음', '결제, 환불, 계약 변경과 체결은 에이전트 권한이 아닙니다.', CURRENT_TIMESTAMP),
('seed-rule-prod', 'rule', '운영 사이트는 수정하지 않음', '운영 코드, 배포, 서버 설정을 에이전트 도구로 바꾸지 않습니다.', CURRENT_TIMESTAMP),
('seed-rule-quote', 'rule', '견적은 예상 범위로 적음', '상담 전 금액은 확정 견적이 아닙니다. 초안에는 예상 범위와 상담 후 확정이라는 문장을 함께 적습니다.', CURRENT_TIMESTAMP),
('seed-failure-quote', 'failure', '견적 초안을 확정 금액처럼 적음', '상담 전 금액을 확정 견적으로 적으면 고객 기대가 어긋납니다. 다음 초안은 ''예상 범위''와 ''상담 후 확정''을 본문에 넣습니다.', CURRENT_TIMESTAMP);
