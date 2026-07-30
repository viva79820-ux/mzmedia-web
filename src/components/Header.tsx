"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { nav } from "@/lib/site";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lectureOpen, setLectureOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
    setLectureOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-paper/85 backdrop-blur-md">
      <div className="site-shell flex h-[4.25rem] items-center justify-between gap-4">
        <Link href="/" className="relative z-10 flex items-center gap-2">
          <Image
            src="/brand/logo.svg"
            alt="MZ MEDIA"
            width={168}
            height={36}
            priority
          />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((item) =>
            "children" in item && item.children ? (
              <div key={item.href} className="relative group">
                <Link
                  href={item.href}
                  className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "text-accent"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
                <div className="invisible absolute left-0 top-full pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100">
                  <div className="min-w-[10.5rem] rounded-2xl border border-line bg-white p-2 shadow-[0_16px_40px_rgba(16,20,26,0.08)]">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`block rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-paper ${
                          isActive(child.href) ? "text-accent" : "text-ink-soft"
                        }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
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

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/quote"
            className="rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-soft"
          >
            견적 문의
          </Link>
        </div>

        <button
          type="button"
          className="relative z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white lg:hidden"
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
              "children" in item && item.children ? (
                <div key={item.href} className="flex flex-col">
                  <button
                    type="button"
                    className="flex items-center justify-between rounded-xl px-3 py-3 text-left text-base font-medium text-ink"
                    onClick={() => setLectureOpen((v) => !v)}
                  >
                    {item.label}
                    <span className="text-muted">{lectureOpen ? "−" : "+"}</span>
                  </button>
                  {lectureOpen &&
                    item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="rounded-xl px-5 py-2.5 text-sm text-ink-soft"
                      >
                        {child.label}
                      </Link>
                    ))}
                  <Link
                    href={item.href}
                    className="rounded-xl px-5 py-2.5 text-sm text-ink-soft"
                  >
                    강의 전체 보기
                  </Link>
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
            <Link
              href="/quote"
              className="mt-2 rounded-full bg-accent px-4 py-3 text-center text-sm font-semibold text-white"
            >
              견적 문의하기
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
