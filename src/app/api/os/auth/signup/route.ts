import { NextResponse } from "next/server";
import { parseCompanyEmail } from "@/lib/company-mail";
import { isOwnerAccount } from "@/lib/owner";
import { prisma } from "@/lib/db";
import {
  createStaffToken,
  hashStaffPassword,
  setStaffCookie,
} from "@/lib/staff-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      username?: string;
      password?: string;
    };
    const name = body.name?.trim() ?? "";
    const password = body.password ?? "";
    const claimed = parseCompanyEmail(body.username ?? "");
    if (!claimed.ok || !name || password.length < 4) {
      return NextResponse.json(
        {
          ok: false,
          message: claimed.ok
            ? "이름과 비밀번호(4자 이상)를 입력해 주세요."
            : claimed.error,
        },
        { status: 400 },
      );
    }
    const taken = await prisma.staff.findFirst({
      where: { OR: [{ email: claimed.email }, { username: claimed.email }] },
      select: { id: true },
    });
    if (taken) {
      return NextResponse.json(
        { ok: false, message: "이미 쓰는 회사 메일입니다." },
        { status: 409 },
      );
    }
    const staff = await prisma.staff.create({
      data: {
        username: claimed.email,
        email: claimed.email,
        name,
        passwordHash: await hashStaffPassword(password),
        role: isOwnerAccount(claimed.email) ? "SUPER_ADMIN" : "EMPLOYEE",
        active: true,
      },
      select: { id: true, username: true, name: true, role: true },
    });
    const token = await createStaffToken(staff);
    await setStaffCookie(token);
    return NextResponse.json({ ok: true, staff });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, message: "회원가입 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
