import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  LEAD_STAGE_LABEL,
  PROJECT_STATUS_LABEL,
  formatWon,
} from "@/lib/os";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionStaff } from "@/lib/staff-auth";

export const metadata: Metadata = {
  title: "고객 상세",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function OsCustomerDetailPage({ params }: Props) {
  const staff = await getSessionStaff();
  if (!staff) redirect("/os/login");
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      leads: { orderBy: { updatedAt: "desc" }, include: { owner: true } },
      projects: { orderBy: { updatedAt: "desc" } },
      inquiries: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/os/customers" className="text-sm text-accent">
          ← 고객 목록
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-ink">
          {customer.companyName}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {customer.contactName} · {customer.phone} · {customer.email}
        </p>
        {customer.memo && (
          <p className="mt-3 whitespace-pre-wrap text-sm text-ink-soft">
            {customer.memo}
          </p>
        )}
      </div>

      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="font-semibold">영업 리드</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {customer.leads.length === 0 && (
            <li className="text-muted">없음</li>
          )}
          {customer.leads.map((lead) => (
            <li key={lead.id} className="rounded-xl bg-paper px-3 py-2">
              <span className="font-medium">{lead.title}</span>
              <span className="ml-2 text-xs text-muted">
                {LEAD_STAGE_LABEL[lead.stage]} · {formatWon(lead.expectedAmount)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="font-semibold">프로젝트</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {customer.projects.length === 0 && (
            <li className="text-muted">없음</li>
          )}
          {customer.projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/os/projects/${project.id}`}
                className="font-medium text-accent"
              >
                {project.name}
              </Link>
              <span className="ml-2 text-xs text-muted">
                {PROJECT_STATUS_LABEL[project.status]} ·{" "}
                {formatWon(project.contractAmount)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="font-semibold">홈페이지 견적문의</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {customer.inquiries.length === 0 && (
            <li className="text-muted">없음</li>
          )}
          {customer.inquiries.map((inq) => (
            <li key={inq.id} className="rounded-xl bg-paper px-3 py-2">
              <p className="font-medium">{inq.serviceName || "견적 문의"}</p>
              <p className="mt-1 text-xs text-muted">
                {inq.createdAt.toISOString().slice(0, 10)} · {inq.budgetLabel}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-ink-soft">
                {inq.message}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
