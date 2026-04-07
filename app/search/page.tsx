"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/tms/AppShell";
import { StatusBadge } from "@/components/tms/StatusBadge";
import { useAuth } from "@/lib/auth-context";
import { taskStore, connectionStore, authStore } from "@/lib/store";
import type { Task } from "@/lib/store";
import { Search, Calendar, Hash, FileText, AlignLeft, X } from "lucide-react";
import Link from "next/link";

export default function SearchPage() {
  const { user } = useAuth();

  const [queryId, setQueryId] = useState("");
  const [queryTitle, setQueryTitle] = useState("");
  const [queryDesc, setQueryDesc] = useState("");
  const [queryDeadline, setQueryDeadline] = useState("");
  const [results, setResults] = useState<Task[]>([]);
  const [searched, setSearched] = useState(false);
  const [connectedIds, setConnectedIds] = useState<string[]>([]);
  const allUsers = authStore.getAllUsers();

  useEffect(() => {
    if (user) {
      const conns = connectionStore.getConnectedUsers(user.id);
      setConnectedIds(conns.map((c) => c.id));
    }
  }, [user]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;
    const res = taskStore.search(user.id, connectedIds, {
      id: queryId.trim() || undefined,
      title: queryTitle.trim() || undefined,
      description: queryDesc.trim() || undefined,
      deadline: queryDeadline || undefined,
    });
    setResults(res);
    setSearched(true);
  };

  const clearAll = () => {
    setQueryId(""); setQueryTitle(""); setQueryDesc(""); setQueryDeadline("");
    setResults([]); setSearched(false);
  };

  const hasFilters = queryId || queryTitle || queryDesc || queryDeadline;
  const getAssigneeName = (id: string) => allUsers.find((u) => u.id === id)?.name || "Unknown";
  const now = new Date();

  if (!user) return null;

  return (
    <AppShell>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Search Tasks</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Search across your tasks and all your connections&apos; tasks. (TMS-30, TMS-31)
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="bg-card rounded-xl border border-border p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Task ID */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
                <Hash className="w-3.5 h-3.5 text-muted-foreground" /> Task ID
              </label>
              <input
                type="text" placeholder="e.g. TMS-101"
                className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                value={queryId} onChange={(e) => setQueryId(e.target.value)}
              />
            </div>

            {/* Title */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" /> Title
              </label>
              <input
                type="text" placeholder="Search by title..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={queryTitle} onChange={(e) => setQueryTitle(e.target.value)}
              />
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
                <AlignLeft className="w-3.5 h-3.5 text-muted-foreground" /> Description
              </label>
              <input
                type="text" placeholder="Search in description..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={queryDesc} onChange={(e) => setQueryDesc(e.target.value)}
              />
            </div>

            {/* Deadline */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Deadline
              </label>
              <input
                type="date"
                className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={queryDeadline} onChange={(e) => setQueryDeadline(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:opacity-90 transition-opacity"
            >
              <Search className="w-4 h-4" /> Search
            </button>
            {hasFilters && (
              <button
                type="button" onClick={clearAll}
                className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>
        </form>

        {/* Results */}
        {searched && (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <span className="text-sm font-semibold text-foreground">
                {results.length} result{results.length !== 1 ? "s" : ""} found
              </span>
              {results.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  Across your tasks and {connectedIds.length} connection{connectedIds.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {results.length === 0 ? (
              <div className="p-12 text-center">
                <Search className="w-10 h-10 text-muted mx-auto mb-3" />
                <p className="text-muted-foreground text-sm font-medium">No tasks match your search</p>
                <p className="text-muted-foreground text-xs mt-1">Try different keywords or broaden your filters.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {results.map((t) => {
                  const isOverdue = t.deadline && new Date(t.deadline) < now && t.status !== "Completed";
                  const isMyTask = t.assignedToId === user.id;
                  return (
                    <Link
                      key={t.id}
                      href={`/tasks/${t.id}`}
                      className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{t.id}</span>
                          {isOverdue && (
                            <span className="text-xs text-red-600 font-medium">Overdue</span>
                          )}
                          {!isMyTask && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                              Assigned to {getAssigneeName(t.assignedToId)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{t.title}</p>
                        {t.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          {t.deadline && (
                            <span className={`flex items-center gap-1 text-xs ${isOverdue ? "text-red-600" : "text-muted-foreground"}`}>
                              <Calendar className="w-3 h-3" />
                              {new Date(t.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={t.status} />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!searched && (
          <div className="bg-muted/30 rounded-xl border border-dashed border-border p-12 text-center">
            <Search className="w-10 h-10 text-muted mx-auto mb-3" />
            <p className="text-muted-foreground text-sm font-medium">Enter search terms above</p>
            <p className="text-muted-foreground text-xs mt-1">
              You can search by any combination of ID, title, description, or deadline.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
