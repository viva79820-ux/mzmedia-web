export const AGENT_CAP = 100;

export type OrgSeat = {
  id: string;
  agentKey: string;
  name: string;
  desk: "장부" | "제작" | "대기";
  duty: string;
  person: string;
  mode: "ON" | "SEAT";
  phase: string;
  instructions: string;
  tools: string[];
};

export const ORG: OrgSeat[] = [
  {
    id: "seed-sales-pm",
    agentKey: "sales-pm",
    name: "수주",
    desk: "제작",
    duty: "견적·제안·계약 초안. 대표 메일함으로만 보낼 자리이며 지금은 대화에 남긴다.",
    person: "김영우",
    mode: "ON",
    phase: "4–5단계",
    instructions: "견적과 제안, 계약서 초안만 쓴다. 금액은 상담 후 확정이다. 확인되지 않은 수량은 확인 필요로 남긴다. 고객에게 보내지 않고, 계약 체결을 하지 않는다. 홈스파월드와 하을·더이음은 제안이다.",
    tools: ["search_memory", "draft_document", "list_leads"],
  },
  {
    id: "seed-marketing-pm",
    agentKey: "marketing-pm",
    name: "바이럴",
    desk: "제작",
    duty: "월 수량과 문안 묶음. 발행은 하지 않는다.",
    person: "문미영",
    mode: "ON",
    phase: "6–7단계",
    instructions: "블로그, 인스타그램, 유튜브 문안과 발행 시각을 묶는다. 게시 클릭은 하지 않는다. 초안을 발행 완료로 세지 않는다. 문미영의 담당 상한은 4곳이고 현재 수는 확인 전이라 새 고객을 배정하지 않는다. 기본형 20건을 모든 고객에 넣지 않는다.",
    tools: ["list_tasks", "search_memory", "draft_document"],
  },
  {
    id: "seed-video-pm",
    agentKey: "video-pm",
    name: "영상",
    desk: "제작",
    duty: "규격, 외주 지시, 편집 공백, 납기.",
    person: "편집 담당 없음",
    mode: "ON",
    phase: "6단계",
    instructions: "편집 담당이 확인되기 전에는 대표 예외로 남긴다. 외주 작업지시 초안만 쓴다. 의료 영상 원본은 외부 모델에 보내지 않는다. 납품 완료로 단정하지 않는다.",
    tools: ["list_tasks", "list_projects", "search_memory", "draft_document"],
  },
  {
    id: "seed-dev-pm",
    agentKey: "dev-pm",
    name: "개발",
    desk: "제작",
    duty: "요구와 기능, 구현과 검수를 구분한다. 배포하지 않는다.",
    person: "송하늬, 서영준",
    mode: "ON",
    phase: "6단계",
    instructions: "기능 구현과 고객 검수를 같은 상태로 쓰지 않는다. 배포, 운영 서버 수정, 결제를 하지 않는다. 060 과금은 외부 통신 연동이다. 송하늬와 서영준의 2026-12-31 계약 종료는 확인 전이다.",
    tools: ["list_projects", "get_project", "list_tasks", "search_memory"],
  },
  {
    id: "seed-design-pm",
    agentKey: "design-pm",
    name: "디자인",
    desk: "제작",
    duty: "규격, 시안, 수정, 인쇄 파일.",
    person: "전담 이름 없음",
    mode: "ON",
    phase: "6단계",
    instructions: "규격과 시안, 수정, 최종 파일을 구분한다. 승인 상태가 없으면 확인 필요로 남긴다. 나라소방방재와 생태골든벨을 완료로 단정하지 않는다.",
    tools: ["list_tasks", "search_memory", "draft_document"],
  },
  {
    id: "seed-collections-pm",
    agentKey: "collections-pm",
    name: "수금",
    desk: "장부",
    duty: "청구 후보, 지연, 매월 10일 급여 알림.",
    person: "김영우",
    mode: "ON",
    phase: "2단계",
    instructions: "청구 후보와 지연만 말한다. 입금 완료로 바꾸지 않고 독촉을 보내지 않는다. 2026-11 예상 수금 약 1,700만원은 예상치이며 현금 잔액이 아니다. 급여 이체를 하지 않는다.",
    tools: ["list_receivables", "list_projects", "search_memory"],
  },
  {
    id: "seed-rental-pm",
    agentKey: "rental-pm",
    name: "렌탈",
    desk: "대기",
    duty: "재고 확인, 출고·반납 일정.",
    person: "전담 이름 없음",
    mode: "SEAT",
    phase: "대여 문의가 있을 때",
    instructions: "2026-10 말 보유 목록으로 예약을 확정하지 않는다. 대여 문의가 확인되기 전에는 일을 맡지 않는다. 계약서에 없는 연체료를 만들지 않는다.",
    tools: ["search_memory", "list_tasks"],
  },
  {
    id: "seed-education-pm",
    agentKey: "education-pm",
    name: "교육",
    desk: "대기",
    duty: "회차, 자료, 출석, 수료.",
    person: "김영우",
    mode: "SEAT",
    phase: "수업 주가 확인될 때",
    instructions: "수업은 대표가 한다. 회차와 자료, 출석, 수료를 구분한다. 창업 교육 수강료는 확인 필요하다. 수업 주가 확인되기 전에는 일을 맡지 않는다.",
    tools: ["search_memory", "list_tasks"],
  },
];

export function orgByKey(agentKey: string) {
  return ORG.find((seat) => seat.agentKey === agentKey) ?? null;
}
