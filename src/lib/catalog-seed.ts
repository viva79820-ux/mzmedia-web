import type { SaleMode } from "@/lib/catalog";
import { emptyEstimateRule } from "@/lib/catalog";

type SeedProduct = {
  slug: string;
  name: string;
  summary: string;
  saleMode: SaleMode;
  startingPrice?: number | null;
  durationLabel?: string;
  scopeItems?: string[];
  estimateRule?: ReturnType<typeof emptyEstimateRule>;
};

type SeedCategory = {
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
  products: SeedProduct[];
  children?: {
    slug: string;
    name: string;
    description: string;
    sortOrder: number;
    products: SeedProduct[];
  }[];
};

function autoRule(base: number, options: ReturnType<typeof emptyEstimateRule>["options"] = []) {
  return {
    basePrice: base,
    vatIncluded: true,
    durationLabel: null as string | null,
    options,
  };
}

export const CATALOG_SEED: SeedCategory[] = [
  {
    slug: "online-marketing",
    name: "온라인마케팅",
    description: "블로그·SNS·광고 운영과 콘텐츠 제작",
    sortOrder: 1,
    products: [
      { slug: "blog-content", name: "블로그 콘텐츠 제작", summary: "검색 의도에 맞는 원고·이미지 제작", saleMode: "FIXED" },
      { slug: "blog-monthly", name: "블로그 월간 관리", summary: "계정 운영과 포스팅 루틴 관리", saleMode: "CONSULT" },
      { slug: "blog-regular", name: "블로그 월 정기발행", summary: "월 단위 정기 발행 패키지", saleMode: "CONSULT" },
      { slug: "naver-powerlink", name: "네이버 파워링크 관리", summary: "키워드·소재·입찰 운영", saleMode: "CONSULT" },
      { slug: "instagram-content", name: "인스타그램 콘텐츠 제작", summary: "피드·릴스 콘텐츠 제작", saleMode: "FIXED" },
      { slug: "instagram-monthly", name: "인스타그램 월간 관리", summary: "계정 톤 관리와 발행 운영", saleMode: "CONSULT" },
      { slug: "meta-ads", name: "메타 광고 관리", summary: "페이스북·인스타 광고 운영", saleMode: "CONSULT" },
      { slug: "youtube-content", name: "유튜브 콘텐츠 제작", summary: "기획·콘티·편집 기반 콘텐츠", saleMode: "AUTO" },
      { slug: "youtube-channel", name: "유튜브 채널 관리", summary: "채널 성장과 업로드 운영", saleMode: "CONSULT" },
      { slug: "google-youtube-ads", name: "구글·유튜브 광고 관리", summary: "검색·영상 광고 운영", saleMode: "CONSULT" },
    ],
  },
  {
    slug: "video",
    name: "영상·촬영",
    description: "기업·행사·숏폼 영상 기획부터 편집까지",
    sortOrder: 2,
    products: [
      { slug: "corp-promo", name: "기업 홍보영상", summary: "브랜드·기업 소개 영상", saleMode: "AUTO" },
      { slug: "event-video", name: "행사·학회 영상", summary: "현장 촬영과 하이라이트 편집", saleMode: "AUTO" },
      { slug: "interview", name: "인터뷰 촬영", summary: "인터뷰 촬영·자막·편집", saleMode: "AUTO" },
      { slug: "youtube-shoot", name: "유튜브 촬영", summary: "채널용 촬영 디렉팅", saleMode: "AUTO" },
      {
        slug: "video-edit",
        name: "영상 편집",
        summary: "원본 기반 편집·자막·색보정",
        saleMode: "FIXED",
        estimateRule: autoRule(0, [
          {
            id: "minutes",
            label: "원본 분량",
            type: "number",
            unit: "분",
            min: 1,
            max: 180,
            step: 1,
            defaultValue: 10,
            pricePerUnit: 0,
          },
        ]),
      },
      { slug: "shortform", name: "숏폼 영상 제작", summary: "릴스·쇼츠 포맷 제작", saleMode: "FIXED" },
      { slug: "drone", name: "드론 촬영", summary: "항공 촬영과 편집", saleMode: "AUTO" },
    ],
    children: [
      {
        slug: "personal-event",
        name: "개인 행사 촬영",
        description: "결혼식·돌잔치 등 개인 행사",
        sortOrder: 1,
        products: [
          { slug: "wedding-video", name: "결혼식 영상", summary: "본식·하이라이트 영상", saleMode: "CONSULT" },
          { slug: "wedding-photo", name: "결혼식 사진", summary: "본식·스냅 사진", saleMode: "CONSULT" },
          { slug: "dol-video", name: "돌잔치 영상", summary: "돌잔치 촬영·편집", saleMode: "CONSULT" },
          { slug: "dol-photo", name: "돌잔치 사진", summary: "돌잔치 사진 촬영", saleMode: "CONSULT" },
        ],
      },
    ],
  },
  {
    slug: "web-it",
    name: "홈페이지·IT",
    description: "웹사이트·시스템·앱·자동화 개발",
    sortOrder: 3,
    products: [
      { slug: "corporate-website", name: "기업 홈페이지 제작", summary: "기업·브랜드 소개 사이트", saleMode: "AUTO" },
      { slug: "landing-page", name: "랜딩페이지 제작", summary: "캠페인·전환 중심 페이지", saleMode: "FIXED" },
      { slug: "shopping-mall", name: "쇼핑몰 제작", summary: "상품 판매형 쇼핑몰", saleMode: "CONSULT" },
      { slug: "website-maintenance", name: "홈페이지 유지관리", summary: "수정·보안·백업 운영", saleMode: "CONSULT" },
      { slug: "booking-system", name: "예약·접수 시스템 개발", summary: "예약·문의·접수 자동화", saleMode: "CONSULT" },
      { slug: "admin-system", name: "관리자 프로그램 개발", summary: "업무용 관리 시스템", saleMode: "CONSULT" },
      { slug: "mobile-app", name: "모바일 앱 개발", summary: "iOS·Android 앱", saleMode: "CONSULT" },
      { slug: "ai-automation", name: "AI 기능 및 업무자동화 개발", summary: "업무 자동화·AI 기능", saleMode: "CONSULT" },
    ],
  },
  {
    slug: "design-print",
    name: "디자인·인쇄",
    description: "디자인 제작과 인쇄물 제작",
    sortOrder: 4,
    products: [
      { slug: "ppt-design", name: "PPT 디자인", summary: "발표·제안용 슬라이드", saleMode: "FIXED" },
      { slug: "led-screen", name: "행사 LED 화면 디자인", summary: "무대·행사용 LED 디자인", saleMode: "AUTO" },
      { slug: "poster-flyer", name: "포스터·전단지 디자인", summary: "홍보용 인쇄 디자인", saleMode: "FIXED" },
      { slug: "detail-page", name: "상세페이지 제작", summary: "상품 상세·랜딩 비주얼", saleMode: "FIXED" },
      { slug: "card-news", name: "카드뉴스 제작", summary: "SNS용 카드뉴스", saleMode: "FIXED" },
      { slug: "banner-design", name: "배너·현수막 디자인", summary: "온·오프라인 배너", saleMode: "FIXED" },
      { slug: "logo-brand", name: "로고·브랜드 디자인", summary: "로고와 기본 브랜드 세트", saleMode: "CONSULT" },
      { slug: "print-card-flyer", name: "명함·전단지·포스터 인쇄", summary: "기본 인쇄물 제작", saleMode: "FIXED" },
      { slug: "print-banner", name: "현수막·배너 인쇄", summary: "대형 현수막·배너", saleMode: "FIXED" },
      { slug: "print-catalog", name: "리플렛·책자·카탈로그 인쇄", summary: "제본·카탈로그 인쇄", saleMode: "CONSULT" },
      { slug: "print-etc", name: "스티커·봉투·기타 인쇄", summary: "소량·특수 인쇄", saleMode: "CONSULT" },
    ],
  },
];
