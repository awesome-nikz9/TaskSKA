"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useTaskStore } from "@/lib/store"
import { Bell, Search, X, Settings, User, LogOut, ChevronDown } from "lucide-react"
import { formatDistanceToNow } from "@/lib/date-utils"

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/tasks": "Tasks",
  "/dashboard/kanban": "Kanban Board",
  "/dashboard/sprints": "Sprints",
  "/dashboard/connections": "Connections",
  "/dashboard/workload": "Workload",
  "/dashboard/notifications": "Notifications",
  "/dashboard/templates": "Templates",
  "/dashboard/automation": "Automation",
  "/dashboard/admin": "Admin Panel",
  "/dashboard/settings": "Settings",
}

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser, notifications, tasks, markNotificationRead, setSearchQuery, searchQuery, logout } = useTaskStore()
  const [showNotifs, setShowNotifs] = useState(false)
  const [showUser, setShowUser] = useState(false)
  const [localSearch, setLocalSearch] = useState("")
  const notifRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  const unread = notifications.filter((n) => n.userId === currentUser?.id && !n.read)
  const userNotifs = notifications.filter((n) => n.userId === currentUser?.id).slice(0, 6)

  const title = PAGE_TITLES[pathname] ?? "TaskSKA"

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUser(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchQuery(localSearch)
    if (localSearch.trim()) router.push("/dashboard/tasks")
  }

  const notifIcons: Record<string, string> = {
    task_assigned: "🔵",
    status_update: "🟡",
    connection_request: "🟢",
    connection_accepted: "✅",
    overdue_alert: "🔴",
    dependency_blocked: "🟠",
  }

  return (
    <header className="flex items-center justify-between px-6 py-3.5 bg-card border-b border-border shrink-0">
      <div>
        <h1 className="text-lg font-bold text-foreground">{title}</h1>
        <p className="text-xs text-muted-foreground hidden sm:block">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <form onSubmit={handleSearch} className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search tasks..."
            className="pl-9 pr-8 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary w-52"
          />
          {localSearch && (
            <button type="button" onClick={() => { setLocalSearch(""); setSearchQuery("") }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition"
          >
            <Bell className="w-4 h-4" />
            {unread.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                {unread.length > 9 ? "9+" : unread.length}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-11 w-80 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="font-semibold text-foreground text-sm">Notifications</span>
                {unread.length > 0 && (
                  <span className="text-xs text-primary font-medium">{unread.length} unread</span>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {userNotifs.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-8">No notifications</p>
                ) : (
                  userNotifs.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => { markNotificationRead(n.id); setShowNotifs(false) }}
                      className={`w-full text-left px-4 py-3 hover:bg-muted/50 border-b border-border/50 transition ${!n.read ? "bg-primary/5" : ""}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-base shrink-0 mt-0.5">{notifIcons[n.type] ?? "📌"}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{formatDistanceToNow(n.createdAt)}</p>
                        </div>
                        {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />}
                      </div>
                    </button>
                  ))
                )}
              </div>
              <div className="px-4 py-2.5 border-t border-border">
                <Link href="/dashboard/notifications" onClick={() => setShowNotifs(false)} className="text-xs text-primary hover:underline font-medium">
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => setShowUser(!showUser)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background hover:border-primary transition"
          >
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white text-xs font-bold">{currentUser?.name?.[0]?.toUpperCase()}</span>
            </div>
            <span className="text-sm font-medium text-foreground hidden sm:block max-w-24 truncate">{currentUser?.name?.split(" ")[0]}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
          </button>

          {showUser && (
            <div className="absolute right-0 top-11 w-52 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground">{currentUser?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{currentUser?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold capitalize">{currentUser?.role}</span>
              </div>
              <div className="p-1.5">
                <Link href="/dashboard/settings" onClick={() => setShowUser(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-foreground hover:bg-muted transition">
                  <Settings className="w-4 h-4" /> Settings
                </Link>
                <button
                  onClick={() => { logout(); window.location.href = "/login" }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
