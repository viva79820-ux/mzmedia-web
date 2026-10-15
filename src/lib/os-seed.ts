import { prisma } from "@/lib/db";
import { hashStaffPassword } from "@/lib/staff-auth";

/** Ensure a SUPER_ADMIN exists (from env) so OS can be bootstrapped. */
export async function ensureSuperAdminSeeded() {
  const count = await prisma.staff.count({
    where: { role: "SUPER_ADMIN", active: true },
  });
  if (count > 0) return { seeded: false };

  const username =
    process.env.OS_ADMIN_USERNAME?.trim() ||
    process.env.ADMIN_USERNAME?.trim() ||
    "admin";
  const password =
    process.env.OS_ADMIN_PASSWORD?.trim() ||
    process.env.ADMIN_PASSWORD?.trim() ||
    "";

  if (!password || password.length < 4) {
    throw new Error(
      "OS bootstrap requires OS_ADMIN_PASSWORD or ADMIN_PASSWORD (min 4 chars)",
    );
  }

  await prisma.staff.create({
    data: {
      username,
      passwordHash: await hashStaffPassword(password),
      name: "대표",
      email: process.env.OS_ADMIN_EMAIL?.trim() || "",
      role: "SUPER_ADMIN",
      active: true,
      department: "경영",
    },
  });

  const goal = await prisma.osSetting.findUnique({
    where: { key: "monthly_revenue_goal" },
  });
  if (!goal) {
    await prisma.osSetting.create({
      data: { key: "monthly_revenue_goal", value: "30000000" },
    });
  }

  return { seeded: true };
}
