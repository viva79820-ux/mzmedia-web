import { NextResponse } from "next/server";
import { canAccessOffice } from "@/lib/office/access";
import { getSessionStaff } from "@/lib/staff-auth";
import { ensureOfficeSchema } from "@/lib/office/schema";

export async function guardOffice({ prepareSchema = true } = {}) {
  try {
    const staff = await getSessionStaff();
    if (!staff) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }
    if (!canAccessOffice(staff.role)) {
      return NextResponse.json({ error: "AI OFFICE 접근 권한이 없습니다." }, { status: 403 });
    }
    if (prepareSchema) await ensureOfficeSchema();
    return null;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "요청을 처리하지 못했습니다." }, { status: 500 });
  }
}
