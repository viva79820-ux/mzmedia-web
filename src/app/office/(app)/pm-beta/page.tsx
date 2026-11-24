import { redirect } from "next/navigation";
import { canAccessOffice } from "@/lib/office/access";
import { pmBetaSource, readPmBeta } from "@/lib/office/pm-beta";
import { getSessionStaff } from "@/lib/staff-auth";

const labels = { queued: "작업 대기", running: "PC에서 실행 중", review: "담당자 검토 대기" };

export default async function PmBetaPage() {
  const staff = await getSessionStaff();
  if (!staff) redirect("/os/login?next=%2Foffice%2Fpm-beta");
  if (!canAccessOffice(staff.role)) redirect("/os");
  const current = await readPmBeta();
  const job = current?.job;

  return (
    <article className="card">
      <h1>PM 베타 작업</h1>
      <h2>KSERS 2027 오프닝 영상 작업 지시서</h2>
      <p>상태 {job ? labels[job.status] : "등록 대기"}</p>
      {job?.node && <p>실행 PC {job.node}</p>}
      <p><a href={pmBetaSource}>Drive 원본 매뉴얼</a></p>
      {job?.result && <p><a href={job.result}>작업 지시서 초안 열기</a></p>}
    </article>
  );
}
