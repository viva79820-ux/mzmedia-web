import type { Metadata } from "next";
import { FilesBoard } from "@/components/os/FilesBoard";

export const metadata: Metadata = {
  title: "파일·자료",
  robots: { index: false, follow: false },
};

export default function OsFilesPage() {
  return <FilesBoard />;
}
