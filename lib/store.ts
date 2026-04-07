"use client"
import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Priority = "low" | "medium" | "high" | "critical"
export type TaskStatus = "todo" | "in-progress" | "review" | "done" | "overdue"
export type UserRole = "admin" | "taskmaster" | "user"
export type ConnectionStatus = "pending" | "accepted" | "declined"
export type NotificationType = "task_assigned" | "status_update" | "connection_request" | "connection_accepted" | "overdue_alert" | "dependency_blocked"

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: UserRole
  avatar?: string
  mfaEnabled: boolean
  mfaSecret?: string
  mfaVerified: boolean
  notificationPrefs: {
    taskAssigned: boolean
    statusUpdate: boolean
    connectionRequest: boolean
    overdueAlert: boolean
    emailNotifications: boolean
    pushNotifications: boolean
  }
  createdAt: string
  lastLogin?: string
  workloadPercentage: number
}

export interface Connection {
  id: string
  requesterId: string
  receiverId: string
  status: ConnectionStatus
  createdAt: string
}

export interface TaskDependency {
  taskId: string
  dependsOn: string
}

export interface Task {
  id: string
  taskCode: string
  title: string
  description: string
  priority: Priority
  status: TaskStatus
  assigneeId: string
  creatorId: string
  deadline: string
  createdAt: string
  updatedAt: string
  sprintId?: string
  templateId?: string
  tags: string[]
  comments: Comment[]
  attachments: string[]
  estimatedHours: number
  actualHours: number
  dependencies: string[]
  automatedStatusUpdate: boolean
}

export interface Comment {
  id: string
  userId: string
  content: string
  createdAt: string
}

export interface Sprint {
  id: string
  name: string
  code: string
  startDate: string
  endDate: string
  status: "planning" | "active" | "completed"
  taskIds: string[]
  description: string
}

export interface TaskTemplate {
  id: string
  name: string
  description: string
  priority: Priority
  estimatedHours: number
  tags: string[]
  creatorId: string
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  createdAt: string
  taskId?: string
}

export interface AppState {
  // Auth
  currentUser: User | null
  isAuthenticated: boolean
  mfaPending: boolean
  pendingUserId: string | null

  // Data
  users: User[]
  tasks: Task[]
  connections: Connection[]
  sprints: Sprint[]
  templates: TaskTemplate[]
  notifications: Notification[]

  // UI
  activeView: string
  selectedTask: Task | null
  searchQuery: string
  filterStatus: TaskStatus | "all"
  filterPriority: Priority | "all"

  // Actions - Auth
  register: (name: string, email: string, password: string) => { success: boolean; message: string }
  login: (email: string, password: string) => { success: boolean; requiresMfa: boolean; message: string }
  verifyMfa: (userId: string, code: string) => { success: boolean; message: string }
  logout: () => void
  resetPassword: (email: string, newPassword: string) => { success: boolean; message: string }
  setupMfa: (userId: string) => void
  disableMfa: (userId: string) => void
  updateNotificationPrefs: (userId: string, prefs: Partial<User["notificationPrefs"]>) => void

  // Actions - Tasks
  createTask: (task: Omit<Task, "id" | "taskCode" | "createdAt" | "updatedAt" | "comments">) => Task
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  addComment: (taskId: string, userId: string, content: string) => void
  setSelectedTask: (task: Task | null) => void
  updateTaskStatus: (taskId: string, status: TaskStatus) => void

  // Actions - Connections
  sendConnectionRequest: (requesterId: string, receiverEmail: string) => { success: boolean; message: string }
  respondToConnection: (connectionId: string, accept: boolean) => void

  // Actions - Sprints
  createSprint: (sprint: Omit<Sprint, "id">) => void
  updateSprint: (id: string, updates: Partial<Sprint>) => void

  // Actions - Templates
  createTemplate: (template: Omit<TaskTemplate, "id" | "createdAt">) => void
  deleteTemplate: (id: string) => void

  // Actions - Notifications
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: (userId: string) => void
  addNotification: (notification: Omit<Notification, "id" | "createdAt">) => void

  // Actions - UI
  setActiveView: (view: string) => void
  setSearchQuery: (q: string) => void
  setFilterStatus: (s: TaskStatus | "all") => void
  setFilterPriority: (p: Priority | "all") => void
}

function generateId() {
  return Math.random().toString(36).substring(2, 11)
}

function generateTaskCode(tasks: Task[]) {
  const num = tasks.length + 1
  return `TMS-${String(num + 50).padStart(3, "0")}`
}

const DEMO_ADMIN: User = {
  id: "admin-001",
  name: "Admin SKA",
  email: "admin@taskska.com",
  password: "Admin@1234",
  role: "admin",
  mfaEnabled: false,
  mfaVerified: false,
  notificationPrefs: {
    taskAssigned: true,
    statusUpdate: true,
    connectionRequest: true,
    overdueAlert: true,
    emailNotifications: true,
    pushNotifications: true,
  },
  createdAt: "2026-01-01T00:00:00Z",
  workloadPercentage: 20,
}

