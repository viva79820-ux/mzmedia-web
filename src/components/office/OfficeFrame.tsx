"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/office", label: "엠지몬" },
  { href: "/office/backend", label: "백엔드" },
  { href: "/office/inquiries", label: "1:1 문의" },
  { href: "/office/asks", label: "AI에게 물어보기" },
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
            <img className="agent-face" src="/office/agent.png" alt="엠지 에이전트" />
            <small>MZ MEDIA</small>
            <strong>엠지몬</strong>
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
          <button className="ghost" type="button" onClick={() => logout().catch(() => undefined)}>
            로그아웃
          </button>
        </aside>
        <section className="main">{children}</section>
      </div>
    </div>
  );
}
