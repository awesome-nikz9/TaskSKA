"use client";
// ─── TaskSKA — Single canonical localStorage data store ───────────────────────
// Covers all sprints TMS-8 through TMS-50

export type TaskStatus = "Not Started" | "In Progress" | "Blocked" | "Completed";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // btoa-hashed (demo only)
  role: "admin" | "taskmaster";
  mfaEnabled: boolean;
  mfaSecret?: string;
  createdAt: string;
  notifAssigned: boolean;
  notifStatusUpdate: boolean;
  notifConnectionRequest: boolean;
}

export interface Connection {
  id: string;
  fromUserId: string; // requester
  toUserId: string;   // recipient
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

export interface Task {
  id: string; // TMS-NNN
  title: string;
  description: string;
  deadline?: string; // YYYY-MM-DD
  status: TaskStatus;
  createdById: string;
  assignedToId: string;
  dependencies?: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  estimatedHours?: number;
}

export type TemplateCategory =
  | "Engineering"
  | "Design"
  | "QA & Testing"
  | "DevOps"
  | "Documentation"
  | "Management"
  | "Other";

export interface TaskTemplate {
  id: string;
  name: string;
  title: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  estimatedHours?: number;
  defaultStatus: TaskStatus;
  ownerId: string;
  isSystem?: boolean; // built-in templates visible to all
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "task_assigned" | "status_update" | "connection_request" | "overdue";
  message: string;
  read: boolean;
  createdAt: string;
  linkId?: string; // task id if relevant
}

export interface Session {
  userId: string;
  expiresAt: string;
}

// ─── Storage Keys ──────────────────────────────────────────────────────────────
const K = {
  users: "tms_users",
  session: "tms_session",
  mfaPending: "tms_mfa_pending",
  connections: "tms_connections",
  tasks: "tms_tasks",
  taskCounter: "tms_task_counter",
  templates: "tms_templates",
  notifications: "tms_notifications",
  seeded: "tms_seeded",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, val: T): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function hashPw(p: string): string {
  return btoa(p + "__tska_salt__");
}

function checkPw(plain: string, hash: string): boolean {
  return hashPw(plain) === hash;
}

function nextTaskId(): string {
  const n = load<number>(K.taskCounter, 8) + 1;
  save(K.taskCounter, n);
  return `TMS-${String(n).padStart(3, "0")}`;
}

// ─── SEED ──────────────────────────────────────────────────────────────────────
const SEED_VERSION = "v3"; // bump this to force a full re-seed

export function seedDemoData(): void {
  const seededVersion = load<string>(K.seeded as string, "");
  if (seededVersion === SEED_VERSION) return;

  // Clear all TMS data to ensure a clean slate
  if (typeof window !== "undefined") {
    Object.values(K).forEach((key) => localStorage.removeItem(key as string));
  }

  const now = new Date();
  const d  = (offsetDays: number) => new Date(now.getTime() + offsetDays * 86_400_000).toISOString();
  const dt = (offsetDays: number) => new Date(now.getTime() + offsetDays * 86_400_000).toISOString().split("T")[0];

  // ── 1 Admin + 5 Taskmasters — zero connections between any of them ──────────
  const admin: User = {
    id: "u_admin",
    name: "System Admin",
    email: "admin@taskska.com",
    password: hashPw("Admin@1234"),
    role: "admin",
    mfaEnabled: false,
    createdAt: d(-40),
    notifAssigned: true,
    notifStatusUpdate: true,
    notifConnectionRequest: true,
  };

  // Taskmaster 1 — senior dev, heavy workload
  const alice: User = {
    id: "u_alice",
    name: "Alice Johnson",
    email: "alice@taskska.com",
    password: hashPw("Alice@1234"),
    role: "taskmaster",
    mfaEnabled: false,
    createdAt: d(-30),
    notifAssigned: true,
    notifStatusUpdate: true,
    notifConnectionRequest: true,
  };

  // Taskmaster 2 — backend engineer, moderate workload
  const bob: User = {
    id: "u_bob",
    name: "Bob Martinez",
    email: "bob@taskska.com",
    password: hashPw("Bob@12345"),
    role: "taskmaster",
    mfaEnabled: false,
    createdAt: d(-28),
    notifAssigned: true,
    notifStatusUpdate: true,
    notifConnectionRequest: true,
  };

  // Taskmaster 3 — QA engineer, light workload
  const carol: User = {
    id: "u_carol",
    name: "Carol Smith",
    email: "carol@taskska.com",
    password: hashPw("Carol@123"),
    role: "taskmaster",
    mfaEnabled: false,
    createdAt: d(-25),
    notifAssigned: true,
    notifStatusUpdate: false,
    notifConnectionRequest: true,
  };

  // Taskmaster 4 — designer, moderate workload
  const david: User = {
    id: "u_david",
    name: "David Lee",
    email: "david@taskska.com",
    password: hashPw("David@123"),
    role: "taskmaster",
    mfaEnabled: false,
    createdAt: d(-20),
    notifAssigned: true,
    notifStatusUpdate: true,
    notifConnectionRequest: false,
  };

  // Taskmaster 5 — devops, minimal workload
  const emma: User = {
    id: "u_emma",
    name: "Emma Wilson",
    email: "emma@taskska.com",
    password: hashPw("Emma@1234"),
    role: "taskmaster",
    mfaEnabled: false,
    createdAt: d(-15),
    notifAssigned: false,
    notifStatusUpdate: true,
    notifConnectionRequest: true,
  };

  save(K.users, [admin, alice, bob, carol, david, emma]);

  // ── No connections — users will connect themselves during testing ─────────
  save(K.connections, []);

  // ── Tasks — each user only assigned to themselves (no cross-user needed yet)
  save(K.taskCounter, 20); // next auto-id will be TMS-021

  const tasks: Task[] = [
    // ── Alice's tasks ────────────────────────────────────────────────────────
    {
      id: "TMS-001",
      title: "Design system database schema",
      description: "Create the full ER diagram covering users, tasks, connections, notifications and session tables. Include indexes and foreign key constraints.",
      deadline: dt(2),
      status: "Completed",
      createdById: "u_alice",
      assignedToId: "u_alice",
      completedAt: d(-3),
      createdAt: d(-14),
      updatedAt: d(-3),
      estimatedHours: 5,
      dependencies: [],
    },
    {
      id: "TMS-002",
      title: "Implement authentication module",
      description: "Build register, login, logout, password reset and MFA verification endpoints. Use secure session management and bcrypt-equivalent hashing.",
      deadline: dt(1),
      status: "In Progress",
      createdById: "u_alice",
      assignedToId: "u_alice",
      createdAt: d(-10),
      updatedAt: d(-2),
      estimatedHours: 8,
      dependencies: ["TMS-001"],
    },
    {
      id: "TMS-003",
      title: "Build assigned tasks list UI",
      description: "Create the React component that displays all assigned tasks sorted by deadline (earliest first), with task ID, title, and status badge visible at a glance.",
      deadline: dt(4),
      status: "In Progress",
      createdById: "u_alice",
      assignedToId: "u_alice",
      createdAt: d(-7),
      updatedAt: d(-1),
      estimatedHours: 6,
      dependencies: [],
    },
    {
      id: "TMS-004",
      title: "Write system documentation",
      description: "Document all API endpoints, data models, and user flows. Include setup guide, environment variable reference, and deployment instructions.",
      deadline: dt(14),
      status: "Not Started",
      createdById: "u_alice",
      assignedToId: "u_alice",
      createdAt: d(-3),
      updatedAt: d(-3),
      estimatedHours: 10,
      dependencies: [],
    },
    {
      id: "TMS-005",
      title: "Performance testing — 1000 concurrent users",
      description: "Run load tests against the staging environment simulating 1,000 concurrent users. Document p50, p95, p99 response times and identify bottlenecks.",
      deadline: dt(-1), // overdue
      status: "Blocked",
      createdById: "u_alice",
      assignedToId: "u_alice",
      createdAt: d(-8),
      updatedAt: d(-4),
      estimatedHours: 6,
      dependencies: [],
    },

    // ── Bob's tasks ───────────────────────────────────────────────────────────
    {
      id: "TMS-006",
      title: "Implement connection request API",
      description: "Build endpoints for sending, accepting, and declining connection requests. Enforce business rules: a user cannot connect to themselves, duplicate requests are blocked.",
      deadline: dt(3),
      status: "In Progress",
      createdById: "u_bob",
      assignedToId: "u_bob",
      createdAt: d(-9),
      updatedAt: d(-1),
      estimatedHours: 7,
      dependencies: [],
    },
    {
      id: "TMS-007",
      title: "Build workload estimation engine",
      description: "Implement the algorithm that calculates a 0–100% workload score per user based on active tasks, deadlines in the next 7 days, task states, and historical completion data.",
      deadline: dt(6),
      status: "In Progress",
      createdById: "u_bob",
      assignedToId: "u_bob",
      createdAt: d(-6),
      updatedAt: d(-2),
      estimatedHours: 9,
      dependencies: ["TMS-006"],
    },
    {
      id: "TMS-008",
      title: "Task search and filtering",
      description: "Implement server-side search across tasks by ID, title, description, and deadline. Results scoped to the current user's own tasks and all connected user tasks.",
      deadline: dt(5),
      status: "Not Started",
      createdById: "u_bob",
      assignedToId: "u_bob",
      createdAt: d(-5),
      updatedAt: d(-5),
      estimatedHours: 5,
      dependencies: [],
    },
    {
      id: "TMS-009",
      title: "Set up CI/CD pipeline",
      description: "Configure GitHub Actions workflow for automated testing, linting, and deployment to staging on every push to main. Include rollback on failed health-check.",
      deadline: dt(8),
      status: "Not Started",
      createdById: "u_bob",
      assignedToId: "u_bob",
      createdAt: d(-4),
      updatedAt: d(-4),
      estimatedHours: 4,
      dependencies: [],
    },

    // ── Carol's tasks ─────────────────────────────────────────────────────────
    {
      id: "TMS-010",
      title: "Write integration test suite",
      description: "Cover all module interfaces: auth flow, task CRUD, connection lifecycle, and notification delivery. Achieve at least 85% code coverage.",
      deadline: dt(7),
      status: "In Progress",
      createdById: "u_carol",
      assignedToId: "u_carol",
      createdAt: d(-8),
      updatedAt: d(-1),
      estimatedHours: 8,
      dependencies: [],
    },
    {
      id: "TMS-011",
      title: "User acceptance testing",
      description: "Conduct structured UAT sessions with 5 representative users. Document findings, prioritise bugs, and confirm acceptance criteria for all Sprint 1–4 user stories.",
      deadline: dt(10),
      status: "Not Started",
      createdById: "u_carol",
      assignedToId: "u_carol",
      createdAt: d(-3),
      updatedAt: d(-3),
      estimatedHours: 6,
      dependencies: ["TMS-010"],
    },
    {
      id: "TMS-012",
      title: "Security audit and OWASP review",
      description: "Conduct a full OWASP Top 10 audit. Run automated pen-test tools and manual review. Document findings, severity ratings, and remediation steps for each issue.",
      deadline: dt(12),
      status: "Not Started",
      createdById: "u_carol",
      assignedToId: "u_carol",
      createdAt: d(-2),
      updatedAt: d(-2),
      estimatedHours: 10,
      dependencies: [],
    },

    // ── David's tasks ─────────────────────────────────────────────────────────
    {
      id: "TMS-013",
      title: "Design dashboard UI mockups",
      description: "Create high-fidelity Figma mockups for the main dashboard, task detail page, connections view, and notifications panel. Follow the TaskSKA blue design system.",
      deadline: dt(3),
      status: "Completed",
      createdById: "u_david",
      assignedToId: "u_david",
      completedAt: d(-1),
      createdAt: d(-12),
      updatedAt: d(-1),
      estimatedHours: 8,
      dependencies: [],
    },
    {
      id: "TMS-014",
      title: "Build notification preferences UI",
      description: "Implement the settings page section allowing users to toggle notifications for: task assignments, status updates, and connection requests. Persist preferences immediately.",
      deadline: dt(5),
      status: "In Progress",
      createdById: "u_david",
      assignedToId: "u_david",
      createdAt: d(-5),
      updatedAt: d(-1),
      estimatedHours: 4,
      dependencies: ["TMS-013"],
    },
    {
      id: "TMS-015",
      title: "Create reusable component library",
      description: "Extract and document shared UI components: StatusBadge, WorkloadBar, TaskCard, UserAvatar, ConnectionButton. Add Storybook stories for each.",
      deadline: dt(9),
      status: "Not Started",
      createdById: "u_david",
      assignedToId: "u_david",
      createdAt: d(-3),
      updatedAt: d(-3),
      estimatedHours: 7,
      dependencies: ["TMS-013"],
    },

    // ── Emma's tasks ──────────────────────────────────────────────────────────
    {
      id: "TMS-016",
      title: "Provision staging environment",
      description: "Set up cloud infrastructure for staging: VPC, compute instances, managed database, object storage, and SSL certificates. Document all resource configurations.",
      deadline: dt(4),
      status: "In Progress",
      createdById: "u_emma",
      assignedToId: "u_emma",
      createdAt: d(-6),
      updatedAt: d(-2),
      estimatedHours: 5,
      dependencies: [],
    },
    {
      id: "TMS-017",
      title: "Configure environment variable management",
      description: "Set up secrets manager integration for all environments. Ensure no credentials are committed to source control. Document the rotation policy.",
      deadline: dt(6),
      status: "Not Started",
      createdById: "u_emma",
      assignedToId: "u_emma",
      createdAt: d(-3),
      updatedAt: d(-3),
      estimatedHours: 3,
      dependencies: ["TMS-016"],
    },
    {
      id: "TMS-018",
      title: "Production deployment checklist",
      description: "Prepare and execute the production launch checklist: smoke tests, DNS cutover, monitoring alerts, on-call rota, rollback procedure, and stakeholder sign-off.",
      deadline: dt(18),
      status: "Not Started",
      createdById: "u_emma",
      assignedToId: "u_emma",
      createdAt: d(-1),
      updatedAt: d(-1),
      estimatedHours: 4,
      dependencies: ["TMS-016", "TMS-017"],
    },
  ];
  save(K.tasks, tasks);

  // ── Templates ─────────────────────────────────────────────────────────────
  const templates: TaskTemplate[] = [
    // System templates — visible to all users
    {
      id: "tmpl_sys_001",
      name: "Bug Fix",
      title: "Bug Fix: [Issue Name]",
      description: "## Problem\nDescribe the bug clearly.\n\n## Steps to Reproduce\n1. \n2. \n3. \n\n## Expected Behaviour\n\n## Actual Behaviour\n\n## Root Cause\n\n## Fix Applied\n",
      category: "Engineering",
      tags: ["bug", "engineering", "fix"],
      estimatedHours: 3,
      defaultStatus: "Not Started",
      ownerId: "u_admin",
      isSystem: true,
      usageCount: 0,
      createdAt: d(0),
      updatedAt: d(0),
    },
    {
      id: "tmpl_sys_002",
      name: "Feature Development",
      title: "Feature: [Feature Name]",
      description: "## Overview\nBrief summary of what this feature does.\n\n## User Story\nAs a [user], I want [goal] so that [benefit].\n\n## Acceptance Criteria\n- [ ] \n- [ ] \n- [ ] \n\n## Technical Design\n\n## Out of Scope\n",
      category: "Engineering",
      tags: ["feature", "engineering", "development"],
      estimatedHours: 8,
      defaultStatus: "Not Started",
      ownerId: "u_admin",
      isSystem: true,
      usageCount: 0,
      createdAt: d(0),
      updatedAt: d(0),
    },
    {
      id: "tmpl_sys_003",
      name: "Code Review",
      title: "Review: [PR / Branch Name]",
      description: "## PR Link\n\n## Summary of Changes\n\n## Review Checklist\n- [ ] Logic is correct\n- [ ] Code style is consistent\n- [ ] Tests are present and pass\n- [ ] No security issues\n- [ ] Documentation updated\n- [ ] No unnecessary dependencies added\n\n## Feedback\n",
      category: "Engineering",
      tags: ["review", "pr", "engineering"],
      estimatedHours: 2,
      defaultStatus: "Not Started",
      ownerId: "u_admin",
      isSystem: true,
      usageCount: 0,
      createdAt: d(0),
      updatedAt: d(0),
    },
    {
      id: "tmpl_sys_004",
      name: "Integration Test",
      title: "Integration Test: [Module Name]",
      description: "## Scope\nModules and interfaces being tested.\n\n## Test Environment\n\n## Test Cases\n| # | Description | Expected | Actual | Pass/Fail |\n|---|-------------|----------|--------|----------|\n| 1 | | | | |\n\n## Coverage Summary\n\n## Issues Found\n",
      category: "QA & Testing",
      tags: ["testing", "integration", "qa"],
      estimatedHours: 6,
      defaultStatus: "Not Started",
      ownerId: "u_admin",
      isSystem: true,
      usageCount: 0,
      createdAt: d(0),
      updatedAt: d(0),
    },
    {
      id: "tmpl_sys_005",
      name: "Security Audit",
      title: "Security Audit: [Component / Module]",
      description: "## Audit Scope\n\n## OWASP Top 10 Checklist\n- [ ] Injection\n- [ ] Broken Authentication\n- [ ] Sensitive Data Exposure\n- [ ] XXE\n- [ ] Broken Access Control\n- [ ] Security Misconfiguration\n- [ ] XSS\n- [ ] Insecure Deserialization\n- [ ] Using Components with Known Vulnerabilities\n- [ ] Insufficient Logging\n\n## Findings\n| Severity | Issue | Remediation |\n|----------|-------|-------------|\n\n## Sign-off\n",
      category: "QA & Testing",
      tags: ["security", "audit", "owasp"],
      estimatedHours: 10,
      defaultStatus: "Not Started",
      ownerId: "u_admin",
      isSystem: true,
      usageCount: 0,
      createdAt: d(0),
      updatedAt: d(0),
    },
    {
      id: "tmpl_sys_006",
      name: "Deployment Checklist",
      title: "Deploy: [Service / Version] to [Environment]",
      description: "## Pre-Deployment\n- [ ] All tests passing\n- [ ] Changelog updated\n- [ ] Environment variables verified\n- [ ] Database migrations ready\n- [ ] Rollback plan documented\n\n## Deployment Steps\n1. \n2. \n3. \n\n## Post-Deployment Verification\n- [ ] Smoke tests passed\n- [ ] Monitoring alerts nominal\n- [ ] Stakeholders notified\n\n## Rollback Procedure\n",
      category: "DevOps",
      tags: ["deployment", "devops", "release"],
      estimatedHours: 4,
      defaultStatus: "Not Started",
      ownerId: "u_admin",
      isSystem: true,
      usageCount: 0,
      createdAt: d(0),
      updatedAt: d(0),
    },
    {
      id: "tmpl_sys_007",
      name: "CI/CD Pipeline Setup",
      title: "CI/CD: Setup pipeline for [Project / Service]",
      description: "## Pipeline Goals\n\n## Stages\n1. **Lint** — \n2. **Unit Tests** — \n3. **Build** — \n4. **Integration Tests** — \n5. **Deploy to Staging** — \n6. **Deploy to Production** — \n\n## Environment Variables Required\n\n## Health Check URL\n\n## Notifications\n",
      category: "DevOps",
      tags: ["ci-cd", "devops", "automation"],
      estimatedHours: 5,
      defaultStatus: "Not Started",
      ownerId: "u_admin",
      isSystem: true,
      usageCount: 0,
      createdAt: d(0),
      updatedAt: d(0),
    },
    {
      id: "tmpl_sys_008",
      name: "Design Handoff",
      title: "Design Handoff: [Component / Screen Name]",
      description: "## Figma / Design Tool Link\n\n## Component Specifications\n- **Colours:** \n- **Typography:** \n- **Spacing:** \n- **Border Radius:** \n- **Breakpoints:** \n\n## States\n- Default\n- Hover\n- Active\n- Disabled\n- Error\n\n## Assets\n\n## Notes for Developers\n",
      category: "Design",
      tags: ["design", "handoff", "ui"],
      estimatedHours: 3,
      defaultStatus: "Not Started",
      ownerId: "u_admin",
      isSystem: true,
      usageCount: 0,
      createdAt: d(0),
      updatedAt: d(0),
    },
    {
      id: "tmpl_sys_009",
      name: "API Documentation",
      title: "Docs: [API / Module] Documentation",
      description: "## Overview\n\n## Base URL\n\n## Authentication\n\n## Endpoints\n\n### GET /example\n**Description:**\n**Parameters:**\n| Name | Type | Required | Description |\n|------|------|----------|-------------|\n\n**Response:**\n```json\n{}\n```\n\n## Error Codes\n| Code | Meaning |\n|------|---------|\n\n## Changelog\n",
      category: "Documentation",
      tags: ["docs", "api", "documentation"],
      estimatedHours: 5,
      defaultStatus: "Not Started",
      ownerId: "u_admin",
      isSystem: true,
      usageCount: 0,
      createdAt: d(0),
      updatedAt: d(0),
    },
    {
      id: "tmpl_sys_010",
      name: "Sprint Planning",
      title: "Sprint [#] Planning — [Team Name]",
      description: "## Sprint Goal\n\n## Capacity\n| Member | Available Hours |\n|--------|----------------|\n\n## Stories Committed\n| ID | Title | Points | Assignee |\n|----|-------|--------|----------|\n\n## Definition of Done\n- [ ] Feature complete\n- [ ] Tests written\n- [ ] Code reviewed\n- [ ] Deployed to staging\n- [ ] Acceptance criteria met\n\n## Risks & Dependencies\n",
      category: "Management",
      tags: ["sprint", "planning", "agile"],
      estimatedHours: 2,
      defaultStatus: "Not Started",
      ownerId: "u_admin",
      isSystem: true,
      usageCount: 0,
      createdAt: d(0),
      updatedAt: d(0),
    },
    // User-owned templates
    {
      id: "tmpl_001",
      name: "Bug Fix (Alice)",
      title: "Bug Fix: [Issue Name]",
      description: "## Problem\nDescribe the bug.\n\n## Steps to Reproduce\n1. \n2. \n\n## Expected Behaviour\n\n## Fix Applied\n",
      category: "Engineering",
      tags: ["bug", "fix"],
      estimatedHours: 3,
      defaultStatus: "Not Started",
      ownerId: "u_alice",
      isSystem: false,
      usageCount: 2,
      createdAt: d(-10),
      updatedAt: d(-10),
    },
    {
      id: "tmpl_003",
      name: "Code Review (Bob)",
      title: "Review: [PR / Branch Name]",
      description: "## What to Review\n\n## Checklist\n- [ ] Code quality\n- [ ] Tests pass\n- [ ] Documentation updated\n",
      category: "Engineering",
      tags: ["review", "pr"],
      estimatedHours: 2,
      defaultStatus: "Not Started",
      ownerId: "u_bob",
      isSystem: false,
      usageCount: 4,
      createdAt: d(-8),
      updatedAt: d(-8),
    },
    {
      id: "tmpl_004",
      name: "Test Case (Carol)",
      title: "Test: [Module / Feature]",
      description: "## Scope\n\n## Test Steps\n1. \n2. \n\n## Expected Result\n\n## Actual Result\n\n## Pass / Fail\n",
      category: "QA & Testing",
      tags: ["testing", "qa"],
      estimatedHours: 4,
      defaultStatus: "Not Started",
      ownerId: "u_carol",
      isSystem: false,
      usageCount: 1,
      createdAt: d(-5),
      updatedAt: d(-5),
    },
    {
      id: "tmpl_005",
      name: "Design Handoff (David)",
      title: "Design Handoff: [Component Name]",
      description: "## Figma Link\n\n## Specs\n- Colours: \n- Typography: \n- Spacing: \n\n## Notes for Dev\n",
      category: "Design",
      tags: ["design", "handoff"],
      estimatedHours: 2,
      defaultStatus: "Not Started",
      ownerId: "u_david",
      isSystem: false,
      usageCount: 3,
      createdAt: d(-3),
      updatedAt: d(-3),
    },
  ];
  save(K.templates, templates);

  // ── Notifications — each user gets their own relevant notifications ─────────
  const notifs: Notification[] = [
    // Alice
    {
      id: uid(), userId: "u_alice", type: "status_update",
      message: "Your task \"Implement authentication module\" (TMS-002) was moved to In Progress.",
      read: false, createdAt: d(-2), linkId: "TMS-002",
    },
    {
      id: uid(), userId: "u_alice", type: "overdue",
      message: "Task \"Performance testing\" (TMS-005) is overdue — deadline passed yesterday.",
      read: false, createdAt: d(0), linkId: "TMS-005",
    },
    // Bob
    {
      id: uid(), userId: "u_bob", type: "status_update",
      message: "Your task \"Implement connection request API\" (TMS-006) was moved to In Progress.",
      read: false, createdAt: d(-1), linkId: "TMS-006",
    },
    {
      id: uid(), userId: "u_bob", type: "status_update",
      message: "Your task \"Build workload estimation engine\" (TMS-007) was moved to In Progress.",
      read: true, createdAt: d(-2), linkId: "TMS-007",
    },
    // Carol
    {
      id: uid(), userId: "u_carol", type: "status_update",
      message: "Your task \"Write integration test suite\" (TMS-010) was moved to In Progress.",
      read: false, createdAt: d(-1), linkId: "TMS-010",
    },
    // David
    {
      id: uid(), userId: "u_david", type: "status_update",
      message: "Your task \"Design dashboard UI mockups\" (TMS-013) was marked Completed.",
      read: true, createdAt: d(-1), linkId: "TMS-013",
    },
    {
      id: uid(), userId: "u_david", type: "status_update",
      message: "Your task \"Build notification preferences UI\" (TMS-014) was moved to In Progress.",
      read: false, createdAt: d(-1), linkId: "TMS-014",
    },
    // Emma
    {
      id: uid(), userId: "u_emma", type: "status_update",
      message: "Your task \"Provision staging environment\" (TMS-016) was moved to In Progress.",
      read: false, createdAt: d(-2), linkId: "TMS-016",
    },
  ];
  save(K.notifications, notifs);

  save(K.seeded, SEED_VERSION);
}

// ─── AUTH ──────────────────────────────────────────────────────────────────────
export const authStore = {
  register(name: string, email: string, password: string): { ok: boolean; error?: string } {
    const users = load<User[]>(K.users, []);
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, error: "An account with this email already exists." };
    }
    const user: User = {
      id: uid(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashPw(password),
      role: "taskmaster",
      mfaEnabled: false,
      createdAt: new Date().toISOString(),
      notifAssigned: true,
      notifStatusUpdate: true,
      notifConnectionRequest: true,
    };
    save(K.users, [...users, user]);
    return { ok: true };
  },