const DEMO_USER: User = {
  id: "user-001",
  name: "John Taskmaster",
  email: "john@taskska.com",
  password: "User@1234",
  role: "taskmaster",
  mfaEnabled: false,
  mfaVerified: false,
  notificationPrefs: {
    taskAssigned: true,
    statusUpdate: true,
    connectionRequest: true,
    overdueAlert: true,
    emailNotifications: true,
    pushNotifications: false,
  },
  createdAt: "2026-01-15T00:00:00Z",
  workloadPercentage: 65,
}

const DEMO_USER2: User = {
  id: "user-002",
  name: "Sarah Collins",
  email: "sarah@taskska.com",
  password: "User@1234",
  role: "user",
  mfaEnabled: false,
  mfaVerified: false,
  notificationPrefs: {
    taskAssigned: true,
    statusUpdate: false,
    connectionRequest: true,
    overdueAlert: true,
    emailNotifications: false,
    pushNotifications: true,
  },
  createdAt: "2026-01-20T00:00:00Z",
  workloadPercentage: 45,
}

const DEMO_USER3: User = {
  id: "user-003",
  name: "Mark Reyes",
  email: "mark@taskska.com",
  password: "User@1234",
  role: "user",
  mfaEnabled: false,
  mfaVerified: false,
  notificationPrefs: {
    taskAssigned: true,
    statusUpdate: true,
    connectionRequest: false,
    overdueAlert: true,
    emailNotifications: true,
    pushNotifications: true,
  },
  createdAt: "2026-02-01T00:00:00Z",
  workloadPercentage: 80,
}

const INITIAL_SPRINTS: Sprint[] = [
  {
    id: "sprint-1",
    name: "Sprint 1 (MIT 651)",
    code: "MIT651-S1",
    startDate: "2026-03-18",
    endDate: "2026-04-01",
    status: "completed",
    description: "Authentication and MFA features",
    taskIds: ["task-1", "task-2", "task-3", "task-4", "task-5", "task-6", "task-7"],
  },
  {
    id: "sprint-2",
    name: "Sprint 2 (MIT651)",
    code: "MIT651-S2",
    startDate: "2026-04-02",
    endDate: "2026-04-15",
    status: "completed",
    description: "Task creation, assignment, and status tracking",
    taskIds: ["task-8", "task-9", "task-10", "task-11", "task-12"],
  },
  {
    id: "sprint-3",
    name: "Sprint 3 (MIT652)",
    code: "MIT652-S3",
    startDate: "2026-04-16",
    endDate: "2026-04-30",
    status: "active",
    description: "Connection management and task search/filtering",
    taskIds: ["task-13", "task-14", "task-15", "task-16", "task-17"],
  },
  {
    id: "sprint-4",
    name: "Sprint 4",
    code: "MIT652-S4",
    startDate: "2026-05-01",
    endDate: "2026-05-15",
    status: "planning",
    description: "Workload, notifications, templates, dependencies & automation",
    taskIds: ["task-18", "task-19", "task-20", "task-21", "task-22", "task-23", "task-24", "task-25", "task-26", "task-27"],
  },
  {
    id: "sprint-5",
    name: "Sprint 5",
    code: "MIT652-S5",
    startDate: "2026-05-16",
    endDate: "2026-05-31",
    status: "planning",
    description: "Testing, documentation, and production deployment",
    taskIds: ["task-28", "task-29", "task-30", "task-31", "task-32"],
  },
]

