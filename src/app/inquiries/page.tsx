import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ question?: string }>;
}) {
  const { question = "" } = await searchParams;
  const query = question.trim() ? `?question=${encodeURIComponent(question.trim())}` : "";
  const next = `/mypage${query}`;
  const user = await getSessionUser();
  if (!user) redirect(`/auth/signup?next=${encodeURIComponent(next)}`);
  redirect(next);
}
