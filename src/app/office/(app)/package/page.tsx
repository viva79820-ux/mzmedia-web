"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PackagePage() {
  return (
    <Suspense fallback={<p className="help">고객 요청을 불러오는 중입니다.</p>}>
      <PackageForm />
    </Suspense>
  );
}

function PackageForm() {
  const router = useRouter();
  const params = useSearchParams();
  const inquiryId = params.get("inquiry") ?? "";
  const [request, setRequest] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!inquiryId) return;
    fetch(`/api/office/packages?inquiryId=${encodeURIComponent(inquiryId)}`)
      .then(async (response) => {
        const body = (await response.json()) as { request?: string; companyName?: string; contactName?: string; error?: string };
        if (!response.ok) {
          setError(body.error || "문의를 불러오지 못했습니다.");
          return;
        }
        setRequest(body.request || "");
        setCompanyName(body.companyName || "");
        setContactName(body.contactName || "");
      })
      .catch(() => setError("문의를 불러오지 못했습니다."));
  }, [inquiryId]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch("/api/office/packages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ request, companyName, contactName, inquiryId: inquiryId || undefined }),
    });
    const body = (await response.json()) as { job?: { id: string }; error?: string };
    setPending(false);
    if (!response.ok || !body.job) {
      setError(body.error || "전달 패키지를 만들지 못했습니다.");
      return;
    }
    router.push(`/office/agent/${body.job.id}`);
  }

  return (
    <>
      <header className="page-head">
        <div>
          <p className="kicker">V3 · PM</p>
          <h1>고객 전달 패키지</h1>
          <p>고객에게 들은 요청만 넘기면 내용 분석, 견적서, 제안서를 전달용으로 정리합니다. 발송은 하지 않습니다.</p>
        </div>
      </header>
      <form className="card stack" onSubmit={onSubmit}>
        <label>
          회사
          <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="없으면 비워 두세요" />
        </label>
        <label>
          담당
          <input value={contactName} onChange={(event) => setContactName(event.target.value)} />
        </label>
        <label>
          고객 요청
          <textarea value={request} onChange={(event) => setRequest(event.target.value)} placeholder="고객이 말한 내용, 원하는 결과, 희망일, 예산이 있으면 그대로 붙여 넣습니다." />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "견적서와 제안서를 정리하는 중" : "전달용으로 정리"}
        </button>
      </form>
    </>
  );
}
