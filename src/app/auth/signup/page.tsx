import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/PageHero";
import { SignupForm } from "@/components/SignupForm";

export const metadata: Metadata = {
  title: "회원가입",
  description: "작업의뢰·업체홍보 글을 등록하려면 회원가입이 필요합니다.",
};

export default function SignupPage() {
  return (
    <>
      <PageHero
        eyebrow="Sign up"
        title="회원가입"
        description="1:1 문의와 글 작성은 회원만 할 수 있습니다. 문의 현황은 마이페이지에서 확인합니다."
      />
      <section className="bg-white py-16 md:py-20">
        <div className="site-shell mx-auto max-w-xl">
          <Suspense fallback={<div className="text-sm text-muted">불러오는 중…</div>}>
            <SignupForm />
          </Suspense>
        </div>
      </section>
    </>
  );
}
