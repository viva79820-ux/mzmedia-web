import { NextResponse } from "next/server";
import {
  createAdminToken,
  getAdminPassword,
  setAdminCookie,
} from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { password?: string };
    const password = body.password ?? "";
    if (!password) {
      return NextResponse.json(
        { ok: false, message: "비밀번호를 입력해 주세요." },
        { status: 400 },
      );
    }

    if (password !== getAdminPassword()) {
      return NextResponse.json(
        { ok: false, message: "비밀번호가 올바르지 않습니다." },
        { status: 401 },
      );
    }

    const token = await createAdminToken();
    await setAdminCookie(token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, message: "로그인에 실패했습니다." },
      { status: 500 },
    );
  }
}
