import { NextResponse } from "next/server";
import {
  createSessionToken,
  hashPassword,
  setSessionCookie,
} from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const USERNAME_RE = /^[a-zA-Z0-9_]{4,20}$/;
const PHONE_RE = /^[0-9\-+\s]{9,20}$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
      name?: string;
      phone?: string;
      email?: string;
      privacyAgreed?: boolean;
    };

    const username = body.username?.trim() ?? "";
    const password = body.password ?? "";
    const name = body.name?.trim() ?? "";
    const phone = body.phone?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const privacyAgreed = Boolean(body.privacyAgreed);

    if (!USERNAME_RE.test(username)) {
      return NextResponse.json(
        {
          ok: false,
          message: "아이디는 영문/숫자/밑줄 4~20자로 입력해 주세요.",
        },
        { status: 400 },
      );
    }

    if (password.length < 8 || password.length > 72) {
      return NextResponse.json(
        { ok: false, message: "비밀번호는 8자 이상 입력해 주세요." },
        { status: 400 },
      );
    }

    if (!name || name.length > 40) {
      return NextResponse.json(
        { ok: false, message: "성함을 입력해 주세요." },
        { status: 400 },
      );
    }

    if (!PHONE_RE.test(phone)) {
      return NextResponse.json(
        { ok: false, message: "전화번호를 확인해 주세요." },
        { status: 400 },
      );
    }

    if (!email || !email.includes("@") || email.length > 120) {
      return NextResponse.json(
        { ok: false, message: "이메일을 확인해 주세요." },
        { status: 400 },
      );
    }

    if (!privacyAgreed) {
      return NextResponse.json(
        {
          ok: false,
          message: "개인정보 수집·이용에 동의해 주세요.",
        },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json(
        { ok: false, message: "이미 사용 중인 아이디입니다." },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        name,
        phone,
        email,
        privacyAgreedAt: new Date(),
      },
      select: { id: true, username: true, name: true },
    });

    const token = await createSessionToken(user);
    await setSessionCookie(token);

    return NextResponse.json({ ok: true, user });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, message: "회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
