import type { StaffRole } from "@/generated/prisma/client";

export function canAccessOffice(role: StaffRole) {
  return role === "SUPER_ADMIN";
}
