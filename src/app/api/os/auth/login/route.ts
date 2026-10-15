import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureSuperAdminSeeded } from "@/lib/os-seed";
import {
  createStaffToken,
  setStaffCookie,
  verifyStaffPassword,
} from "@/lib/staff-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await ensureSuperAdminSeeded();
    const body = (await request.json()) as {
      username?: string;
      password?: string;
    };
    const username = body.username?.trim() ?? "";
    const password = body.password ?? "";
    if (!username || !password) {
      return NextResponse.json(
        { ok: false, message: "아이디와 비밀번호를 입력해 주세요." },
        { status: 400 },
      );
    }

    const staff = await prisma.staff.findUnique({ where: { username } });
    if (!staff || !staff.active) {
      return NextResponse.json(
        { ok: false, message: "계정을 확인할 수 없습니다." },
        { status: 401 },
      );
    }

    const ok = await verifyStaffPassword(password, staff.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { ok: false, message: "아이디 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 },
      );
    }

    const token = await createStaffToken({
      id: staff.id,
      username: staff.username,
      name: staff.name,
      role: staff.role,
    });
    await setStaffCookie(token);

    return NextResponse.json({
      ok: true,
      staff: {
        id: staff.id,
        username: staff.username,
        name: staff.name,
        role: staff.role,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "로그인 처리 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
