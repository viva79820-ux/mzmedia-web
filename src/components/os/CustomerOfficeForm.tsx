"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Manager = { id: string; name: string };

export function CustomerOfficeForm({
  id,
  folderUrl,
  pmId,
  managers,
  canAssignPm,
}: {
  id: string;
  folderUrl: string;
  pmId: string;
  managers: Manager[];
  canAssignPm: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body: Record<string, string> = { folderUrl: String(form.get("folderUrl") ?? "") };
    if (canAssignPm) body.pmId = String(form.get("pmId") ?? "");
    const response = await fetch(`/api/os/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json()) as { message?: string };
    if (!response.ok) {
      setMessage(data.message ?? "저장하지 못했습니다.");
      return;
    }
    setMessage("저장했습니다. 파일 본문은 가져오지 않습니다.");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="grid gap-3 md:grid-cols-2">
      {canAssignPm ? (
        <label className="text-sm">
          <span className="mb-1 block text-muted">담당 PM</span>
          <select name="pmId" defaultValue={pmId} className="w-full rounded-lg border border-line bg-white px-3 py-2">
            <option value="">미지정</option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>{manager.name}</option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="text-sm md:col-span-2">
        <span className="mb-1 block text-muted">드라이브 폴더</span>
        <input name="folderUrl" defaultValue={folderUrl} placeholder="https://drive.google.com/..." className="w-full rounded-lg border border-line px-3 py-2" />
      </label>
      <div>
        <button type="submit" className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white">저장</button>
        {message ? <p className="mt-2 text-sm text-muted">{message}</p> : null}
      </div>
    </form>
  );
}
