"use client";

import { useState } from "react";

const services = [
  "블로그 마케팅",
  "SNS 마케팅",
  "유튜브 마케팅",
  "온라인 강의",
  "오프라인 강의",
  "패키지 상담",
];

export function QuoteForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-[1.75rem] border border-teal/25 bg-teal-soft p-8 md:p-10">
        <p className="font-display text-2xl font-bold text-ink">
          문의가 접수되었습니다.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft md:text-base">
          남겨주신 내용을 확인한 뒤, 영업일 기준 1일 이내에 연락드리겠습니다.
          급한 상담이 필요하시면 이메일로도 언제든 연락 주세요.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[1.75rem] border border-line bg-white p-6 shadow-[0_20px_50px_rgba(16,20,26,0.06)] md:p-8"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-2 block font-medium text-ink">이름 / 담당자</span>
          <input
            required
            name="name"
            className="w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none transition focus:border-accent"
            placeholder="홍길동"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-2 block font-medium text-ink">연락처</span>
          <input
            required
            name="phone"
            type="tel"
            className="w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none transition focus:border-accent"
            placeholder="010-0000-0000"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-2 block font-medium text-ink">이메일</span>
          <input
            required
            name="email"
            type="email"
            className="w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none transition focus:border-accent"
            placeholder="hello@company.com"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-2 block font-medium text-ink">관심 서비스</span>
          <select
            required
            name="service"
            defaultValue=""
            className="w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none transition focus:border-accent"
          >
            <option value="" disabled>
              선택해 주세요
            </option>
            {services.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="mt-5 block text-sm">
        <span className="mb-2 block font-medium text-ink">문의 내용</span>
        <textarea
          required
          name="message"
          rows={5}
          className="w-full resize-y rounded-xl border border-line bg-paper px-4 py-3 outline-none transition focus:border-accent"
          placeholder="업종, 목표, 예산 범위, 일정 등을 자유롭게 적어 주세요."
        />
      </label>
      <button
        type="submit"
        className="mt-6 inline-flex rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-accent-deep"
      >
        견적 문의 보내기
      </button>
      <p className="mt-3 text-xs text-muted">
        * 현재는 데모 폼입니다. 배포 전 실제 메일/카카오 연동으로 연결할 수 있습니다.
      </p>
    </form>
  );
}
