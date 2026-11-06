import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { headers } from "next/headers";

export async function AppChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "";
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

  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
