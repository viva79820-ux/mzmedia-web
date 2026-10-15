import type { Metadata } from "next";
import { TasksBoard } from "@/components/os/TasksBoard";

export const metadata: Metadata = {
  title: "내 업무",
  robots: { index: false, follow: false },
};

export default function OsTasksPage() {
  return <TasksBoard />;
}
