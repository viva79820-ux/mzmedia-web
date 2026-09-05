"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { nav, type NavChild, type NavItem } from "@/lib/site";

type Me = { id: string; username: string; name: string } | null;

function hasChildren(
  item: NavItem,
): item is NavItem & { children: readonly NavChild[] } {
  return Array.isArray(item.children) && item.children.length > 0;
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [me, setMe] = useState<Me>(null);

  useEffect(() => {
    setOpen(false);
    setOpenGroup(null);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data: { user?: Me }) => {
        if (!cancelled) setMe(data.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setMe(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe(null);
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-paper/85 backdrop-blur-md">
      <div className="site-shell flex h-[4.25rem] items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/brand/logo.png"
            alt="MZ MEDIA 엠지미디어"
            width={56}
            height={56}
            priority
            className="h-14 w-14 object-contain"
          />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((item) =>
            hasChildren(item) ? (
              <DesktopNavMenu
                key={item.href}
                item={item}
                pathname={pathname}
                active={isActive(item.href)}
              />
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "text-accent"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {me ? (
            <>
              <span className="max-w-[7rem] truncate text-sm text-muted">
                {me.name}
              </span>
              <Link
                href="/jobs/new"
                className="rounded-full border border-line bg-white px-3.5 py-2 text-sm font-semibold text-ink transition hover:border-ink/30"
              >
                공고 등록
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full px-3.5 py-2 text-sm font-medium text-ink-soft hover:text-ink"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-full px-3.5 py-2 text-sm font-medium text-ink-soft hover:text-ink"
              >
                로그인
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-full border border-line bg-white px-3.5 py-2 text-sm font-semibold text-ink"
              >
                회원가입
              </Link>
            </>
          )}
          <Link
            href="/estimate"
            className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-deep hover:text-white"
          >
            빠른 견적
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white lg:hidden"
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">메뉴</span>
          <span className="flex w-5 flex-col gap-1.5">
            <span
              className={`h-0.5 w-full bg-ink transition ${open ? "translate-y-2 rotate-45" : ""}`}
            />
            <span
              className={`h-0.5 w-full bg-ink transition ${open ? "opacity-0" : ""}`}
            />
            <span
              className={`h-0.5 w-full bg-ink transition ${open ? "-translate-y-2 -rotate-45" : ""}`}
            />
          </span>
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-white lg:hidden">
          <div className="site-shell flex flex-col gap-1 py-4">
            {nav.map((item) =>
              hasChildren(item) ? (
                <div key={item.href} className="flex flex-col">
                  <p className="rounded-xl px-3 py-3 text-base font-medium text-ink">
                    {item.label}
                  </p>
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="rounded-xl px-5 py-2.5 text-sm text-ink-soft"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-3 py-3 text-base font-medium ${
                    isActive(item.href) ? "text-accent" : "text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              ),
            )}
            <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
              {me ? (
                <>
                  <Link
                    href="/jobs/new"
                    className="rounded-full bg-accent px-4 py-3 text-center text-sm font-semibold text-white"
                  >
                    공고 등록
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-full border border-line px-4 py-3 text-sm font-semibold text-ink"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="rounded-full border border-line px-4 py-3 text-center text-sm font-semibold text-ink"
                  >
                    로그인
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="rounded-full bg-accent px-4 py-3 text-center text-sm font-semibold text-white"
                  >
                    회원가입
                  </Link>
                </>
              )}
              <Link
                href="/estimate"
                className="rounded-full bg-accent px-4 py-3 text-center text-sm font-semibold text-white hover:bg-accent-deep hover:text-white"
              >
                빠른 견적받기
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function DesktopNavMenu({
  item,
  pathname,
  active,
}: {
  item: NavItem & { children: readonly NavChild[] };
  pathname: string;
  active: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const closeTimer = useRef<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  function place() {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = 200;
    const left = Math.min(
      Math.max(8, r.right - width),
      window.innerWidth - width - 8,
    );
    setBox({ top: r.bottom + 6, left });
  }

  function show() {
    window.clearTimeout(closeTimer.current);
    place();
    setOpen(true);
  }

  function hide() {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 180);
  }

  useEffect(() => {
    if (!open) return;
    function onScroll() {
      setOpen(false);
    }
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  useEffect(() => {
    return () => window.clearTimeout(closeTimer.current);
  }, []);

  const menu =
    mounted && open
      ? createPortal(
          <div
            role="menu"
            onMouseEnter={show}
            onMouseLeave={hide}
            onPointerEnter={show}
            onPointerLeave={hide}
            style={{
              position: "fixed",
              top: box.top,
              left: box.left,
              zIndex: 9999,
              width: 200,
            }}
            className="rounded-2xl border border-line bg-white p-2 shadow-[0_16px_40px_rgba(16,20,26,0.12)]"
          >
            {item.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                role="menuitem"
                className={`block rounded-xl px-3 py-2.5 text-sm whitespace-nowrap transition-colors hover:bg-paper ${
                  pathname === child.href ||
                  pathname.startsWith(`${child.href}/`)
                    ? "text-accent"
                    : "text-ink-soft"
                }`}
              >
                {child.label}
              </Link>
            ))}
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={show}
      onMouseLeave={hide}
      onPointerEnter={show}
      onPointerLeave={hide}
    >
      <Link
        href={item.href}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
          active ? "text-accent" : "text-ink-soft hover:text-ink"
        }`}
        onClick={(e) => {
          if (item.href === "/admin") {
            e.preventDefault();
            if (open) hide();
            else show();
          }
        }}
      >
        {item.label}
        <span className="text-[10px] leading-none text-muted" aria-hidden>
          ▾
        </span>
      </Link>
      {menu}
    </div>
  );
}
