import type { Metadata } from "next";
import { HomeChat } from "@/components/home/HomeChat";

export const metadata: Metadata = {
  title: "비즈니스의 고민을 물어보세요",
  description: "마케팅부터 영상·디자인·웹·앱 개발까지. 기업에 필요한 솔루션을 엠지미디어에서 찾아보세요.",
};

export default function HomePage() {
  return <HomeChat />;
}
