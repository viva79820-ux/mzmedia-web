import { NextResponse } from "next/server";
import {
  findOfflineStudent,
  maskPhone,
} from "@/lib/offline-students";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      phone?: string;
    };

    const name = body.name?.trim() ?? "";
    const phone = body.phone?.trim() ?? "";

    const result = findOfflineStudent(name, phone);

    if (result.status === "invalid") {
      return NextResponse.json(
        { ok: false, message: "성함과 전화번호를 모두 입력해 주세요." },
        { status: 400 },
      );
    }

    if (result.status === "ambiguous") {
      return NextResponse.json(
        {
          ok: false,
          message:
            "동일 정보가 여러 건입니다. 엠지미디어로 문의해 주세요.",
        },
        { status: 409 },
      );
    }

    if (result.status === "not_found") {
      return NextResponse.json(
        {
          ok: false,
          message:
            "일치하는 수강 정보를 찾지 못했습니다. 성함·번호를 다시 확인해 주세요.",
        },
        { status: 404 },
      );
    }

    const student = result.student;

    return NextResponse.json({
      ok: true,
      student: {
        name: student.name,
        phoneMasked: maskPhone(student.phone),
        startDate: student.startDate || "-",
        endDate: student.endDate || "-",
        totalSessions: student.totalSessions || "-",
        usedSessions: student.usedSessions || "-",
        remainingSessions: student.remainingSessions || "-",
        sessionDates: student.sessionDates,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        ok: false,
        message: "수강 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
      },
      { status: 500 },
    );
  }
}
