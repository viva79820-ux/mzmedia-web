import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { ok: false, message: "직원 계정은 회사 관리자에게 발급을 요청해 주세요." },
    { status: 403 },
  );
}
