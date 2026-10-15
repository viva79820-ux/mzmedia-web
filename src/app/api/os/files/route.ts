import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

/** URL-based file registry (S3 upload can replace url later). */
export async function GET(request: Request) {
  try {
    await requireStaff();
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    const customerId = url.searchParams.get("customerId");
    const contractId = url.searchParams.get("contractId");
    const files = await prisma.fileAsset.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...(customerId ? { customerId } : {}),
        ...(contractId ? { contractId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { uploadedBy: true },
      take: 200,
    });
    return NextResponse.json({ files });
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
    const staff = await requireStaff();
    const body = (await request.json()) as Record<string, unknown>;
    const name = String(body.name ?? "").trim();
    const fileUrl = String(body.url ?? "").trim();
    if (!name || !fileUrl) {
      return NextResponse.json(
        { ok: false, message: "파일명과 URL은 필수입니다." },
        { status: 400 },
      );
    }
    const file = await prisma.fileAsset.create({
      data: {
        name,
        url: fileUrl,
        mimeType: String(body.mimeType ?? ""),
        size: Number(body.size ?? 0) || 0,
        customerId: body.customerId ? String(body.customerId) : null,
        leadId: body.leadId ? String(body.leadId) : null,
        projectId: body.projectId ? String(body.projectId) : null,
        quoteId: body.quoteId ? String(body.quoteId) : null,
        contractId: body.contractId ? String(body.contractId) : null,
        uploadedById: staff.id,
      },
    });
    return NextResponse.json({ ok: true, file });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireStaff();
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ ok: false }, { status: 400 });
    await prisma.fileAsset.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
