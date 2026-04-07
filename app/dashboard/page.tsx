"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/tms/AppShell";
import { StatusBadge } from "@/components/tms/StatusBadge";
import { WorkloadBar } from "@/components/tms/WorkloadBar";
import { useAuth } from "@/lib/auth-context";
import { taskStore, connectionStore, notificationStore, workloadStore, type Task, type User } from "@/lib/store";
import { CheckSquare, Users, Bell, TrendingUp, Clock, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [connections, setConnections] = useState<User[]>([]);
  const [unread, setUnread] = useState(0);
  const [myWorkload, setMyWorkload] = useState(0);

  useEffect(() => {
    if (!user) return;
    setTasks(taskStore.getAssignedTo(user.id));
    setConnections(connectionStore.getConnectedUsers(user.id));
    setUnread(notificationStore.getUnreadCount(user.id));
    setMyWorkload(workloadStore.calculate(user.id));
  }, [user]);

  if (!user) return null;

  const stats = [
    { label: "My Tasks", value: tasks.length, icon: CheckSquare, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "In Progress", value: tasks.filter((t) => t.status === "In Progress").length, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Connections", value: connections.length, icon: Users, color: "text-green-600", bg: "bg-green-50" },
    { label: "Notifications", value: unread, icon: Bell, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  const now = new Date();
  const overdue = tasks.filter((t) => t.deadline && new Date(t.deadline) < now && t.status !== "Completed");

  return (
    <AppShell>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {user.name.split(" ")[0]}!
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <Link
            href="/tasks/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> New Task
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-card rounded-xl p-4 border border-border">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Overdue alert */}
        {overdue.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <p className="font-semibold text-red-700 text-sm">
                {overdue.length} overdue task{overdue.length > 1 ? "s" : ""}
              </p>
              <p className="text-red-600 text-xs mt-0.5">
                {overdue.map((t) => t.title).join(", ")}
              </p>
            </div>
            <Link href="/tasks" className="ml-auto text-xs font-medium text-red-600 hover:underline whitespace-nowrap">View all</Link>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* My Tasks */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Assigned Tasks</h2>
              <Link href="/tasks" className="flex items-center gap-1 text-xs text-primary hover:underline">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {tasks.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No tasks assigned yet.{" "}
                  <Link href="/tasks/new" className="text-primary hover:underline">Create one</Link>
                </div>
              )}
              {tasks.slice(0, 6).map((t) => (
                <Link key={t.id} href={`/tasks/${t.id}`} className="flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs text-muted-foreground font-mono">{t.id}</span>
                      {t.deadline && new Date(t.deadline) < now && t.status !== "Completed" && (
                        <span className="text-xs text-red-600 font-medium">Overdue</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{t.title}</p>
                    {t.deadline && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Due {new Date(t.deadline).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={t.status} />
                </Link>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* My Workload */}
            <div className="bg-card rounded-xl border border-border p-4">
              <h2 className="font-semibold text-foreground mb-4">My Workload</h2>
              <WorkloadBar pct={myWorkload} />
              <p className="text-xs text-muted-foreground mt-2">
                Based on {tasks.filter((t) => t.status !== "Completed").length} active tasks
              </p>
            </div>

            {/* Team Workload */}
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground">Team Workload</h2>
                <Link href="/connections" className="text-xs text-primary hover:underline">View all</Link>
              </div>
              {connections.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No connections yet.{" "}
                  <Link href="/connections" className="text-primary hover:underline">Add some</Link>
                </p>
              ) : (
                <div className="space-y-3">
                  {connections.slice(0, 4).map((c) => (
                    <div key={c.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium truncate">{c.name}</span>
                        </div>
                      </div>
                      <WorkloadBar pct={workloadStore.calculate(c.id)} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="bg-card rounded-xl border border-border p-4">
              <h2 className="font-semibold text-foreground mb-3">Quick Actions</h2>
              <div className="space-y-2">
                {[
                  { label: "Create Task", href: "/tasks/new" },
                  { label: "Add Connection", href: "/connections" },
                  { label: "Search Tasks", href: "/search" },
                  { label: "View Notifications", href: "/notifications" },
                ].map((a) => (
                  <Link
                    key={a.label}
                    href={a.href}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted text-sm text-foreground transition-colors"
                  >
                    {a.label}
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
