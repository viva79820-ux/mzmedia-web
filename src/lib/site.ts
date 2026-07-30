export const site = {
  name: "MZ MEDIA",
  nameKo: "엠지미디어",
  tagline: "MZ Generation's Marketing Zone",
  description:
    "대구·경북 로컬 마케팅 전문. 블로그, SNS, 유튜브로 브랜드가 실제로 움직이게 만듭니다.",
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
