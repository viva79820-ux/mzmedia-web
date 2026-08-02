import type { Metadata } from "next";
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
        description="누구나 공고를 검색·열람할 수 있고, 글 작성·업체홍보는 회원만 가능합니다."
      />
      <section className="bg-white py-16 md:py-20">
        <div className="site-shell mx-auto max-w-xl">
          <SignupForm />
        </div>
      </section>
    </>
  );
}