const INITIAL_TASKS: Task[] = [
  // Sprint 1
  { id: "task-1", taskCode: "TMS-008", title: "User Registration", description: "As a Public user, I want to register an account", priority: "high", status: "done", assigneeId: "user-001", creatorId: "admin-001", deadline: "2026-03-25", createdAt: "2026-03-18T00:00:00Z", updatedAt: "2026-03-24T00:00:00Z", sprintId: "sprint-1", tags: ["auth", "registration"], comments: [], attachments: [], estimatedHours: 8, actualHours: 7, dependencies: [], automatedStatusUpdate: false },
  { id: "task-2", taskCode: "TMS-010", title: "User Login", description: "As a user, I want to log in using my credentials so that I can securely access my tasks", priority: "high", status: "done", assigneeId: "user-001", creatorId: "admin-001", deadline: "2026-03-25", createdAt: "2026-03-18T00:00:00Z", updatedAt: "2026-03-24T00:00:00Z", sprintId: "sprint-1", tags: ["auth", "login"], comments: [], attachments: [], estimatedHours: 6, actualHours: 5, dependencies: ["task-1"], automatedStatusUpdate: false },
  { id: "task-3", taskCode: "TMS-011", title: "Password Reset", description: "As a user, I want to reset my password securely so that I can regain access without compromising my data", priority: "medium", status: "done", assigneeId: "user-002", creatorId: "admin-001", deadline: "2026-03-28", createdAt: "2026-03-18T00:00:00Z", updatedAt: "2026-03-27T00:00:00Z", sprintId: "sprint-1", tags: ["auth", "security"], comments: [], attachments: [], estimatedHours: 4, actualHours: 4, dependencies: ["task-1"], automatedStatusUpdate: false },
  { id: "task-4", taskCode: "TMS-012", title: "MFA Setup", description: "As a User, I want to set up Multi Factor Authentication (MFA) for my account", priority: "high", status: "done", assigneeId: "user-001", creatorId: "admin-001", deadline: "2026-03-30", createdAt: "2026-03-18T00:00:00Z", updatedAt: "2026-03-29T00:00:00Z", sprintId: "sprint-1", tags: ["auth", "mfa", "security"], comments: [], attachments: [], estimatedHours: 10, actualHours: 12, dependencies: ["task-2"], automatedStatusUpdate: false },
  { id: "task-5", taskCode: "TMS-013", title: "Secure Logout", description: "As a User, I want to securely logout so that my session is securely ended", priority: "medium", status: "done", assigneeId: "user-002", creatorId: "admin-001", deadline: "2026-03-30", createdAt: "2026-03-18T00:00:00Z", updatedAt: "2026-03-29T00:00:00Z", sprintId: "sprint-1", tags: ["auth", "security"], comments: [], attachments: [], estimatedHours: 3, actualHours: 2, dependencies: ["task-2"], automatedStatusUpdate: false },
  { id: "task-6", taskCode: "TMS-014", title: "Taskmaster Assignment", description: "As a User, I want to be assigned as Taskmaster for tasks created", priority: "medium", status: "done", assigneeId: "user-001", creatorId: "admin-001", deadline: "2026-04-01", createdAt: "2026-03-18T00:00:00Z", updatedAt: "2026-03-31T00:00:00Z", sprintId: "sprint-1", tags: ["roles", "assignment"], comments: [], attachments: [], estimatedHours: 5, actualHours: 5, dependencies: [], automatedStatusUpdate: false },
  { id: "task-7", taskCode: "TMS-015", title: "Admin Login & Management", description: "As an Admin, I want to be able to log in and manage the platform", priority: "high", status: "done", assigneeId: "admin-001", creatorId: "admin-001", deadline: "2026-04-01", createdAt: "2026-03-18T00:00:00Z", updatedAt: "2026-04-01T00:00:00Z", sprintId: "sprint-1", tags: ["admin", "auth"], comments: [], attachments: [], estimatedHours: 8, actualHours: 9, dependencies: ["task-2"], automatedStatusUpdate: false },
  // Sprint 2
  { id: "task-8", taskCode: "TMS-022", title: "Create Task", description: "As a user, I want to create tasks with a title, description, and deadline so that I can manage my work effectively.", priority: "high", status: "done", assigneeId: "user-001", creatorId: "user-001", deadline: "2026-04-08", createdAt: "2026-04-02T00:00:00Z", updatedAt: "2026-04-07T00:00:00Z", sprintId: "sprint-2", tags: ["tasks", "creation"], comments: [], attachments: [], estimatedHours: 8, actualHours: 8, dependencies: [], automatedStatusUpdate: false },
  { id: "task-9", taskCode: "TMS-023", title: "Assign Tasks", description: "As a user, I want to assign tasks to myself or connected users so that I can collaborate on task execution.", priority: "high", status: "done", assigneeId: "user-001", creatorId: "user-001", deadline: "2026-04-10", createdAt: "2026-04-02T00:00:00Z", updatedAt: "2026-04-09T00:00:00Z", sprintId: "sprint-2", tags: ["tasks", "assignment"], comments: [], attachments: [], estimatedHours: 6, actualHours: 7, dependencies: ["task-8"], automatedStatusUpdate: false },
  { id: "task-10", taskCode: "TMS-024", title: "Unique Task ID Generation", description: "As a system, I want to generate a unique Task ID for each created task so that tasks are easily searchable.", priority: "medium", status: "done", assigneeId: "user-002", creatorId: "user-001", deadline: "2026-04-08", createdAt: "2026-04-02T00:00:00Z", updatedAt: "2026-04-07T00:00:00Z", sprintId: "sprint-2", tags: ["system", "tasks"], comments: [], attachments: [], estimatedHours: 3, actualHours: 2, dependencies: ["task-8"], automatedStatusUpdate: false },
  { id: "task-11", taskCode: "TMS-025", title: "View Tasks by Deadline", description: "As a user, I want to view all tasks assigned to me sorted by deadline so that I can prioritise my workload.", priority: "medium", status: "done", assigneeId: "user-002", creatorId: "user-001", deadline: "2026-04-12", createdAt: "2026-04-02T00:00:00Z", updatedAt: "2026-04-11T00:00:00Z", sprintId: "sprint-2", tags: ["tasks", "view"], comments: [], attachments: [], estimatedHours: 5, actualHours: 4, dependencies: ["task-8"], automatedStatusUpdate: false },
  { id: "task-12", taskCode: "TMS-026", title: "Update Task Status", description: "As a user, I want to update the status of a task to reflect its progress so that collaborators are kept informed.", priority: "high", status: "done", assigneeId: "user-001", creatorId: "user-001", deadline: "2026-04-15", createdAt: "2026-04-02T00:00:00Z", updatedAt: "2026-04-14T00:00:00Z", sprintId: "sprint-2", tags: ["tasks", "status"], comments: [], attachments: [], estimatedHours: 4, actualHours: 4, dependencies: ["task-8"], automatedStatusUpdate: false },
  // Sprint 3
  { id: "task-13", taskCode: "TMS-027", title: "Send Connection Request", description: "As a user, I want to request a connection with another user using their email so that I can assign tasks to them.", priority: "medium", status: "in-progress", assigneeId: "user-001", creatorId: "user-001", deadline: "2026-04-22", createdAt: "2026-04-16T00:00:00Z", updatedAt: "2026-04-18T00:00:00Z", sprintId: "sprint-3", tags: ["connections"], comments: [], attachments: [], estimatedHours: 5, actualHours: 0, dependencies: [], automatedStatusUpdate: false },
  { id: "task-14", taskCode: "TMS-028", title: "Accept/Decline Connections", description: "As a user, I want to accept or decline incoming connection requests so that I can control my task collaborators.", priority: "medium", status: "in-progress", assigneeId: "user-002", creatorId: "user-001", deadline: "2026-04-22", createdAt: "2026-04-16T00:00:00Z", updatedAt: "2026-04-18T00:00:00Z", sprintId: "sprint-3", tags: ["connections"], comments: [], attachments: [], estimatedHours: 4, actualHours: 0, dependencies: ["task-13"], automatedStatusUpdate: false },
  { id: "task-15", taskCode: "TMS-029", title: "View Connections", description: "As a user, I want to view all my current connections so that I know who I can assign tasks to.", priority: "low", status: "todo", assigneeId: "user-003", creatorId: "user-001", deadline: "2026-04-25", createdAt: "2026-04-16T00:00:00Z", updatedAt: "2026-04-16T00:00:00Z", sprintId: "sprint-3", tags: ["connections"], comments: [], attachments: [], estimatedHours: 3, actualHours: 0, dependencies: ["task-14"], automatedStatusUpdate: false },
  { id: "task-16", taskCode: "TMS-030", title: "Task Search & Filter", description: "As a user, I want to search tasks by ID, title, description, or deadline so that I can locate specific tasks easily.", priority: "medium", status: "todo", assigneeId: "user-002", creatorId: "user-001", deadline: "2026-04-28", createdAt: "2026-04-16T00:00:00Z", updatedAt: "2026-04-16T00:00:00Z", sprintId: "sprint-3", tags: ["search", "tasks"], comments: [], attachments: [], estimatedHours: 6, actualHours: 0, dependencies: [], automatedStatusUpdate: false },
  { id: "task-17", taskCode: "TMS-031", title: "Task Detail View", description: "As a user, I want to view full task details when I click a task so that I can understand its content and context.", priority: "medium", status: "todo", assigneeId: "user-003", creatorId: "user-001", deadline: "2026-04-30", createdAt: "2026-04-16T00:00:00Z", updatedAt: "2026-04-16T00:00:00Z", sprintId: "sprint-3", tags: ["tasks", "view"], comments: [], attachments: [], estimatedHours: 4, actualHours: 0, dependencies: ["task-16"], automatedStatusUpdate: false },
  // Sprint 4
  { id: "task-18", taskCode: "TMS-033", title: "View Connection Workload", description: "As a user, I want to view the workload percentage of each connection so that I can balance task assignments.", priority: "medium", status: "todo", assigneeId: "user-001", creatorId: "user-001", deadline: "2026-05-07", createdAt: "2026-05-01T00:00:00Z", updatedAt: "2026-05-01T00:00:00Z", sprintId: "sprint-4", tags: ["workload"], comments: [], attachments: [], estimatedHours: 8, actualHours: 0, dependencies: [], automatedStatusUpdate: false },
  { id: "task-19", taskCode: "TMS-034", title: "Historical Workload Calculation", description: "As a system, I want to calculate workload using historical data so that estimates are more accurate.", priority: "high", status: "todo", assigneeId: "user-002", creatorId: "user-001", deadline: "2026-05-07", createdAt: "2026-05-01T00:00:00Z", updatedAt: "2026-05-01T00:00:00Z", sprintId: "sprint-4", tags: ["workload", "system"], comments: [], attachments: [], estimatedHours: 10, actualHours: 0, dependencies: ["task-18"], automatedStatusUpdate: false },
  { id: "task-20", taskCode: "TMS-035", title: "Task Assignment Notifications", description: "As a taskmaster, I want to receive notifications when I'm assigned a new task so that I can respond promptly.", priority: "high", status: "todo", assigneeId: "user-001", creatorId: "user-001", deadline: "2026-05-09", createdAt: "2026-05-01T00:00:00Z", updatedAt: "2026-05-01T00:00:00Z", sprintId: "sprint-4", tags: ["notifications"], comments: [], attachments: [], estimatedHours: 6, actualHours: 0, dependencies: [], automatedStatusUpdate: false },
  { id: "task-21", taskCode: "TMS-036", title: "Status Update Notifications", description: "As a taskmaster, I want to receive notifications when tasks I created have status updates so that I can stay informed of progress.", priority: "medium", status: "todo", assigneeId: "user-002", creatorId: "user-001", deadline: "2026-05-09", createdAt: "2026-05-01T00:00:00Z", updatedAt: "2026-05-01T00:00:00Z", sprintId: "sprint-4", tags: ["notifications"], comments: [], attachments: [], estimatedHours: 5, actualHours: 0, dependencies: ["task-20"], automatedStatusUpdate: false },
  { id: "task-22", taskCode: "TMS-037", title: "Connection Request Notifications", description: "As a taskmaster, I want to receive notifications when connection requests are sent to me so that I can respond quickly.", priority: "medium", status: "todo", assigneeId: "user-001", creatorId: "user-001", deadline: "2026-05-10", createdAt: "2026-05-01T00:00:00Z", updatedAt: "2026-05-01T00:00:00Z", sprintId: "sprint-4", tags: ["notifications", "connections"], comments: [], attachments: [], estimatedHours: 4, actualHours: 0, dependencies: ["task-20"], automatedStatusUpdate: false },
  { id: "task-23", taskCode: "TMS-038", title: "Notification Preferences", description: "As a taskmaster, I want to customize my notification preferences so that I'm not overwhelmed by updates.", priority: "low", status: "todo", assigneeId: "user-003", creatorId: "user-001", deadline: "2026-05-12", createdAt: "2026-05-01T00:00:00Z", updatedAt: "2026-05-01T00:00:00Z", sprintId: "sprint-4", tags: ["notifications", "settings"], comments: [], attachments: [], estimatedHours: 4, actualHours: 0, dependencies: ["task-20"], automatedStatusUpdate: false },
  { id: "task-24", taskCode: "TMS-039", title: "Task Templates", description: "As a taskmaster, I want to create task templates for recurring work so that I can save time on task creation.", priority: "medium", status: "todo", assigneeId: "user-001", creatorId: "user-001", deadline: "2026-05-12", createdAt: "2026-05-01T00:00:00Z", updatedAt: "2026-05-01T00:00:00Z", sprintId: "sprint-4", tags: ["templates"], comments: [], attachments: [], estimatedHours: 6, actualHours: 0, dependencies: [], automatedStatusUpdate: false },
  { id: "task-25", taskCode: "TMS-040", title: "Auto-Assign by Workload", description: "As a taskmaster, I want to automatically assign tasks based on workload distribution so that work is balanced across my team.", priority: "high", status: "todo", assigneeId: "user-002", creatorId: "user-001", deadline: "2026-05-14", createdAt: "2026-05-01T00:00:00Z", updatedAt: "2026-05-01T00:00:00Z", sprintId: "sprint-4", tags: ["automation", "workload"], comments: [], attachments: [], estimatedHours: 10, actualHours: 0, dependencies: ["task-18", "task-19"], automatedStatusUpdate: false },
  { id: "task-26", taskCode: "TMS-041", title: "Automated Status Updates", description: "As a taskmaster, I want to set up automated status updates based on deadlines so that overdue tasks are flagged.", priority: "medium", status: "todo", assigneeId: "user-001", creatorId: "user-001", deadline: "2026-05-14", createdAt: "2026-05-01T00:00:00Z", updatedAt: "2026-05-01T00:00:00Z", sprintId: "sprint-4", tags: ["automation"], comments: [], attachments: [], estimatedHours: 8, actualHours: 0, dependencies: [], automatedStatusUpdate: false },
  { id: "task-27", taskCode: "TMS-042", title: "Task Dependencies", description: "As a taskmaster, I want to create task dependencies so that workflows follow the correct order.", priority: "high", status: "todo", assigneeId: "user-002", creatorId: "user-001", deadline: "2026-05-15", createdAt: "2026-05-01T00:00:00Z", updatedAt: "2026-05-01T00:00:00Z", sprintId: "sprint-4", tags: ["dependencies", "workflow"], comments: [], attachments: [], estimatedHours: 10, actualHours: 0, dependencies: [], automatedStatusUpdate: false },
  // Sprint 5
  { id: "task-28", taskCode: "TMS-044", title: "System Integration Testing", description: "As a QA engineer, I want to perform system integration testing so that all modules work together seamlessly.", priority: "critical", status: "todo", assigneeId: "user-003", creatorId: "admin-001", deadline: "2026-05-22", createdAt: "2026-05-16T00:00:00Z", updatedAt: "2026-05-16T00:00:00Z", sprintId: "sprint-5", tags: ["testing", "qa"], comments: [], attachments: [], estimatedHours: 20, actualHours: 0, dependencies: [], automatedStatusUpdate: false },
  { id: "task-29", taskCode: "TMS-046", title: "User Acceptance Testing", description: "As a user, I want to perform user acceptance testing so that I can validate that the system meets my requirements.", priority: "critical", status: "todo", assigneeId: "user-001", creatorId: "admin-001", deadline: "2026-05-25", createdAt: "2026-05-16T00:00:00Z", updatedAt: "2026-05-16T00:00:00Z", sprintId: "sprint-5", tags: ["testing", "uat"], comments: [], attachments: [], estimatedHours: 16, actualHours: 0, dependencies: ["task-28"], automatedStatusUpdate: false },
  { id: "task-30", taskCode: "TMS-047", title: "Performance Testing", description: "As a system, I want to undergo performance testing so that I can handle high user loads efficiently.", priority: "high", status: "todo", assigneeId: "user-003", creatorId: "admin-001", deadline: "2026-05-25", createdAt: "2026-05-16T00:00:00Z", updatedAt: "2026-05-16T00:00:00Z", sprintId: "sprint-5", tags: ["testing", "performance"], comments: [], attachments: [], estimatedHours: 12, actualHours: 0, dependencies: ["task-28"], automatedStatusUpdate: false },
  { id: "task-31", taskCode: "TMS-048", title: "Security Testing & Auditing", description: "As a system, I want to undergo security testing and auditing so that user data is protected from vulnerabilities.", priority: "critical", status: "todo", assigneeId: "user-002", creatorId: "admin-001", deadline: "2026-05-27", createdAt: "2026-05-16T00:00:00Z", updatedAt: "2026-05-16T00:00:00Z", sprintId: "sprint-5", tags: ["testing", "security"], comments: [], attachments: [], estimatedHours: 16, actualHours: 0, dependencies: ["task-28"], automatedStatusUpdate: false },
  { id: "task-32", taskCode: "TMS-050", title: "Production Deployment", description: "As an admin, I want to deploy the system to production so that users can access the live application.", priority: "critical", status: "todo", assigneeId: "admin-001", creatorId: "admin-001", deadline: "2026-05-31", createdAt: "2026-05-16T00:00:00Z", updatedAt: "2026-05-16T00:00:00Z", sprintId: "sprint-5", tags: ["deployment", "production"], comments: [], attachments: [], estimatedHours: 8, actualHours: 0, dependencies: ["task-29", "task-30", "task-31"], automatedStatusUpdate: false },
]

