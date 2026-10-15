import type { StaffRole } from "@/generated/prisma/client";
import type { SessionStaff } from "@/lib/staff-auth";

export const STAFF_ROLE_LABEL: Record<StaffRole, string> = {
  SUPER_ADMIN: "대표",
  MANAGER: "매니저",
  EMPLOYEE: "직원",
  FREELANCER: "외주",
  ACCOUNTING: "회계",
};

export function isManagerPlus(role: StaffRole) {
  return role === "SUPER_ADMIN" || role === "MANAGER";
}

export function canSeeAllRecords(staff: SessionStaff) {
  return isManagerPlus(staff.role);
}

export function canManageStaff(staff: SessionStaff) {
  return staff.role === "SUPER_ADMIN" || staff.role === "MANAGER";
}

export function canManageFinance(staff: SessionStaff) {
  return (
    staff.role === "SUPER_ADMIN" ||
    staff.role === "MANAGER" ||
    staff.role === "ACCOUNTING"
  );
}

export const LEAD_STAGE_LABEL = {
  LEAD: "잠재고객",
  CONTACT: "접촉",
  CONSULT: "상담",
  QUOTE: "견적",
  NEGOTIATE: "계약협의",
  WON: "계약완료",
  LOST: "실패",
  ON_HOLD: "보류",
} as const;

export const LEAD_SOURCE_LABEL = {
  NAVER: "네이버",
  GOOGLE: "구글",
  WEBSITE: "홈페이지",
  REFERRAL: "소개",
  NAVER_CAFE: "네이버카페",
  NARAJANGTER: "나라장터",
  WISHKET: "위시캣",
  KMONG: "크몽",
  OPENCHAT: "오픈채팅",
  DIRECT: "직접영업",
  OTHER: "기타",
} as const;

export const PROJECT_STATUS_LABEL = {
  CONTRACTED: "계약완료",
  PREP: "준비",
  IN_PROGRESS: "진행중",
  REVIEW: "검수",
  REVISION: "수정",
  DELIVERED: "납품완료",
  CLOSED: "종료",
} as const;

export const TASK_STATUS_LABEL = {
  TODO: "대기",
  IN_PROGRESS: "진행중",
  REVIEW: "검수",
  DONE: "완료",
  HOLD: "보류",
} as const;

export const TASK_PRIORITY_LABEL = {
  LOW: "낮음",
  MEDIUM: "보통",
  HIGH: "높음",
  URGENT: "긴급",
} as const;

export const PAYMENT_STATUS_LABEL = {
  PLANNED: "예정",
  PAID: "입금완료",
  OVERDUE: "미수",
  CANCELLED: "취소",
} as const;

export const PAYMENT_KIND_LABEL = {
  DEPOSIT: "계약금",
  MILESTONE: "중도금",
  FINAL: "잔금",
  OTHER: "기타",
} as const;

export const CADENCE_LABEL = {
  DAILY: "매일",
  WEEKLY: "매주",
  MONTHLY: "매월",
} as const;

export function formatWon(amount: number | null | undefined) {
  if (amount === null || amount === undefined) return "-";
  return `${amount.toLocaleString("ko-KR")}원`;
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function monthPrefix(d = new Date()) {
  return d.toISOString().slice(0, 7);
}

export function periodKeyForCadence(
  cadence: "DAILY" | "WEEKLY" | "MONTHLY",
  date = new Date(),
) {
  if (cadence === "DAILY") return date.toISOString().slice(0, 10);
  if (cadence === "MONTHLY") return date.toISOString().slice(0, 7);
  const tmp = new Date(date);
  const day = tmp.getDay();
  const diff = tmp.getDate() - day + (day === 0 ? -6 : 1);
  tmp.setDate(diff);
  return `W-${tmp.toISOString().slice(0, 10)}`;
}
