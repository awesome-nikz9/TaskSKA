export type UserRole = "admin" | "taskmaster" | "user"
export type TaskStatus = "todo" | "in-progress" | "review" | "done" | "overdue"
export type TaskPriority = "low" | "medium" | "high" | "critical"
export type ConnectionStatus = "pending" | "accepted" | "declined"
export type NotificationType =
  | "task_assigned"
  | "status_update"
  | "connection_request"
  | "deadline_warning"
  | "system"

export interface NotificationPrefs {
  taskAssigned: boolean
  statusUpdates: boolean
  connectionRequests: boolean
  deadlineWarnings: boolean
  emailNotifications: boolean
}

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: UserRole
  avatar?: string
  mfaEnabled: boolean
  mfaSecret?: string
  mfaBackupCodes?: string[]
  createdAt: string
  lastLogin?: string
  notificationPrefs: NotificationPrefs
  department?: string
  jobTitle?: string
}

export interface Comment {
  id: string
  userId: string
  content: string
  createdAt: string
}

export interface TaskHistoryEntry {
  id: string
  userId: string
  field: string
  oldValue: string
  newValue: string
  timestamp: string
}

export interface Task {
  id: string
  title: string
  description: string
  deadline: string
  status: TaskStatus
  priority: TaskPriority
  createdBy: string
  assignedTo: string[]
  tags: string[]
  sprintId?: string
  dependsOn?: string[]
  templateId?: string
  estimatedHours?: number
  actualHours?: number
  comments: Comment[]
  history: TaskHistoryEntry[]
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface Connection {
  id: string
  requesterId: string
  receiverId: string
  status: ConnectionStatus
  createdAt: string
  updatedAt: string
}

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  relatedId?: string
  createdAt: string
}

export interface Sprint {
  id: string
  name: string
  code: string
  startDate: string
  endDate: string
  goal: string
  tasks: string[]
  status: "planning" | "active" | "completed"
  createdAt: string
}

export interface Template {
  id: string
  name: string
  description: string
  priority: TaskPriority
  estimatedHours: number
  tags: string[]
  checklistItems: string[]
  createdBy: string
  createdAt: string
}

export interface AutomationRule {
  id: string
  name: string
  trigger: "deadline_passed" | "deadline_approaching" | "status_change" | "workload_threshold"
  action: "update_status" | "send_notification" | "auto_assign" | "flag_overdue"
  conditionValue: string
  actionValue: string
  enabled: boolean
  createdBy: string
  createdAt: string
}

export interface WorkloadData {
  userId: string
  activeTasks: number
  completedTasks: number
  overdueTasks: number
  estimatedHours: number
  workloadPercent: number
}

export interface TaskDependency {
  taskId: string
  dependsOnId: string
  type: "finish-to-start" | "start-to-start" | "finish-to-finish"
}

export interface SystemStats {
  totalUsers: number
  totalTasks: number
  completedTasks: number
  activeSprints: number
  totalConnections: number
  lastDeployedAt: string
  version: string
  environment: string
}
