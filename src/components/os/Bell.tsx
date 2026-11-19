"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Note = {
  id: string;
  title: string;
  body: string;
  href: string;
  readAt: string | null;
};

export function Bell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [notes, setNotes] = useState<Note[]>([]);

  async function load() {
    const response = await fetch("/api/os/notifications/inbox");
    if (!response.ok) return;
    const data = (await response.json()) as { unread: number; notifications: Note[] };
    setUnread(data.unread);
    setNotes(data.notifications);
  }

  useEffect(() => {
    const timer = window.setInterval(() => {
      load().catch(() => undefined);
    }, 10000);
    load().catch(() => undefined);
    return () => window.clearInterval(timer);
  }, []);

  async function openNote(note: Note) {
    await fetch("/api/os/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: note.id }),
    });
    setOpen(false);
    if (note.href) router.push(note.href);
    else router.push("/os/notifications");
    load().catch(() => undefined);
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="알림"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-full border border-line bg-white px-3 py-1.5 text-sm"
      >
        종
        {unread > 0 ? (
          <span className="absolute -top-2 -right-2 min-w-5 rounded-full bg-accent px-1.5 text-center text-[11px] font-semibold text-white">
            {unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-line bg-white p-2 shadow-lg">
          {notes.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted">알림이 없습니다.</p>
          ) : (
            notes.map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={() => openNote(note).catch(() => undefined)}
                className="block w-full rounded-lg px-2 py-2 text-left hover:bg-paper"
              >
                <p className={`text-sm ${note.readAt ? "text-muted" : "font-semibold text-ink"}`}>
                  {note.title}
                </p>
                {note.body ? <p className="text-xs text-muted">{note.body}</p> : null}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
