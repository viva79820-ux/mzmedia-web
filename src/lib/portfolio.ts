export const webPortfolio = [
  {
    name: "KSERS 학회",
    work: "홈페이지 · 마이페이지",
    href: "https://ksers.kr/2027",
  },
  {
    name: "DAISO 학회",
    work: "홈페이지",
    href: "https://daiso.or.kr/",
  },
  {
    name: "사이결",
    work: "홈페이지 · 앱",
    href: "https://www.saigyul.com/",
  },
  {
    name: "쪽집게천사",
    work: "홈페이지",
    href: "https://jjokjipge-webapp.vercel.app/",
  },
  {
    name: "올보컬스튜디오",
    work: "랜딩페이지",
    href: "https://allvocalstudio.com/",
  },
  {
    name: "엠지미디어",
    work: "홈페이지",
    href: "https://www.mzmedia.co.kr/",
  },
] as const;

const portfolioQuestion =
  /포트폴리오|portfolio|레퍼런스|래퍼런스|references?|작업\s*(내역|이력|사례|물)|제작\s*(사례|물)|개발\s*사례|납품\s*(사례|내역)|샘플\s*(사이트|홈페이지)|(만든|제작한|개발한|작업한)\s*(사이트|홈페이지)/i;

export function isPortfolioQuestion(message: string) {
  return portfolioQuestion.test(message);
}

export function portfolioHost(href: string) {
  const url = new URL(href);
  const path = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");
  return `${url.host}${path}`;
}

export function portfolioAnswer(message: string) {
  if (!isPortfolioQuestion(message)) return null;
  const aboutMoney = /얼마|비용|가격|예산|할인|견적/.test(message);
  const lines = webPortfolio
    .map((item) => `· ${item.name} — ${item.work}\n${item.href}`)
    .join("\n");
  const markdown = [
    "엠지미디어가 제작한 홈페이지·앱 작업입니다. 이름이나 주소를 누르면 사이트로 이동합니다.",
    "",
    lines,
    ...(aboutMoney ? ["", "금액과 일정은 상담 후 확정입니다."] : []),
  ].join("\n");
  return {
    markdown,
    links: webPortfolio.map((item) => ({ href: item.href, label: item.name })),
    needsInquiry: aboutMoney,
    usedReply: false,
  };
}
