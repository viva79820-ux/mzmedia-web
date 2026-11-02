"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/office", label: "대시보드" },
  { href: "/office/agent", label: "마스터 에이전트" },
  { href: "/office/memory", label: "기억 관리" },
  { href: "/office/improve", label: "자기개선" },
];

export function OfficeFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin");
    router.refresh();
  }

  return (
    <div className="office-app">
      <div className="shell">
        <aside className="side">
          <div className="brand">
            <small>MZ MEDIA</small>
            <strong>AI Office</strong>
          </div>
          <nav className="nav">
            {LINKS.map((link) => {
              const active = link.href === "/office" ? pathname === "/office" : pathname.startsWith(link.href);
              return (
                <Link key={link.href} href={link.href} className={active ? "active" : ""}>
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <Link className="ghost" href="/admin/orders">
            관리자 화면
          </Link>
          <button className="ghost" type="button" onClick={() => logout().catch(() => undefined)}>
            로그아웃
          </button>
        </aside>
        <section className="main">{children}</section>
      </div>
    </div>
  );
}
