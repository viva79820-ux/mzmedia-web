import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canOpenCustomer, openWork, responsiblePmIds, scopeItems } from "@/lib/customer-access";
import { canSeeAmounts } from "@/lib/os";
import { receivableByCustomer } from "@/lib/money-view";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

function fail(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  console.error(error);
  return NextResponse.json({ ok: false }, { status: 500 });
}

async function loadCustomer(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: { leads: { select: { ownerId: true, owner: { select: { role: true } } } } },
  });
}

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const staff = await requireStaff();
    const { id } = await ctx.params;
    const customer = await loadCustomer(id);
    if (!customer) return NextResponse.json({ ok: false }, { status: 404 });
    const pmIds = responsiblePmIds({
      pmId: customer.pmId,
      leadOwnerIds: customer.leads.filter((lead) => lead.owner?.role === "MANAGER").map((lead) => lead.ownerId),
    });
    if (!canOpenCustomer(staff.role, staff.id, pmIds)) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }
    const [items, slots, folder, payments] = await Promise.all([
      prisma.inboxItem.findMany({
        where: { customerName: customer.companyName },
        select: { id: true, kind: true, title: true, quantity: true, doneCriteria: true, reason: true, status: true },
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
    ]);
    const scope = scopeItems(items);
    const receivable = payments.length
      ? receivableByCustomer([{ customerName: customer.companyName, status: payments.some((row) => row.status === "PLANNED" || row.status === "OVERDUE") ? "PLANNED" : "PAID" }])[0]?.receivable
      : null;
    return NextResponse.json({
      customer: {
        id: customer.id,
        companyName: customer.companyName,
        contactName: customer.contactName,
        phone: customer.phone,
        email: customer.email,
        pmId: customer.pmId,
      },
      scope: scope.inScope,
      outside: scope.outside,
      work: openWork(slots),
      folderUrl: folder?.folderUrl ?? "",
      receivable,
    });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const staff = await requireStaff();
    const { id } = await ctx.params;
    const customer = await loadCustomer(id);
    if (!customer) return NextResponse.json({ ok: false }, { status: 404 });
    const pmIds = responsiblePmIds({
      pmId: customer.pmId,
      leadOwnerIds: customer.leads.filter((lead) => lead.owner?.role === "MANAGER").map((lead) => lead.ownerId),
    });
    if (!canOpenCustomer(staff.role, staff.id, pmIds)) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }
    const body = (await request.json()) as Record<string, unknown>;
    const ceo = canSeeAmounts(staff);
    if (!ceo && ["companyName", "contactName", "phone", "email", "memo", "pmId"].some((key) => body[key] !== undefined)) {
      return NextResponse.json({ ok: false, message: "담당 PM 변경은 대표만 저장합니다." }, { status: 403 });
    }
    if (ceo && body.pmId !== undefined) {
      const pmId = String(body.pmId ?? "").trim();
      if (pmId) {
        const pm = await prisma.staff.findFirst({ where: { id: pmId, role: "MANAGER", active: true }, select: { id: true } });
        if (!pm) return NextResponse.json({ ok: false, message: "담당 PM을 확인해 주세요." }, { status: 400 });
      }
      await prisma.customer.update({ where: { id }, data: { pmId: pmId || null } });
    }
    if (body.folderUrl !== undefined) {
      const folderUrl = String(body.folderUrl ?? "").trim();
      if (folderUrl && !folderUrl.startsWith("https://")) {
        return NextResponse.json({ ok: false, message: "드라이브 폴더 주소는 https 주소여야 합니다." }, { status: 400 });
      }
      if (!folderUrl) {
        await prisma.customerFolder.deleteMany({ where: { customerName: customer.companyName } });
      } else {
        await prisma.customerFolder.upsert({
          where: { customerName: customer.companyName },
          update: { folderUrl },
          create: { customerName: customer.companyName, folderUrl },
        });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
