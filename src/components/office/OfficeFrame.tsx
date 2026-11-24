"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const GROUPS = [
  { label: "업무", links: [{ href: "/os", label: "첫 화면" }, { href: "/office/chat", label: "엠지몬" }] },
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
  { label: "생산", links: [
    { href: "/os/calendar", label: "달력" },
    { href: "/os/inbox", label: "수신함" },
    { href: "/os/ask", label: "질문" },
    { href: "/os/drafts", label: "초안" },
    { href: "/os/chat", label: "대화" },
  ] },
];

export function OfficeFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/os/auth/logout", { method: "POST" });
    router.replace("/os/login?next=%2Foffice");
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
                    link.href === "/office/chat" || link.href === "/office/erp" || link.href === "/os"
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
