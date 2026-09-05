"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const items = [
  { href: "/admin/orders", label: "오더 관리" },
  { href: "/admin/products", label: "상품 관리" },
  { href: "/admin/inquiries", label: "견적 문의" },
  { href: "/admin/wages", label: "직원 급여 산정" },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <nav className="flex flex-wrap gap-1 rounded-full border border-line bg-white p-1">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-teal text-white"
                  : "text-ink-soft hover:bg-paper hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={() => logout().catch(() => undefined)}
        className="h-10 rounded-full border border-line px-4 text-sm font-semibold text-ink-soft"
      >
        관리자 로그아웃
      </button>
    </div>
  );
}
