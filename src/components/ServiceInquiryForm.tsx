"use client";

import { useState } from "react";
import type { EstimateSelection } from "@/lib/catalog";

type Props = {
  productId?: string;
  productName?: string;
  selection?: EstimateSelection;
  estimateSummary?: string;
};

export function ServiceInquiryForm({
  productId,
  productName,
  selection,
  estimateSummary,
}: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      companyName: String(form.get("companyName") ?? ""),
      contactName: String(form.get("contactName") ?? ""),
      phone: String(form.get("phone") ?? ""),
      email: String(form.get("email") ?? ""),
      dueDate: String(form.get("dueDate") ?? ""),
      budgetLabel: String(form.get("budgetLabel") ?? estimateSummary ?? ""),
      message: String(form.get("message") ?? ""),
      privacyAgreed: form.get("privacyAgreed") === "on",
      productId,
      selection,
    };

    try {
      const res = await fetch("/api/estimate/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.message ?? "접수에 실패했습니다.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-teal/20 bg-teal-soft p-5">
        <p className="font-display text-xl font-bold text-ink">
          문의가 접수되었습니다.
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          남겨주신 내용을 확인한 뒤 담당자가 연락드리겠습니다.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 border-t border-line pt-5">
      <h3 className="font-semibold text-ink">문의하기</h3>
      {productName && (
        <p className="text-sm text-muted">선택 서비스: {productName}</p>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <input
          name="companyName"
          required
          placeholder="회사명 또는 고객명"
          className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm"
        />
        <input
          name="contactName"
          required
          placeholder="담당자명"
          className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm"
        />
        <input
          name="phone"
          required
          placeholder="연락처"
          className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm"
        />
        <input
          name="email"
          type="email"
          required
          placeholder="이메일"
          className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm"
        />
        <input
          name="budgetLabel"
          placeholder="예상 예산"
          defaultValue={estimateSummary ?? ""}
          className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm"
        />
        <input
          name="dueDate"
          type="date"
          placeholder="희망 완료일"
          className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm"
        />
      </div>
      <textarea
        name="message"
        required
        rows={5}
        placeholder="문의 내용 / 참고사항"
        className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm"
      />
      <p className="text-xs text-muted">
        참고자료는 문의 내용에 링크를 남겨 주시면 확인합니다. (파일 첨부는 추후
        지원)
      </p>
      <label className="flex items-start gap-2 text-sm text-ink-soft">
        <input name="privacyAgreed" type="checkbox" required className="mt-1" />
        개인정보 수집·이용에 동의합니다.
      </label>
      {error && <p className="text-sm text-accent-deep">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-60"
      >
        {loading ? "접수 중..." : "견적 문의 보내기"}
      </button>
    </form>
  );
}
