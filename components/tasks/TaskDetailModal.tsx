"use client"
import { useState } from "react"
import { useTaskStore, Task, TaskStatus, Priority } from "@/lib/store"
import { X, Clock, User, Calendar, Tag, MessageSquare, Send, Trash2, Edit3, Link2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props { task: Task; onClose: () => void }

const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
  { value: "todo", label: "Todo", color: "bg-muted text-muted-foreground" },
  { value: "in-progress", label: "In Progress", color: "bg-blue-100 text-blue-700" },
  { value: "review", label: "Review", color: "bg-purple-100 text-purple-700" },
  { value: "done", label: "Done", color: "bg-green-100 text-green-700" },
  { value: "overdue", label: "Overdue", color: "bg-red-100 text-red-700" },
]

const priorityColors: Record<Priority, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
}

export default function TaskDetailModal({ task, onClose }: Props) {
  const { currentUser, users, tasks, updateTask, deleteTask, addComment, setSelectedTask, updateTaskStatus } = useTaskStore()
  const [comment, setComment] = useState("")
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDesc, setEditDesc] = useState(task.description)
  const [editPriority, setEditPriority] = useState<Priority>(task.priority)
  const [editDeadline, setEditDeadline] = useState(task.deadline)
  const [editHours, setEditHours] = useState(task.estimatedHours)
  const [editActual, setEditActual] = useState(task.actualHours)

  if (!currentUser) return null

  const assignee = users.find((u) => u.id === task.assigneeId)
  const creator = users.find((u) => u.id === task.creatorId)
  const depsBlocked = task.dependencies.map((d) => tasks.find((t) => t.id === d)).filter(Boolean)
  const currentStatus = statusOptions.find((s) => s.value === task.status)
  const isOverdue = new Date(task.deadline) < new Date() && task.status !== "done"
  const canEdit = currentUser.id === task.creatorId || currentUser.role === "admin"

  const handleSave = () => {
    updateTask(task.id, { title: editTitle, description: editDesc, priority: editPriority, deadline: editDeadline, estimatedHours: editHours, actualHours: editActual })
    setEditing(false)
  }

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTask(task.id)
      setSelectedTask(null)
      onClose()
    }
  }

  const handleComment = () => {
    if (comment.trim()) {
      addComment(task.id, currentUser.id, comment.trim())
      setComment("")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-border">
        {/* Header */}
        <div className="flex items-start gap-3 px-6 py-4 border-b border-border">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{task.taskCode}</span>
              {isOverdue && <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded">Overdue</span>}
            </div>
            {editing ? (
              <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full text-lg font-semibold bg-transparent border-b-2 border-primary text-foreground focus:outline-none pb-1" />
            ) : (
              <h2 className="text-lg font-semibold text-foreground leading-tight">{task.title}</h2>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {canEdit && (
              <button onClick={() => editing ? handleSave() : setEditing(true)} className="p-2 rounded-lg hover:bg-muted transition">
                <Edit3 className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            {canEdit && (
              <button onClick={handleDelete} className="p-2 rounded-lg hover:bg-red-50 transition">
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
            {/* Main */}
            <div className="lg:col-span-2 p-6 space-y-5 border-r border-border">
              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
                {editing ? (
                  <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={4} className="w-full mt-2 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                ) : (
                  <p className="mt-1.5 text-sm text-foreground/80 leading-relaxed">{task.description || "No description provided."}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {statusOptions.map((s) => (
                    <button key={s.value} onClick={() => updateTaskStatus(task.id, s.value)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition border-2", task.status === s.value ? `${s.color} border-current` : "border-transparent hover:border-border " + s.color.replace("bg-", "hover:bg-").replace("100", "50"))}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dependencies */}
              {depsBlocked.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5" />Dependencies
                  </label>
                  <div className="mt-2 space-y-2">
                    {depsBlocked.map((dep) => dep && (
                      <div key={dep.id} className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                        <span className="text-xs font-mono text-primary">{dep.taskCode}</span>
                        <span className="text-xs text-foreground flex-1">{dep.title}</span>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full", statusOptions.find((s) => s.value === dep.status)?.color)}>{dep.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {task.tags.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />Tags
                  </label>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {task.tags.map((tag) => <span key={tag} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">{tag}</span>)}
                  </div>
                </div>
              )}

              {/* Comments */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />Comments ({task.comments.length})
                </label>
                <div className="mt-2 space-y-3">
                  {task.comments.map((c) => {
                    const commenter = users.find((u) => u.id === c.userId)
                    return (
                      <div key={c.id} className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0">
                          {commenter?.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-foreground">{commenter?.name}</span>
                            <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-foreground/80 mt-0.5 bg-muted rounded-lg px-3 py-2">{c.content}</p>
                        </div>
                      </div>
                    )
                  })}
                  <div className="flex gap-2 mt-3">
                    <input value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleComment()} placeholder="Add a comment..." className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                    <button onClick={handleComment} className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="p-5 space-y-4 text-sm">
              {[
                { label: "Assignee", icon: User, value: assignee?.name || "Unassigned" },
                { label: "Creator", icon: User, value: creator?.name || "Unknown" },
                { label: "Priority", icon: Tag, value: null, badge: task.priority },
                { label: "Deadline", icon: Calendar, value: new Date(task.deadline).toLocaleDateString() },
                { label: "Created", icon: Clock, value: new Date(task.createdAt).toLocaleDateString() },
                { label: "Updated", icon: Clock, value: new Date(task.updatedAt).toLocaleDateString() },
              ].map((item) => (
                <div key={item.label}>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <item.icon className="w-3 h-3" />{item.label}
                  </label>
                  <div className="mt-1">
                    {item.badge ? (
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", priorityColors[item.badge as Priority])}>{item.badge}</span>
                    ) : editing && item.label === "Deadline" ? (
                      <input type="date" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} className="px-2 py-1 rounded border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring" />
                    ) : (
                      <p className="text-foreground font-medium">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hours</label>
                {editing ? (
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <p className="text-xs text-muted-foreground">Est.</p>
                      <input type="number" value={editHours} onChange={(e) => setEditHours(Number(e.target.value))} className="w-full px-2 py-1 rounded border border-input bg-background text-foreground text-xs" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Actual</p>
                      <input type="number" value={editActual} onChange={(e) => setEditActual(Number(e.target.value))} className="w-full px-2 py-1 rounded border border-input bg-background text-foreground text-xs" />
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Est.</span>
                      <span className="font-medium text-foreground">{task.estimatedHours}h</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Actual</span>
                      <span className={cn("font-medium", task.actualHours > task.estimatedHours ? "text-red-600" : "text-green-600")}>{task.actualHours}h</span>
                    </div>
                    {task.estimatedHours > 0 && (
                      <div className="bg-muted rounded-full h-1.5">
                        <div className={cn("h-1.5 rounded-full", task.actualHours > task.estimatedHours ? "bg-red-500" : "bg-primary")} style={{ width: `${Math.min((task.actualHours / task.estimatedHours) * 100, 100)}%` }} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {editing && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Priority</label>
                  <select value={editPriority} onChange={(e) => setEditPriority(e.target.value as Priority)} className="w-full mt-1 px-2 py-1.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              )}

              {editing && (
                <button onClick={handleSave} className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition">
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
