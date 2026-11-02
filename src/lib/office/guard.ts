import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function guardOffice() {
  try {
    await requireAdmin();
    return null;
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "요청을 처리하지 못했습니다." }, { status: 500 });
  }
}
