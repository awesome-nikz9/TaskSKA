"use client"
import { useTaskStore } from "@/lib/store"
import { Menu, Bell, Plus } from "lucide-react"
import { useState } from "react"
import CreateTaskModal from "@/components/tasks/CreateTaskModal"

interface Props { onMenuClick: () => void }

const viewTitles: Record<string, string> = {
  dashboard: "Dashboard",
  tasks: "My Tasks",
  sprints: "Sprint Board",
  connections: "Connections",
  search: "Search & Filter",
  workload: "Workload Analytics",
  notifications: "Notifications",
  templates: "Task Templates",
  dependencies: "Task Dependencies",
  automation: "Automation Rules",
  testing: "Testing & QA",
  settings: "Settings & MFA",
  admin: "Admin Panel",
}

export default function Topbar({ onMenuClick }: Props) {
  const { currentUser, activeView, notifications } = useTaskStore()
  const [showCreate, setShowCreate] = useState(false)
  const unread = notifications.filter((n) => n.userId === currentUser?.id && !n.read).length

  return (
    <>
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-muted transition">
            <Menu className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="font-semibold text-foreground text-base leading-none">{viewTitles[activeView] || "TaskSKA"}</h1>
            <p className="text-xs text-muted-foreground mt-0.5 leading-none">
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreate(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>

          <button className="relative p-2 rounded-lg hover:bg-muted transition">
            <Bell className="w-5 h-5 text-muted-foreground" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
            {currentUser?.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
        </div>
      </header>

      {showCreate && <CreateTaskModal onClose={() => setShowCreate(false)} />}
    </>
  )
}
