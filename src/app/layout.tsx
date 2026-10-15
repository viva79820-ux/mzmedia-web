import type { Metadata } from "next";
import { Noto_Sans_KR, Syne } from "next/font/google";
import { AppChrome } from "@/components/AppChrome";
import { site } from "@/lib/site";
import "./globals.css";

const body = Noto_Sans_KR({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const display = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: `${site.nameKo} | ${site.name}`,
    template: `%s | ${site.nameKo}`,
  },
  description: site.description,
  metadataBase: new URL(site.url),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${site.nameKo} | ${site.name}`,
    description: site.description,
    url: site.url,
    siteName: site.nameKo,
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${body.variable} ${display.variable} h-full`}>
      <body className="min-h-full antialiased">
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
