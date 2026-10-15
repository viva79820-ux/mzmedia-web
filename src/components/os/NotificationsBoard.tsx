"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Notification = {
  id: string;
  kind: string;
  title: string;
  body: string;
  href: string;
  readAt: string | null;
  createdAt: string;
};

export function NotificationsBoard() {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  async function load() {
    const res = await fetch("/api/os/notifications");
    if (!res.ok) return;
    const data = (await res.json()) as {
      notifications: Notification[];
      unread: number;
    };
    setItems(data.notifications);
    setUnread(data.unread);
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function markRead(id: string) {
    await fetch("/api/os/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load();
  }

  async function markAll() {
    await fetch("/api/os/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    await load();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">알림</h1>
          <p className="mt-1 text-sm text-muted">
            납기·미수·다음 연락·업무 마감을 모읍니다. 미읽음 {unread}건
          </p>
        </div>
        <button
          type="button"
          onClick={markAll}
          className="rounded-full border border-line px-4 py-2 text-sm font-semibold"
        >
          모두 읽음
        </button>
      </div>

      <ul className="space-y-2">
        {items.length === 0 && (
          <li className="rounded-2xl border border-line bg-white p-4 text-sm text-muted">
            알림이 없습니다.
          </li>
        )}
        {items.map((n) => (
          <li
            key={n.id}
            className={`rounded-2xl border border-line p-4 ${
              n.readAt ? "bg-white" : "bg-accent/5"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-ink">{n.title}</p>
                <p className="mt-1 text-sm text-muted">{n.body}</p>
                <p className="mt-1 text-xs text-muted">
                  {new Date(n.createdAt).toLocaleString("ko-KR")} · {n.kind}
                </p>
              </div>
              <div className="flex gap-2">
                {n.href && (
                  <Link
                    href={n.href}
                    className="rounded-full border border-line px-3 py-1 text-xs font-semibold"
                  >
                    바로가기
                  </Link>
                )}
                {!n.readAt && (
                  <button
                    type="button"
                    onClick={() => markRead(n.id)}
                    className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white"
                  >
                    읽음
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
