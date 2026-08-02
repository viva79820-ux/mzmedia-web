import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { JOB_CATEGORIES, JOB_LOCATIONS } from "@/lib/job-categories";

export const runtime = "nodejs";

const VALID_TYPES = new Set(["REQUEST", "PROMOTE"]);
const VALID_CATEGORIES = new Set<string>(JOB_CATEGORIES);
const VALID_LOCATIONS = new Set<string>(JOB_LOCATIONS);

function parseType(value: string | null) {
  if (!value) return undefined;
  return VALID_TYPES.has(value) ? (value as "REQUEST" | "PROMOTE") : undefined;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = parseType(searchParams.get("type"));
    const category = searchParams.get("category")?.trim() || undefined;
    const location = searchParams.get("location")?.trim() || undefined;
    const q = searchParams.get("q")?.trim() || undefined;
    const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
    const take = 20;
    const skip = (page - 1) * take;

    const where: Prisma.PostWhereInput = {};
    if (type) where.type = type;
    if (category && VALID_CATEGORIES.has(category)) where.category = category;
    if (location && VALID_LOCATIONS.has(location)) where.location = location;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { content: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, posts] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        select: {
          id: true,
          type: true,
          category: true,
          title: true,
          budget: true,
          location: true,
          createdAt: true,
          views: true,
          author: { select: { name: true, username: true } },
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      total,
      page,
      pageSize: take,
      posts,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, message: "목록을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, message: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as {
      type?: string;
      category?: string;
      title?: string;
      content?: string;
      budget?: string;
      location?: string;
      contact?: string;
    };

    const type = parseType(body.type ?? null);
    const category = body.category?.trim() ?? "";
    const title = body.title?.trim() ?? "";
    const content = body.content?.trim() ?? "";
    const budget = body.budget?.trim() || null;
    const location = body.location?.trim() || null;
    const contact = body.contact?.trim() || null;

    if (!type) {
      return NextResponse.json(
        { ok: false, message: "공고 유형을 선택해 주세요." },
        { status: 400 },
      );
    }
    if (!VALID_CATEGORIES.has(category)) {
      return NextResponse.json(
        { ok: false, message: "카테고리를 선택해 주세요." },
        { status: 400 },
      );
    }
    if (title.length < 2 || title.length > 120) {
      return NextResponse.json(
        { ok: false, message: "제목은 2~120자로 입력해 주세요." },
        { status: 400 },
      );
    }
    if (content.length < 10 || content.length > 10000) {
      return NextResponse.json(
        { ok: false, message: "내용은 10자 이상 입력해 주세요." },
        { status: 400 },
      );
    }
    if (location && !VALID_LOCATIONS.has(location)) {
      return NextResponse.json(
        { ok: false, message: "지역을 확인해 주세요." },
        { status: 400 },
      );
    }

    const post = await prisma.post.create({
      data: {
        type,
        category,
        title,
        content,
        budget,
        location,
        contact,
        authorId: user.id,
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: post.id }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, message: "공고 등록에 실패했습니다." },
      { status: 500 },
    );
  }
}
