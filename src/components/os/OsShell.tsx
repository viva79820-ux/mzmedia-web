"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { STAFF_ROLE_LABEL } from "@/lib/os";
import type { StaffRole } from "@/generated/prisma/client";

type Props = {
  staff: {
    id: string;
    name: string;
    username: string;
    role: StaffRole;
  };
};

const navItems: {
  href: string;
  label: string;
  roles?: StaffRole[];
}[] = [
  { href: "/os/dashboard", label: "대시보드", roles: ["SUPER_ADMIN", "MANAGER", "ACCOUNTING"] },
  { href: "/os/tasks", label: "내 업무" },
  { href: "/os/leads", label: "영업" },
  { href: "/os/customers", label: "고객" },
  { href: "/os/projects", label: "프로젝트" },
  { href: "/os/recurring", label: "반복업무" },
  { href: "/os/finance/payments", label: "매출·입금", roles: ["SUPER_ADMIN", "MANAGER", "ACCOUNTING"] },
  { href: "/os/staff", label: "직원", roles: ["SUPER_ADMIN", "MANAGER"] },
  { href: "/os/legacy/orders", label: "레거시 오더" },
  { href: "/os/catalog", label: "상품 카탈로그" },
  { href: "/os/wages", label: "급여", roles: ["SUPER_ADMIN", "MANAGER", "ACCOUNTING"] },
];

export function OsShell({
  staff,
  children,
}: Props & { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const visible = navItems.filter(
    (item) => !item.roles || item.roles.includes(staff.role),
  );

  async function logout() {
    await fetch("/api/os/auth/logout", { method: "POST" });
    router.replace("/os/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-[#f4f6f9] text-ink">
      <aside className="hidden w-60 shrink-0 border-r border-line bg-white md:flex md:flex-col">
        <div className="border-b border-line px-4 py-4">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-muted uppercase">
            MZ MEDIA OS
          </p>
          <p className="mt-1 text-sm font-semibold text-ink">통합 운영관리</p>
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          {visible.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-sm ${
                  active
                    ? "bg-accent/10 font-semibold text-accent"
                    : "text-ink-soft hover:bg-paper"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-line p-3">
          <p className="text-sm font-medium text-ink">{staff.name}</p>
          <p className="text-xs text-muted">
            {STAFF_ROLE_LABEL[staff.role]} · @{staff.username}
          </p>
          <button
            type="button"
            onClick={logout}
            className="mt-2 text-xs font-semibold text-accent"
          >
            로그아웃
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line bg-white px-4 py-3 md:px-6">
          <div className="md:hidden">
            <p className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">
              MZ MEDIA OS
            </p>
          </div>
          <div className="flex flex-wrap gap-2 md:hidden">
            {visible.slice(0, 5).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-line px-2.5 py-1 text-xs"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <Link href="/" className="text-xs text-muted hover:text-ink">
            홈페이지 →
          </Link>
        </header>
        <main className="flex-1 px-4 py-5 md:px-6 md:py-6">{children}</main>
      </div>
    </div>
  );
}
