import type { Metadata } from "next";
import { LegalDraft } from "@/components/LegalDraft";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "이용약관 초안",
  description: "엠지미디어 홈페이지 이용약관 초안입니다. 시행 전 문서입니다.",
};

export default function TermsPage() {
  return (
    <LegalDraft title="이용약관 초안">
      <section>
        <h2 className="text-base font-bold text-ink">제1조 목적</h2>
        <p className="mt-2">
          이 약관은 {site.nameKo}(이하 “회사”)가 운영하는 홈페이지에서 회원 가입, 1:1 문의, 서비스 안내를 이용하는 방법과
          회사와 회원의 권리, 의무를 정합니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-ink">제2조 약관의 성격</h2>
        <p className="mt-2">
          이 문서는 2026년 11월 6일에 작성한 초안입니다. 시행일과 사업자등록번호는 대표가 확인한 뒤 넣습니다. 확인 전에는
          이 약관으로 유료 계약이나 결제가 성립하지 않습니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-ink">제3조 회원가입</h2>
        <p className="mt-2">
          회원은 아이디, 비밀번호, 성함, 전화번호, 이메일을 입력하고 이용약관과 개인정보 수집·이용에 동의한 뒤 가입합니다.
          다른 사람의 정보를 쓰거나, 사실과 다른 연락처를 남기면 회사는 가입을 거절하거나 계정을 멈출 수 있습니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-ink">제4조 1:1 문의</h2>
        <p className="mt-2">
          1:1 문의는 로그인한 회원만 남길 수 있습니다. 접수한 내용과 대표의 답변은 마이페이지에서 확인합니다. 회사는 문의
          내용을 문자나 이메일로 자동 발송하지 않습니다. 답변 시점은 상담 일정에 따르며, 이 화면의 답변은 계약이 아닙니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-ink">제5조 금액과 계약</h2>
        <p className="mt-2">
          홈페이지에 보이는 서비스 범위와 금액은 참고입니다. 실제 금액, 월 수량, 일정, 할인, 계약 조건은 상담 후 확정합니다.
          이 홈페이지에서 결제, 환불, 광고비 집행, 계약서 서명을 하지 않습니다. 계약은 회사가 따로 교부하는 문서로 합니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-ink">제6조 회원이 지킬 일</h2>
        <p className="mt-2">
          회원은 계정과 비밀번호를 직접 관리합니다. 문의에는 사실인 사업 내용만 적고, 다른 사람의 개인정보나 법령을 어기는
          내용을 올리지 않습니다. 공개 답변으로 재사용되면 안 되는 매출, 고객 명단, 의료 정보 원본은 문의에 올리지 않습니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-ink">제7조 회사가 지킬 일</h2>
        <p className="mt-2">
          회사는 회원의 문의에 대표가 확인한 범위에서 답합니다. 답변에 다른 고객의 상호, 전화번호, 매출을 옮기지 않습니다.
          홈페이지 대화의 일반 안내는 공개된 회사 소개와 대표가 남긴 답변을 기준으로 합니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-ink">제8조 계정 삭제</h2>
        <p className="mt-2">
          회원은 회사에 계정 삭제를 요청할 수 있습니다. 삭제 요청의 접수 방법은 시행 전에 확정합니다. 이미 진행 중인 상담
          기록은 분쟁 확인에 필요한 기간 동안 개인정보 처리방침에 적힌 기준으로 남을 수 있습니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-ink">제9조 책임</h2>
        <p className="mt-2">
          홈페이지의 안내와 1:1 답변은 일반 정보와 상담 의견입니다. 그 내용만으로 광고 성과, 매출, 법적 효과를 보장하지
          않습니다. 회사의 시스템 점검이나 통신 장애로 일시적으로 문의 화면을 쓰지 못할 수 있습니다.
        </p>
      </section>
      <section>
        <h2 className="text-base font-bold text-ink">제10조 준거법</h2>
        <p className="mt-2">이 약관은 대한민국 법령을 따릅니다. 분쟁이 있으면 민사소송법의 관할 법원에 따릅니다.</p>
      </section>
    </LegalDraft>
  );
}
