"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/tms/AppShell";
import { useAuth } from "@/lib/auth-context";
import { taskStore, connectionStore, templateStore, type User, type Task } from "@/lib/store";
import { ArrowLeft, Zap } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function NewTaskForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [deps, setDeps] = useState<string[]>([]);
  const [depInput, setDepInput] = useState("");
  const [connections, setConnections] = useState<User[]>([]);
  const [templates, setTemplates] = useState<ReturnType<typeof templateStore.getAll>>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [autoAssign, setAutoAssign] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setConnections(connectionStore.getConnectedUsers(user.id));
    setAssignedToId(user.id);
    setAllTasks(taskStore.getAll());
    setTemplates(templateStore.getAll()); // safe inside useEffect (client only)
    // Pre-fill from template if ?template= param
    const tplId = searchParams.get("template");
    if (tplId) {
      const tpl = templateStore.getById(tplId);
      if (tpl) { setTitle(tpl.title); setDescription(tpl.description ?? ""); }
    }
  }, [user, searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");
    if (!title.trim()) { setError("Title is required."); return; }
    setLoading(true);

    let task;
    if (autoAssign && connections.length > 0) {
      task = taskStore.autoAssignByWorkload(user.id, { title, description, deadline: deadline || undefined }, connections.map((c) => c.id));
    } else {
      task = taskStore.create(user.id, {
        title, description, deadline: deadline || undefined,
        assignedToId: assignedToId || user.id,
        dependencies: deps.filter((d) => d.trim()),
      });
    }
    setLoading(false);
    router.push(`/tasks/${task.id}`);
  };

  const addDep = () => {
    if (depInput.trim() && !deps.includes(depInput.trim())) {
      setDeps([...deps, depInput.trim()]);
      setDepInput("");
    }
  };

  if (!user) return null;

  const myTemplates = templates; // show all available templates

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/tasks" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create New Task</h1>
          <p className="text-muted-foreground text-sm">Fill in the details. A unique Task ID will be auto-assigned.</p>
        </div>
      </div>

      {/* Template quick-fill */}
      {myTemplates.length > 0 && (
        <div className="bg-muted/50 rounded-xl p-4 border border-border">
          <p className="text-sm font-medium text-foreground mb-2">Use a template</p>
          <div className="flex flex-wrap gap-2">
            {myTemplates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => { setTitle(t.title); setDescription(t.description); }}
                className="px-3 py-1 bg-card border border-border rounded-lg text-xs font-medium hover:border-primary hover:text-primary transition-colors"
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5 bg-card rounded-xl border border-border p-6">
        <div>
          <label className="block text-sm font-medium mb-1.5">Title <span className="text-destructive">*</span></label>
          <input
            type="text" required placeholder="What needs to be done?"
            className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={title} onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Description</label>
          <textarea
            rows={4} placeholder="Describe the task in detail..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            value={description} onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Deadline (optional)</label>
          <input
            type="date"
            className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={deadline} onChange={(e) => setDeadline(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Assign To</label>
          <div className="flex items-center gap-3 mb-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox" checked={autoAssign} onChange={(e) => setAutoAssign(e.target.checked)}
                className="rounded"
              />
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Auto-assign to least busy connection (TMS-40)
              </span>
            </label>
          </div>
          {!autoAssign && (
            <select
              className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)}
            >
              <option value={user.id}>Myself ({user.name})</option>
              {connections.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
              ))}
            </select>
          )}
          {autoAssign && connections.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">No connections yet — task will be assigned to you.</p>
          )}
        </div>

        {/* Task Dependencies */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Dependencies (optional)</label>
          <div className="flex gap-2">
            <select
              className="flex-1 px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={depInput} onChange={(e) => setDepInput(e.target.value)}
            >
              <option value="">Select a task dependency...</option>
              {allTasks.filter((t) => t.id !== undefined).map((t) => (
                <option key={t.id} value={t.id}>{t.id} — {t.title}</option>
              ))}
            </select>
            <button type="button" onClick={addDep} className="px-3 py-2 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors">
              Add
            </button>
          </div>
          {deps.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {deps.map((d) => (
                <span key={d} className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-mono">
                  {d}
                  <button type="button" onClick={() => setDeps(deps.filter((x) => x !== d))} className="hover:text-destructive">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit" disabled={loading}
            className="flex-1 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Task"}
          </button>
          <Link href="/tasks" className="px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors text-foreground">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function NewTaskPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-6">Loading...</div>}>
        <NewTaskForm />
      </Suspense>
    </AppShell>
  );
}