const INITIAL_CONNECTIONS: Connection[] = [
  { id: "conn-1", requesterId: "user-001", receiverId: "user-002", status: "accepted", createdAt: "2026-02-01T00:00:00Z" },
  { id: "conn-2", requesterId: "user-001", receiverId: "user-003", status: "accepted", createdAt: "2026-02-05T00:00:00Z" },
  { id: "conn-3", requesterId: "user-002", receiverId: "user-003", status: "pending", createdAt: "2026-04-01T00:00:00Z" },
]

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: "notif-1", userId: "user-001", type: "task_assigned", title: "New Task Assigned", message: "You have been assigned to 'Send Connection Request' (TMS-027)", read: false, createdAt: "2026-04-16T00:00:00Z", taskId: "task-13" },
  { id: "notif-2", userId: "user-002", type: "connection_request", title: "Connection Request", message: "Mark Reyes sent you a connection request", read: false, createdAt: "2026-04-01T00:00:00Z" },
  { id: "notif-3", userId: "user-001", type: "status_update", title: "Task Status Updated", message: "'MFA Setup' (TMS-012) status changed to Done", read: true, createdAt: "2026-03-29T00:00:00Z", taskId: "task-4" },
  { id: "notif-4", userId: "user-003", type: "task_assigned", title: "New Task Assigned", message: "You have been assigned to 'View Connections' (TMS-029)", read: false, createdAt: "2026-04-16T00:00:00Z", taskId: "task-15" },
  { id: "notif-5", userId: "user-001", type: "overdue_alert", title: "Overdue Alert", message: "Task 'Task Dependencies' (TMS-042) is approaching its deadline", read: false, createdAt: "2026-05-14T00:00:00Z", taskId: "task-27" },
]

