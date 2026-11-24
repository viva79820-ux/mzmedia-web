import { prisma } from "@/lib/db";

export const pmBetaKey = "ai_office_pm_beta_ksers_2027";
export const pmBetaSource = "https://docs.google.com/document/d/1YMy06seK-HxBLCgI5m_QkNK4Fv71zk-r9p_6LrqPK3k/edit";

export type PmBetaJob = {
  status: "queued" | "running" | "review";
  node?: string;
  queuedAt: string;
  claimedAt?: string;
  lease?: string;
  result?: string;
  returnedAt?: string;
};

export async function readPmBeta() {
  const row = await prisma.osSetting.findUnique({ where: { key: pmBetaKey } });
  return row ? { row, job: JSON.parse(row.value) as PmBetaJob } : null;
}
