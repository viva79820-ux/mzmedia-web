import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { LEAD_SOURCE_LABEL, canManageStaff } from "@/lib/os";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

/**
 * One-shot bridge: copy legacy Order rows into Customer + Lead
 * when they look like quote-stage work and are not already mirrored.
 */
export async function POST() {
  try {
    const staff = await requireStaff();
    if (!canManageStaff(staff)) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    let created = 0;
    let skipped = 0;

    for (const order of orders) {
      const companyName = order.clientName.trim() || "미상 고객";
      const contactBits = order.contact.split("/").map((s) => s.trim());
      const phone =
        contactBits.find((b) => /\d{3,}/.test(b)) ??
        contactBits[1] ??
        "";
      const email =
        contactBits.find((b) => b.includes("@")) ?? "";

      const existingLead = await prisma.lead.findFirst({
        where: {
          title: { contains: order.product || companyName },
          customer: { companyName },
          memo: { contains: order.id },
        },
      });
      if (existingLead) {
        skipped += 1;
        continue;
      }

      let customer = phone
        ? await prisma.customer.findFirst({ where: { phone } })
        : null;
      if (!customer) {
        customer = await prisma.customer.findFirst({
          where: { companyName },
        });
      }
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            companyName,
            contactName: contactBits[0] ?? "",
            phone,
            email,
            memo: `레거시 오더에서 이관`,
          },
        });
      }

      const stage =
        order.status === "계약서" || order.status === "진행중" || order.status === "완료"
          ? "WON"
          : order.status === "견적서"
            ? "QUOTE"
            : order.status === "제안서"
              ? "CONSULT"
              : "LEAD";

      await prisma.lead.create({
        data: {
          customerId: customer.id,
          title: order.product || `${companyName} 오더`,
          stage,
          source: "OTHER",
          expectedAmount: order.amount || null,
          desiredService: order.product,
          inquiryMessage: order.detailText,
          memo: `legacyOrderId=${order.id}\n${order.memo}\n상태:${order.status}`,
          ownerId: staff.id,
          updatedById: staff.id,
        },
      });
      created += 1;
    }

    return NextResponse.json({
      ok: true,
      created,
      skipped,
      total: orders.length,
      note: `유입경로 기본값은 OTHER입니다. (${Object.keys(LEAD_SOURCE_LABEL).join(", ")})`,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
