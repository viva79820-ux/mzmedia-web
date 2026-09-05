export const site = {
  name: "MZ MEDIA",
  nameKo: "엠지미디어",
  tagline: "MZ Generation's Marketing Zone",
  description:
    "엠지미디어는 기업의 온라인 홍보를 위해 콘텐츠를 기획하고 제작하는 콘텐츠 마케팅 전문기업입니다.",
  url: "https://www.mzmedia.co.kr",
  phone: "010-4788-2336",
  email: "mzm79820@gmail.com",
  address: "대구 중구 달구벌대로 1992-16, 2층",
  representative: "김영우",
  kakao: "#",
} as const;

export type NavChild = { href: string; label: string };
export type NavItem = {
  href: string;
  label: string;
  children?: readonly NavChild[];
};

export const nav: readonly NavItem[] = [
  { href: "/", label: "홈" },
  {
    href: "/about",
    label: "회사소개",
    children: [
      { href: "/about", label: "회사소개" },
      { href: "/guide", label: "이용방법" },
    ],
  },
  {
    href: "/services",
    label: "서비스",
    children: [
      { href: "/services", label: "전체 서비스" },
      { href: "/services/online-marketing", label: "온라인마케팅" },
      { href: "/services/video", label: "영상·촬영" },
      { href: "/services/web-it", label: "홈페이지·IT" },
      { href: "/services/design-print", label: "디자인·인쇄" },
    ],
  },
  { href: "/estimate", label: "빠른 견적" },
  { href: "/jobs", label: "작업의뢰정보" },
  {
    href: "/lectures",
    label: "강의",
    children: [
      { href: "/lectures/online", label: "온라인 강의" },
      { href: "/lectures/offline", label: "오프라인 강의" },
    ],
  },
  {
    href: "/admin",
    label: "관리자",
    children: [
      { href: "/admin/orders", label: "오더 관리" },
      { href: "/admin/products", label: "상품 관리" },
      { href: "/admin/inquiries", label: "견적 문의" },
      { href: "/admin/wages", label: "직원 급여 산정" },
    ],
  },
] as const;
