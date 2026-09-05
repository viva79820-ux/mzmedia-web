"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  SALE_MODE_LABEL,
  formatPriceLabel,
  type SaleMode,
} from "@/lib/catalog";

type Product = {
  id: string;
  categoryId: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  thumbnailUrl: string;
  saleMode: SaleMode;
  startingPrice: number | null;
  durationLabel: string;
  published: boolean;
  sortOrder: number;
};

type Category = {
  id: string;
  slug: string;
  name: string;
  products: Product[];
  children: { id: string; slug: string; name: string; products: Product[] }[];
};

const emptyForm = {
  categoryId: "",
  slug: "",
  name: "",
  summary: "",
  description: "",
  thumbnailUrl: "",
  saleMode: "CONSULT" as SaleMode,
  startingPrice: "",
  durationLabel: "",
  published: true,
  sortOrder: "0",
};

export function ProductAdminBoard() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/products");
    if (!res.ok) {
      setMessage("상품 목록을 불러오지 못했습니다.");
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { categories: Category[] };
    setCategories(data.categories);
    if (!form.categoryId && data.categories[0]) {
      setForm((prev) => ({ ...prev, categoryId: data.categories[0].id }));
    }
    setLoading(false);
  }

  useEffect(() => {
    load().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flatCategories = categories.flatMap((cat) => [
    { id: cat.id, label: cat.name },
    ...cat.children.map((child) => ({
      id: child.id,
      label: `${cat.name} > ${child.name}`,
    })),
  ]);

  async function createProduct(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        startingPrice:
          form.startingPrice.trim() === "" ? null : Number(form.startingPrice),
        sortOrder: Number(form.sortOrder) || 0,
      }),
    });
    const data = (await res.json()) as { ok?: boolean; message?: string };
    if (!res.ok || !data.ok) {
      setMessage(data.message ?? "저장 실패");
      return;
    }
    setForm((prev) => ({
      ...emptyForm,
      categoryId: prev.categoryId,
    }));
    setMessage("상품이 등록되었습니다.");
    await load();
  }

  async function togglePublish(product: Product) {
    await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !product.published }),
    });
    await load();
  }

  async function removeProduct(id: string) {
    if (!window.confirm("이 상품을 삭제할까요?")) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    await load();
  }

  const allProducts = categories.flatMap((cat) => [
    ...cat.products.map((p) => ({
      ...p,
      categoryName: cat.name,
      categorySlug: cat.slug,
    })),
    ...cat.children.flatMap((child) =>
      child.products.map((p) => ({
        ...p,
        categoryName: `${cat.name} > ${child.name}`,
        categorySlug: child.slug,
      })),
    ),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-[1.5rem] border border-line bg-white p-5 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">상품 관리</h1>
            <p className="mt-1 text-sm text-muted">
              쇼핑몰처럼 썸네일·제목·상세를 등록합니다. 결제는 추후, 현재는 문의로
              연결됩니다.
            </p>
          </div>
          <Link
            href="/admin/inquiries"
            className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink"
          >
            견적 문의 목록
          </Link>
        </div>

        <form onSubmit={createProduct} className="mt-6 grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block font-medium">카테고리</span>
            <select
              required
              value={form.categoryId}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, categoryId: e.target.value }))
              }
              className="w-full rounded-xl border border-line bg-paper px-3 py-2.5"
            >
              {flatCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">판매방식</span>
            <select
              value={form.saleMode}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  saleMode: e.target.value as SaleMode,
                }))
              }
              className="w-full rounded-xl border border-line bg-paper px-3 py-2.5"
            >
              {(Object.keys(SALE_MODE_LABEL) as SaleMode[]).map((mode) => (
                <option key={mode} value={mode}>
                  {SALE_MODE_LABEL[mode]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">상품명</span>
            <input
              required
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  name,
                  slug:
                    prev.slug ||
                    name
                      .toLowerCase()
                      .replace(/\s+/g, "-")
                      .replace(/[^a-z0-9-]/g, ""),
                }));
              }}
              className="w-full rounded-xl border border-line bg-paper px-3 py-2.5"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">URL 슬러그</span>
            <input
              required
              value={form.slug}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, slug: e.target.value }))
              }
              className="w-full rounded-xl border border-line bg-paper px-3 py-2.5"
              placeholder="blog-content"
            />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block font-medium">한 줄 설명</span>
            <input
              value={form.summary}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, summary: e.target.value }))
              }
              className="w-full rounded-xl border border-line bg-paper px-3 py-2.5"
            />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block font-medium">상세 설명</span>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              className="w-full rounded-xl border border-line bg-paper px-3 py-2.5"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">썸네일 URL</span>
            <input
              value={form.thumbnailUrl}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, thumbnailUrl: e.target.value }))
              }
              className="w-full rounded-xl border border-line bg-paper px-3 py-2.5"
              placeholder="https://..."
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">시작가격 (비우면 상담 후 확정)</span>
            <input
              type="number"
              value={form.startingPrice}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, startingPrice: e.target.value }))
              }
              className="w-full rounded-xl border border-line bg-paper px-3 py-2.5"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">제작기간 안내</span>
            <input
              value={form.durationLabel}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, durationLabel: e.target.value }))
              }
              className="w-full rounded-xl border border-line bg-paper px-3 py-2.5"
              placeholder="예: 7~14일"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">정렬</span>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, sortOrder: e.target.value }))
              }
              className="w-full rounded-xl border border-line bg-paper px-3 py-2.5"
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-deep"
            >
              상품 등록
            </button>
            {message && (
              <p className="mt-3 text-sm text-muted">{message}</p>
            )}
          </div>
        </form>
      </div>

      <div className="overflow-x-auto rounded-[1.5rem] border border-line bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-line bg-paper text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">상품</th>
              <th className="px-4 py-3 font-medium">카테고리</th>
              <th className="px-4 py-3 font-medium">판매방식</th>
              <th className="px-4 py-3 font-medium">시작가</th>
              <th className="px-4 py-3 font-medium">공개</th>
              <th className="px-4 py-3 font-medium">관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-muted" colSpan={6}>
                  불러오는 중...
                </td>
              </tr>
            ) : allProducts.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-muted" colSpan={6}>
                  등록된 상품이 없습니다.
                </td>
              </tr>
            ) : (
              allProducts.map((product) => (
                <tr key={product.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{product.name}</p>
                    <p className="text-xs text-muted">{product.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {product.categoryName}
                  </td>
                  <td className="px-4 py-3">
                    {SALE_MODE_LABEL[product.saleMode]}
                  </td>
                  <td className="px-4 py-3">
                    {formatPriceLabel(product.startingPrice)}
                  </td>
                  <td className="px-4 py-3">
                    {product.published ? "공개" : "비공개"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/services/${product.categorySlug}/${product.slug}`}
                        className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold"
                        target="_blank"
                      >
                        보기
                      </Link>
                      <button
                        type="button"
                        onClick={() => togglePublish(product)}
                        className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold"
                      >
                        {product.published ? "비공개" : "공개"}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeProduct(product.id)}
                        className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-accent-deep"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
