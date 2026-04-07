"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/tms/AppShell";
import { StatusBadge } from "@/components/tms/StatusBadge";
import { useAuth } from "@/lib/auth-context";
import { taskStore, type Task, type TaskStatus } from "@/lib/store";
import { Plus, Filter } from "lucide-react";

const STATUSES: TaskStatus[] = ["Not Started", "In Progress", "Blocked", "Completed"];

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskStatus | "All">("All");

  useEffect(() => {
    if (user) setTasks(taskStore.getAssignedTo(user.id));
  }, [user]);

  const filtered = filter === "All" ? tasks : tasks.filter((t) => t.status === filter);
  const now = new Date();

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Tasks</h1>
            <p className="text-muted-foreground text-sm">{tasks.length} task{tasks.length !== 1 ? "s" : ""} assigned to you, sorted by deadline</p>
          </div>
          <Link
            href="/tasks/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> New Task
          </Link>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {(["All", ...STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                ${filter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {s}
              <span className="ml-1.5 opacity-70">
                ({s === "All" ? tasks.length : tasks.filter((t) => t.status === s).length})
              </span>
            </button>
          ))}
        </div>

        {/* Task list */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-4 py-2.5 bg-muted/50 text-xs font-medium text-muted-foreground border-b border-border">
            <div className="col-span-2">Task ID</div>
            <div className="col-span-4">Title</div>
            <div className="col-span-2">Deadline</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Action</div>
          </div>
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground text-sm">No tasks found.</p>
              <Link href="/tasks/new" className="mt-2 inline-block text-sm text-primary hover:underline">
                Create your first task
              </Link>
            </div>
          ) : (
            filtered.map((t) => {
              const isOverdue = t.deadline && new Date(t.deadline) < now && t.status !== "Completed";
              return (
                <div key={t.id} className="grid grid-cols-12 gap-4 px-4 py-3.5 border-b border-border last:border-0 hover:bg-muted/30 transition-colors items-center">
                  <div className="col-span-2">
                    <span className="text-xs font-mono text-muted-foreground">{t.id}</span>
                  </div>
                  <div className="col-span-4">
                    <p className="text-sm font-medium text-foreground truncate">{t.title}</p>
                    {t.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{t.description}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    {t.deadline ? (
                      <span className={`text-xs ${isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                        {isOverdue && "Overdue · "}
                        {new Date(t.deadline).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No deadline</span>
                    )}
                  </div>
                  <div className="col-span-2">
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="col-span-2 text-right">
                    <Link
                      href={`/tasks/${t.id}`}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      View details
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}
