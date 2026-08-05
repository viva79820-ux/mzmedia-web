import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import {
  ORDER_STATUSES,
  calcAmount,
  todayDate,
  toOrderListItem,
} from "@/lib/orders";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    const orders = await prisma.order.findMany({
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({
      statusOptions: ORDER_STATUSES,
      orders: orders.map(toOrderListItem),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    const quantity = Number(body.수량 ?? body.quantity ?? 1) || 1;
    const unitPrice = Number(body.단가 ?? body.unitPrice ?? 0) || 0;
    const status =
      typeof body.상태 === "string"
        ? body.상태
        : typeof body.status === "string"
          ? body.status
          : "콜드콜";

    const created = await prisma.order.create({
      data: {
        orderDate:
          (typeof body.날짜 === "string" && body.날짜) ||
          (typeof body.orderDate === "string" && body.orderDate) ||
          todayDate(),
        clientName: String(body.거래처명 ?? body.clientName ?? ""),
        contact: String(body.연락처 ?? body.contact ?? ""),
        product: String(body["상품/서비스"] ?? body.product ?? ""),
        quantity,
        unitPrice,
        amount: calcAmount(quantity, unitPrice),
        status,
        assignee: String(body.담당자 ?? body.assignee ?? ""),
        memo: String(body.메모 ?? body.memo ?? ""),
      },
    });

    return NextResponse.json(toOrderListItem(created));
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
