export type HomeLink = { href: string; label: string };

export type HomeReply = { question: string; answer: string };

export type HomeAnswer = {
  markdown: string;
  links: HomeLink[];
  needsInquiry: boolean;
  usedReply: boolean;
};

const passages: { keys: string[]; body: string; links: HomeLink[] }[] = [
  {
    keys: ["어떤 회사", "회사 소개", "회사야", "누구", "소개해", "무슨 회사"],
    body: "엠지미디어는 대구·경북의 로컬 브랜드를 위한 콘텐츠 마케팅 회사입니다. 블로그, 인스타그램, 유튜브로 브랜드가 움직이도록 기획과 제작과 운영을 한곳에서 이어갑니다. 전국 공통 문구보다 그 지역 고객이 쓰는 말을 기준으로 콘텐츠를 만듭니다.",
    links: [{ href: "/about", label: "회사소개" }],
  },
  {
    keys: ["상품", "서비스", "뭐가 있", "무엇을", "하는 일", "뭐 해"],
    body: "공개된 상품은 온라인마케팅, 영상촬영 · 편집, 홈페이지·IT, 디자인·인쇄, 유튜브 중계, 장비 렌탈, 강의입니다. 온라인마케팅은 블로그, 인스타그램, 유튜브와 검색 광고 운영을 다룹니다. 금액과 월 수량은 상품 페이지의 참고 범위이고, 이 대화에서 확정하지 않습니다. 상담 후 확정입니다.",
    links: [
      { href: "/services", label: "서비스" },
      { href: "/lectures", label: "강의" },
      { href: "/rental", label: "장비 렌탈" },
    ],
  },
  {
    keys: ["이용방법", "어떻게 문의", "진행 방법", "견적 내"],
    body: "서비스를 고르고 조건을 적은 뒤 빠른 견적이나 1:1 문의로 내용을 남기면 됩니다. 1:1 문의는 회원가입 후 마이페이지에서 접수와 답변을 확인합니다. 화면에 나오는 금액은 참고용이고, 최종 범위와 일정은 상담에서 맞춥니다. 이 화면에서 결제하지 않습니다.",
    links: [
      { href: "/guide", label: "이용방법" },
      { href: "/estimate", label: "빠른 견적" },
      { href: "/inquiries", label: "1:1 문의" },
    ],
  },
  {
    keys: ["렌탈", "노트북", "장비 빌"],
    body: "장비 렌탈은 대구를 중심으로 노트북, 음향, 촬영 장비를 짧게 빌려 주는 서비스입니다. 보유 수량과 대여 가능 여부는 목록만으로 확정하지 않고, 문의에서 확인합니다.",
    links: [{ href: "/rental", label: "장비 렌탈" }],
  },
  {
    keys: ["강의", "교육", "수강"],
    body: "강의는 블로그, 인스타그램, 유튜브 실습과 취업·창업 과정이 있습니다. 창업 교육 수강료는 이 대화에서 적지 않습니다. 회차와 수강료는 강의 안내와 상담에서 확인합니다.",
    links: [{ href: "/lectures", label: "강의" }],
  },
];

const industries = [
  ["뷰티", "미용", "샵", "헤어", "네일"],
  ["음식", "식당", "카페", "맛집"],
  ["학원", "교육"],
  ["병원", "의원", "치과"],
  ["인테리어", "공사"],
];

const channels = ["블로그", "인스타", "유튜브", "광고", "플레이스", "숏폼", "릴스"];

function specific(message: string) {
  return /추천|패키지|전략|예산|얼마|상세|우리 회사|우리 매장|어떻게 하면|어떤 광고/.test(message);
}

function sharesGroup(left: string, right: string, group: string[]) {
  return group.some((word) => left.includes(word)) && group.some((word) => right.includes(word));
}

export function replyFits(message: string, earlierQuestion: string) {
  if (industries.some((group) => sharesGroup(message, earlierQuestion, group))) return true;
  const sharedChannels = channels.filter((word) => message.includes(word) && earlierQuestion.includes(word));
  return sharedChannels.length >= 2;
}

const topics = ["블로그", "인스타", "유튜브", "광고", "홈페이지", "쇼핑몰", "앱", "영상", "촬영", "편집", "숏폼", "드론", "렌탈", "노트북", "디자인", "인쇄", "로고", "강의", "중계", "상세페이지", "명함", "카드뉴스"];

function hasIndustry(text: string) {
  return industries.some((group) => group.some((word) => text.includes(word)));
}

export function approvedAskFits(message: string, earlierQuestion: string) {
  const sameIndustry = industries.some((group) => sharesGroup(message, earlierQuestion, group));
  if (hasIndustry(earlierQuestion) && !sameIndustry) return false;
  const sharedTopic = topics.some((word) => message.includes(word) && earlierQuestion.includes(word));
  if (sharedTopic) return true;
  return !hasIndustry(earlierQuestion) && replyFits(message, earlierQuestion);
}

