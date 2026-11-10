"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export function AppChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isOs = pathname === "/os" || pathname.startsWith("/os/");
  const isOffice = pathname === "/office" || pathname.startsWith("/office/");
  const isHome = pathname === "/";

  if (isOs || isOffice) {
    return <>{children}</>;
  }

  if (isHome) {
    return (
      <div className="flex h-dvh flex-col overflow-hidden bg-paper">
        <Header />
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    );
  }

  if (pathname === "/explore") {
    return (
      <div className="flex h-dvh flex-col overflow-hidden bg-paper">
        <Header />
        <div className="explore-scroll min-h-0 flex-1 overflow-y-scroll">
          <main>{children}</main>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
