import type { Metadata } from "next";
import { NotificationsBoard } from "@/components/os/NotificationsBoard";

export const metadata: Metadata = {
  title: "알림",
  robots: { index: false, follow: false },
};

export default function OsNotificationsPage() {
  return <NotificationsBoard />;
}
