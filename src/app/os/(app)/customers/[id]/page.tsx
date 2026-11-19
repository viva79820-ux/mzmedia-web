import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CustomerOfficeForm } from "@/components/os/CustomerOfficeForm";
import { canOpenCustomer, openWork, responsiblePmIds, scopeItems } from "@/lib/customer-access";
import { canSeeAmounts } from "@/lib/os";
import { receivableByCustomer } from "@/lib/money-view";
import { prisma } from "@/lib/db";
import { getSessionStaff } from "@/lib/staff-auth";

export const metadata: Metadata = {
  title: "고객사",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function OsCustomerDetailPage({ params }: Props) {
  const staff = await getSessionStaff();
  if (!staff) redirect("/os/login");
  if (staff.role !== "SUPER_ADMIN" && staff.role !== "MANAGER") redirect("/os/calendar");
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { leads: { select: { ownerId: true, owner: { select: { role: true } } } } },
  });
  if (!customer) notFound();
  const pmIds = responsiblePmIds({
    pmId: customer.pmId,
    leadOwnerIds: customer.leads.filter((lead) => lead.owner?.role === "MANAGER").map((lead) => lead.ownerId),
  });
  if (!canOpenCustomer(staff.role, staff.id, pmIds)) notFound();

  const [items, slots, folder, payments, managers] = await Promise.all([
    prisma.inboxItem.findMany({
      where: { customerName: customer.companyName },
      select: { id: true, kind: true, title: true, quantity: true, doneCriteria: true, reason: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.workSlot.findMany({
      where: { customerName: customer.companyName },
      select: { id: true, title: true, date: true, status: true, assignee: { select: { name: true } } },
      orderBy: { date: "asc" },
    }),
    prisma.customerFolder.findUnique({ where: { customerName: customer.companyName }, select: { folderUrl: true } }),
    prisma.payment.findMany({
      where: { project: { customerId: customer.id }, status: { in: ["PLANNED", "OVERDUE", "PAID"] } },
      select: { status: true },
    }),
    canSeeAmounts(staff)
      ? prisma.staff.findMany({ where: { role: "MANAGER", active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } })
      : Promise.resolve([]),
  ]);
  const scope = scopeItems(items);
  const work = openWork(slots);
  const receivable = payments.length
    ? receivableByCustomer([{ customerName: customer.companyName, status: payments.some((row) => row.status === "PLANNED" || row.status === "OVERDUE") ? "PLANNED" : "PAID" }])[0]?.receivable
    : null;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/os/customers" className="text-sm text-accent">← 고객사</Link>
        <h1 className="mt-2 text-2xl font-bold text-ink">{customer.companyName}</h1>
        <p className="mt-1 text-sm text-muted">{[customer.contactName, customer.phone, customer.email].filter(Boolean).join(" · ") || "연락처 없음"}</p>
        {receivable ? <p className="mt-2 text-sm">{receivable}</p> : null}
      </div>

      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="font-semibold">범위</h2>
        {scope.inScope.length === 0 ? <p className="mt-2 text-sm text-muted">기록에 없습니다.</p> : (
          <ul className="mt-3 space-y-2 text-sm">
            {scope.inScope.map((item) => (
              <li key={item.id} className="rounded-xl bg-paper px-3 py-2">{item.title} {item.quantity}건{item.doneCriteria ? ` · 완료 기준 ${item.doneCriteria}` : ""}</li>
            ))}
          </ul>
        )}
        {scope.outside.length > 0 ? (
          <div className="mt-4">
            <h3 className="text-sm font-semibold">범위에 넣지 않음</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {scope.outside.map((item) => (
                <li key={item.id}>{item.title}{item.reason ? ` · ${item.reason}` : ""}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="font-semibold">진행 업무</h2>
        {work.length === 0 ? <p className="mt-2 text-sm text-muted">진행 중인 일정이 없습니다.</p> : (
          <ul className="mt-3 space-y-2 text-sm">
            {work.map((slot) => (
              <li key={slot.id}>{slot.date || "날짜 없음"} · {slot.title} · {slot.assignee.name} · {slot.status}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="font-semibold">드라이브 폴더</h2>
        {folder?.folderUrl ? (
          <p className="mt-2 text-sm"><a href={folder.folderUrl} target="_blank" rel="noreferrer" className="text-accent">폴더 열기</a></p>
        ) : (
          <p className="mt-2 text-sm text-muted">폴더를 먼저 연결하세요. 파일 본문은 가져오지 않습니다.</p>
        )}
        <div className="mt-4">
          <CustomerOfficeForm
            id={customer.id}
            folderUrl={folder?.folderUrl ?? ""}
            pmId={customer.pmId ?? ""}
            managers={managers}
            canAssignPm={canSeeAmounts(staff)}
          />
        </div>
      </section>
    </div>
  );
}
