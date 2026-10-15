"use client";

import { useEffect, useState } from "react";

type FileRow = {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  createdAt: string;
  uploadedBy?: { name: string } | null;
};

type Project = { id: string; name: string };
type Customer = { id: string; companyName: string };

export function FilesBoard() {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState({
    name: "",
    url: "",
    projectId: "",
    customerId: "",
  });

  async function load() {
    const [fRes, pRes, cRes] = await Promise.all([
      fetch("/api/os/files"),
      fetch("/api/os/projects"),
      fetch("/api/os/customers"),
    ]);
    if (fRes.ok) setFiles(((await fRes.json()) as { files: FileRow[] }).files);
    if (pRes.ok) {
      setProjects(((await pRes.json()) as { projects: Project[] }).projects);
    }
    if (cRes.ok) {
      setCustomers(
        ((await cRes.json()) as { customers: Customer[] }).customers,
      );
    }
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function createFile(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/os/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        projectId: form.projectId || null,
        customerId: form.customerId || null,
      }),
    });
    setForm((p) => ({ ...p, name: "", url: "" }));
    await load();
  }

  async function remove(id: string) {
    if (!window.confirm("파일 링크를 삭제할까요?")) return;
    await fetch(`/api/os/files?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">파일 · 자료</h1>
        <p className="mt-1 text-sm text-muted">
          외부 스토리지(드라이브·드롭박스 등) URL을 등록합니다. 바이너리 업로드는
          추후 S3 연동으로 확장합니다.
        </p>
      </div>

      <form
        onSubmit={createFile}
        className="grid gap-3 rounded-2xl border border-line bg-white p-4 md:grid-cols-2"
      >
        <input
          required
          placeholder="파일명"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        />
        <input
          required
          placeholder="https://..."
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        />
        <select
          value={form.projectId}
          onChange={(e) => setForm({ ...form, projectId: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        >
          <option value="">프로젝트(선택)</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={form.customerId}
          onChange={(e) => setForm({ ...form, customerId: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        >
          <option value="">고객(선택)</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.companyName}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white md:w-fit"
        >
          자료 등록
        </button>
      </form>

      <ul className="space-y-2">
        {files.map((f) => (
          <li
            key={f.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-white px-4 py-3 text-sm"
          >
            <div>
              <a
                href={f.url}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-accent"
              >
                {f.name}
              </a>
              <p className="text-xs text-muted">
                {f.uploadedBy?.name ?? "-"} ·{" "}
                {new Date(f.createdAt).toLocaleDateString("ko-KR")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => remove(f.id)}
              className="text-xs font-semibold text-accent-deep"
            >
              삭제
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
