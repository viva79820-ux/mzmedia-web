"use client";

import { useEffect, useMemo, useState } from "react";
import {
  TASK_PRIORITY_LABEL,
  TASK_STATUS_LABEL,
  todayKey,
} from "@/lib/os";

type Task = {
  id: string;
  title: string;
  status: keyof typeof TASK_STATUS_LABEL;
  priority: keyof typeof TASK_PRIORITY_LABEL;
  dueDate: string;
  progress: number;
  project?: { name: string } | null;
  assignee?: { name: string } | null;
};

export function TasksBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(todayKey());
  const today = todayKey();

  async function load() {
    const res = await fetch("/api/os/tasks?scope=mine");
    if (!res.ok) return;
    setTasks(((await res.json()) as { tasks: Task[] }).tasks);
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  const buckets = useMemo(() => {
    const open = tasks.filter((t) => t.status !== "DONE");
    return {
      today: open.filter((t) => t.dueDate === today || !t.dueDate),
      soon: open.filter(
        (t) => t.dueDate && t.dueDate > today && t.dueDate <= addDays(today, 3),
      ),
      overdue: open.filter((t) => t.dueDate && t.dueDate < today),
      doing: open.filter((t) => t.status === "IN_PROGRESS"),
      done: tasks.filter((t) => t.status === "DONE").slice(0, 20),
    };
  }, [tasks, today]);

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/os/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, dueDate }),
    });
    setTitle("");
    await load();
  }

  async function setStatus(id: string, status: string) {
    await fetch("/api/os/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await load();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">내 업무</h1>
        <p className="mt-1 text-sm text-muted">
          오늘 / 마감 임박 / 지연 / 진행중 / 완료를 한눈에 확인합니다.
        </p>
      </div>

      <form
        onSubmit={createTask}
        className="flex flex-wrap gap-2 rounded-2xl border border-line bg-white p-4"
      >
        <input
          required
          placeholder="업무명"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="min-w-[220px] flex-1 rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          업무 추가
        </button>
      </form>

      {(
        [
          ["오늘 업무", buckets.today],
          ["마감 임박", buckets.soon],
          ["지연 업무", buckets.overdue],
          ["진행중", buckets.doing],
          ["완료", buckets.done],
        ] as const
      ).map(([label, list]) => (
        <section
          key={label}
          className="rounded-2xl border border-line bg-white p-4"
        >
          <h2 className="font-semibold text-ink">
            {label}{" "}
            <span className="text-sm font-normal text-muted">({list.length})</span>
          </h2>
          <ul className="mt-3 space-y-2">
            {list.length === 0 && (
              <li className="text-sm text-muted">없음</li>
            )}
            {list.map((task) => (
              <li
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-paper px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-xs text-muted">
                    {TASK_PRIORITY_LABEL[task.priority]} ·{" "}
                    {task.dueDate || "마감 없음"}
                    {task.project ? ` · ${task.project.name}` : ""}
                  </p>
                </div>
                <select
                  value={task.status}
                  onChange={(e) => setStatus(task.id, e.target.value)}
                  className="rounded-lg border border-line bg-white px-2 py-1 text-xs"
                >
                  {Object.entries(TASK_STATUS_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