  login(email: string, password: string): { ok: boolean; user?: User; needsMfa?: boolean; error?: string } {
    const users = load<User[]>(K.users, []);
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) return { ok: false, error: "No account found with this email." };
    if (!checkPw(password, user.password)) return { ok: false, error: "Incorrect password." };
    if (user.mfaEnabled) {
      save(K.mfaPending, { userId: user.id, expires: Date.now() + 5 * 60 * 1000 });
      return { ok: true, needsMfa: true, user };
    }
    save(K.session, { userId: user.id, expiresAt: new Date(Date.now() + 8 * 3600 * 1000).toISOString() });
    return { ok: true, user };
  },

  verifyMfa(userId: string, code: string): { ok: boolean; error?: string } {
    const pending = load<{ userId: string; expires: number } | null>(K.mfaPending, null);
    if (!pending || pending.userId !== userId || Date.now() > pending.expires) {
      return { ok: false, error: "MFA session expired. Please log in again." };
    }
    const user = load<User[]>(K.users, []).find((u) => u.id === userId);
    if (!user) return { ok: false, error: "User not found." };
    const valid = user.mfaSecret || "123456";
    if (code !== valid) return { ok: false, error: "Invalid MFA code. (Demo: use 123456)" };
    if (typeof window !== "undefined") localStorage.removeItem(K.mfaPending);
    save(K.session, { userId: user.id, expiresAt: new Date(Date.now() + 8 * 3600 * 1000).toISOString() });
    return { ok: true };
  },

  logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(K.session);
      localStorage.removeItem(K.mfaPending);
    }
  },

  getSession(): Session | null {
    const s = load<Session | null>(K.session, null);
    if (!s) return null;
    if (new Date(s.expiresAt) < new Date()) {
      if (typeof window !== "undefined") localStorage.removeItem(K.session);
      return null;
    }
    return s;
  },

  getCurrentUser(): User | null {
    const s = this.getSession();
    if (!s) return null;
    return load<User[]>(K.users, []).find((u) => u.id === s.userId) ?? null;
  },

  resetPassword(email: string, newPassword: string): { ok: boolean; error?: string } {
    const users = load<User[]>(K.users, []);
    const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (idx === -1) return { ok: false, error: "No account found with this email." };
    users[idx].password = hashPw(newPassword);
    save(K.users, users);
    return { ok: true };
  },

  setupMfa(userId: string, secret: string): void {
    const users = load<User[]>(K.users, []);
    const idx = users.findIndex((u) => u.id === userId);
    if (idx !== -1) { users[idx].mfaEnabled = true; users[idx].mfaSecret = secret; save(K.users, users); }
  },

  disableMfa(userId: string): void {
    const users = load<User[]>(K.users, []);
    const idx = users.findIndex((u) => u.id === userId);
    if (idx !== -1) { users[idx].mfaEnabled = false; delete users[idx].mfaSecret; save(K.users, users); }
  },

  updateProfile(userId: string, name: string, email: string): { ok: boolean; error?: string } {
    const users = load<User[]>(K.users, []);
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.id !== userId)) {
      return { ok: false, error: "Email already in use by another account." };
    }
    const idx = users.findIndex((u) => u.id === userId);
    if (idx !== -1) { users[idx].name = name.trim(); users[idx].email = email.toLowerCase().trim(); save(K.users, users); }
    return { ok: true };
  },

  updateNotifPrefs(
    userId: string,
    prefs: Partial<Pick<User, "notifAssigned" | "notifStatusUpdate" | "notifConnectionRequest">>
  ): void {
    const users = load<User[]>(K.users, []);
    const idx = users.findIndex((u) => u.id === userId);
    if (idx !== -1) { Object.assign(users[idx], prefs); save(K.users, users); }
  },

  getAllUsers(): User[] {
    return load<User[]>(K.users, []);
  },

  deleteUser(userId: string): void {
    save(K.users, load<User[]>(K.users, []).filter((u) => u.id !== userId));
  },
};

