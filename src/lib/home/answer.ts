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
    body: "공개된 상품은 온라인마케팅, 영상·촬영, 홈페이지·IT, 디자인·인쇄, 장비 렌탈, 강의입니다. 온라인마케팅은 블로그, 인스타그램, 유튜브와 검색 광고 운영을 다룹니다. 금액과 월 수량은 상품 페이지의 참고 범위이고, 이 대화에서 확정하지 않습니다. 상담 후 확정입니다.",
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

function publicWords(answer: string) {
  return answer
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "")
    .replace(/01[016789]-?\d{3,4}-?\d{4}/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
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
