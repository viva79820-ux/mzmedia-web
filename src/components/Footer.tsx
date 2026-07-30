import Image from "next/image";
import Link from "next/link";
import { nav, site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-line bg-ink text-white">
      <div className="site-shell grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Image
            src="/brand/logo.svg"
            alt="MZ MEDIA"
            width={168}
            height={36}
            className="brightness-0 invert"
          />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
            {site.tagline}
            <br />
            대구·경북 로컬 비즈니스의 마케팅을 설계하고 실행합니다.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-white/45 uppercase">
            Menu
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-white/80">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-white/45 uppercase">
            Contact
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-white/80">
            <li>{site.address}</li>
            <li>
              <a href={`mailto:${site.email}`} className="hover:text-white">
                {site.email}
              </a>
            </li>
            <li>
              <a href={`tel:${site.phone}`} className="hover:text-white">
                {site.phone}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="site-shell flex flex-col gap-2 py-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {site.nameKo}. All rights reserved.</p>
          <p>로컬에서 시작해, 검색과 SNS에서 성장합니다.</p>
        </div>
      </div>
    </footer>
  );
}
