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
  rentalShopUrl:
    "https://mgmedia-notebook-rental-production.up.railway.app/shop/",
} as const;

export type NavChild = { href: string; label: string };
export type NavItem = {
  href: string;
  label: string;
  children?: readonly NavChild[];
};

export const serviceLinks: readonly NavChild[] = [
  { href: "/services/online-marketing", label: "온라인마케팅" },
  { href: "/services/video", label: "영상촬영 · 편집" },
  { href: "/services/web-it", label: "홈페이지·IT" },
  { href: "/services/design-print", label: "디자인·인쇄" },
  { href: "/services/youtube-live", label: "유튜브 중계" },
  { href: "/rental", label: "장비 렌탈" },
];

export const lectureLinks: readonly NavChild[] = [
  { href: "/lectures/online", label: "온라인 강의" },
  { href: "/lectures/offline", label: "오프라인 강의" },
];

export const exploreLinks: readonly NavChild[] = [
  { href: "/about", label: "회사소개" },
  { href: "/guide", label: "이용방법" },
  { href: "/estimate", label: "빠른 견적" },
  { href: "/inquiries", label: "1:1 문의" },
];

export const nav: readonly NavItem[] = [
  { href: "/", label: "AI에게 물어보기" },
  { href: "/explore", label: "자세히 알아보기" },
] as const;