const INITIAL_TEMPLATES: TaskTemplate[] = [
  { id: "tmpl-1", name: "Bug Fix Template", description: "Standard template for bug fixes including reproduction steps, fix description, and testing notes", priority: "high", estimatedHours: 4, tags: ["bug", "fix"], creatorId: "user-001", createdAt: "2026-03-01T00:00:00Z" },
  { id: "tmpl-2", name: "Feature Development", description: "Template for new feature development including design, implementation, and testing phases", priority: "medium", estimatedHours: 16, tags: ["feature", "development"], creatorId: "user-001", createdAt: "2026-03-05T00:00:00Z" },
  { id: "tmpl-3", name: "Code Review", description: "Template for code review tasks with checklist items for best practices", priority: "medium", estimatedHours: 2, tags: ["review", "quality"], creatorId: "user-002", createdAt: "2026-03-10T00:00:00Z" },
]

export const useTaskStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      mfaPending: false,
      pendingUserId: null,
      users: [DEMO_ADMIN, DEMO_USER, DEMO_USER2, DEMO_USER3],
      tasks: INITIAL_TASKS,
      connections: INITIAL_CONNECTIONS,
      sprints: INITIAL_SPRINTS,
      templates: INITIAL_TEMPLATES,
      notifications: INITIAL_NOTIFICATIONS,
      activeView: "dashboard",
      selectedTask: null,
      searchQuery: "",
      filterStatus: "all",
      filterPriority: "all",

      register: (name, email, password) => {
        const { users } = get()
        if (users.find((u) => u.email === email)) {
          return { success: false, message: "Email already registered" }
        }
        const newUser: User = {
          id: generateId(),
          name,
          email,
          password,
          role: "user",
          mfaEnabled: false,
          mfaVerified: false,
          notificationPrefs: { taskAssigned: true, statusUpdate: true, connectionRequest: true, overdueAlert: true, emailNotifications: true, pushNotifications: false },
          createdAt: new Date().toISOString(),
          workloadPercentage: 0,
        }
        set((s) => ({ users: [...s.users, newUser] }))
        return { success: true, message: "Registration successful" }
      },

      login: (email, password) => {
        const { users } = get()
        const user = users.find((u) => u.email === email && u.password === password)
        if (!user) return { success: false, requiresMfa: false, message: "Invalid credentials" }
        if (user.mfaEnabled) {
          set({ mfaPending: true, pendingUserId: user.id })
          return { success: true, requiresMfa: true, message: "MFA required" }
        }
        set({ currentUser: user, isAuthenticated: true, activeView: user.role === "admin" ? "admin" : "dashboard" })
        set((s) => ({ users: s.users.map((u) => u.id === user.id ? { ...u, lastLogin: new Date().toISOString() } : u) }))
        return { success: true, requiresMfa: false, message: "Login successful" }
      },

      verifyMfa: (userId, code) => {
        if (code.length === 6 && /^\d+$/.test(code)) {
          const { users } = get()
          const user = users.find((u) => u.id === userId)
          if (user) {
            set({ currentUser: user, isAuthenticated: true, mfaPending: false, pendingUserId: null, activeView: user.role === "admin" ? "admin" : "dashboard" })
            set((s) => ({ users: s.users.map((u) => u.id === userId ? { ...u, lastLogin: new Date().toISOString() } : u) }))
            return { success: true, message: "MFA verified" }
          }
        }
        return { success: false, message: "Invalid MFA code" }
      },

      logout: () => set({ currentUser: null, isAuthenticated: false, mfaPending: false, pendingUserId: null, activeView: "dashboard" }),

      resetPassword: (email, newPassword) => {
        const { users } = get()
        const user = users.find((u) => u.email === email)
        if (!user) return { success: false, message: "Email not found" }
        set((s) => ({ users: s.users.map((u) => u.email === email ? { ...u, password: newPassword } : u) }))
        return { success: true, message: "Password reset successful" }
      },

      setupMfa: (userId) => set((s) => ({ users: s.users.map((u) => u.id === userId ? { ...u, mfaEnabled: true, mfaSecret: "TASKSKA2FA" } : u), currentUser: s.currentUser?.id === userId ? { ...s.currentUser, mfaEnabled: true } : s.currentUser })),

      disableMfa: (userId) => set((s) => ({ users: s.users.map((u) => u.id === userId ? { ...u, mfaEnabled: false, mfaSecret: undefined } : u), currentUser: s.currentUser?.id === userId ? { ...s.currentUser, mfaEnabled: false } : s.currentUser })),

      updateNotificationPrefs: (userId, prefs) => set((s) => ({ users: s.users.map((u) => u.id === userId ? { ...u, notificationPrefs: { ...u.notificationPrefs, ...prefs } } : u), currentUser: s.currentUser?.id === userId ? { ...s.currentUser, notificationPrefs: { ...s.currentUser.notificationPrefs, ...prefs } } : s.currentUser })),

      createTask: (task) => {
        const { tasks } = get()
        const newTask: Task = { ...task, id: generateId(), taskCode: generateTaskCode(tasks), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), comments: [] }
        set((s) => ({ tasks: [...s.tasks, newTask] }))
        if (task.assigneeId !== task.creatorId) {
          get().addNotification({ userId: task.assigneeId, type: "task_assigned", title: "New Task Assigned", message: `You have been assigned to '${task.title}' (${newTask.taskCode})`, read: false, taskId: newTask.id })
        }
        return newTask
      },

      updateTask: (id, updates) => set((s) => {
        const old = s.tasks.find((t) => t.id === id)
        if (old && updates.status && old.status !== updates.status) {
          setTimeout(() => get().addNotification({ userId: old.creatorId, type: "status_update", title: "Task Status Updated", message: `'${old.title}' status changed to ${updates.status}`, read: false, taskId: id }), 0)
        }
        return { tasks: s.tasks.map((t) => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t) }
      }),

      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      addComment: (taskId, userId, content) => set((s) => ({ tasks: s.tasks.map((t) => t.id === taskId ? { ...t, comments: [...t.comments, { id: generateId(), userId, content, createdAt: new Date().toISOString() }] } : t) })),

      setSelectedTask: (task) => set({ selectedTask: task }),

      updateTaskStatus: (taskId, status) => {
        get().updateTask(taskId, { status })
        const task = get().tasks.find((t) => t.id === taskId)
        if (task) {
          const blocked = get().tasks.filter((t) => t.dependencies.includes(taskId) && t.status === "todo")
          blocked.forEach((bt) => {
            get().addNotification({ userId: bt.assigneeId, type: "dependency_blocked", title: "Dependency Unblocked", message: `Task '${bt.title}' dependency '${task.title}' is now ${status}`, read: false, taskId: bt.id })
          })
        }
      },

      sendConnectionRequest: (requesterId, receiverEmail) => {
        const { users, connections } = get()
        const receiver = users.find((u) => u.email === receiverEmail)
        if (!receiver) return { success: false, message: "User not found" }
        if (receiver.id === requesterId) return { success: false, message: "Cannot connect with yourself" }
        const existing = connections.find((c) => (c.requesterId === requesterId && c.receiverId === receiver.id) || (c.requesterId === receiver.id && c.receiverId === requesterId))
        if (existing) return { success: false, message: "Connection already exists" }
        const newConn: Connection = { id: generateId(), requesterId, receiverId: receiver.id, status: "pending", createdAt: new Date().toISOString() }
        set((s) => ({ connections: [...s.connections, newConn] }))
        get().addNotification({ userId: receiver.id, type: "connection_request", title: "Connection Request", message: `${users.find((u) => u.id === requesterId)?.name} sent you a connection request`, read: false })
        return { success: true, message: "Connection request sent" }
      },

      respondToConnection: (connectionId, accept) => set((s) => {
        const conn = s.connections.find((c) => c.id === connectionId)
        if (conn && accept) {
          const requester = s.users.find((u) => u.id === conn.requesterId)
          setTimeout(() => get().addNotification({ userId: conn.requesterId, type: "connection_accepted", title: "Connection Accepted", message: `${s.users.find((u) => u.id === conn.receiverId)?.name} accepted your connection request`, read: false }), 0)
        }
        return { connections: s.connections.map((c) => c.id === connectionId ? { ...c, status: accept ? "accepted" : "declined" } : c) }
      }),

      createSprint: (sprint) => set((s) => ({ sprints: [...s.sprints, { ...sprint, id: generateId() }] })),

      updateSprint: (id, updates) => set((s) => ({ sprints: s.sprints.map((sp) => sp.id === id ? { ...sp, ...updates } : sp) })),

      createTemplate: (template) => set((s) => ({ templates: [...s.templates, { ...template, id: generateId(), createdAt: new Date().toISOString() }] })),

      deleteTemplate: (id) => set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),

      markNotificationRead: (id) => set((s) => ({ notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n) })),

      markAllNotificationsRead: (userId) => set((s) => ({ notifications: s.notifications.map((n) => n.userId === userId ? { ...n, read: true } : n) })),

      addNotification: (notification) => set((s) => ({ notifications: [...s.notifications, { ...notification, id: generateId(), createdAt: new Date().toISOString() }] })),

      setActiveView: (view) => set({ activeView: view }),
      setSearchQuery: (q) => set({ searchQuery: q }),
      setFilterStatus: (s) => set({ filterStatus: s }),
      setFilterPriority: (p) => set({ filterPriority: p }),
    }),
    { name: "taskska-store" }
  )
)
