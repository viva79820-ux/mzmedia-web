import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { shareDriveFile, uploadDriveText } from "@/lib/drive";
import { requireStaffRole } from "@/lib/staff-auth";
import { draftBody } from "@/lib/work-ask";

export const runtime = "nodejs";

const KINDS = new Set(["제안서", "계약서", "기획서"]);

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

async function recordsFor(customerName: string) {
  const [inbox, slots] = await Promise.all([
    prisma.inboxItem.findMany({ where: { customerName, kind: "업무" }, take: 30 }),
    prisma.workSlot.findMany({
      where: { customerName },
      include: { assignee: { select: { name: true } } },
      take: 30,
    }),
  ]);
  return [
    ...inbox.map(
      (item) =>
        `업무 ${item.title} 수량 ${item.quantity}건 내용 ${item.detail} 완료 기준 ${item.doneCriteria} 해당 월 ${item.month}`,
    ),
    ...slots.map((slot) => `달력 ${slot.date} ${slot.title} 담당 ${slot.assignee.name}`),
  ];
}

export async function GET() {
  try {
    await requireStaffRole("SUPER_ADMIN", "MANAGER");
    const drafts = await prisma.officeDraft.findMany({
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        customerName: true,
        kind: true,
        title: true,
        body: true,
        driveUrl: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({ drafts });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const staff = await requireStaffRole("SUPER_ADMIN", "MANAGER");
    const body = (await request.json()) as {
      customerName?: string;
      kind?: string;
      folderUrl?: string;
    };
    const customerName = String(body.customerName ?? "").trim();
    const kind = String(body.kind ?? "");
    const folderUrl = String(body.folderUrl ?? "").trim();
    if (!customerName || !KINDS.has(kind) || !folderUrl) {
      return NextResponse.json(
        { ok: false, error: "고객사, 문서 종류, 드라이브 폴더 주소가 필요합니다." },
        { status: 400 },
      );
    }
    const records = await recordsFor(customerName);
    const text = draftBody({ customerName, kind, records });
    const uploaded = await uploadDriveText({ folderUrl, name: `${customerName} ${kind}`, body: text });
    if (uploaded.ok && staff.username.endsWith("@mzmedia.co.kr")) {
      await shareDriveFile(uploaded.id, staff.username);
    }
    const draft = await prisma.$transaction(async (tx) => {
      await tx.customerFolder.upsert({
        where: { customerName },
        update: { folderUrl },
        create: { customerName, folderUrl },
      });
      return tx.officeDraft.create({
        data: {
          customerName,
          kind,
          title: `${customerName} ${kind}`,
          body: text,
          driveFileId: uploaded.ok ? uploaded.id : "",
          driveUrl: uploaded.ok ? uploaded.url : "",
          createdById: staff.id,
        },
      });
    });
    return NextResponse.json({
      ok: true,
      draft: {
        id: draft.id,
        customerName: draft.customerName,
        kind: draft.kind,
        title: draft.title,
        body: draft.body,
        driveUrl: draft.driveUrl,
      },
      driveError: uploaded.ok ? "" : uploaded.error,
    });
  } catch (error) {
    return fail(error);
  }
}
