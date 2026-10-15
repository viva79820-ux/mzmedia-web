import { NextResponse } from "next/server";
import type { ContractStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { canManageQuotes, canSeeAllRecords, todayKey } from "@/lib/os";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

const STATUSES = new Set(["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"]);

function fail(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (error instanceof Error && error.message === "FORBIDDEN") {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  console.error(error);
  return NextResponse.json({ ok: false }, { status: 500 });
}

export async function GET() {
  try {
    const staff = await requireStaff();
    if (!canManageQuotes(staff) && staff.role !== "ACCOUNTING") {
      throw new Error("FORBIDDEN");
    }
    const contracts = await prisma.contract.findMany({
      where: canSeeAllRecords(staff)
        ? undefined
        : {
            OR: [
              { createdById: staff.id },
              { lead: { ownerId: staff.id } },
            ],
          },
      orderBy: { updatedAt: "desc" },
      include: {
        customer: true,
        project: true,
        quote: true,
        lead: true,
      },
      take: 300,
    });
    return NextResponse.json({ contracts });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const staff = await requireStaff();
    if (!canManageQuotes(staff)) throw new Error("FORBIDDEN");
    const body = (await request.json()) as Record<string, unknown>;
    const customerId = String(body.customerId ?? "");
    const title = String(body.title ?? "").trim();
    if (!customerId || !title) {
      return NextResponse.json(
        { ok: false, message: "고객과 계약명은 필수입니다." },
        { status: 400 },
      );
    }

    const contractAmount = Number(body.contractAmount ?? 0) || 0;
    const depositAmount = Number(body.depositAmount ?? 0) || 0;
    const milestoneAmount = Number(body.milestoneAmount ?? 0) || 0;
    const finalAmount =
      body.finalAmount !== undefined
        ? Number(body.finalAmount) || 0
        : Math.max(0, contractAmount - depositAmount - milestoneAmount);

    const result = await prisma.$transaction(async (tx) => {
      let projectId = body.projectId ? String(body.projectId) : null;

      if (body.createProject === true && !projectId) {
        const project = await tx.project.create({
          data: {
            customerId,
            name: title,
            status: "CONTRACTED",
            contractAmount,
            serviceCategory: String(body.serviceCategory ?? ""),
            channelSource: String(body.channelSource ?? ""),
            startDate: String(body.contractDate ?? todayKey()),
            updatedById: staff.id,
            members: { create: { staffId: staff.id, roleLabel: "owner" } },
          },
        });
        projectId = project.id;
        if (body.leadId) {
          await tx.lead.update({
            where: { id: String(body.leadId) },
            data: {
              stage: "WON",
              projectId,
              updatedById: staff.id,
            },
          });
        }
      }

      const contract = await tx.contract.create({
        data: {
          customerId,
          leadId: body.leadId ? String(body.leadId) : null,
          projectId,
          quoteId: body.quoteId ? String(body.quoteId) : null,
          title,
          contractAmount,
          contractDate: String(body.contractDate ?? todayKey()),
          status: STATUSES.has(String(body.status))
            ? (String(body.status) as ContractStatus)
            : "ACTIVE",
          depositAmount,
          milestoneAmount,
          finalAmount,
          depositDue: String(body.depositDue ?? ""),
          milestoneDue: String(body.milestoneDue ?? ""),
          finalDue: String(body.finalDue ?? ""),
          documentUrl: String(body.documentUrl ?? ""),
          memo: String(body.memo ?? ""),
          createdById: staff.id,
        },
      });

      // Auto payment schedule
      const schedule: {
        label: string;
        kind: "DEPOSIT" | "MILESTONE" | "FINAL";
        amount: number;
        dueDate: string;
      }[] = [];
      if (depositAmount > 0) {
        schedule.push({
          label: "계약금",
          kind: "DEPOSIT",
          amount: depositAmount,
          dueDate: String(body.depositDue ?? ""),
        });
      }
      if (milestoneAmount > 0) {
        schedule.push({
          label: "중도금",
          kind: "MILESTONE",
          amount: milestoneAmount,
          dueDate: String(body.milestoneDue ?? ""),
        });
      }
      if (finalAmount > 0) {
        schedule.push({
          label: "잔금",
          kind: "FINAL",
          amount: finalAmount,
          dueDate: String(body.finalDue ?? ""),
        });
      }
      for (const row of schedule) {
        await tx.payment.create({
          data: {
            projectId,
            label: row.label,
            kind: row.kind,
            amount: row.amount,
            dueDate: row.dueDate,
            status: "PLANNED",
          },
        });
      }

      return contract;
    });

    return NextResponse.json({ ok: true, contract: result });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const staff = await requireStaff();
    if (!canManageQuotes(staff) && staff.role !== "ACCOUNTING") {
      throw new Error("FORBIDDEN");
    }
    const body = (await request.json()) as Record<string, unknown>;
    const id = String(body.id ?? "");
    if (!id) return NextResponse.json({ ok: false }, { status: 400 });

    const data: Record<string, unknown> = {};
    for (const key of [
      "title",
      "contractDate",
      "depositDue",
      "milestoneDue",
      "finalDue",
      "documentUrl",
      "memo",
    ] as const) {
      if (body[key] !== undefined) data[key] = String(body[key]);
    }
    for (const key of [
      "contractAmount",
      "depositAmount",
      "milestoneAmount",
      "finalAmount",
    ] as const) {
      if (body[key] !== undefined) data[key] = Number(body[key]) || 0;
    }
    if (body.status !== undefined && STATUSES.has(String(body.status))) {
      data.status = String(body.status) as ContractStatus;
    }
    if (body.projectId !== undefined) {
      data.projectId = body.projectId ? String(body.projectId) : null;
    }

    const contract = await prisma.contract.update({ where: { id }, data });
    return NextResponse.json({ ok: true, contract });
  } catch (error) {
    return fail(error);
  }
}
