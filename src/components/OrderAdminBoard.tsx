"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUSES, type OrderListItem } from "@/lib/orders";

type MediaItem = {
  id: string;
  url: string;
  name: string;
  originalName?: string;
  size?: number;
};

function money(n: number) {
  return Number(n || 0).toLocaleString("ko-KR");
}

function parseMoney(v: string) {
  const cleaned = String(v ?? "").replace(/,/g, "").replace(/[^\d.-]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/** Registration stamp is "YYYY-MM-DD HH:MM"; drop the date part when it matches the order date. */
function registeredLabel(order: OrderListItem) {
  const stamp = order.등록일시 || "";
  if (!stamp) return "-";
  const [datePart, timePart = ""] = stamp.split(" ");
  return datePart === order.날짜 ? timePart : stamp.slice(5);
}

function formatSize(bytes?: number) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function OrderAdminBoard() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [statusOptions, setStatusOptions] = useState<string[]>([...ORDER_STATUSES]);
  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState("");
  const [dateSort, setDateSort] = useState<"asc" | "desc" | null>(null);
  const [toast, setToast] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailText, setDetailText] = useState("");
  const [detailImages, setDetailImages] = useState<MediaItem[]>([]);
  const [detailFiles, setDetailFiles] = useState<MediaItem[]>([]);
  const saveTimers = useRef<Record<string, number>>({});
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 1800);
  }, []);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/orders");
    if (res.status === 401) {
      router.replace("/admin");
      return;
    }
    if (!res.ok) throw new Error("목록을 불러오지 못했습니다.");
    const data = (await res.json()) as {
      orders: OrderListItem[];
      statusOptions?: string[];
    };
    setOrders(data.orders || []);
    if (data.statusOptions?.length) setStatusOptions(data.statusOptions);
  }, [router]);

  useEffect(() => {
    load().catch((e: Error) => showToast(e.message));
  }, [load, showToast]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const rows = orders.filter((o) => {
      if (status && o.상태 !== status) return false;
      if (!q) return true;
      const hay = [o.거래처명, o.연락처, o["상품/서비스"], o.담당자, o.메모]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });

    if (!dateSort) return rows;

    return [...rows].sort((a, b) => {
      const keyA = `${a.날짜} ${a.등록일시}`;
      const keyB = `${b.날짜} ${b.등록일시}`;
      return dateSort === "asc"
        ? keyA.localeCompare(keyB)
        : keyB.localeCompare(keyA);
    });
  }, [orders, filter, status, dateSort]);

  function scheduleSave(id: string, next: OrderListItem) {
    window.clearTimeout(saveTimers.current[id]);
    saveTimers.current[id] = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/orders/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        });
        if (!res.ok) throw new Error("저장 실패");
        const saved = (await res.json()) as OrderListItem;
        setOrders((prev) => prev.map((o) => (o.id === id ? saved : o)));
      } catch (e) {
        showToast(e instanceof Error ? e.message : "저장 실패");
      }
    }, 350);
  }

  function patchOrder(id: string, patch: Partial<OrderListItem>) {
    setOrders((prev) => {
      const current = prev.find((o) => o.id === id);
      if (!current) return prev;
      const next: OrderListItem = { ...current, ...patch };
      if (patch.수량 !== undefined || patch.단가 !== undefined) {
        next.금액 = (Number(next.수량) || 0) * (Number(next.단가) || 0);
      }
      scheduleSave(id, next);
      return prev.map((o) => (o.id === id ? next : o));
    });
  }

  async function addOrder() {
    const res = await fetch("/api/admin/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (!res.ok) throw new Error("추가 실패");
    const created = (await res.json()) as OrderListItem;
    setOrders((prev) => [created, ...prev]);
    showToast("새 오더가 추가되었습니다.");
  }

  async function deleteOrder(id: string) {
    if (!confirm("이 오더를 삭제할까요?")) return;
    const res = await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("삭제 실패");
    setOrders((prev) => prev.filter((o) => o.id !== id));
    showToast("삭제되었습니다.");
  }

  async function openDetail(id: string) {
    const res = await fetch(`/api/admin/orders/${id}`);
    if (!res.ok) throw new Error("세부내용을 불러오지 못했습니다.");
    const data = (await res.json()) as {
      detail: { text: string; images: MediaItem[]; files: MediaItem[] };
    };
    setDetailId(id);
    setDetailText(data.detail.text || "");
    setDetailImages(data.detail.images || []);
    setDetailFiles(data.detail.files || []);
  }

  async function saveDetail() {
    if (!detailId) return;
    const res = await fetch(`/api/admin/orders/${detailId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ detailText }),
    });
    if (!res.ok) throw new Error("세부내용 저장 실패");
    const saved = (await res.json()) as OrderListItem;
    setOrders((prev) => prev.map((o) => (o.id === detailId ? saved : o)));
    setDetailId(null);
    showToast("세부내용이 저장되었습니다.");
  }

  async function uploadImageDataUrl(dataUrl: string) {
    if (!detailId) return;
    const res = await fetch(`/api/admin/orders/${detailId}/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataUrl }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error || "이미지 업로드 실패");
    }
    const uploaded = (await res.json()) as MediaItem;
    setDetailImages((prev) => [...prev, uploaded]);
    setOrders((prev) =>
      prev.map((o) =>
        o.id === detailId ? { ...o, 세부내용여부: "있음" } : o,
      ),
    );
    showToast("이미지가 첨부되었습니다.");
  }

  async function uploadPdf(file: File) {
    if (!detailId) return;
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/admin/orders/${detailId}/upload`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error || "PDF 업로드 실패");
    }
    const uploaded = (await res.json()) as MediaItem;
    setDetailFiles((prev) => [...prev, uploaded]);
    setOrders((prev) =>
      prev.map((o) =>
        o.id === detailId ? { ...o, 세부내용여부: "있음" } : o,
      ),
    );
    showToast("PDF가 첨부되었습니다.");
  }

  async function removeMedia(mediaId: string, kind: "image" | "pdf") {
    if (!detailId) return;
    const res = await fetch(`/api/admin/orders/${detailId}/media/${mediaId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("삭제 실패");
    if (kind === "image") {
      setDetailImages((prev) => prev.filter((m) => m.id !== mediaId));
    } else {
      setDetailFiles((prev) => prev.filter((m) => m.id !== mediaId));
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin");
    router.refresh();
  }

  const detailOrder = orders.find((o) => o.id === detailId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-teal uppercase">
            Order DB
          </p>
          <h1 className="mt-1 text-2xl font-bold text-ink md:text-3xl">오더 관리</h1>
          <p className="mt-1 text-sm text-muted">관리자 전용 · 비밀번호 보호</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="거래처 · 상품 · 담당자 검색"
            className="h-10 min-w-[12rem] rounded-full border border-line bg-white px-4 text-sm outline-none focus:border-teal"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 rounded-full border border-line bg-white px-3 text-sm outline-none"
          >
            <option value="">전체 상태</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => addOrder().catch((e) => showToast(e.message))}
            className="h-10 rounded-full bg-teal px-4 text-sm font-semibold text-white"
          >
            + 새 오더
          </button>
          <button
            type="button"
            onClick={() => load().then(() => showToast("새로고침 완료")).catch((e) => showToast(e.message))}
            className="h-10 rounded-full border border-line bg-white px-4 text-sm font-semibold"
          >
            새로고침
          </button>
          <button
            type="button"
            onClick={() => logout().catch(() => undefined)}
            className="h-10 rounded-full border border-line px-4 text-sm font-semibold text-ink-soft"
          >
            관리자 로그아웃
          </button>
        </div>
      </div>

      <div className="overflow-auto rounded-3xl border border-line bg-white shadow-[0_16px_40px_rgba(16,20,26,0.05)]">
        <table className="min-w-[1480px] w-full table-fixed border-collapse text-sm">
          <thead>
            <tr className="bg-[#eef2f0] text-left text-xs font-bold text-ink-soft">
              <th className="sticky top-0 z-[1] w-[152px] px-2 py-3">
                <div className="flex items-center gap-1.5">
                  <span>날짜</span>
                  <span className="flex flex-col leading-none">
                    <button
                      type="button"
                      aria-label="날짜 오름차순 정렬"
                      title="오름차순 (과거 → 최근)"
                      onClick={() =>
                        setDateSort((v) => (v === "asc" ? null : "asc"))
                      }
                      className={`text-[9px] transition ${
                        dateSort === "asc" ? "text-teal" : "text-muted hover:text-ink"
                      }`}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      aria-label="날짜 내림차순 정렬"
                      title="내림차순 (최근 → 과거)"
                      onClick={() =>
                        setDateSort((v) => (v === "desc" ? null : "desc"))
                      }
                      className={`text-[9px] transition ${
                        dateSort === "desc" ? "text-teal" : "text-muted hover:text-ink"
                      }`}
                    >
                      ▼
                    </button>
                  </span>
                </div>
              </th>
              <th className="sticky top-0 z-[1] w-[140px] px-2 py-3">거래처명</th>
              <th className="sticky top-0 z-[1] w-[120px] px-2 py-3">연락처</th>
              <th className="sticky top-0 z-[1] w-[160px] px-2 py-3">상품/서비스</th>
              <th className="sticky top-0 z-[1] w-[90px] px-2 py-3">수량</th>
              <th className="sticky top-0 z-[1] w-[140px] px-2 py-3">단가</th>
              <th className="sticky top-0 z-[1] w-[140px] px-2 py-3">금액</th>
              <th className="sticky top-0 z-[1] w-[110px] px-2 py-3">상태</th>
              <th className="sticky top-0 z-[1] w-[90px] px-2 py-3">담당자</th>
              <th className="sticky top-0 z-[1] w-[160px] px-2 py-3">메모</th>
              <th className="sticky top-0 z-[1] w-[130px] px-2 py-3">수정일</th>
              <th className="sticky top-0 z-[1] w-[110px] px-2 py-3">세부내용</th>
              <th className="sticky top-0 z-[1] w-[72px] px-2 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
              <tr key={order.id} className="border-t border-line hover:bg-[#f7faf8]">
                <td className="py-1">
                  <input
                    type="date"
                    value={order.날짜 || ""}
                    onChange={(e) => patchOrder(order.id, { 날짜: e.target.value })}
                    className="h-8 w-full bg-transparent px-2 outline-none"
                  />
                  <span className="block px-2 text-[11px] text-muted whitespace-nowrap">
                    등록 {registeredLabel(order)}
                  </span>
                </td>
                <td>
                  <input
                    type="text"
                    value={order.거래처명}
                    onChange={(e) => patchOrder(order.id, { 거래처명: e.target.value })}
                    className="h-10 w-full bg-transparent px-2 outline-none"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={order.연락처}
                    onChange={(e) => patchOrder(order.id, { 연락처: e.target.value })}
                    className="h-10 w-full bg-transparent px-2 outline-none"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={order["상품/서비스"]}
                    onChange={(e) =>
                      patchOrder(order.id, { "상품/서비스": e.target.value })
                    }
                    className="h-10 w-full bg-transparent px-2 outline-none"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    value={order.수량}
                    onChange={(e) =>
                      patchOrder(order.id, { 수량: Number(e.target.value || 0) })
                    }
                    className="h-10 w-full bg-transparent px-2 text-right outline-none"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    inputMode="numeric"
                    defaultValue={money(order.단가)}
                    key={`${order.id}-price`}
                    onFocus={(e) => {
                      e.currentTarget.value = String(order.단가 || "");
                      e.currentTarget.select();
                    }}
                    onBlur={(e) => {
                      const value = parseMoney(e.currentTarget.value);
                      e.currentTarget.value = money(value);
                      patchOrder(order.id, { 단가: value });
                    }}
                    className="h-10 w-full bg-transparent px-2 text-right outline-none tabular-nums"
                  />
                </td>
                <td className="px-2 text-right font-semibold tabular-nums">
                  {money(order.금액)}
                </td>
                <td>
                  <select
                    value={order.상태}
                    onChange={(e) => patchOrder(order.id, { 상태: e.target.value })}
                    className="h-10 w-full bg-transparent px-2 outline-none"
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    value={order.담당자}
                    onChange={(e) => patchOrder(order.id, { 담당자: e.target.value })}
                    className="h-10 w-full bg-transparent px-2 outline-none"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={order.메모}
                    onChange={(e) => patchOrder(order.id, { 메모: e.target.value })}
                    className="h-10 w-full bg-transparent px-2 outline-none"
                  />
                </td>
                <td className="px-2 text-xs text-muted whitespace-nowrap">
                  {order.수정일}
                </td>
                <td className="p-1">
                  <button
                    type="button"
                    onClick={() =>
                      openDetail(order.id).catch((e) => showToast(e.message))
                    }
                    className={`h-8 w-full rounded-lg border text-xs font-semibold ${
                      order.세부내용여부 === "있음"
                        ? "border-[#b7d7cc] bg-[#d7ebe4] text-teal"
                        : "border-line bg-white text-ink-soft"
                    }`}
                  >
                    {order.세부내용여부 === "있음" ? "보기/수정" : "작성"}
                  </button>
                </td>
                <td className="p-1">
                  <button
                    type="button"
                    onClick={() =>
                      deleteOrder(order.id).catch((e) => showToast(e.message))
                    }
                    className="h-8 w-full rounded-lg text-xs font-semibold text-[#9b2c2c]"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length ? (
          <p className="px-4 py-12 text-center text-muted">
            등록된 오더가 없습니다. 「새 오더」로 추가하세요.
          </p>
        ) : null}
      </div>

      <p className="text-sm text-muted">{filtered.length}건</p>

      {detailId ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-3">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-3xl border border-line bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-line p-4">
              <div>
                <h2 className="text-lg font-bold">세부내용</h2>
                <p className="mt-1 text-sm text-muted">
                  {detailOrder?.거래처명 || "이름 없음"} ·{" "}
                  {detailOrder?.["상품/서비스"] || "상품 미입력"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailId(null)}
                className="rounded-full border border-line px-3 py-1.5 text-sm"
              >
                닫기
              </button>
            </div>

            <div className="space-y-4 p-4">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  텍스트 / 붙여넣기
                </label>
                <textarea
                  value={detailText}
                  onChange={(e) => setDetailText(e.target.value)}
                  onPaste={(e) => {
                    const items = e.clipboardData?.items;
                    if (!items) return;
                    for (const item of items) {
                      if (item.type.startsWith("image/")) {
                        e.preventDefault();
                        const file = item.getAsFile();
                        if (!file) continue;
                        const reader = new FileReader();
                        reader.onload = () => {
                          uploadImageDataUrl(String(reader.result)).catch((err) =>
                            showToast(err.message),
                          );
                        };
                        reader.readAsDataURL(file);
                        return;
                      }
                    }
                  }}
                  rows={8}
                  className="w-full rounded-2xl border border-line bg-paper p-3 outline-none focus:border-teal"
                  placeholder="텍스트 입력 또는 Ctrl+V로 캡처 이미지 붙여넣기"
                />
                <p className="mt-2 rounded-xl bg-paper px-3 py-2 text-xs text-muted">
                  캡처 붙여넣기: Win+Shift+S 후 이 창에서 Ctrl+V
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {detailImages.map((img) => (
                  <div
                    key={img.id}
                    className="relative overflow-hidden rounded-2xl border border-line"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.name}
                      className="h-36 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        removeMedia(img.id, "image").catch((e) =>
                          showToast(e.message),
                        )
                      }
                      className="absolute right-2 top-2 rounded-lg bg-white/90 px-2 py-1 text-xs font-semibold text-[#9b2c2c]"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-t border-line pt-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">PDF 첨부</p>
                  <button
                    type="button"
                    onClick={() => pdfInputRef.current?.click()}
                    className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold"
                  >
                    PDF 선택
                  </button>
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      uploadPdf(file).catch((err) => showToast(err.message));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  {!detailFiles.length ? (
                    <p className="text-sm text-muted">첨부된 PDF가 없습니다.</p>
                  ) : (
                    detailFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 rounded-2xl border border-line px-3 py-2"
                      >
                        <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#f1e6e0] text-[10px] font-bold text-[#8a3b2a]">
                          PDF
                        </span>
                        <div className="min-w-0 flex-1">
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block truncate font-semibold hover:text-teal"
                          >
                            {file.originalName || file.name}
                          </a>
                          <span className="text-xs text-muted">
                            {formatSize(file.size)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            removeMedia(file.id, "pdf").catch((e) =>
                              showToast(e.message),
                            )
                          }
                          className="text-xs font-semibold text-[#9b2c2c]"
                        >
                          삭제
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-line p-4">
              <button
                type="button"
                onClick={() =>
                  saveDetail().catch((e) => showToast(e.message))
                }
                className="rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-white"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-5 right-5 z-[70] rounded-xl bg-[#16352e] px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
