"use client"
import { useTaskStore } from "@/lib/store"
import { CheckSquare, Clock, AlertCircle, Users2, TrendingUp, ArrowRight, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

function StatCard({ label, value, icon: Icon, color, sub }: { label: string; value: number | string; icon: React.ElementType; color: string; sub?: string }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", color)}>
          <Icon className="w-5 h-5" />
        </div>
        <TrendingUp className="w-4 h-4 text-muted-foreground/50" />
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
      {sub && <div className="text-xs text-muted-foreground/60 mt-1">{sub}</div>}
    </div>
  )
}

export default function Dashboard() {
  const { currentUser, tasks, sprints, connections, setActiveView, setSelectedTask } = useTaskStore()
  if (!currentUser) return null

  const myTasks = tasks.filter((t) => t.assigneeId === currentUser.id || t.creatorId === currentUser.id)
  const todoCount = myTasks.filter((t) => t.status === "todo").length
  const inProgressCount = myTasks.filter((t) => t.status === "in-progress").length
  const doneCount = myTasks.filter((t) => t.status === "done").length
  const overdueCount = myTasks.filter((t) => {
    const dl = new Date(t.deadline)
    return dl < new Date() && t.status !== "done"
  }).length

  const activeSprint = sprints.find((s) => s.status === "active")
  const myConnections = connections.filter((c) => (c.requesterId === currentUser.id || c.receiverId === currentUser.id) && c.status === "accepted")

  const recentTasks = [...myTasks].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5)

  const priorityBadge: Record<string, string> = {
    low: "bg-green-100 text-green-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-orange-100 text-orange-700",
    critical: "bg-red-100 text-red-700",
  }
  const statusBadge: Record<string, string> = {
    todo: "bg-muted text-muted-foreground",
    "in-progress": "bg-blue-100 text-blue-700",
    review: "bg-purple-100 text-purple-700",
    done: "bg-green-100 text-green-700",
    overdue: "bg-red-100 text-red-700",
  }

  const completionRate = myTasks.length > 0 ? Math.round((doneCount / myTasks.length) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-primary rounded-xl p-6 text-primary-foreground">
        <h2 className="text-xl font-bold">Welcome back, {currentUser.name.split(" ")[0]}!</h2>
        <p className="text-primary-foreground/70 text-sm mt-1">
          You have <strong>{inProgressCount}</strong> task{inProgressCount !== 1 ? "s" : ""} in progress
          {overdueCount > 0 && <span className="text-red-300"> and {overdueCount} overdue</span>}.
        </p>
        <div className="mt-4 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
            <Calendar className="w-4 h-4" />
            <span>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
          </div>
          {activeSprint && (
            <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
              <CheckSquare className="w-4 h-4" />
              <span>Active: {activeSprint.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="In Progress" value={inProgressCount} icon={Clock} color="bg-blue-100 text-blue-600" sub={`${myTasks.length} total tasks`} />
        <StatCard label="Completed" value={doneCount} icon={CheckSquare} color="bg-green-100 text-green-600" sub={`${completionRate}% completion rate`} />
        <StatCard label="Overdue" value={overdueCount} icon={AlertCircle} color="bg-red-100 text-red-600" sub="Need attention" />
        <StatCard label="Connections" value={myConnections.length} icon={Users2} color="bg-purple-100 text-purple-600" sub="Active collaborators" />
      </div>

      {/* Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Completion */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Task Completion</h3>
          <div className="space-y-3">
            {[
              { label: "Todo", count: todoCount, color: "bg-muted-foreground" },
              { label: "In Progress", count: inProgressCount, color: "bg-primary" },
              { label: "Review", count: myTasks.filter((t) => t.status === "review").length, color: "bg-purple-500" },
              { label: "Done", count: doneCount, color: "bg-green-500" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-20 flex-shrink-0">{item.label}</span>
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div className={cn("h-2 rounded-full transition-all", item.color)} style={{ width: myTasks.length > 0 ? `${(item.count / myTasks.length) * 100}%` : "0%" }} />
                </div>
                <span className="text-sm font-medium text-foreground w-8 text-right">{item.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Overall completion</span>
            <span className="font-bold text-primary">{completionRate}%</span>
          </div>
        </div>

        {/* Sprint */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Sprint Overview</h3>
            <button onClick={() => setActiveView("sprints")} className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {sprints.slice(0, 4).map((sprint) => {
              const sprintTasks = tasks.filter((t) => t.sprintId === sprint.id)
              const doneTasks = sprintTasks.filter((t) => t.status === "done").length
              const progress = sprintTasks.length > 0 ? (doneTasks / sprintTasks.length) * 100 : 0
              const statusColor = sprint.status === "active" ? "bg-primary text-primary-foreground" : sprint.status === "completed" ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
              return (
                <div key={sprint.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground truncate max-w-[180px]">{sprint.name}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusColor)}>{sprint.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{doneTasks}/{sprintTasks.length}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-card rounded-xl border border-border">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Recent Tasks</h3>
          <button onClick={() => setActiveView("tasks")} className="text-xs text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="divide-y divide-border">
          {recentTasks.map((task) => (
            <button key={task.id} onClick={() => { setSelectedTask(task); setActiveView("tasks") }} className="w-full flex items-center gap-4 px-5 py-3 hover:bg-muted/50 transition text-left">
              <div className={cn("w-2 h-2 rounded-full flex-shrink-0", {
                "bg-muted-foreground": task.status === "todo",
                "bg-primary": task.status === "in-progress",
                "bg-purple-500": task.status === "review",
                "bg-green-500": task.status === "done",
                "bg-red-500": task.status === "overdue",
              })} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">{task.taskCode}</span>
                  <span className="text-sm font-medium text-foreground truncate">{task.title}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">Due {new Date(task.deadline).toLocaleDateString()}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", priorityBadge[task.priority])}>{task.priority}</span>
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", statusBadge[task.status])}>{task.status.replace("-", " ")}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
