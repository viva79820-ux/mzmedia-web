import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

export type OfflineStudent = {
  no: number | string;
  name: string;
  phone: string;
  startDate: string;
  totalSessions: number | string;
  usedSessions: number | string;
  remainingSessions: number | string;
  endDate: string;
  sessionDates: string[];
};

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizePhone(value: string) {
  return String(value ?? "").replace(/\D/g, "");
}

function formatCellDate(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      const y = parsed.y;
      const m = String(parsed.m).padStart(2, "0");
      const d = String(parsed.d).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
    }).format(value);
  }

  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  return text;
}

function getExcelPath() {
  return path.join(process.cwd(), "data", "offline-schedule.xlsx");
}

export function loadOfflineStudents(): OfflineStudent[] {
  const filePath = getExcelPath();
  if (!fs.existsSync(filePath)) {
    throw new Error("offline-schedule.xlsx 파일을 찾을 수 없습니다.");
  }

  // 한글 경로 이슈를 피하기 위해 버퍼로 읽고, 빈 1행을 건너뜁니다.
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: true,
    range: 1,
  });

  return rows
    .map((row) => {
      const name = String(row["이름"] ?? "").trim();
      if (!name || name === "이름") return null;

      const sessionDates: string[] = [];
      for (let i = 1; i <= 10; i += 1) {
        const date = formatCellDate(row[String(i)]);
        if (date) sessionDates.push(date);
      }

      return {
        no: (row["No"] as number | string) ?? "",
        name,
        phone: String(row["전화번호"] ?? "").trim(),
        startDate: formatCellDate(row["수업 시작일"]),
        totalSessions: (row["총 회차"] as number | string) ?? "",
        usedSessions: (row["사용 회차"] as number | string) ?? "",
        remainingSessions: (row["잔여 회차"] as number | string) ?? "",
        endDate: formatCellDate(row["수업종료일"]),
        sessionDates,
      } satisfies OfflineStudent;
    })
    .filter((row): row is OfflineStudent => row !== null);
}

export function findOfflineStudent(name: string, phone: string) {
  const students = loadOfflineStudents();
  const targetName = normalizeName(name);
  const targetPhone = normalizePhone(phone);

  if (!targetName || !targetPhone) {
    return { status: "invalid" as const };
  }

  const nameMatches = students.filter(
    (student) => normalizeName(student.name) === targetName,
  );

  if (nameMatches.length === 0) {
    return { status: "not_found" as const };
  }

  const phoneMatches = nameMatches.filter((student) => {
    const stored = normalizePhone(student.phone);
    return stored !== "" && stored === targetPhone;
  });

  if (phoneMatches.length === 1) {
    return { status: "ok" as const, student: phoneMatches[0] };
  }

  if (phoneMatches.length > 1) {
    return { status: "ambiguous" as const };
  }

  // 엑셀에 전화번호가 비어 있는 수강생: 이름이 유일할 때만 조회 허용
  const emptyPhoneMatches = nameMatches.filter(
    (student) => normalizePhone(student.phone) === "",
  );

  if (emptyPhoneMatches.length === 1 && nameMatches.length === 1) {
    return { status: "ok" as const, student: emptyPhoneMatches[0] };
  }

  return { status: "not_found" as const };
}

export function maskPhone(phone: string) {
  const digits = normalizePhone(phone);
  if (!digits) return "미등록";
  if (digits.length < 7) return digits;
  return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
}
