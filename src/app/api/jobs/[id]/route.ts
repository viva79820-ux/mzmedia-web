import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;

    const post = await prisma.$transaction(async (tx) => {
      const existing = await tx.post.findUnique({
        where: { id },
        include: {
          author: { select: { name: true, username: true } },
        },
      });
      if (!existing) return null;

      return tx.post.update({
        where: { id },
        data: { views: { increment: 1 } },
        include: {
          author: { select: { name: true, username: true } },
        },
      });
    });

    if (!post) {
      return NextResponse.json(
        { ok: false, message: "공고를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, post });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, message: "공고를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
