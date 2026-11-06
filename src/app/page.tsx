import type { Metadata } from "next";
import { HomeChat } from "@/components/home/HomeChat";

export const metadata: Metadata = {
  title: "AI에게 물어보기",
  description: "엠지미디어의 회사, 상품, 업종별 마케팅을 대화로 물어보세요.",
};

export default function HomePage() {
  return <HomeChat />;
}
