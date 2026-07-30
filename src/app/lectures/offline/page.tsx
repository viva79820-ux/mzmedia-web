import type { Metadata } from "next";
import { OfflineStudentLookup } from "@/components/OfflineStudentLookup";

export const metadata: Metadata = {
  title: "오프라인 강의",
  description: "엠지미디어 오프라인 수강 정보 조회.",
};

export default function OfflineLecturePage() {
  return <OfflineStudentLookup />;
}
