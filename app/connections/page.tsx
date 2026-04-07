"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/tms/AppShell";
import { WorkloadBar } from "@/components/tms/WorkloadBar";
import { useAuth } from "@/lib/auth-context";
import {
  authStore, connectionStore, workloadStore, taskStore,
  type User, type Connection,
} from "@/lib/store";
import {
  UserPlus, Users, Check, X, Mail, Clock, BarChart3,
  ChevronDown, ChevronUp, CheckSquare,
} from "lucide-react";

export default function ConnectionsPage() {
  const { user } = useAuth();
  const [connected, setConnected] = useState<User[]>([]);
  const [pendingIncoming, setPendingIncoming] = useState<Connection[]>([]);
  const [sentPending, setSentPending] = useState<Connection[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    if (!user) return;
    setConnected(connectionStore.getConnectedUsers(user.id));
    setPendingIncoming(connectionStore.getPendingIncoming(user.id));
    setSentPending(
      connectionStore.getAll().filter((c) => c.fromUserId === user.id && c.status === "pending")
    );
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(""); setSuccess(""); setLoading(true);
    const result = connectionStore.sendRequest(user.id, newEmail);
    setLoading(false);
    if (!result.ok) { setError(result.error || "Failed to send request."); return; }
    setSuccess(`Connection request sent to ${newEmail}!`);
    setNewEmail("");
    refresh();
  };

  const handleRespond = (connId: string, action: "accepted" | "declined") => {
    connectionStore.respond(connId, action);
    refresh();
  };

  const allUsers = authStore.getAllUsers();
  const getUserName = (id: string) => allUsers.find((u) => u.id === id)?.name ?? "Unknown";
  const getUserEmail = (id: string) => allUsers.find((u) => u.id === id)?.email ?? "";

  if (!user) return null;

  return (
    <AppShell>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Connections</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Connect with other Taskmasters to assign tasks and monitor workloads. (TMS-27, TMS-28, TMS-29)
          </p>
        </div>

        {/* Send Connection Request */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" /> Send Connection Request
          </h2>
          {error && <div className="mb-3 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
          {success && <div className="mb-3 p-3 rounded-lg bg-green-50 text-green-700 text-sm border border-green-200">{success}</div>}
          <form onSubmit={handleSendRequest} className="flex gap-3">
            <div className="flex-1 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email" required
                placeholder="Enter collaborator&apos;s email address"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? "Sending..." : "Send Request"}
            </button>
          </form>
          <p className="text-xs text-muted-foreground mt-2">
            Enter the email address of another TaskSKA user to start collaborating.
          </p>
        </div>

        {/* Incoming Pending Requests */}
        {pendingIncoming.length > 0 && (
          <div className="bg-amber-50/50 rounded-xl border border-amber-200 p-5">
            <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Incoming Requests
              <span className="bg-amber-500 text-white text-xs rounded-full px-2 py-0.5">{pendingIncoming.length}</span>
            </h2>
            <div className="space-y-3">
              {pendingIncoming.map((conn) => (
                <div key={conn.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-200">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                      {getUserName(conn.fromUserId).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{getUserName(conn.fromUserId)}</p>
                      <p className="text-xs text-muted-foreground">{getUserEmail(conn.fromUserId)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRespond(conn.id, "accepted")}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" /> Accept
                    </button>
                    <button
                      onClick={() => handleRespond(conn.id, "declined")}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-300 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sent Requests */}
        {sentPending.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" /> Sent Requests (Awaiting Response)
            </h2>
            <div className="space-y-2">
              {sentPending.map((conn) => (
                <div key={conn.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold">
                      {getUserEmail(conn.toUserId).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm text-foreground font-medium">{getUserName(conn.toUserId)}</p>
                      <p className="text-xs text-muted-foreground">{getUserEmail(conn.toUserId)}</p>
                    </div>
                  </div>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Pending</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connected Users */}
        <div className="bg-card rounded-xl border border-border">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              My Connections
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{connected.length}</span>
            </h2>
          </div>

          {connected.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-muted mx-auto mb-3" />
              <p className="text-muted-foreground text-sm font-medium">No connections yet</p>
              <p className="text-muted-foreground text-xs mt-1">Send a connection request above to start collaborating.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {connected.map((c) => {
                const workload = workloadStore.calculate(c.id);
                const userTasks = taskStore.getAssignedTo(c.id);
                const activeTasks = userTasks.filter((t) => t.status !== "Completed");
                const isExpanded = expanded === c.id;

                return (
                  <div key={c.id}>
                    <div
                      className="flex items-center gap-4 p-4 hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => setExpanded(isExpanded ? null : c.id)}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </div>
                      <div className="hidden sm:flex items-center gap-6">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>{activeTasks.length} active</span>
                        </div>
                        <div className="flex items-center gap-2 w-40">
                          <BarChart3 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <WorkloadBar pct={workload} compact />
                        </div>
                      </div>
                      {isExpanded
                        ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                      }
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 bg-muted/20 border-t border-border">
                        <div className="grid sm:grid-cols-2 gap-4 pt-3">
                          <div className="space-y-3">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Profile</h3>
                            <div className="space-y-1.5 text-sm">
                              {[
                                ["Name", c.name],
                                ["Email", c.email],
                                ["Role", "Taskmaster"],
                                ["Member since", new Date(c.createdAt).toLocaleDateString()],
                              ].map(([label, value]) => (
                                <div key={label} className="flex gap-2">
                                  <span className="text-muted-foreground w-24 shrink-0">{label}</span>
                                  <span className="font-medium break-all">{value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Workload this week (TMS-33)</h3>
                            <WorkloadBar pct={workload} />
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {(["Not Started", "In Progress", "Blocked", "Completed"] as const).map((s) => (
                                <div key={s} className="flex items-center justify-between bg-white rounded p-2 border border-border">
                                  <span className="text-muted-foreground">{s}</span>
                                  <span className="font-semibold">{userTasks.filter((t) => t.status === s).length}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
