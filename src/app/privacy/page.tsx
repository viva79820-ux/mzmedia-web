import type { Metadata } from "next";
import { LegalDraft } from "@/components/LegalDraft";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "개인정보 처리방침 초안",
  description: "엠지미디어 개인정보 수집·이용 초안입니다. 시행 전 문서입니다.",
};

export default function PrivacyPage() {
  return (
    <LegalDraft title="개인정보 처리방침 초안">
      <section>
        <h2 className="text-base font-bold text-ink">1. 처리하는 곳</h2>
        <p className="mt-2">
          {site.nameKo} (대표 {site.representative})가 홈페이지 회원가입과 1:1 문의에 필요한 개인정보를 처리합니다.
          주소는 {site.address}입니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-ink">2. 수집하는 항목</h2>
        <p className="mt-2">
          회원가입 때 아이디, 비밀번호, 성함, 전화번호, 이메일을 받습니다. 비밀번호는 그대로 저장하지 않고 확인할 수 없는
          형태로 바꿉니다. 1:1 문의 때 상호, 문의 내용, 접수 시각, 답변과 답변 시각을 받습니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-ink">3. 사용 목적</h2>
        <p className="mt-2">
          회원 식별, 1:1 문의 접수, 대표의 답변, 마이페이지의 문의 현황 표시에 사용합니다. 광고 문자나 이메일을 이 정보로
          자동 발송하지 않습니다. 다른 고객의 답변에 이름, 전화번호, 이메일, 매출을 옮기지 않습니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-ink">4. 보유 기간</h2>
        <p className="mt-2">
          초안 기준입니다. 회원 정보는 탈퇴 또는 삭제 요청 때까지 보관합니다. 1:1 문의와 답변은 상담이 끝난 뒤 3년 보관하고
          지웁니다. 이 기간은 대표 확인 전이며, 시행 문서에서 바뀔 수 있습니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-ink">5. 제3자 제공</h2>
        <p className="mt-2">
          회사는 회원의 개인정보를 판매하지 않습니다. 법령에 따른 요청이 아니면 동의 없이 제3자에게 제공하지 않습니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-ink">6. 처리 위탁</h2>
        <p className="mt-2">
          홈페이지를 보여주고 문의 기록을 보관하려고 서버와 데이터베이스 사업을 외부에 맡길 수 있습니다. 수탁사 이름과
          맡기는 업무의 확정 목록은 시행 전에 이 문서에 추가합니다. 로컬 확인 중에는 그 목록을 확정하지 않습니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-ink">7. 회원의 권리</h2>
        <p className="mt-2">
          회원은 자신의 정보를 보거나 고치거나 지워 달라고 요청할 수 있습니다. 동의는 거절할 수 있으며, 거절하면 회원가입과
          1:1 문의를 이용하지 못합니다. 요청은 아래 연락처로 합니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-ink">8. 문의</h2>
        <p className="mt-2">
          개인정보 관련 문의는 {site.phone}, {site.email}로 받습니다. 이 초안의 보호책임자 지정과 고충처리 절차는 시행 전에
          확정합니다.
        </p>
      </section>
    </LegalDraft>
  );
}
