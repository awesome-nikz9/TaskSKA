"use client"
import { useTaskStore } from "@/lib/store"
import { LayoutDashboard, CheckSquare, Users2, Search, Bell, Settings, LogOut, Shield, Layers, BookTemplate, GitBranch, BarChart3, Zap, TestTube, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, group: "main" },
  { id: "tasks", label: "My Tasks", icon: CheckSquare, group: "main" },
  { id: "sprints", label: "Sprints", icon: Layers, group: "main" },
  { id: "connections", label: "Connections", icon: Users2, group: "collaborate" },
  { id: "search", label: "Search & Filter", icon: Search, group: "collaborate" },
  { id: "workload", label: "Workload", icon: BarChart3, group: "analytics" },
  { id: "notifications", label: "Notifications", icon: Bell, group: "analytics" },
  { id: "templates", label: "Templates", icon: BookTemplate, group: "tools" },
  { id: "dependencies", label: "Dependencies", icon: GitBranch, group: "tools" },
  { id: "automation", label: "Automation", icon: Zap, group: "tools" },
  { id: "testing", label: "Testing & QA", icon: TestTube, group: "tools" },
  { id: "settings", label: "Settings & MFA", icon: Settings, group: "system" },
  { id: "admin", label: "Admin Panel", icon: Shield, group: "system", adminOnly: true },
]

const groups = [
  { id: "main", label: "Main" },
  { id: "collaborate", label: "Collaborate" },
  { id: "analytics", label: "Analytics" },
  { id: "tools", label: "Tools" },
  { id: "system", label: "System" },
]

interface Props { isOpen: boolean; onClose: () => void }

export default function Sidebar({ isOpen, onClose }: Props) {
  const { currentUser, activeView, setActiveView, logout, notifications } = useTaskStore()
  const unread = notifications.filter((n) => n.userId === currentUser?.id && !n.read).length

  const handleNav = (id: string) => {
    setActiveView(id)
    onClose()
  }

  const visibleItems = navItems.filter((item) => {
    if (item.adminOnly && currentUser?.role !== "admin") return false
    return true
  })

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-sidebar text-sidebar-foreground flex flex-col z-40 transition-transform duration-300",
        "lg:translate-x-0 lg:relative lg:z-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <CheckSquare className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-bold text-sidebar-foreground text-lg leading-none">TaskSKA</div>
            <div className="text-xs text-sidebar-foreground/50 mt-0.5">Task Management</div>
          </div>
        </div>

        {/* User */}
        <div className="px-4 py-3 border-b border-sidebar-border">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-sidebar-accent">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0">
              {currentUser?.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">{currentUser?.name}</p>
              <p className="text-xs text-sidebar-foreground/50 capitalize truncate">{currentUser?.role}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
          {groups.map((group) => {
            const items = visibleItems.filter((i) => i.group === group.id)
            if (!items.length) return null
            return (
              <div key={group.id}>
                <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-2 mb-1">{group.label}</p>
                {items.map((item) => {
                  const Icon = item.icon
                  const isActive = activeView === item.id
                  const showBadge = item.id === "notifications" && unread > 0
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {showBadge && (
                        <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                          {unread > 9 ? "9+" : unread}
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-destructive/20 hover:text-red-400 transition"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