// ─── CONNECTIONS ───────────────────────────────────────────────────────────────
export const connectionStore = {
  getAll(): Connection[] {
    return load<Connection[]>(K.connections, []);
  },

  sendRequest(fromUserId: string, toEmail: string): { ok: boolean; error?: string } {
    const users = load<User[]>(K.users, []);
    const toUser = users.find((u) => u.email.toLowerCase() === toEmail.toLowerCase().trim());
    if (!toUser) return { ok: false, error: "No user found with that email address." };
    if (toUser.id === fromUserId) return { ok: false, error: "You cannot connect with yourself." };
    const conns = this.getAll();
    const existing = conns.find(
      (c) =>
        (c.fromUserId === fromUserId && c.toUserId === toUser.id) ||
        (c.fromUserId === toUser.id && c.toUserId === fromUserId)
    );
    if (existing) {
      if (existing.status === "accepted") return { ok: false, error: "You are already connected with this user." };
      if (existing.status === "pending") return { ok: false, error: "A connection request is already pending." };
      // declined — allow re-request
      save(K.connections, conns.filter((c) => c.id !== existing.id));
    }
    const conn: Connection = {
      id: uid(),
      fromUserId,
      toUserId: toUser.id,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    save(K.connections, [...this.getAll(), conn]);
    const fromUser = users.find((u) => u.id === fromUserId);
    if (toUser.notifConnectionRequest) {
      notificationStore.add(
        toUser.id,
        "connection_request",
        `${fromUser?.name ?? "Someone"} sent you a connection request.`
      );
    }
    return { ok: true };
  },

  respond(connId: string, action: "accepted" | "declined"): void {
    const conns = this.getAll();
    const idx = conns.findIndex((c) => c.id === connId);
    if (idx !== -1) { conns[idx].status = action; save(K.connections, conns); }
  },

  getConnectedUsers(userId: string): User[] {
    const users = load<User[]>(K.users, []);
    const ids = this.getAll()
      .filter((c) => c.status === "accepted" && (c.fromUserId === userId || c.toUserId === userId))
      .map((c) => (c.fromUserId === userId ? c.toUserId : c.fromUserId));
    return users.filter((u) => ids.includes(u.id));
  },

  getPendingIncoming(userId: string): Connection[] {
    return this.getAll().filter((c) => c.toUserId === userId && c.status === "pending");
  },

  isConnected(a: string, b: string): boolean {
    return this.getAll().some(
      (c) =>
        c.status === "accepted" &&
        ((c.fromUserId === a && c.toUserId === b) || (c.fromUserId === b && c.toUserId === a))
    );
  },
};

// ─── TASKS ─────────────────────────────────────────────────────────────────────
export const taskStore = {
  getAll(): Task[] {
    return load<Task[]>(K.tasks, []);
  },

  getById(id: string): Task | undefined {
    return this.getAll().find((t) => t.id === id);
  },

  getAssignedTo(userId: string): Task[] {
    return this.getAll()
      .filter((t) => t.assignedToId === userId)
      .sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
  },

  create(
    createdById: string,
    data: { title: string; description: string; deadline?: string; assignedToId?: string; dependencies?: string[] }
  ): Task {
    const task: Task = {
      id: nextTaskId(),
      title: data.title.trim(),
      description: data.description.trim(),
      deadline: data.deadline || undefined,
      status: "Not Started",
      createdById,
      assignedToId: data.assignedToId || createdById,
      dependencies: data.dependencies?.filter(Boolean) ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    save(K.tasks, [...this.getAll(), task]);
    // Notify assignee if different from creator
    if (task.assignedToId !== createdById) {
      const users = load<User[]>(K.users, []);
      const creator = users.find((u) => u.id === createdById);
      const assignee = users.find((u) => u.id === task.assignedToId);
      if (assignee?.notifAssigned) {
        notificationStore.add(
          task.assignedToId,
          "task_assigned",
          `${creator?.name ?? "Someone"} assigned you: ${task.title} (${task.id})`,
          task.id
        );
      }
    }
    return task;
  },

  updateStatus(taskId: string, status: TaskStatus, byUserId: string): { ok: boolean; error?: string } {
    const tasks = this.getAll();
    const idx = tasks.findIndex((t) => t.id === taskId);
    if (idx === -1) return { ok: false, error: "Task not found." };
    const task = tasks[idx];
    if (task.createdById !== byUserId && task.assignedToId !== byUserId) {
      return { ok: false, error: "You can only update tasks you created or are assigned to." };
    }
    tasks[idx] = {
      ...task,
      status,
      updatedAt: new Date().toISOString(),
      completedAt: status === "Completed" ? new Date().toISOString() : task.completedAt,
    };
    save(K.tasks, tasks);
    // Notify creator if updater is someone else
    if (task.createdById !== byUserId) {
      const users = load<User[]>(K.users, []);
      const creator = users.find((u) => u.id === task.createdById);
      const updater = users.find((u) => u.id === byUserId);
      if (creator?.notifStatusUpdate) {
        notificationStore.add(
          task.createdById,
          "status_update",
          `"${task.title}" (${task.id}) was updated to "${status}" by ${updater?.name ?? "someone"}.`,
          task.id
        );
      }
    }
    return { ok: true };
  },

  delete(taskId: string, byUserId: string): { ok: boolean; error?: string } {
    const tasks = this.getAll();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return { ok: false, error: "Task not found." };
    if (task.createdById !== byUserId) return { ok: false, error: "Only the task creator can delete this task." };
    save(K.tasks, tasks.filter((t) => t.id !== taskId));
    return { ok: true };
  },

  adminDelete(taskId: string): void {
    save(K.tasks, this.getAll().filter((t) => t.id !== taskId));
  },

  search(
    userId: string,
    connectedIds: string[],
    q: { id?: string; title?: string; description?: string; deadline?: string }
  ): Task[] {
    const scope = new Set([userId, ...connectedIds]);
    return this.getAll().filter((t) => {
      if (!scope.has(t.assignedToId)) return false;
      if (q.id && !t.id.toLowerCase().includes(q.id.toLowerCase())) return false;
      if (q.title && !t.title.toLowerCase().includes(q.title.toLowerCase())) return false;
      if (q.description && !t.description.toLowerCase().includes(q.description.toLowerCase())) return false;
      if (q.deadline && t.deadline !== q.deadline) return false;
      return true;
    });
  },

  flagOverdue(): void {
    const now = new Date();
    this.getAll().forEach((t) => {
      if (t.deadline && new Date(t.deadline) < now && t.status !== "Completed") {
        const already = notificationStore.getAll().some((n) => n.linkId === t.id && n.type === "overdue");
        if (!already) {
          notificationStore.add(
            t.assignedToId,
            "overdue",
            `Task "${t.title}" (${t.id}) is overdue!`,
            t.id
          );
        }
      }
    });
  },

  autoAssignByWorkload(
    createdById: string,
    data: { title: string; description: string; deadline?: string },
    candidateIds: string[]
  ): Task {
    const scored = candidateIds.map((id) => ({ id, pct: workloadStore.calculate(id) }));
    scored.sort((a, b) => a.pct - b.pct);
    const assignedToId = scored[0]?.id ?? createdById;
    return this.create(createdById, { ...data, assignedToId });
  },
};

// ─── TEMPLATES ─────────────────────────────────────────────────────────────────
export const templateStore = {
  getAll(): TaskTemplate[] {
    return load<TaskTemplate[]>(K.templates, []);
  },
  getById(id: string): TaskTemplate | undefined {
    return this.getAll().find((t) => t.id === id);
  },
  getByOwner(ownerId: string): TaskTemplate[] {
    return this.getAll().filter((t) => t.ownerId === ownerId);
  },
  create(ownerId: string, data: {
    name: string;
    title: string;
    description: string;
    category?: TemplateCategory;
    tags?: string[];
    estimatedHours?: number;
    defaultStatus?: TaskStatus;
  }): TaskTemplate {
    const now = new Date().toISOString();
    const t: TaskTemplate = {
      id: uid(),
      name: data.name,
      title: data.title,
      description: data.description,
      category: data.category ?? "Other",
      tags: data.tags ?? [],
      estimatedHours: data.estimatedHours,
      defaultStatus: data.defaultStatus ?? "Not Started",
      ownerId,
      isSystem: false,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    save(K.templates, [...this.getAll(), t]);
    return t;
  },
  update(id: string, data: Partial<Omit<TaskTemplate, "id" | "ownerId" | "createdAt" | "isSystem">>): TaskTemplate | null {
    const all = this.getAll();
    const idx = all.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString() };
    save(K.templates, all);
    return all[idx];
  },
  incrementUsage(id: string): void {
    const all = this.getAll();
    const idx = all.findIndex((t) => t.id === id);
    if (idx !== -1) { all[idx].usageCount = (all[idx].usageCount ?? 0) + 1; save(K.templates, all); }
  },
  delete(id: string): void {
    save(K.templates, this.getAll().filter((t) => t.id !== id));
  },
};

// ─── NOTIFICATIONS ─────────────────────────────────────────────────────────────
export const notificationStore = {
  getAll(): Notification[] {
    return load<Notification[]>(K.notifications, []);
  },
  getForUser(userId: string): Notification[] {
    return this.getAll()
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  getUnreadCount(userId: string): number {
    return this.getForUser(userId).filter((n) => !n.read).length;
  },
  add(userId: string, type: Notification["type"], message: string, linkId?: string): void {
    const n: Notification = {
      id: uid(),
      userId,
      type,
      message,
      read: false,
      createdAt: new Date().toISOString(),
      linkId,
    };
    save(K.notifications, [...this.getAll(), n]);
  },
  markRead(id: string): void {
    save(K.notifications, this.getAll().map((n) => (n.id === id ? { ...n, read: true } : n)));
  },
  markAllRead(userId: string): void {
    save(K.notifications, this.getAll().map((n) => (n.userId === userId ? { ...n, read: true } : n)));
  },
  remove(id: string): void {
    save(K.notifications, this.getAll().filter((n) => n.id !== id));
  },
};

// ─── WORKLOAD ──────────────────────────────────────────────────────────────────
export const workloadStore = {
  calculate(userId: string): number {
    const tasks = taskStore.getAssignedTo(userId).filter((t) => t.status !== "Completed");
    const now = new Date();
    const weekAhead = new Date(now.getTime() + 7 * 86_400_000);
    let score = 0;
    tasks.forEach((t) => {
      let w = 1;
      if (t.status === "In Progress") w = 2;
      else if (t.status === "Blocked") w = 1.5;
      if (t.deadline) {
        const dl = new Date(t.deadline);
        if (dl < now) w += 2; // overdue
        else if (dl <= weekAhead) w += 1; // due this week
      }
      if (t.estimatedHours && t.estimatedHours > 8) w *= 1.3; // heavy task
      score += w;
    });
    const base = Math.max(tasks.length + 2, 5);
    return Math.min(100, Math.round((score / base) * 100));
  },
};

// ─── ADMIN HELPERS ─────────────────────────────────────────────────────────────
export const adminStore = {
  getStats() {
    const users = authStore.getAllUsers().filter((u) => u.role !== "admin");
    const tasks = taskStore.getAll();
    const conns = connectionStore.getAll();
    return {
      totalUsers: users.length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter((t) => t.status === "Completed").length,
      activeConnections: conns.filter((c) => c.status === "accepted").length,
      pendingConnections: conns.filter((c) => c.status === "pending").length,
    };
  },
};
