"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const GROUPS = [
  { label: "엠지몬", links: [{ href: "/office", label: "대화" }] },
  {
    label: "장부",
    links: [
      { href: "/office/erp", label: "대시보드" },
      { href: "/office/erp/payments", label: "수금·미수" },
      { href: "/office/erp/costs", label: "지출" },
    ],
  },
  {
    label: "고객",
    links: [
      { href: "/office/inquiries", label: "1:1 문의" },
      { href: "/office/asks", label: "AI에게 물어보기" },
    ],
  },
  { label: "조직", links: [{ href: "/office/backend", label: "담당" }] },
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
            {GROUPS.map((group) => (
              <div key={group.label} className="nav-group">
                <div className="nav-label">{group.label}</div>
                {group.links.map((link) => {
                  const active =
                    link.href === "/office" || link.href === "/office/erp"
                      ? pathname === link.href
                      : pathname.startsWith(link.href);
                  return (
                    <Link key={link.href} href={link.href} className={active ? "active" : ""}>
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            ))}
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
