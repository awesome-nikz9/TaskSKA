"use client";

import { type TaskStatus } from "@/lib/store";

const config: Record<TaskStatus, { bg: string; text: string; dot: string }> = {
  "Not Started": { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  "In Progress": { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  "Blocked": { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  "Completed": { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}
