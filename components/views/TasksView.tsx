"use client"
import { useState } from "react"
import { useTaskStore, TaskStatus, Priority } from "@/lib/store"
import { Plus, Filter, SortAsc, Calendar, Clock, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import CreateTaskModal from "@/components/tasks/CreateTaskModal"
import TaskDetailModal from "@/components/tasks/TaskDetailModal"

const statusOptions: { value: TaskStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "todo", label: "Todo" },
  { value: "in-progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
  { value: "overdue", label: "Overdue" },
]

const priorityColors: Record<string, string> = {
  low: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  critical: "bg-red-100 text-red-700 border-red-200",
}
const statusColors: Record<string, string> = {
  todo: "bg-muted text-muted-foreground",
  "in-progress": "bg-blue-100 text-blue-700",
  review: "bg-purple-100 text-purple-700",
  done: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
}

export default function TasksView() {
  const { currentUser, tasks, users, selectedTask, setSelectedTask, filterStatus, setFilterStatus, filterPriority, setFilterPriority } = useTaskStore()
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<"deadline" | "priority" | "status" | "created">("deadline")
  const [view, setView] = useState<"list" | "board">("list")

  if (!currentUser) return null

  let filteredTasks = tasks.filter((t) => t.assigneeId === currentUser.id || t.creatorId === currentUser.id)
  if (filterStatus !== "all") filteredTasks = filteredTasks.filter((t) => t.status === filterStatus)
  if (filterPriority !== "all") filteredTasks = filteredTasks.filter((t) => t.priority === filterPriority)
  if (search) {
    const q = search.toLowerCase()
    filteredTasks = filteredTasks.filter((t) =>
      t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.taskCode.toLowerCase().includes(q) || t.tags.some((tag) => tag.toLowerCase().includes(q))
    )
  }

  filteredTasks.sort((a, b) => {
    if (sort === "deadline") return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    if (sort === "priority") {
      const order = { critical: 0, high: 1, medium: 2, low: 3 }
      return order[a.priority] - order[b.priority]
    }
    if (sort === "status") return a.status.localeCompare(b.status)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const boardColumns: { status: TaskStatus; label: string; color: string }[] = [
    { status: "todo", label: "Todo", color: "border-t-muted-foreground" },
    { status: "in-progress", label: "In Progress", color: "border-t-primary" },
    { status: "review", label: "Review", color: "border-t-purple-500" },
    { status: "done", label: "Done", color: "border-t-green-500" },
  ]

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks..." className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="px-3 py-2 rounded-lg border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as any)} className="px-3 py-2 rounded-lg border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="all">All Priority</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="px-3 py-2 rounded-lg border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="deadline">Sort by Deadline</option>
          <option value="priority">Sort by Priority</option>
          <option value="status">Sort by Status</option>
          <option value="created">Sort by Created</option>
        </select>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <button onClick={() => setView("list")} className={cn("px-3 py-1 rounded text-xs font-medium transition", view === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>List</button>
          <button onClick={() => setView("board")} className={cn("px-3 py-1 rounded text-xs font-medium transition", view === "board" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>Board</button>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition">
          <Plus className="w-4 h-4" />New Task
        </button>
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Showing <strong className="text-foreground">{filteredTasks.length}</strong> task{filteredTasks.length !== 1 ? "s" : ""}
      </div>

      {/* List View */}
      {view === "list" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 w-24">ID</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Title</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden md:table-cell">Assignee</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden sm:table-cell">Priority</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden lg:table-cell">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTasks.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">No tasks found</td></tr>
              ) : filteredTasks.map((task) => {
                const assignee = users.find((u) => u.id === task.assigneeId)
                const isOverdue = new Date(task.deadline) < new Date() && task.status !== "done"
                return (
                  <tr key={task.id} onClick={() => setSelectedTask(task)} className="hover:bg-muted/30 cursor-pointer transition">
                    <td className="px-4 py-3"><span className="text-xs font-mono font-bold text-primary">{task.taskCode}</span></td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm text-foreground">{task.title}</div>
                      {task.tags.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {task.tags.slice(0, 3).map((tag) => <span key={tag} className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">{tag}</span>)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">{assignee?.name.charAt(0)}</div>
                        <span className="text-sm text-foreground">{assignee?.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize border", priorityColors[task.priority])}>{task.priority}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-xs px-2 py-1 rounded-full font-medium capitalize", statusColors[task.status])}>{task.status.replace("-", " ")}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className={cn("flex items-center gap-1.5 text-xs", isOverdue ? "text-red-600 font-medium" : "text-muted-foreground")}>
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(task.deadline).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Board View */}
      {view === "board" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {boardColumns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.status)
            return (
              <div key={col.status} className={cn("bg-card rounded-xl border border-border border-t-4", col.color)}>
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <span className="font-semibold text-sm text-foreground">{col.label}</span>
                  <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">{colTasks.length}</span>
                </div>
                <div className="p-3 space-y-2 min-h-32">
                  {colTasks.map((task) => (
                    <div key={task.id} onClick={() => setSelectedTask(task)} className="bg-background rounded-lg border border-border p-3 cursor-pointer hover:border-primary/50 transition shadow-sm">
                      <div className="text-xs font-mono text-primary mb-1">{task.taskCode}</div>
                      <p className="text-sm font-medium text-foreground leading-snug mb-2">{task.title}</p>
                      <div className="flex items-center justify-between">
                        <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium capitalize", priorityColors[task.priority])}>{task.priority}</span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {new Date(task.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showCreate && <CreateTaskModal onClose={() => setShowCreate(false)} />}
      {selectedTask && <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  )
}
