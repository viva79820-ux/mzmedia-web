import type { Metadata } from "next";
import { ProjectsBoard } from "@/components/os/ProjectsBoard";

export const metadata: Metadata = {
  title: "프로젝트",
  robots: { index: false, follow: false },
};

export default function OsProjectsPage() {
  return <ProjectsBoard />;
}
