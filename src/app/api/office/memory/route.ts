import { NextResponse } from "next/server";
import { memories, remember } from "@/lib/office/engine";
import { guardOffice } from "@/lib/office/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await guardOffice();
  if (denied) return denied;
  const url = new URL(request.url);
  return NextResponse.json({ items: await memories(url.searchParams.get("q") ?? "", url.searchParams.get("kind") ?? "") });
}

export async function POST(request: Request) {
  const denied = await guardOffice();
  if (denied) return denied;
  const body = (await request.json().catch(() => null)) as { kind?: string; title?: string; content?: string } | null;
  if (body?.kind !== "feedback" && body?.kind !== "rule") {
    return NextResponse.json({ error: "규칙 또는 피드백만 추가할 수 있습니다." }, { status: 400 });
  }
  try {
    await remember({ kind: body.kind, title: body.title ?? "", content: body.content ?? "" });
    return NextResponse.json({ items: await memories("", "") });
  } catch (error) {
    const message = error instanceof Error ? error.message : "저장하지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
