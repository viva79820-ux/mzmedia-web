import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  PAYMENT_STATUS_LABEL,
  PROJECT_STATUS_LABEL,
  TASK_STATUS_LABEL,
  formatWon,
} from "@/lib/os";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionStaff } from "@/lib/staff-auth";

export const metadata: Metadata = {
  title: "프로젝트 상세",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function OsProjectDetailPage({ params }: Props) {
  const staff = await getSessionStaff();
  if (!staff) redirect("/os/login");
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      customer: true,
      members: { include: { staff: true } },
      tasks: {
        orderBy: { updatedAt: "desc" },
        include: { assignee: true },
      },
      payments: { orderBy: { dueDate: "asc" } },
      costs: true,
    },
  });
  if (!project) notFound();

  const paid = project.payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);
  const costSum = project.costs.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/os/projects" className="text-sm text-accent">
          ← 프로젝트 목록
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-ink">{project.name}</h1>
        <p className="mt-1 text-sm text-muted">
          {project.customer.companyName} ·{" "}
          {PROJECT_STATUS_LABEL[project.status]} · 진행 {project.progress}%
        </p>
        <p className="mt-2 text-sm">
          계약 {formatWon(project.contractAmount)} · 입금 {formatWon(paid)} ·
          비용 {formatWon(costSum)} · 이익{" "}
          {formatWon(paid - costSum)}
        </p>
      </div>

      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="font-semibold">참여 직원</h2>
        <p className="mt-2 text-sm text-ink-soft">
          {project.members.map((m) => m.staff.name).join(", ") || "없음"}
        </p>
      </section>

      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="font-semibold">업무</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {project.tasks.length === 0 && <li className="text-muted">없음</li>}
          {project.tasks.map((task) => (
            <li key={task.id} className="rounded-xl bg-paper px-3 py-2">
              {task.title}
              <span className="ml-2 text-xs text-muted">
                {TASK_STATUS_LABEL[task.status]} ·{" "}
                {task.assignee?.name ?? "미배정"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="font-semibold">입금</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {project.payments.length === 0 && <li className="text-muted">없음</li>}
          {project.payments.map((payment) => (
            <li key={payment.id} className="flex justify-between gap-2">
              <span>
                {payment.label || payment.kind} · {formatWon(payment.amount)}
              </span>
              <span className="text-xs text-muted">
                {PAYMENT_STATUS_LABEL[payment.status]} · {payment.dueDate}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
