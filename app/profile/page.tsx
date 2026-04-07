"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/tms/AppShell";
import { StatusBadge } from "@/components/tms/StatusBadge";
import { WorkloadBar } from "@/components/tms/WorkloadBar";
import { useAuth } from "@/lib/auth-context";
import { authStore, taskStore, workloadStore } from "@/lib/store";
import type { Task } from "@/lib/store";
import { User, Mail, Calendar, CheckSquare, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workload, setWorkload] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setTasks(taskStore.getAssignedTo(user.id));
    setWorkload(workloadStore.calculate(user.id));
    setName(user.name);
    setEmail(user.email);
  }, [user]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(""); setSuccess("");
    if (!name.trim() || !email.trim()) { setError("Name and email are required."); return; }
    setSaving(true);
    const result = authStore.updateProfile(user.id, name, email);
    setSaving(false);
    if (!result.ok) { setError(result.error || "Update failed."); return; }
    refresh();
    setSuccess("Profile updated successfully.");
    setEditMode(false);
  };

  if (!user) return null;

  const now = new Date();
  const completedTasks = tasks.filter((t) => t.status === "Completed");
  const activeTasks = tasks.filter((t) => t.status !== "Completed");

  return (
    <AppShell>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Your Taskmaster profile and assigned tasks list. (TMS-14, TMS-25)
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile card */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-card rounded-xl border border-border p-5">
              {/* Avatar */}
              <div className="flex flex-col items-center text-center mb-5">
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold mb-3">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <h2 className="font-bold text-foreground text-lg">{user.name}</h2>
                <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full mt-1 font-medium">
                  {user.role === "admin" ? "Admin" : "Taskmaster"}
                </span>
              </div>

              {/* Info */}
              {!editMode ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-sm">
                    <User className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-foreground">{user.name}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-foreground break-all">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                  <button
                    onClick={() => setEditMode(true)}
                    className="w-full mt-2 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                  >
                    Edit Profile
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-3">
                  {error && <div className="p-2 rounded-lg bg-destructive/10 text-destructive text-xs">{error}</div>}
                  {success && <div className="p-2 rounded-lg bg-green-50 text-green-700 text-xs border border-green-200">{success}</div>}
                  <div>
                    <label className="block text-xs font-medium mb-1">Full Name</label>
                    <input
                      type="text" required
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      value={name} onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Email Address</label>
                    <input
                      type="email" required
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      value={email} onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={saving} className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button type="button" onClick={() => { setEditMode(false); setError(""); }} className="flex-1 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Stats */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total tasks</span>
                  <span className="font-bold">{tasks.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-bold text-green-600">{completedTasks.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Active</span>
                  <span className="font-bold text-blue-600">{activeTasks.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Completion rate</span>
                  <span className="font-bold">
                    {tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Workload */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">My Workload</h3>
              <WorkloadBar pct={workload} />
              <p className="text-xs text-muted-foreground mt-2">
                Based on {activeTasks.length} active tasks this week
              </p>
            </div>

            <Link
              href="/settings"
              className="flex items-center justify-between p-4 bg-card rounded-xl border border-border hover:border-primary/30 transition-colors group"
            >
              <span className="text-sm font-medium">Security &amp; MFA Settings</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          </div>

          {/* Assigned tasks list */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl border border-border">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-primary" />
                  Assigned Tasks List
                </h2>
                <span className="text-xs text-muted-foreground">Sorted by deadline (earliest first)</span>
              </div>

              {tasks.length === 0 ? (
                <div className="p-10 text-center">
                  <CheckSquare className="w-10 h-10 text-muted mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No tasks assigned to you yet.</p>
                  <Link href="/tasks/new" className="mt-2 inline-block text-sm text-primary hover:underline">
                    Create your first task
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {tasks.map((t) => {
                    const isOverdue = t.deadline && new Date(t.deadline) < now && t.status !== "Completed";
                    return (
                      <Link
                        key={t.id}
                        href={`/tasks/${t.id}`}
                        className="flex items-center gap-4 px-4 py-3.5 hover:bg-muted/30 transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-mono text-muted-foreground">{t.id}</span>
                            {isOverdue && (
                              <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Overdue
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {t.title}
                          </p>
                          {t.deadline && (
                            <p className={`text-xs mt-0.5 ${isOverdue ? "text-red-500" : "text-muted-foreground"}`}>
                              Due {new Date(t.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          )}
                          {!t.deadline && (
                            <p className="text-xs text-muted-foreground mt-0.5">No deadline</p>
                          )}
                        </div>
                        <StatusBadge status={t.status} />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
