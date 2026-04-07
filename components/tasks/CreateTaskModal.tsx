"use client"
import { useState } from "react"
import { useTaskStore, Priority, TaskStatus } from "@/lib/store"
import { X, Plus, Trash2 } from "lucide-react"

interface Props { onClose: () => void; templateId?: string }

export default function CreateTaskModal({ onClose, templateId }: Props) {
  const { currentUser, users, connections, sprints, tasks, templates, createTask } = useTaskStore()
  const template = templateId ? templates.find((t) => t.id === templateId) : null

  const [title, setTitle] = useState(template?.name || "")
  const [description, setDescription] = useState(template?.description || "")
  const [priority, setPriority] = useState<Priority>(template?.priority || "medium")
  const [deadline, setDeadline] = useState("")
  const [assigneeId, setAssigneeId] = useState(currentUser?.id || "")
  const [sprintId, setSprintId] = useState("")
  const [estimatedHours, setEstimatedHours] = useState(template?.estimatedHours || 4)
  const [tags, setTags] = useState<string[]>(template?.tags || [])
  const [tagInput, setTagInput] = useState("")
  const [dependencies, setDependencies] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  if (!currentUser) return null

  const connectedUserIds = connections
    .filter((c) => (c.requesterId === currentUser.id || c.receiverId === currentUser.id) && c.status === "accepted")
    .map((c) => c.requesterId === currentUser.id ? c.receiverId : c.requesterId)
  const assignableUsers = users.filter((u) => u.id === currentUser.id || connectedUserIds.includes(u.id))

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !deadline) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 400))
    createTask({
      title: title.trim(),
      description: description.trim(),
      priority,
      status: "todo" as TaskStatus,
      assigneeId,
      creatorId: currentUser.id,
      deadline,
      sprintId: sprintId || undefined,
      templateId: templateId,
      tags,
      attachments: [],
      estimatedHours,
      actualHours: 0,
      dependencies,
      automatedStatusUpdate: false,
    })
    setLoading(false)
    onClose()
  }

  const priorityColors: Record<Priority, string> = {
    low: "border-green-500 text-green-600",
    medium: "border-yellow-500 text-yellow-600",
    high: "border-orange-500 text-orange-600",
    critical: "border-red-500 text-red-600",
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-semibold text-foreground text-lg">{template ? `New Task from Template` : "Create New Task"}</h2>
            {template && <p className="text-xs text-muted-foreground">Template: {template.name}</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Task Title <span className="text-destructive">*</span></label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Enter task title..." className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe this task..." className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Deadline <span className="text-destructive">*</span></label>
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} required className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Assign To</label>
                <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition">
                  {assignableUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} {u.id === currentUser.id ? "(You)" : ""}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Sprint</label>
                <select value={sprintId} onChange={(e) => setSprintId(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition">
                  <option value="">No Sprint</option>
                  {sprints.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Estimated Hours</label>
              <input type="number" min={0.5} step={0.5} value={estimatedHours} onChange={(e) => setEstimatedHours(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Tags</label>
              <div className="flex gap-2">
                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="Add tag..." className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition" />
                <button type="button" onClick={addTag} className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                      {tag}
                      <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Dependencies</label>
              <select
                multiple
                value={dependencies}
                onChange={(e) => setDependencies(Array.from(e.target.selectedOptions, (o) => o.value))}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition h-24"
              >
                {tasks.map((t) => <option key={t.id} value={t.id}>{t.taskCode} - {t.title}</option>)}
              </select>
              <p className="text-xs text-muted-foreground">Hold Ctrl/Cmd to select multiple</p>
            </div>
          </div>
        </form>

        <div className="flex gap-3 px-6 py-4 border-t border-border">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition">Cancel</button>
          <button onClick={handleSubmit as any} disabled={loading || !title.trim() || !deadline} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />Creating...</> : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  )
}
