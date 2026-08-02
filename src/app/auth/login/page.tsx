import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/PageHero";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "로그인",
  description: "엠지미디어 작업의뢰정보 게시판 로그인.",
};

export default function LoginPage() {
  return (
    <>
      <PageHero
        eyebrow="Login"
        title="로그인"
        description="공고 등록과 업체홍보를 위해 로그인해 주세요."
      />
      <section className="bg-white py-16 md:py-20">
        <div className="site-shell mx-auto max-w-md">
          <Suspense fallback={<div className="text-sm text-muted">불러오는 중…</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </>
  );
}
