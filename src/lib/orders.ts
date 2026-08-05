export const ORDER_STATUSES = [
  "콜드콜",
  "제안서",
  "견적서",
  "계약서",
  "진행중",
  "완료",
  "보류",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function todayDate() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function calcAmount(quantity: number, unitPrice: number) {
  return (Number(quantity) || 0) * (Number(unitPrice) || 0);
}

export function formatStamp(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export type OrderListItem = {
  id: string;
  날짜: string;
  등록일시: string;
  거래처명: string;
  연락처: string;
  "상품/서비스": string;
  수량: number;
  단가: number;
  금액: number;
  상태: string;
  담당자: string;
  메모: string;
  수정일: string;
  세부내용여부: "있음" | "없음";
};

export function toOrderListItem(order: {
  id: string;
  orderDate: string;
  clientName: string;
  contact: string;
  product: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  status: string;
  assignee: string;
  memo: string;
  hasDetail: boolean;
  createdAt: Date;
  updatedAt: Date;
}): OrderListItem {
  return {
    id: order.id,
    날짜: order.orderDate,
    등록일시: formatStamp(order.createdAt),
    거래처명: order.clientName,
    연락처: order.contact,
    "상품/서비스": order.product,
    수량: order.quantity,
    단가: order.unitPrice,
    금액: order.amount,
    상태: order.status,
    담당자: order.assignee,
    메모: order.memo,
    수정일: formatStamp(order.updatedAt),
    세부내용여부: order.hasDetail ? "있음" : "없음",
  };
}
