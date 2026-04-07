"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/tms/AppShell";
import { StatusBadge } from "@/components/tms/StatusBadge";
import { useAuth } from "@/lib/auth-context";
import { taskStore, authStore, type Task, type TaskStatus } from "@/lib/store";
import { ArrowLeft, Calendar, User, Hash, Link as LinkIcon, Trash2, AlertTriangle } from "lucide-react";
import Link from "next/link";

const STATUSES: TaskStatus[] = ["Not Started", "In Progress", "Blocked", "Completed"];

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [creator, setCreator] = useState<string>("");
  const [assignee, setAssignee] = useState<string>("");
  const [depTasks, setDepTasks] = useState<Task[]>([]);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [statusError, setStatusError] = useState("");

  useEffect(() => {
    const t = taskStore.getById(id);
    if (!t) { router.push("/tasks"); return; }
    setTask(t);
    const users = authStore.getAllUsers();
    setCreator(users.find((u) => u.id === t.createdById)?.name ?? "Unknown");
    setAssignee(users.find((u) => u.id === t.assignedToId)?.name ?? "Unknown");
    setDepTasks((t.dependencies ?? []).map((d) => taskStore.getById(d)).filter(Boolean) as Task[]);
  }, [id, router]);

  const handleStatusChange = (status: TaskStatus) => {
    if (!task || !user) return;
    setStatusError("");
    setUpdating(true);
    const result = taskStore.updateStatus(task.id, status, user.id);
    setUpdating(false);
    if (!result.ok) { setStatusError(result.error || "Failed to update status."); return; }
    const updated = taskStore.getById(task.id);
    if (updated) setTask(updated);
  };

  const handleDelete = () => {
    if (!task || !user) return;
    const result = taskStore.delete(task.id, user.id);
    if (!result.ok) { setError(result.error || "Cannot delete."); return; }
    router.push("/tasks");
  };

  const canEdit = user && task && (task.createdById === user.id || task.assignedToId === user.id);

  if (!task) return <AppShell><div className="p-6">Loading...</div></AppShell>;

  const now = new Date();
  const isOverdue = task.deadline && new Date(task.deadline) < now && task.status !== "Completed";

  return (
    <AppShell>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/tasks" className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">{task.id}</span>
              {isOverdue && (
                <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" /> Overdue
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-foreground truncate">{task.title}</h1>
          </div>
        </div>

        {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
        {statusError && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{statusError}</div>}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main details */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-card rounded-xl border border-border p-5">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Description</h2>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {task.description || <span className="text-muted-foreground italic">No description provided.</span>}
              </p>
            </div>

            {/* Status update */}
            {canEdit && (
              <div className="bg-card rounded-xl border border-border p-5">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Update Status</h2>
                <div className="grid grid-cols-2 gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      disabled={updating || task.status === s}
                      onClick={() => handleStatusChange(s)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all
                        ${task.status === s
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:border-primary hover:text-primary"
                        } disabled:opacity-50`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Current: <strong>{task.status}</strong></p>
              </div>
            )}

            {/* Dependencies */}
            {depTasks.length > 0 && (
              <div className="bg-card rounded-xl border border-border p-5">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5" /> Dependencies
                </h2>
                <div className="space-y-2">
                  {depTasks.map((d) => (
                    <Link key={d.id} href={`/tasks/${d.id}`} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div>
                        <span className="text-xs font-mono text-muted-foreground">{d.id}</span>
                        <p className="text-sm font-medium">{d.title}</p>
                      </div>
                      <StatusBadge status={d.status} />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-5 space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Details</h2>

              <div className="flex items-start gap-2.5">
                <Hash className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Task ID</p>
                  <p className="text-sm font-mono font-medium">{task.id}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <StatusBadge status={task.status} />
              </div>

              <div className="flex items-start gap-2.5">
                <User className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Created by</p>
                  <p className="text-sm font-medium">{creator}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <User className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Assigned to</p>
                  <p className="text-sm font-medium">{assignee}</p>
                </div>
              </div>

              {task.deadline && (
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Deadline</p>
                    <p className={`text-sm font-medium ${isOverdue ? "text-red-600" : ""}`}>
                      {new Date(task.deadline).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm">{new Date(task.createdAt).toLocaleDateString()}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Last updated</p>
                <p className="text-sm">{new Date(task.updatedAt).toLocaleDateString()}</p>
              </div>

              {task.completedAt && (
                <div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="text-sm text-green-600">{new Date(task.completedAt).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            {/* Delete */}
            {user && task.createdById === user.id && (
              <button
                onClick={() => setDeleting(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-destructive/30 text-destructive hover:bg-destructive/10 rounded-lg text-sm font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete Task
              </button>
            )}
          </div>
        </div>

        {/* Confirm delete modal */}
        {deleting && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl p-6 max-w-sm w-full border border-border shadow-xl">
              <h3 className="font-bold text-lg mb-2">Delete Task?</h3>
              <p className="text-muted-foreground text-sm mb-5">This will permanently delete &quot;{task.title}&quot;. This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={handleDelete} className="flex-1 py-2.5 bg-destructive text-destructive-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
                  Delete
                </button>
                <button onClick={() => setDeleting(false)} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
