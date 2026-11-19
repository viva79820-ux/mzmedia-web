import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { uploadDriveText } from "@/lib/drive";
import { requireStaffRole } from "@/lib/staff-auth";
import { moneyFilled } from "@/lib/work-ask";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

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

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireStaffRole("SUPER_ADMIN", "MANAGER");
    const { id } = await params;
    const body = (await request.json()) as { body?: string };
    const text = String(body.body ?? "");
    if (!text.trim()) return NextResponse.json({ ok: false, error: "초안 문장이 필요합니다." }, { status: 400 });
    if (moneyFilled(text)) {
      return NextResponse.json({ ok: false, error: "금액 란은 저장되지 않습니다." }, { status: 400 });
    }
    const current = await prisma.officeDraft.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ ok: false }, { status: 404 });
    let driveUrl = current.driveUrl;
    if (current.driveFileId) {
      const folder = await prisma.customerFolder.findUnique({ where: { customerName: current.customerName } });
      const uploaded = await uploadDriveText({
        folderUrl: folder?.folderUrl || current.driveUrl,
        name: current.title,
        body: text,
        fileId: current.driveFileId,
      });
      if (uploaded.ok) driveUrl = uploaded.url;
    }
    const updated = await prisma.officeDraft.update({
      where: { id },
      data: { body: text, driveUrl },
    });
    return NextResponse.json({ ok: true, draft: { id: updated.id, body: updated.body, driveUrl: updated.driveUrl } });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(_request: Request, { params }: Params) {
  try {
    await requireStaffRole("SUPER_ADMIN", "MANAGER");
    const { id } = await params;
    const current = await prisma.officeDraft.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ ok: false }, { status: 404 });
    const folder = await prisma.customerFolder.findUnique({ where: { customerName: current.customerName } });
    if (!folder) return NextResponse.json({ ok: false, error: "고객사 드라이브 폴더가 없습니다." }, { status: 400 });
    const uploaded = await uploadDriveText({
      folderUrl: folder.folderUrl,
      name: current.title,
      body: current.body,
      fileId: current.driveFileId || undefined,
    });
    if (!uploaded.ok) return NextResponse.json({ ok: false, error: uploaded.error }, { status: 502 });
    const updated = await prisma.officeDraft.update({
      where: { id },
      data: { driveFileId: uploaded.id, driveUrl: uploaded.url },
    });
    return NextResponse.json({ ok: true, driveUrl: updated.driveUrl });
  } catch (error) {
    return fail(error);
  }
}
