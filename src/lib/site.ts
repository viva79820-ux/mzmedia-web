export const site = {
  name: "MG MEDIA",
  nameKo: "엠지미디어",
  tagline: "Content Marketing Specialist",
  description:
    "엠지미디어는 기업의 온라인 홍보를 위해 콘텐츠를 기획하고 제작하는 콘텐츠 마케팅 전문기업입니다.",
  phone: "053-000-0000",
  email: "hello@mzmedia.co.kr",
  address: "대구광역시",
  kakao: "#",
} as const;

export const nav = [
  { href: "/", label: "홈" },
  { href: "/services", label: "서비스" },
  { href: "/about", label: "회사소개" },
  {
    href: "/lectures",
    label: "강의",
    children: [
      { href: "/lectures/online", label: "온라인 강의" },
      { href: "/lectures/offline", label: "오프라인 강의" },
    ],
  },
  { href: "/quote", label: "견적안내" },
] as const;
