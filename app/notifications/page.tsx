"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/tms/AppShell";
import { useAuth } from "@/lib/auth-context";
import { notificationStore, authStore, type Notification } from "@/lib/store";
import { Bell, CheckCheck, Trash2, Clock, User2, AlertTriangle, CheckSquare, Link2 } from "lucide-react";
import Link from "next/link";

function getIcon(type: Notification["type"]) {
  switch (type) {
    case "task_assigned": return <CheckSquare className="w-4 h-4 text-blue-500" />;
    case "status_update": return <Link2 className="w-4 h-4 text-purple-500" />;
    case "overdue": return <AlertTriangle className="w-4 h-4 text-red-500" />;
    case "connection_request": return <User2 className="w-4 h-4 text-green-500" />;
    case "overdue": return <AlertTriangle className="w-4 h-4 text-red-500" />;
    default: return <Bell className="w-4 h-4 text-muted-foreground" />;
  }
}

function getTypeLabel(type: Notification["type"]) {
  switch (type) {
    case "task_assigned": return "Task Assigned";
    case "status_update": return "Status Updated";
    case "connection_request": return "Connection Request";
    case "overdue": return "Overdue";
    default: return "Notification";
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filterType, setFilterType] = useState<Notification["type"] | "all">("all");

  const refresh = useCallback(() => {
    if (user) setNotifications(notificationStore.getForUser(user.id));
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleMarkRead = (id: string) => {
    notificationStore.markRead(id);
    refresh();
  };

  const handleMarkAllRead = () => {
    if (user) { notificationStore.markAllRead(user.id); refresh(); }
  };

  const handleDelete = (id: string) => {
    notificationStore.remove(id);
    refresh();
  };

  const filtered = filterType === "all" ? notifications : notifications.filter((n) => n.type === filterType);
  const unread = notifications.filter((n) => !n.read).length;

  const filters: { value: Notification["type"] | "all"; label: string }[] = [
    { value: "all", label: "All" },
    { value: "task_assigned", label: "Assigned" },
    { value: "status_update", label: "Status Updates" },
    { value: "connection_request", label: "Connections" },
    { value: "overdue", label: "Overdue" },
  ];

  if (!user) return null;

  return (
    <AppShell>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              Notifications
              {unread > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-medium">
                  {unread}
                </span>
              )}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Task assignments, status changes, and connection requests. (TMS-35, TMS-36, TMS-37)
            </p>
          </div>
          {unread > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-4 py-2 bg-muted text-muted-foreground hover:bg-muted/80 text-sm font-medium rounded-lg transition-colors"
            >
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => {
            const count = f.value === "all" ? notifications.length : notifications.filter((n) => n.type === f.value).length;
            return (
              <button
                key={f.value}
                onClick={() => setFilterType(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                  ${filterType === f.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              >
                {f.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Notifications list */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="w-10 h-10 text-muted mx-auto mb-3" />
              <p className="text-muted-foreground text-sm font-medium">No notifications</p>
              <p className="text-muted-foreground text-xs mt-1">
                {filterType === "all" ? "You're all caught up!" : "No notifications of this type."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-4 p-4 transition-colors ${!n.read ? "bg-blue-50/50" : "hover:bg-muted/20"}`}
                >
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${!n.read ? "bg-white shadow-sm" : "bg-muted/50"}`}>
                    {getIcon(n.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {getTypeLabel(n.type)}
                      </span>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-foreground leading-snug">{n.message}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
                      {n.linkId && (
                        <Link
                          href={`/tasks/${n.linkId}`}
                          className="text-xs text-primary hover:underline ml-1"
                        >
                          View task →
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!n.read && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        title="Mark as read"
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(n.id)}
                      title="Remove"
                      className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
