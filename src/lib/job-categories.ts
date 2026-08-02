export const JOB_CATEGORIES = [
  "영상 편집/제작 의뢰",
  "디자인 의뢰",
  "웹 개발 의뢰",
  "게임/앱 관련 의뢰",
  "일러스트/원화 의뢰",
  "웹툰 의뢰",
  "웹/앱디자인 의뢰",
  "CG/모션그래픽 의뢰",
  "애니메이션 의뢰",
  "마케팅/광고/영화의뢰",
  "건축/인테리어 의뢰",
  "캐릭터/제품관련 의뢰",
  "블록체인/NFT 의뢰",
  "VR/AR/메타버스 의뢰",
  "응용프로그램 의뢰",
  "설계도면(CAD) 의뢰",
  "인쇄/출판 의뢰",
  "사진/영상 촬영 의뢰",
  "사운드/효과음 의뢰",
  "번역/식자/통역 의뢰",
  "제조/3D프린팅 의뢰",
  "해외/기타 의뢰",
] as const;

export type JobCategory = (typeof JOB_CATEGORIES)[number];

export const JOB_LOCATIONS = [
  "전국",
  "서울",
  "경기",
  "인천",
  "부산",
  "대구",
  "광주",
  "대전",
  "울산",
  "세종",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
  "재택/원격",
] as const;

export const POST_TYPE_LABEL = {
  REQUEST: "작업의뢰",
  PROMOTE: "업체홍보",
} as const;
