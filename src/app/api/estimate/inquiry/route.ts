import { NextResponse } from "next/server";
import {
  calculateEstimate,
  parseEstimateRule,
  type EstimateSelection,
  type SaleMode,
} from "@/lib/catalog";
import { ensureCatalogSeeded } from "@/lib/catalog-db";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await ensureCatalogSeeded();
    const body = (await request.json()) as {
      companyName?: string;
      contactName?: string;
      phone?: string;
      email?: string;
      dueDate?: string;
      budgetLabel?: string;
      message?: string;
      privacyAgreed?: boolean;
      productId?: string;
      selection?: EstimateSelection;
    };

    const companyName = body.companyName?.trim() ?? "";
    const contactName = body.contactName?.trim() ?? "";
    const phone = body.phone?.trim() ?? "";
    const email = body.email?.trim() ?? "";
    const message = body.message?.trim() ?? "";

    if (!companyName || !contactName || !phone || !email || !message) {
      return NextResponse.json(
        { ok: false, message: "필수 항목을 모두 입력해 주세요." },
        { status: 400 },
      );
    }
    if (!body.privacyAgreed) {
      return NextResponse.json(
        { ok: false, message: "개인정보 수집·이용에 동의해 주세요." },
        { status: 400 },
      );
    }

    let product = null as Awaited<
      ReturnType<typeof prisma.serviceProduct.findUnique>
    >;
    let snapshot: Record<string, unknown> = {};
    let serviceName = "";

    if (body.productId) {
      product = await prisma.serviceProduct.findUnique({
        where: { id: body.productId },
      });
      if (product) {
        serviceName = product.name;
        const rule = parseEstimateRule(product.estimateRule);
        const result = calculateEstimate(
          rule,
          product.saleMode as SaleMode,
          body.selection ?? {},
        );
        snapshot = {
          productId: product.id,
          productName: product.name,
          saleMode: product.saleMode,
          selection: body.selection ?? {},
          estimate: result,
        };
      }
    }

    const inquiry = await prisma.estimateInquiry.create({
      data: {
        productId: product?.id ?? null,
        companyName,
        contactName,
        phone,
        email,
        serviceName,
        budgetLabel: body.budgetLabel?.trim() ?? "",
        dueDate: body.dueDate?.trim() ?? "",
        message,
        privacyAgreedAt: new Date(),
        estimateSnapshot: JSON.parse(JSON.stringify(snapshot)) as object,
      },
    });

    // Optional handoff into internal Order CRM
    await prisma.order.create({
      data: {
        orderDate: new Date().toISOString().slice(0, 10),
        clientName: companyName,
        contact: `${contactName} / ${phone} / ${email}`,
        product: serviceName || "견적 문의",
        quantity: 1,
        unitPrice: 0,
        amount: 0,
        status: "견적서",
        assignee: "",
        memo: body.budgetLabel?.trim()
          ? `예상예산: ${body.budgetLabel}`
          : "",
        detailText: [
          message,
          body.dueDate ? `희망 완료일: ${body.dueDate}` : "",
          snapshot.estimate
            ? `자동견적: ${JSON.stringify(snapshot.estimate)}`
            : "",
        ]
          .filter(Boolean)
          .join("\n\n"),
        hasDetail: true,
      },
    });

    return NextResponse.json({ ok: true, id: inquiry.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, message: "문의 접수에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