export function answerFromApproved(message: string, replies: HomeReply[]): HomeAnswer | null {
  const hit = replies.find((reply) => reply.answer.trim() && approvedAskFits(message, reply.question));
  const answer = hit ? publicWords(hit.answer) : "";
  if (!hit || !answer) return null;
  const aboutMoney = /얼마|비용|가격|예산|할인|견적|몇\s*건|수량/.test(message);
  return {
    markdown: aboutMoney || answer.includes("상담 후 확정")
      ? answer
      : `${answer}\n\n금액과 월 수량은 이 대화에서 확정하지 않습니다. 상담 후 확정입니다.`,
    links: linksForQuestion(message),
    needsInquiry: aboutMoney,
    usedReply: true,
  };
}

export function publicWords(answer: string) {
  return answer
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "")
    .replace(/01[016789]-?\d{3,4}-?\d{4}/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

export function fittingPublicReplies(message: string, replies: HomeReply[]) {
  return replies
    .filter((reply) => reply.answer.trim() && replyFits(message, reply.question))
    .map((reply) => publicWords(reply.answer))
    .filter(Boolean)
    .slice(0, 3);
}

const pricePattern = /\d[\d,]*\s*(원|만원|억)|월\s*\d{1,3}\s*(건|개|회|편|포스팅)|₩\s*\d/;
const privatePattern = /미수|계약서|급여|직원명단|문미영|송하늬|서영준/;
const moneyQuestion = /얼마|비용|가격|예산|할인|견적|몇\s*건|수량/;

export function linksForQuestion(message: string): HomeLink[] {
  const links: HomeLink[] = [];
  const add = (href: string, label: string) => {
    if (!links.some((link) => link.href === href)) links.push({ href, label });
  };
  if (/회사|엠지|누구|소개/.test(message)) add("/about", "회사소개");
  if (/강의|교육|수강/.test(message)) add("/lectures", "강의");
  if (/렌탈|노트북|음향/.test(message)) add("/rental", "장비 렌탈");
  if (/중계/.test(message)) add("/services/youtube-live", "유튜브 중계");
  if (/홈페이지|쇼핑몰|앱|랜딩|예약 시스템|유지관리/.test(message)) add("/services/web-it", "홈페이지·IT");
  if (/영상|촬영|편집|드론|숏폼|홍보영상|인터뷰/.test(message)) add("/services/video", "영상촬영 · 편집");
  if (/디자인|인쇄|명함|로고|상세페이지|전단지|배너|카드뉴스/.test(message)) add("/services/design-print", "디자인·인쇄");
  if (/블로그|인스타|광고|마케팅|유튜브|파워링크|릴스/.test(message)) add("/services/online-marketing", "온라인마케팅");
  if (/견적|비용|가격|얼마/.test(message)) add("/estimate", "빠른 견적");
  if (links.length === 0) add("/services", "서비스");
  return links.slice(0, 3);
}

export function acceptModelDraft(value: unknown, message: string): Pick<HomeAnswer, "markdown" | "needsInquiry"> | null {
  if (!value || typeof value !== "object") return null;
  const row = value as { markdown?: unknown; needsInquiry?: unknown };
  if (typeof row.markdown !== "string") return null;
  const cleaned = publicWords(row.markdown)
    .split(/\n+|(?<=다\.|요\.|니다\.|까\?|죠\.)\s*/)
    .map((part) => part.trim())
    .filter((part) => part && !pricePattern.test(part) && !privatePattern.test(part))
    .join(" ")
    .trim();
  if (cleaned.length < 10 || cleaned.length > 1800) return null;
  const aboutMoney = moneyQuestion.test(message);
  const needsInquiry = row.needsInquiry === true || aboutMoney;
  const markdown = aboutMoney && !cleaned.includes("상담 후 확정")
    ? `${cleaned}\n\n금액, 월 수량, 일정은 상담 후 확정입니다.`
    : cleaned;
  return { markdown, needsInquiry };
}

export function answerHome(message: string, replies: HomeReply[]): HomeAnswer {
  const text = message.trim();
  const fitted = replies.find((reply) => reply.answer.trim() && replyFits(text, reply.question));
  if (fitted) {
    const answer = publicWords(fitted.answer);
    if (answer) {
      return {
        markdown: `${answer}\n\n금액과 월 수량은 이 대화에서 확정하지 않습니다. 상담 후 확정입니다.`,
        links: [{ href: "/estimate", label: "빠른 견적" }],
        needsInquiry: false,
        usedReply: true,
      };
    }
  }

  const passage = passages.find((item) => item.keys.some((key) => text.includes(key)));
  if (passage && !specific(text)) {
    return { markdown: passage.body, links: passage.links, needsInquiry: false, usedReply: false };
  }

  const hint = passage
    ? `${passage.body}\n\n`
    : "온라인마케팅은 블로그, 인스타그램, 유튜브와 검색 광고를 다룹니다. ";
  return {
    markdown: `${hint}이 문의는 업종과 범위가 구체적이라 공개된 안내만으로 확정할 수 없습니다. 1:1 문의는 회원가입 후 남길 수 있고, 대표 답변은 마이페이지에서 확인합니다.`,
    links: passage?.links ?? [{ href: "/services", label: "서비스" }],
    needsInquiry: true,
    usedReply: false,
  };
}
