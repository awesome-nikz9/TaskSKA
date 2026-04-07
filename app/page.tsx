"use client"

import { useState, useMemo } from "react"
import { useTaskStore } from "@/lib/store"
import type { Task, TaskStatus, Priority, Sprint, User } from "@/lib/store"
import {
  LayoutDashboard, CheckSquare, Zap, Users, Search, Bell, BarChart2,
  FileText, Settings, Shield, LogOut, LogIn, ChevronRight, Plus, X, Edit2,
  Trash2, Eye, Check, Clock, AlertTriangle, ArrowRight,
  Save, RefreshCw, Menu, Lock, Mail, EyeOff, UserPlus,
  UserCheck, UserX, Calendar, Link2, TrendingUp,
  AlertCircle, CheckCircle2, XCircle, Copy
} from "lucide-react"

// ─────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ")
}

function fmtDate(iso: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

function isOverdue(deadline: string, status: TaskStatus) {
  if (status === "done") return false
  return new Date(deadline) < new Date()
}

function daysLeft(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now()
  const days = Math.ceil(diff / 86400000)
  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days === 0) return "Due today"
  return `${days}d left`
}

// ─────────────────────────────────────────────────────────────
// CONSTANTS / BADGE HELPERS
// ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; icon: React.ReactNode }> = {
  "todo":        { label: "To Do",       color: "bg-muted text-muted-foreground border border-border",            icon: <Clock className="w-3 h-3" /> },
  "in-progress": { label: "In Progress", color: "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",   icon: <RefreshCw className="w-3 h-3" /> },
  "review":      { label: "In Review",   color: "bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300",              icon: <Eye className="w-3 h-3" /> },
  "done":        { label: "Done",        color: "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300",                   icon: <CheckCircle2 className="w-3 h-3" /> },
  "overdue":     { label: "Overdue",     color: "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300",                             icon: <AlertCircle className="w-3 h-3" /> },
}

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; dot: string }> = {
  "low":      { label: "Low",      color: "bg-slate-100 text-slate-600 border border-slate-200",                          dot: "bg-slate-400" },
  "medium":   { label: "Medium",   color: "bg-yellow-100 text-yellow-700 border border-yellow-200",                       dot: "bg-yellow-500" },
  "high":     { label: "High",     color: "bg-orange-100 text-orange-700 border border-orange-200",                       dot: "bg-orange-500" },
  "critical": { label: "Critical", color: "bg-red-100 text-red-700 border border-red-200",                                dot: "bg-red-500" },
}

// ─────────────────────────────────────────────────────────────
// SMALL REUSABLE UI COMPONENTS
// ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TaskStatus }) {
  const c = STATUS_CONFIG[status]
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", c.color)}>
      {c.icon}{c.label}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const c = PRIORITY_CONFIG[priority]
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium", c.color)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  )
}

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
  const sz = size === "sm" ? "w-7 h-7 text-xs" : size === "lg" ? "w-10 h-10 text-base" : "w-8 h-8 text-sm"
  const colors = ["bg-blue-500","bg-indigo-500","bg-violet-500","bg-sky-500","bg-cyan-500","bg-teal-500"]
  const bg = colors[name.charCodeAt(0) % colors.length]
  return (
    <div className={cn("rounded-full flex items-center justify-center font-bold text-white flex-shrink-0", sz, bg)}>
      {initials}
    </div>
  )
}

function Card({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return <div className={cn("bg-card border border-border rounded-xl", className)} onClick={onClick}>{children}</div>
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn("w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition", className)}
      {...props}
    />
  )
}

function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn("w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition resize-none", className)}
      {...props}
    />
  )
}

function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select
      className={cn("w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition", className)}
      {...props}
    >
      {children}
    </select>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={cn("block text-sm font-medium text-foreground mb-1.5", className)}>{children}</label>
}

function Btn({
  children, variant = "primary", size = "md", className, disabled, onClick, type = "button"
}: {
  children: React.ReactNode
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline"
  size?: "sm" | "md" | "lg"
  className?: string
  disabled?: boolean
  onClick?: () => void
  type?: "button" | "submit" | "reset"
}) {
  const base = "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent text-foreground",
    danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-border text-foreground hover:bg-accent",
  }
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-base" }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cn(base, variants[variant], sizes[size], className)}>
      {children}
    </button>
  )
}

function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] w-full", wide ? "max-w-2xl" : "max-w-lg")}>
        <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-muted-foreground" />
      </div>
      <p className="font-semibold text-foreground">{title}</p>
      <p className="text-muted-foreground text-sm mt-1 max-w-xs">{desc}</p>
    </div>
  )
}

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: any; color: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────
// AUTH SCREEN
// ─────────────────────────────────────────────────────────────

function AuthScreen() {
  const [view, setView] = useState<"login" | "register" | "reset" | "mfa">("login")
  const { login, register, resetPassword, verifyMfa, pendingUserId } = useTaskStore()

  return (
    <div className="min-h-screen flex bg-background">
      {/* Branding */}
      <div className="hidden lg:flex w-[420px] flex-shrink-0 bg-sidebar flex-col justify-between p-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-white font-black text-lg">T</span>
          </div>
          <span className="text-sidebar-foreground font-bold text-xl tracking-tight">TaskSKA</span>
        </div>
        <div className="space-y-5">
          <h1 className="text-sidebar-foreground text-4xl font-bold leading-snug">
            Manage tasks.<br />Track progress.<br />Deliver results.
          </h1>
          <p className="text-sidebar-foreground/60 leading-relaxed text-sm">
            Enterprise-grade task management with MFA, sprint tracking, workload analytics and team collaboration — built for capstone MIT 651/652.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[{ v:"5 Sprints",k:"All covered" },{ v:"30+ Stories",k:"All use cases" },{ v:"MFA Auth",k:"TOTP secure" },{ v:"Real-time",k:"Live updates" }].map(s => (
              <div key={s.v} className="bg-sidebar-accent rounded-xl p-3">
                <div className="text-primary font-bold text-lg">{s.v}</div>
                <div className="text-sidebar-foreground/50 text-xs mt-0.5">{s.k}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-sidebar-foreground/30 text-xs">TaskSKA &copy; 2026 — Capstone Project</p>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-black text-sm">T</span>
            </div>
            <span className="font-bold text-lg text-foreground">TaskSKA</span>
          </div>
          {view === "login" && <LoginView onNav={setView} login={login} />}
          {view === "register" && <RegisterView onNav={setView} register={register} />}
          {view === "reset" && <ResetView onNav={setView} resetPassword={resetPassword} />}
          {view === "mfa" && <MfaView onNav={setView} verifyMfa={verifyMfa} pendingUserId={pendingUserId} />}
        </div>
      </div>
    </div>
  )
}

function LoginView({ onNav, login }: any) {
  const [email, setEmail] = useState("")
  const [pw, setPw] = useState("")
  const [show, setShow] = useState(false)
  const [err, setErr] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setErr("")
    setLoading(true)
    setTimeout(() => {
      const r = login(email, pw)
      setLoading(false)
      if (!r.success) setErr(r.message)
      else if (r.requiresMfa) onNav("mfa")
    }, 500)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
      <p className="text-muted-foreground text-sm mt-1 mb-6">Sign in to your TaskSKA account</p>

      <div className="mb-5 rounded-xl bg-primary/5 border border-primary/15 p-4 text-xs space-y-1.5">
        <p className="font-semibold text-primary text-sm">Demo accounts</p>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {[
            { label: "Admin", e: "admin@taskska.com", p: "Admin@1234" },
            { label: "Taskmaster", e: "john@taskska.com", p: "User@1234" },
            { label: "User Sarah", e: "sarah@taskska.com", p: "User@1234" },
            { label: "User Mark", e: "mark@taskska.com", p: "User@1234" },
          ].map(d => (
            <button key={d.e} type="button" onClick={() => { setEmail(d.e); setPw(d.p) }}
              className="px-3 py-2 rounded-lg bg-muted hover:bg-accent text-left transition">
              <div className="font-semibold text-foreground">{d.label}</div>
              <div className="text-muted-foreground truncate">{d.e}</div>
            </button>
          ))}
        </div>
      </div>

      {err && <div className="mb-4 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm flex gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{err}</div>}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Email address</Label>
          <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@taskska.com" className="pl-9" required />
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-sm font-medium text-foreground">Password</span>
            <button type="button" onClick={() => onNav("reset")} className="text-xs text-primary hover:underline">Forgot password?</button>
          </div>
          <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input type={show ? "text" : "password"} value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" className="pl-9 pr-10" required />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <Btn type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
          {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</> : <><LogIn className="w-4 h-4" />Sign in</>}
        </Btn>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        {"Don't have an account? "}<button onClick={() => onNav("register")} className="text-primary font-semibold hover:underline">Register now</button>
      </p>
    </div>
  )
}

function RegisterView({ onNav, register }: any) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [pw, setPw] = useState("")
  const [confirm, setConfirm] = useState("")
  const [err, setErr] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setErr("")
    if (pw !== confirm) { setErr("Passwords do not match"); return }
    if (pw.length < 8) { setErr("Password must be at least 8 characters"); return }
    setLoading(true)
    setTimeout(() => {
      const r = register(name, email, pw)
      setLoading(false)
      if (!r.success) setErr(r.message)
      else setSuccess(true)
    }, 500)
  }

  if (success) return (
    <div className="text-center py-8">
      <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-8 h-8 text-green-600" /></div>
      <h3 className="text-xl font-bold text-foreground">Account created!</h3>
      <p className="text-muted-foreground text-sm mt-2 mb-6">Your TaskSKA account is ready. Sign in to get started.</p>
      <Btn onClick={() => onNav("login")} variant="primary">Sign in now</Btn>
    </div>
  )

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground">Create account</h2>
      <p className="text-muted-foreground text-sm mt-1 mb-6">Join TaskSKA — it&apos;s free</p>
      {err && <div className="mb-4 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm flex gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{err}</div>}
      <form onSubmit={submit} className="space-y-4">
        <div><Label>Full name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required /></div>
        <div><Label>Email address</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" required /></div>
        <div><Label>Password</Label><Input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Min. 8 characters" required /></div>
        <div><Label>Confirm password</Label><Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Re-enter password" required /></div>
        <Btn type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
          {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</> : <><UserPlus className="w-4 h-4" />Create account</>}
        </Btn>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already have an account? <button onClick={() => onNav("login")} className="text-primary font-semibold hover:underline">Sign in</button>
      </p>
    </div>
  )
}

function ResetView({ onNav, resetPassword }: any) {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState("")
  const [pw, setPw] = useState("")
  const [confirm, setConfirm] = useState("")
  const [err, setErr] = useState("")
  const [loading, setLoading] = useState(false)

  const step1 = (e: React.FormEvent) => {
    e.preventDefault()
    setErr("")
    setLoading(true)
    setTimeout(() => { setLoading(false); setStep(2) }, 600)
  }

  const step2 = (e: React.FormEvent) => {
    e.preventDefault()
    setErr("")
    if (pw !== confirm) { setErr("Passwords do not match"); return }
    setLoading(true)
    setTimeout(() => {
      const r = resetPassword(email, pw)
      setLoading(false)
      if (!r.success) setErr(r.message)
      else setStep(3)
    }, 600)
  }

  if (step === 3) return (
    <div className="text-center py-8">
      <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-8 h-8 text-green-600" /></div>
      <h3 className="text-xl font-bold text-foreground">Password reset!</h3>
      <p className="text-muted-foreground text-sm mt-2 mb-6">Your password has been updated. Sign in with your new password.</p>
      <Btn onClick={() => onNav("login")} variant="primary">Back to sign in</Btn>
    </div>
  )

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground">Reset password</h2>
      <p className="text-muted-foreground text-sm mt-1 mb-6">{step === 1 ? "Enter your email to reset your password" : "Set your new password"}</p>
      {err && <div className="mb-4 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm flex gap-2"><AlertCircle className="w-4 h-4 mt-0.5" />{err}</div>}
      {step === 1 ? (
        <form onSubmit={step1} className="space-y-4">
          <div><Label>Email address</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@taskska.com" required /></div>
          <Btn type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
            {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</> : "Send reset link"}
          </Btn>
        </form>
      ) : (
        <form onSubmit={step2} className="space-y-4">
          <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300">Reset link sent to <strong>{email}</strong></div>
          <div><Label>New password</Label><Input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Min. 8 characters" required /></div>
          <div><Label>Confirm new password</Label><Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Re-enter password" required /></div>
          <Btn type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
            {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Resetting...</> : "Reset password"}
          </Btn>
        </form>
      )}
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Remember it? <button onClick={() => onNav("login")} className="text-primary font-semibold hover:underline">Sign in</button>
      </p>
    </div>
  )
}

function MfaView({ pendingUserId, verifyMfa, onNav }: any) {
  const [code, setCode] = useState("")
  const [err, setErr] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setErr("")
    if (code.length !== 6) { setErr("Enter the 6-digit code"); return }
    setLoading(true)
    setTimeout(() => {
      const r = verifyMfa(pendingUserId, code)
      setLoading(false)
      if (!r.success) setErr(r.message)
    }, 500)
  }

  return (
    <div>
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6"><Shield className="w-7 h-7 text-primary" /></div>
      <h2 className="text-2xl font-bold text-foreground">Two-factor authentication</h2>
      <p className="text-muted-foreground text-sm mt-1 mb-6">Enter the 6-digit code from your authenticator app to continue.</p>
      {err && <div className="mb-4 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">{err}</div>}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>6-digit code</Label>
          <Input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" className="text-center text-2xl font-mono tracking-[0.5em] h-14" maxLength={6} />
          <p className="text-xs text-muted-foreground mt-2">For demo, use any 6-digit number (e.g. 123456)</p>
        </div>
        <Btn type="submit" variant="primary" size="lg" className="w-full" disabled={loading || code.length !== 6}>
          {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying...</> : <><Shield className="w-4 h-4" />Verify</>}
        </Btn>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        <button onClick={() => onNav("login")} className="text-primary hover:underline">Back to sign in</button>
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "dashboard",      label: "Dashboard",      icon: LayoutDashboard },
  { id: "tasks",          label: "My Tasks",        icon: CheckSquare },
  { id: "sprints",        label: "Sprints",         icon: Zap },
  { id: "connections",    label: "Connections",     icon: Users },
  { id: "search",         label: "Search & Filter", icon: Search },
  { id: "workload",       label: "Workload",        icon: BarChart2 },
  { id: "notifications",  label: "Notifications",   icon: Bell },
  { id: "templates",      label: "Templates",       icon: FileText },
  { id: "settings",       label: "Settings",        icon: Settings },
]

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { currentUser, activeView, setActiveView, notifications, logout } = useTaskStore()
  const unread = notifications.filter(n => n.userId === currentUser?.id && !n.read).length

  const handleNav = (id: string) => { setActiveView(id); onClose() }

  return (
    <>
      {/* Overlay on mobile */}
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onClose} />}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-sidebar z-40 flex flex-col transition-transform duration-200",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-base">T</span>
          </div>
          <div>
            <div className="text-sidebar-foreground font-bold text-base leading-tight">TaskSKA</div>
            <div className="text-sidebar-foreground/40 text-xs">Task Management</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {NAV_ITEMS.filter(n => n.id !== "admin" || currentUser?.role === "admin").map(item => {
            const active = activeView === item.id
            return (
              <button key={item.id} onClick={() => handleNav(item.id)}
                className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5",
                  active ? "bg-primary text-primary-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}>
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.id === "notifications" && unread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">{unread > 9 ? "9+" : unread}</span>
                )}
              </button>
            )
          })}
          {currentUser?.role === "admin" && (
            <button onClick={() => handleNav("admin")}
              className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5",
                activeView === "admin" ? "bg-primary text-primary-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}>
              <Shield className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">Admin Panel</span>
            </button>
          )}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-sidebar-border flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-sidebar-accent">
            <Avatar name={currentUser?.name ?? "U"} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="text-sidebar-foreground text-sm font-semibold truncate">{currentUser?.name}</div>
              <div className="text-sidebar-foreground/50 text-xs truncate">{currentUser?.role}</div>
            </div>
            <button onClick={logout} className="text-sidebar-foreground/40 hover:text-red-400 transition" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// TOPBAR
// ─────────────────────────────────────────────────────────────

function Topbar({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { currentUser, activeView, notifications, setActiveView, setSearchQuery, searchQuery } = useTaskStore()
  const unread = notifications.filter(n => n.userId === currentUser?.id && !n.read).length

  const viewLabels: Record<string, string> = {
    dashboard: "Dashboard", tasks: "My Tasks", sprints: "Sprints", connections: "Connections",
    search: "Search & Filter", workload: "Workload Analytics", notifications: "Notifications",
    templates: "Templates", settings: "Settings", admin: "Admin Panel",
  }

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur flex items-center px-4 gap-4 flex-shrink-0">
      <button onClick={onMenuToggle} className="lg:hidden p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
        <Menu className="w-5 h-5" />
      </button>
      <h1 className="font-semibold text-foreground text-sm flex-shrink-0">{viewLabels[activeView] ?? activeView}</h1>
      <div className="flex-1 hidden sm:flex max-w-xs">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); if (e.target.value) setActiveView("search") }}
            placeholder="Search tasks…"
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button onClick={() => setActiveView("notifications")} className="relative p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition">
          <Bell className="w-4 h-4" />
          {unread > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
        </button>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveView("settings")}>
          <Avatar name={currentUser?.name ?? "U"} size="sm" />
          <span className="hidden sm:block text-sm font-medium text-foreground truncate max-w-[120px]">{currentUser?.name}</span>
        </div>
      </div>
    </header>
  )
}

// ─────────────────────────────────────────────────────────────
// TASK CARD (reused across views)
// ─────────────────────────────────────────────────────────────

function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const { users } = useTaskStore()
  const assignee = users.find(u => u.id === task.assigneeId)
  const overdue = isOverdue(task.deadline, task.status)

  return (
    <Card className={cn("p-4 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group", overdue && task.status !== "done" && "border-red-300 bg-red-50/30 dark:border-red-700 dark:bg-red-900/10")}>
      <div onClick={onClick}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{task.taskCode}</span>
            <PriorityBadge priority={task.priority} />
          </div>
          <StatusBadge status={overdue && task.status !== "done" ? "overdue" : task.status} />
        </div>
        <h3 className="font-semibold text-foreground text-sm leading-snug mb-1 group-hover:text-primary transition-colors">{task.title}</h3>
        <p className="text-muted-foreground text-xs line-clamp-2 mb-3">{task.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span className={cn(overdue && task.status !== "done" ? "text-red-600 font-medium" : "")}>{daysLeft(task.deadline)}</span>
          </div>
          <div className="flex items-center gap-2">
            {task.tags.slice(0, 2).map(tag => <span key={tag} className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded font-medium">{tag}</span>)}
            {assignee && <Avatar name={assignee.name} size="sm" />}
          </div>
        </div>
      </div>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────
// TASK DETAIL MODAL
// ─────────────────────────────────────────────────────────────

function TaskDetailModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const { users, currentUser, updateTask, updateTaskStatus, addComment, deleteTask, tasks } = useTaskStore()
  const [comment, setComment] = useState("")
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDesc, setEditDesc] = useState(task.description)
  const [editStatus, setEditStatus] = useState(task.status)
  const [editPriority, setEditPriority] = useState(task.priority)
  const [editDeadline, setEditDeadline] = useState(task.deadline)
  const [editHours, setEditHours] = useState(task.estimatedHours)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const assignee = users.find(u => u.id === task.assigneeId)
  const creator = users.find(u => u.id === task.creatorId)
  const deps = tasks.filter(t => task.dependencies.includes(t.id))
  const canEdit = currentUser?.id === task.creatorId || currentUser?.role === "admin" || currentUser?.id === task.assigneeId

  const saveEdit = () => {
    updateTask(task.id, { title: editTitle, description: editDesc, status: editStatus, priority: editPriority, deadline: editDeadline, estimatedHours: editHours })
    setEditing(false)
  }

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim() || !currentUser) return
    addComment(task.id, currentUser.id, comment.trim())
    setComment("")
  }

  return (
    <Modal open onClose={onClose} title={task.taskCode} wide>
      <div className="space-y-5">
        {/* Header */}
        <div>
          {editing ? (
            <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="text-lg font-bold mb-2" />
          ) : (
            <h3 className="text-xl font-bold text-foreground">{task.title}</h3>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            {task.tags.map(t => <span key={t} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">{t}</span>)}
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Description</p>
          {editing ? <Textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={4} /> : <p className="text-sm text-foreground/80 leading-relaxed">{task.description}</p>}
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Assignee", value: <div className="flex items-center gap-2">{assignee && <Avatar name={assignee.name} size="sm" />}<span className="text-sm text-foreground">{assignee?.name ?? "—"}</span></div> },
            { label: "Creator", value: <div className="flex items-center gap-2">{creator && <Avatar name={creator.name} size="sm" />}<span className="text-sm text-foreground">{creator?.name ?? "—"}</span></div> },
            { label: "Deadline", value: editing ? <Input type="date" value={editDeadline} onChange={e => setEditDeadline(e.target.value)} /> : <span className={cn("text-sm", isOverdue(task.deadline, task.status) ? "text-red-600 font-medium" : "text-foreground")}>{fmtDate(task.deadline)} — {daysLeft(task.deadline)}</span> },
            { label: "Status", value: editing ? <Select value={editStatus} onChange={e => setEditStatus(e.target.value as TaskStatus)}>{(Object.keys(STATUS_CONFIG) as TaskStatus[]).map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}</Select> : <StatusBadge status={task.status} /> },
            { label: "Priority", value: editing ? <Select value={editPriority} onChange={e => setEditPriority(e.target.value as Priority)}>{(Object.keys(PRIORITY_CONFIG) as Priority[]).map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>)}</Select> : <PriorityBadge priority={task.priority} /> },
            { label: "Est. Hours", value: editing ? <Input type="number" value={editHours} onChange={e => setEditHours(+e.target.value)} min={0} /> : <span className="text-sm text-foreground">{task.estimatedHours}h est / {task.actualHours}h actual</span> },
            { label: "Created", value: <span className="text-sm text-foreground">{fmtDate(task.createdAt)}</span> },
            { label: "Updated", value: <span className="text-sm text-foreground">{fmtDate(task.updatedAt)}</span> },
          ].map(m => (
            <div key={m.label} className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{m.label}</p>
              {m.value}
            </div>
          ))}
        </div>

        {/* Dependencies */}
        {deps.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Dependencies</p>
            <div className="space-y-1.5">
              {deps.map(d => (
                <div key={d.id} className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm">
                  <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-mono text-xs text-muted-foreground">{d.taskCode}</span>
                  <span className="text-foreground flex-1">{d.title}</span>
                  <StatusBadge status={d.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick status update */}
        {!editing && canEdit && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Update Status</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(STATUS_CONFIG) as TaskStatus[]).filter(s => s !== "overdue").map(s => (
                <button key={s} onClick={() => updateTaskStatus(task.id, s)}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                    task.status === s ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-foreground hover:bg-accent")}>
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Comments ({task.comments.length})</p>
          <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
            {task.comments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
            {task.comments.map(c => {
              const u = users.find(u => u.id === c.userId)
              return (
                <div key={c.id} className="flex gap-2.5">
                  <Avatar name={u?.name ?? "U"} size="sm" />
                  <div className="flex-1 bg-muted rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 mb-1"><span className="text-xs font-semibold text-foreground">{u?.name}</span><span className="text-xs text-muted-foreground">{fmtDate(c.createdAt)}</span></div>
                    <p className="text-sm text-foreground/80">{c.content}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <form onSubmit={submitComment} className="flex gap-2">
            <Input value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment…" className="flex-1" />
            <Btn type="submit" variant="primary" size="sm" disabled={!comment.trim()}>Post</Btn>
          </form>
        </div>

        {/* Actions */}
        {canEdit && (
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            {editing ? (
              <><Btn onClick={saveEdit} variant="primary" size="sm"><Save className="w-3.5 h-3.5" />Save changes</Btn><Btn onClick={() => setEditing(false)} variant="outline" size="sm">Cancel</Btn></>
            ) : (
              <Btn onClick={() => setEditing(true)} variant="outline" size="sm"><Edit2 className="w-3.5 h-3.5" />Edit task</Btn>
            )}
            {!confirmDelete ? (
              <Btn onClick={() => setConfirmDelete(true)} variant="ghost" size="sm" className="ml-auto text-red-500 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" />Delete</Btn>
            ) : (
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-red-600 font-medium">Confirm delete?</span>
                <Btn onClick={() => { deleteTask(task.id); onClose() }} variant="danger" size="sm">Yes, delete</Btn>
                <Btn onClick={() => setConfirmDelete(false)} variant="outline" size="sm">Cancel</Btn>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────
// CREATE TASK MODAL
// ─────────────────────────────────────────────────────────────

function CreateTaskModal({ onClose, prefillSprintId }: { onClose: () => void; prefillSprintId?: string }) {
  const { currentUser, users, connections, sprints, templates, createTask } = useTaskStore()
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  const [priority, setPriority] = useState<Priority>("medium")
  const [deadline, setDeadline] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0])
  const [assigneeId, setAssigneeId] = useState(currentUser?.id ?? "")
  const [sprintId, setSprintId] = useState(prefillSprintId ?? "")
  const [tags, setTags] = useState("")
  const [hours, setHours] = useState(4)
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [loading, setLoading] = useState(false)

  // Connected users
  const connectedIds = connections.filter(c => (c.requesterId === currentUser?.id || c.receiverId === currentUser?.id) && c.status === "accepted").map(c => c.requesterId === currentUser?.id ? c.receiverId : c.requesterId)
  const assignableUsers = users.filter(u => u.id === currentUser?.id || connectedIds.includes(u.id))

  const applyTemplate = (id: string) => {
    const tmpl = templates.find(t => t.id === id)
    if (!tmpl) return
    setDesc(tmpl.description)
    setPriority(tmpl.priority)
    setHours(tmpl.estimatedHours)
    setTags(tmpl.tags.join(", "))
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !currentUser) return
    setLoading(true)
    setTimeout(() => {
      createTask({
        title: title.trim(), description: desc.trim(), priority,
        status: "todo", assigneeId, creatorId: currentUser.id,
        deadline, sprintId, templateId: selectedTemplate,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        attachments: [], estimatedHours: hours, actualHours: 0,
        dependencies: [], automatedStatusUpdate: false,
      })
      setLoading(false)
      onClose()
    }, 400)
  }

  return (
    <Modal open onClose={onClose} title="Create new task" wide>
      <form onSubmit={submit} className="space-y-4">
        {templates.length > 0 && (
          <div>
            <Label>Use template (optional)</Label>
            <Select value={selectedTemplate} onChange={e => { setSelectedTemplate(e.target.value); applyTemplate(e.target.value) }}>
              <option value="">No template</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </div>
        )}
        <div><Label>Task title *</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Brief task title" required /></div>
        <div><Label>Description</Label><Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="Describe the task in detail…" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Priority</Label>
            <Select value={priority} onChange={e => setPriority(e.target.value as Priority)}>
              {(Object.keys(PRIORITY_CONFIG) as Priority[]).map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>)}
            </Select>
          </div>
          <div><Label>Deadline *</Label><Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} required /></div>
          <div><Label>Assign to</Label>
            <Select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}>
              {assignableUsers.map(u => <option key={u.id} value={u.id}>{u.name} {u.id === currentUser?.id ? "(me)" : ""}</option>)}
            </Select>
          </div>
          <div><Label>Sprint</Label>
            <Select value={sprintId} onChange={e => setSprintId(e.target.value)}>
              <option value="">No sprint</option>
              {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </div>
          <div><Label>Est. hours</Label><Input type="number" value={hours} onChange={e => setHours(+e.target.value)} min={0.5} step={0.5} /></div>
          <div><Label>Tags (comma-separated)</Label><Input value={tags} onChange={e => setTags(e.target.value)} placeholder="auth, backend, ui" /></div>
        </div>
        <div className="flex gap-3 pt-2 border-t border-border">
          <Btn type="submit" variant="primary" className="flex-1" disabled={loading || !title.trim()}>
            {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</> : <><Plus className="w-4 h-4" />Create task</>}
          </Btn>
          <Btn onClick={onClose} variant="outline">Cancel</Btn>
        </div>
      </form>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────
// DASHBOARD VIEW
// ─────────────────────────────────────────────────────────────

function DashboardView() {
  const { currentUser, tasks, sprints, connections, notifications, users, setActiveView } = useTaskStore()
  const [selectedTask, setLocalSelectedTask] = useState<Task | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const myTasks = tasks.filter(t => t.assigneeId === currentUser?.id || t.creatorId === currentUser?.id)
  const myOpenTasks = myTasks.filter(t => t.status !== "done")
  const overdueTasks = myTasks.filter(t => isOverdue(t.deadline, t.status))
  const doneTasks = myTasks.filter(t => t.status === "done")
  const activeSprint = sprints.find(s => s.status === "active")
  const myConnections = connections.filter(c => (c.requesterId === currentUser?.id || c.receiverId === currentUser?.id) && c.status === "accepted")
  const unreadNotifs = notifications.filter(n => n.userId === currentUser?.id && !n.read)
  const recentTasks = [...myTasks].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5)

  const statusCounts = {
    todo: myTasks.filter(t => t.status === "todo").length,
    "in-progress": myTasks.filter(t => t.status === "in-progress").length,
    review: myTasks.filter(t => t.status === "review").length,
    done: doneTasks.length,
  }

  const completionPct = myTasks.length > 0 ? Math.round((doneTasks.length / myTasks.length) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {currentUser?.name.split(" ")[0]}</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Here&apos;s your task overview for today.</p>
        </div>
        <Btn onClick={() => setShowCreate(true)} variant="primary"><Plus className="w-4 h-4" />New task</Btn>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tasks" value={myTasks.length} sub={`${completionPct}% complete`} icon={CheckSquare} color="bg-primary" />
        <StatCard label="In Progress" value={statusCounts["in-progress"]} sub={`${statusCounts.review} in review`} icon={RefreshCw} color="bg-blue-500" />
        <StatCard label="Overdue" value={overdueTasks.length} sub="Need attention" icon={AlertTriangle} color="bg-red-500" />
        <StatCard label="Connections" value={myConnections.length} sub={`${unreadNotifs.length} new notifications`} icon={Users} color="bg-indigo-500" />
      </div>

      {/* Progress + Status breakdown */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Task Status Breakdown</p>
          <div className="space-y-3">
            {[
              { label: "To Do", count: statusCounts.todo, color: "bg-muted-foreground", total: myTasks.length },
              { label: "In Progress", count: statusCounts["in-progress"], color: "bg-primary", total: myTasks.length },
              { label: "In Review", count: statusCounts.review, color: "bg-yellow-500", total: myTasks.length },
              { label: "Done", count: statusCounts.done, color: "bg-green-500", total: myTasks.length },
            ].map(row => (
              <div key={row.label} className="space-y-1">
                <div className="flex justify-between text-sm"><span className="text-foreground">{row.label}</span><span className="font-semibold text-foreground">{row.count}</span></div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all", row.color)} style={{ width: row.total > 0 ? `${(row.count / row.total) * 100}%` : "0%" }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between text-sm mb-1"><span className="text-foreground font-medium">Overall completion</span><span className="font-bold text-foreground">{completionPct}%</span></div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Active Sprint</p>
          {activeSprint ? (
            <div className="space-y-3">
              <div>
                <p className="font-bold text-foreground">{activeSprint.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{activeSprint.code}</p>
              </div>
              <p className="text-sm text-foreground/80">{activeSprint.description}</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between"><span>Start</span><span>{fmtDate(activeSprint.startDate)}</span></div>
                <div className="flex justify-between"><span>End</span><span>{fmtDate(activeSprint.endDate)}</span></div>
                <div className="flex justify-between font-medium text-foreground"><span>Tasks</span><span>{activeSprint.taskIds.length}</span></div>
              </div>
              <Btn onClick={() => setActiveView("sprints")} variant="outline" size="sm" className="w-full">View sprint<ArrowRight className="w-3.5 h-3.5" /></Btn>
            </div>
          ) : <EmptyState icon={Zap} title="No active sprint" desc="All sprints are either planned or completed." />}
        </Card>
      </div>

      {/* Recent tasks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recent Activity</p>
          <button onClick={() => setActiveView("tasks")} className="text-xs text-primary hover:underline flex items-center gap-1">View all <ChevronRight className="w-3 h-3" /></button>
        </div>
        {recentTasks.length === 0 ? <EmptyState icon={CheckSquare} title="No tasks yet" desc="Create your first task to get started." /> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentTasks.map(t => <TaskCard key={t.id} task={t} onClick={() => setLocalSelectedTask(t)} />)}
          </div>
        )}
      </div>

      {/* Overdue alert */}
      {overdueTasks.length > 0 && (
        <Card className="p-5 border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700 dark:text-red-400">{overdueTasks.length} overdue task{overdueTasks.length > 1 ? "s" : ""}</p>
              <div className="mt-2 space-y-1">
                {overdueTasks.slice(0, 3).map(t => (
                  <button key={t.id} onClick={() => setLocalSelectedTask(t)} className="block text-sm text-red-600 dark:text-red-400 hover:underline text-left">
                    {t.taskCode} — {t.title} (due {fmtDate(t.deadline)})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {showCreate && <CreateTaskModal onClose={() => setShowCreate(false)} />}
      {selectedTask && <TaskDetailModal task={selectedTask} onClose={() => setLocalSelectedTask(null)} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TASKS VIEW
// ─────────────────────────────────────────────────────────────

function TasksView() {
  const { currentUser, tasks, filterStatus, filterPriority, setFilterStatus, setFilterPriority } = useTaskStore()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [view, setView] = useState<"list" | "board">("list")
  const [sortBy, setSortBy] = useState<"deadline" | "priority" | "status" | "created">("deadline")

  const myTasks = useMemo(() => {
    let t = tasks.filter(t => t.assigneeId === currentUser?.id || t.creatorId === currentUser?.id)
    if (filterStatus !== "all") t = t.filter(t => t.status === filterStatus)
    if (filterPriority !== "all") t = t.filter(t => t.priority === filterPriority)
    return t.sort((a, b) => {
      if (sortBy === "deadline") return a.deadline.localeCompare(b.deadline)
      if (sortBy === "priority") return ["critical","high","medium","low"].indexOf(a.priority) - ["critical","high","medium","low"].indexOf(b.priority)
      if (sortBy === "status") return a.status.localeCompare(b.status)
      return b.createdAt.localeCompare(a.createdAt)
    })
  }, [tasks, currentUser, filterStatus, filterPriority, sortBy])

  const boardCols: TaskStatus[] = ["todo", "in-progress", "review", "done"]

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Select className="w-36" value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
            <option value="all">All statuses</option>
            {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
          </Select>
          <Select className="w-36" value={filterPriority} onChange={e => setFilterPriority(e.target.value as any)}>
            <option value="all">All priorities</option>
            {(Object.keys(PRIORITY_CONFIG) as Priority[]).map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>)}
          </Select>
          <Select className="w-36" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
            <option value="deadline">Sort: Deadline</option>
            <option value="priority">Sort: Priority</option>
            <option value="status">Sort: Status</option>
            <option value="created">Sort: Created</option>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button onClick={() => setView("list")} className={cn("px-3 py-1.5 text-xs font-medium transition", view === "list" ? "bg-primary text-primary-foreground" : "hover:bg-accent text-muted-foreground")}>List</button>
            <button onClick={() => setView("board")} className={cn("px-3 py-1.5 text-xs font-medium transition border-l border-border", view === "board" ? "bg-primary text-primary-foreground" : "hover:bg-accent text-muted-foreground")}>Board</button>
          </div>
          <Btn onClick={() => setShowCreate(true)} variant="primary" size="sm"><Plus className="w-3.5 h-3.5" />New task</Btn>
        </div>
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">{myTasks.length} task{myTasks.length !== 1 ? "s" : ""}</p>

      {/* List view */}
      {view === "list" && (
        myTasks.length === 0 ? <EmptyState icon={CheckSquare} title="No tasks found" desc="Try adjusting filters or create a new task." /> : (
          <div className="space-y-2">
            {myTasks.map(t => (
              <Card key={t.id} className="p-4 hover:shadow-sm hover:border-primary/20 transition-all cursor-pointer" onClick={() => setSelectedTask(t)}>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded w-20 text-center flex-shrink-0">{t.taskCode}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{t.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    <PriorityBadge priority={t.priority} />
                    <StatusBadge status={isOverdue(t.deadline, t.status) ? "overdue" : t.status} />
                    <span className={cn("text-xs", isOverdue(t.deadline, t.status) ? "text-red-600 font-medium" : "text-muted-foreground")}>{fmtDate(t.deadline)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Board view */}
      {view === "board" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {boardCols.map(col => {
            const colTasks = myTasks.filter(t => t.status === col)
            const cfg = STATUS_CONFIG[col]
            return (
              <div key={col}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={cn("px-2 py-1 rounded-lg text-xs font-semibold", cfg.color)}>{cfg.label}</span>
                  <span className="text-xs text-muted-foreground font-medium">{colTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {colTasks.map(t => <TaskCard key={t.id} task={t} onClick={() => setSelectedTask(t)} />)}
                  {colTasks.length === 0 && <div className="border-2 border-dashed border-border rounded-xl p-4 text-center text-xs text-muted-foreground">Empty</div>}
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

// ─────────────────────────────────────────────────────────────
// SPRINTS VIEW
// ─────────────────────────────────────────────────────────────

function SprintsView() {
  const { sprints, tasks, setActiveView } = useTaskStore()
  const [selected, setSelected] = useState<Sprint | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const statusColor: Record<string, string> = {
    planning: "bg-muted text-muted-foreground border border-border",
    active: "bg-blue-100 text-blue-700 border border-blue-200",
    completed: "bg-green-100 text-green-700 border border-green-200",
  }

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sprints.map(sprint => {
          const sprintTasks = tasks.filter(t => sprint.taskIds.includes(t.id))
          const done = sprintTasks.filter(t => t.status === "done").length
          const pct = sprintTasks.length > 0 ? Math.round((done / sprintTasks.length) * 100) : 0
          return (
            <Card key={sprint.id} className={cn("p-5 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all", selected?.id === sprint.id && "border-primary shadow-md")}>
              <div onClick={() => setSelected(selected?.id === sprint.id ? null : sprint)}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-foreground">{sprint.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">{sprint.code}</p>
                  </div>
                  <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold capitalize", statusColor[sprint.status])}>{sprint.status}</span>
                </div>
                <p className="text-sm text-foreground/70 mb-4 line-clamp-2">{sprint.description}</p>
                <div className="text-xs text-muted-foreground space-y-1 mb-4">
                  <div className="flex justify-between"><span>Start</span><span>{fmtDate(sprint.startDate)}</span></div>
                  <div className="flex justify-between"><span>End</span><span>{fmtDate(sprint.endDate)}</span></div>
                  <div className="flex justify-between font-medium text-foreground"><span>Tasks</span><span>{done}/{sprintTasks.length}</span></div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Progress</span><span className="font-semibold text-foreground">{pct}%</span></div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
              {selected?.id === sprint.id && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tasks in this sprint</p>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {sprintTasks.length === 0 && <p className="text-xs text-muted-foreground">No tasks assigned.</p>}
                    {sprintTasks.map(t => (
                      <button key={t.id} onClick={() => setSelectedTask(t)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent text-left transition">
                        <span className="font-mono text-xs text-muted-foreground w-16 flex-shrink-0">{t.taskCode}</span>
                        <span className="flex-1 text-xs text-foreground truncate">{t.title}</span>
                        <StatusBadge status={t.status} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Sprint summary table */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">All Sprints Summary</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/30">
              {["Sprint","Course","Start","End","Status","Tasks","Done","Progress"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>)}
            </tr></thead>
            <tbody>
              {sprints.map(s => {
                const st = tasks.filter(t => s.taskIds.includes(t.id))
                const dn = st.filter(t => t.status === "done").length
                const pct = st.length > 0 ? Math.round((dn / st.length) * 100) : 0
                return (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition">
                    <td className="px-4 py-3 font-semibold text-foreground">{s.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.code}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(s.startDate)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(s.endDate)}</td>
                    <td className="px-4 py-3"><span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold capitalize", statusColor[s.status])}>{s.status}</span></td>
                    <td className="px-4 py-3 text-foreground">{st.length}</td>
                    <td className="px-4 py-3 text-foreground">{dn}</td>
                    <td className="px-4 py-3 w-28">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
                        <span className="text-xs font-medium text-foreground w-8">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedTask && <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  )
}

const statusColor: Record<string, string> = {
  planning: "bg-muted text-muted-foreground border border-border",
  active: "bg-blue-100 text-blue-700 border border-blue-200",
  completed: "bg-green-100 text-green-700 border border-green-200",
}

// ─────────────────────────────────────────────────────────────
// CONNECTIONS VIEW
// ─────────────────────────────────────────────────────────────

function ConnectionsView() {
  const { currentUser, users, connections, tasks, sendConnectionRequest, respondToConnection } = useTaskStore()
  const [email, setEmail] = useState("")
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [loading, setLoading] = useState(false)

  const myConns = connections.filter(c => c.requesterId === currentUser?.id || c.receiverId === currentUser?.id)
  const accepted = myConns.filter(c => c.status === "accepted")
  const pending = myConns.filter(c => c.status === "pending")
  const incoming = pending.filter(c => c.receiverId === currentUser?.id)
  const outgoing = pending.filter(c => c.requesterId === currentUser?.id)

  const getPeer = (c: typeof connections[0]) => users.find(u => u.id === (c.requesterId === currentUser?.id ? c.receiverId : c.requesterId))

  const sendRequest = (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    setLoading(true)
    setTimeout(() => {
      const r = sendConnectionRequest(currentUser!.id, email)
      setLoading(false)
      setMsg({ text: r.message, ok: r.success })
      if (r.success) setEmail("")
    }, 500)
  }

  return (
    <div className="space-y-6">
      {/* Send request */}
      <Card className="p-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Send connection request</p>
        <form onSubmit={sendRequest} className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-48"><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="colleague@email.com" required /></div>
          <Btn type="submit" variant="primary" disabled={loading || !email}>
            {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</> : <><UserPlus className="w-4 h-4" />Send request</>}
          </Btn>
        </form>
        {msg && <p className={cn("text-sm mt-3", msg.ok ? "text-green-600" : "text-red-600")}>{msg.text}</p>}
        <p className="text-xs text-muted-foreground mt-2">Try: sarah@taskska.com, mark@taskska.com</p>
      </Card>

      {/* Incoming */}
      {incoming.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Incoming requests ({incoming.length})</p>
          <div className="space-y-2">
            {incoming.map(c => {
              const peer = getPeer(c)
              return (
                <Card key={c.id} className="p-4 flex items-center gap-4">
                  <Avatar name={peer?.name ?? "U"} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{peer?.name}</p>
                    <p className="text-xs text-muted-foreground">{peer?.email} &bull; Sent {fmtDate(c.createdAt)}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Btn onClick={() => respondToConnection(c.id, true)} variant="primary" size="sm"><UserCheck className="w-3.5 h-3.5" />Accept</Btn>
                    <Btn onClick={() => respondToConnection(c.id, false)} variant="outline" size="sm"><UserX className="w-3.5 h-3.5" />Decline</Btn>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Outgoing pending */}
      {outgoing.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Sent requests ({outgoing.length})</p>
          <div className="space-y-2">
            {outgoing.map(c => {
              const peer = getPeer(c)
              return (
                <Card key={c.id} className="p-4 flex items-center gap-4">
                  <Avatar name={peer?.name ?? "U"} size="md" />
                  <div className="flex-1"><p className="font-semibold text-foreground">{peer?.name}</p><p className="text-xs text-muted-foreground">{peer?.email}</p></div>
                  <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200 font-medium">Pending</span>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Accepted */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">My connections ({accepted.length})</p>
        {accepted.length === 0 ? <EmptyState icon={Users} title="No connections yet" desc="Send a connection request to collaborate with teammates." /> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {accepted.map(c => {
              const peer = getPeer(c)
              const peerTasks = tasks.filter(t => t.assigneeId === peer?.id && t.status !== "done")
              return (
                <Card key={c.id} className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar name={peer?.name ?? "U"} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{peer?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{peer?.email}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 border border-green-200 font-medium flex-shrink-0">Connected</span>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between"><span>Role</span><span className="capitalize font-medium text-foreground">{peer?.role}</span></div>
                    <div className="flex justify-between"><span>Open tasks</span><span className="font-medium text-foreground">{peerTasks.length}</span></div>
                    <div className="flex justify-between"><span>Connected</span><span className="font-medium text-foreground">{fmtDate(c.createdAt)}</span></div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SEARCH VIEW
// ─────────────────────────────────────────────────────────────

function SearchView() {
  const { tasks, users, searchQuery, setSearchQuery, filterStatus, filterPriority, setFilterStatus, setFilterPriority } = useTaskStore()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const results = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return tasks.filter(t =>
      t.taskCode.toLowerCase().includes(q) ||
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.deadline.includes(q) ||
      t.tags.some(tag => tag.toLowerCase().includes(q))
    ).filter(t => filterStatus === "all" || t.status === filterStatus)
     .filter(t => filterPriority === "all" || t.priority === filterPriority)
  }, [tasks, searchQuery, filterStatus, filterPriority])

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by Task ID, title, description, tag or deadline…"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
        </div>
        <div className="flex gap-3 flex-wrap">
          <Select className="w-40" value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
            <option value="all">All statuses</option>
            {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
          </Select>
          <Select className="w-40" value={filterPriority} onChange={e => setFilterPriority(e.target.value as any)}>
            <option value="all">All priorities</option>
            {(Object.keys(PRIORITY_CONFIG) as Priority[]).map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>)}
          </Select>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {searchQuery ? `${results.length} result${results.length !== 1 ? "s" : ""} for "${searchQuery}"` : `${results.length} total task${results.length !== 1 ? "s" : ""}`}
      </p>

      {results.length === 0 ? <EmptyState icon={Search} title="No results found" desc="Try a different search term or adjust filters." /> : (
        <div className="space-y-2">
          {results.map(t => {
            const assignee = users.find(u => u.id === t.assigneeId)
            return (
              <Card key={t.id} className="p-4 cursor-pointer hover:shadow-sm hover:border-primary/20 transition-all" onClick={() => setSelectedTask(t)}>
                <div className="flex items-start gap-3 flex-wrap">
                  <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded mt-0.5">{t.taskCode}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">{t.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{t.description}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {t.tags.map(tag => <span key={tag} className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded font-medium">{tag}</span>)}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                    <PriorityBadge priority={t.priority} />
                    <StatusBadge status={isOverdue(t.deadline, t.status) ? "overdue" : t.status} />
                    <span className="text-xs text-muted-foreground">{fmtDate(t.deadline)}</span>
                    {assignee && <Avatar name={assignee.name} size="sm" />}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {selectedTask && <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// WORKLOAD VIEW
// ─────────────────────────────────────────────────────────────

function WorkloadView() {
  const { currentUser, users, connections, tasks } = useTaskStore()

  const myConns = connections.filter(c => (c.requesterId === currentUser?.id || c.receiverId === currentUser?.id) && c.status === "accepted")
  const teamIds = [currentUser?.id, ...myConns.map(c => c.requesterId === currentUser?.id ? c.receiverId : c.requesterId)].filter(Boolean) as string[]
  const teamUsers = users.filter(u => teamIds.includes(u.id))

  const getUserWorkload = (userId: string) => {
    const userTasks = tasks.filter(t => t.assigneeId === userId && t.status !== "done")
    const totalHours = userTasks.reduce((s, t) => s + (t.estimatedHours || 0), 0)
    const maxHours = 40
    const pct = Math.min(100, Math.round((totalHours / maxHours) * 100))
    return { tasks: userTasks, hours: totalHours, pct, overdue: userTasks.filter(t => isOverdue(t.deadline, t.status)).length }
  }

  const getWorkloadColor = (pct: number) => {
    if (pct >= 90) return { bar: "bg-red-500", text: "text-red-600", label: "Overloaded" }
    if (pct >= 70) return { bar: "bg-orange-500", text: "text-orange-600", label: "High" }
    if (pct >= 40) return { bar: "bg-blue-500", text: "text-blue-600", label: "Moderate" }
    return { bar: "bg-green-500", text: "text-green-600", label: "Available" }
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamUsers.map(u => {
          const wl = getUserWorkload(u.id)
          const col = getWorkloadColor(wl.pct)
          return (
            <Card key={u.id} className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <Avatar name={u.name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground truncate">{u.name} {u.id === currentUser?.id && "(you)"}</p>
                  <p className="text-xs text-muted-foreground capitalize">{u.role}</p>
                </div>
                <span className={cn("text-xs font-semibold px-2 py-1 rounded-full", col.text, "bg-current/10")}>{col.label}</span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Workload</span><span className="font-bold text-foreground">{wl.pct}%</span></div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all", col.bar)} style={{ width: `${wl.pct}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[{ label: "Tasks", value: wl.tasks.length }, { label: "Hours", value: `${wl.hours}h` }, { label: "Overdue", value: wl.overdue }].map(s => (
                  <div key={s.label} className="bg-muted rounded-lg py-2">
                    <div className="font-bold text-foreground text-sm">{s.value}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Historical table */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Team Workload Summary</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/30">
              {["Team Member","Role","Open Tasks","Est. Hours","Overdue","Workload","Status"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>)}
            </tr></thead>
            <tbody>
              {teamUsers.map(u => {
                const wl = getUserWorkload(u.id)
                const col = getWorkloadColor(wl.pct)
                return (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><Avatar name={u.name} size="sm" /><span className="font-medium text-foreground">{u.name}</span></div></td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{u.role}</td>
                    <td className="px-4 py-3 text-foreground">{wl.tasks.length}</td>
                    <td className="px-4 py-3 text-foreground">{wl.hours}h</td>
                    <td className="px-4 py-3"><span className={wl.overdue > 0 ? "text-red-600 font-semibold" : "text-foreground"}>{wl.overdue}</span></td>
                    <td className="px-4 py-3 w-32">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden"><div className={cn("h-full", col.bar)} style={{ width: `${wl.pct}%` }} /></div>
                        <span className="text-xs font-medium text-foreground w-8">{wl.pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", col.text)}>{col.label}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// NOTIFICATIONS VIEW
// ─────────────────────────────────────────────────────────────

function NotificationsView() {
  const { currentUser, notifications, markNotificationRead, markAllNotificationsRead } = useTaskStore()
  const myNotifs = [...notifications.filter(n => n.userId === currentUser?.id)].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const unread = myNotifs.filter(n => !n.read)

  const typeIcon: Record<string, React.ReactNode> = {
    task_assigned: <CheckSquare className="w-4 h-4 text-blue-500" />,
    status_update: <RefreshCw className="w-4 h-4 text-green-500" />,
    connection_request: <UserPlus className="w-4 h-4 text-purple-500" />,
    connection_accepted: <UserCheck className="w-4 h-4 text-green-500" />,
    overdue_alert: <AlertTriangle className="w-4 h-4 text-red-500" />,
    dependency_blocked: <Link2 className="w-4 h-4 text-orange-500" />,
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{unread.length} unread notification{unread.length !== 1 ? "s" : ""}</p>
        {unread.length > 0 && (
          <Btn onClick={() => markAllNotificationsRead(currentUser!.id)} variant="outline" size="sm"><Check className="w-3.5 h-3.5" />Mark all read</Btn>
        )}
      </div>

      {myNotifs.length === 0 ? <EmptyState icon={Bell} title="All caught up!" desc="No notifications yet. We'll let you know when something happens." /> : (
        <div className="space-y-2">
          {myNotifs.map(n => (
            <Card key={n.id} className={cn("p-4 cursor-pointer hover:shadow-sm transition-all", !n.read && "border-primary/30 bg-primary/3")}>
              <div className="flex items-start gap-3" onClick={() => markNotificationRead(n.id)}>
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  {typeIcon[n.type] ?? <Bell className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-foreground text-sm">{n.title}</p>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">{fmtDate(n.createdAt)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TEMPLATES VIEW
// ─────────────────────────────────────────────────────────────

function TemplatesView() {
  const { currentUser, users, templates, createTemplate, deleteTemplate } = useTaskStore()
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [priority, setPriority] = useState<Priority>("medium")
  const [hours, setHours] = useState(4)
  const [tags, setTags] = useState("")

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !currentUser) return
    createTemplate({ name: name.trim(), description: desc.trim(), priority, estimatedHours: hours, tags: tags.split(",").map(t => t.trim()).filter(Boolean), creatorId: currentUser.id })
    setName(""); setDesc(""); setPriority("medium"); setHours(4); setTags("")
    setShowCreate(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Btn onClick={() => setShowCreate(!showCreate)} variant="primary" size="sm"><Plus className="w-3.5 h-3.5" />New template</Btn>
      </div>

      {showCreate && (
        <Card className="p-5">
          <p className="font-semibold text-foreground mb-4">Create task template</p>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>Template name *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Bug Fix Template" required /></div>
              <div><Label>Default priority</Label>
                <Select value={priority} onChange={e => setPriority(e.target.value as Priority)}>
                  {(Object.keys(PRIORITY_CONFIG) as Priority[]).map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>)}
                </Select>
              </div>
            </div>
            <div><Label>Description</Label><Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="Describe what this template is for…" /></div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>Estimated hours</Label><Input type="number" value={hours} onChange={e => setHours(+e.target.value)} min={0.5} step={0.5} /></div>
              <div><Label>Default tags</Label><Input value={tags} onChange={e => setTags(e.target.value)} placeholder="bug, fix, backend" /></div>
            </div>
            <div className="flex gap-3">
              <Btn type="submit" variant="primary" size="sm" disabled={!name.trim()}><Save className="w-3.5 h-3.5" />Save template</Btn>
              <Btn onClick={() => setShowCreate(false)} variant="outline" size="sm">Cancel</Btn>
            </div>
          </form>
        </Card>
      )}

      {templates.length === 0 ? <EmptyState icon={FileText} title="No templates yet" desc="Create reusable templates for recurring task types." /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => {
            const creator = users.find(u => u.id === t.creatorId)
            return (
              <Card key={t.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"><FileText className="w-4 h-4 text-primary" /></div>
                  <button onClick={() => deleteTemplate(t.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                <h3 className="font-bold text-foreground mt-2">{t.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <PriorityBadge priority={t.priority} />
                  <span className="px-2 py-0.5 bg-muted rounded-full text-xs text-muted-foreground">{t.estimatedHours}h est.</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {t.tags.map(tag => <span key={tag} className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded font-medium">{tag}</span>)}
                </div>
                <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground flex justify-between">
                  <span>By {creator?.name ?? "Unknown"}</span>
                  <span>{fmtDate(t.createdAt)}</span>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SETTINGS VIEW (MFA + Notifications + Profile)
// ─────────────────────────────────────────────────────────────

function SettingsView() {
  const { currentUser, setupMfa, disableMfa, updateNotificationPrefs, users } = useTaskStore()
  const [mfaStep, setMfaStep] = useState<"off" | "setup" | "confirm" | "on">(currentUser?.mfaEnabled ? "on" : "off")
  const [mfaCode, setMfaCode] = useState("")
  const [mfaErr, setMfaErr] = useState("")
  const [saved, setSaved] = useState(false)

  const secretKey = "TASK-SKA-MFA-2026"
  const totpUri = `otpauth://totp/TaskSKA:${currentUser?.email}?secret=${secretKey}&issuer=TaskSKA`

  const confirmMfa = () => {
    if (mfaCode.length !== 6) { setMfaErr("Enter the 6-digit code"); return }
    setupMfa(currentUser!.id)
    setMfaStep("on")
    setMfaCode("")
    setMfaErr("")
  }

  const saveNotifPrefs = (key: keyof User["notificationPrefs"], val: boolean) => {
    updateNotificationPrefs(currentUser!.id, { [key]: val })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!currentUser) return null

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile */}
      <Card className="p-6">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-5">Profile</p>
        <div className="flex items-center gap-4 mb-5">
          <Avatar name={currentUser.name} size="lg" />
          <div>
            <p className="font-bold text-foreground text-lg">{currentUser.name}</p>
            <p className="text-muted-foreground text-sm">{currentUser.email}</p>
            <span className="mt-1 inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold capitalize">{currentUser.role}</span>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          {[
            { label: "Account ID", value: currentUser.id },
            { label: "Member since", value: fmtDate(currentUser.createdAt) },
            { label: "Last login", value: currentUser.lastLogin ? fmtDate(currentUser.lastLogin) : "Just now" },
            { label: "MFA status", value: currentUser.mfaEnabled ? "Enabled" : "Disabled" },
          ].map(r => (
            <div key={r.label} className="bg-muted rounded-lg px-3 py-2.5">
              <p className="text-xs font-semibold text-muted-foreground mb-0.5">{r.label}</p>
              <p className="text-foreground font-medium truncate">{r.value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* MFA */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"><Shield className="w-5 h-5 text-primary" /></div>
          <div>
            <p className="font-semibold text-foreground">Multi-Factor Authentication (MFA)</p>
            <p className="text-xs text-muted-foreground">Secure your account with TOTP-based two-factor authentication</p>
          </div>
          <span className={cn("ml-auto px-2.5 py-1 rounded-full text-xs font-bold", mfaStep === "on" ? "bg-green-100 text-green-700 border border-green-200" : "bg-muted text-muted-foreground border border-border")}>
            {mfaStep === "on" ? "Enabled" : "Disabled"}
          </span>
        </div>

        {mfaStep === "off" && (
          <div className="space-y-4">
            <div className="px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-300 flex gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              MFA adds an extra layer of security. Even if someone steals your password, they cannot access your account without your device.
            </div>
            <Btn onClick={() => setMfaStep("setup")} variant="primary"><Shield className="w-4 h-4" />Enable MFA</Btn>
          </div>
        )}

        {mfaStep === "setup" && (
          <div className="space-y-4">
            <div className="bg-muted rounded-xl p-5 space-y-4">
              <p className="font-semibold text-foreground text-sm">Step 1: Scan this QR code</p>
              <div className="flex gap-5 items-start flex-wrap">
                <div className="w-32 h-32 bg-white border-2 border-border rounded-xl flex items-center justify-center flex-shrink-0">
                  <div className="grid grid-cols-7 gap-0.5 p-2">
                    {Array.from({ length: 49 }).map((_, i) => (
                      <div key={i} className={cn("w-2.5 h-2.5 rounded-sm", [0,1,2,3,4,5,6,7,14,21,28,35,42,43,44,45,46,47,48,8,10,12,15,17,19,24,26,29,31,33,36,38,40].includes(i) ? "bg-foreground" : "bg-transparent")} />
                    ))}
                  </div>
                </div>
                <div className="flex-1 min-w-0 space-y-2 text-xs text-muted-foreground">
                  <p>Scan with Google Authenticator, Authy, or any TOTP app.</p>
                  <p className="font-semibold text-foreground">Or enter this key manually:</p>
                  <div className="flex items-center gap-2">
                    <code className="font-mono bg-background border border-border px-2 py-1 rounded text-foreground break-all">{secretKey}</code>
                    <button onClick={() => navigator.clipboard?.writeText(secretKey)} className="p-1.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition"><Copy className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
              <p className="font-semibold text-foreground text-sm pt-2 border-t border-border">Step 2: Enter the 6-digit code</p>
              <div className="flex gap-3 flex-wrap">
                <Input value={mfaCode} onChange={e => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" className="w-36 text-center font-mono text-xl tracking-widest" maxLength={6} />
                <Btn onClick={confirmMfa} variant="primary" disabled={mfaCode.length !== 6}><Check className="w-4 h-4" />Verify &amp; Enable</Btn>
                <Btn onClick={() => setMfaStep("off")} variant="outline">Cancel</Btn>
              </div>
              {mfaErr && <p className="text-sm text-red-600">{mfaErr}</p>}
              <p className="text-xs text-muted-foreground">For demo, any 6-digit number works (e.g. 123456)</p>
            </div>
          </div>
        )}

        {mfaStep === "on" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-700">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-700 dark:text-green-400 text-sm">MFA is active</p>
                <p className="text-green-600 dark:text-green-500 text-xs">Your account requires a 6-digit code at each login.</p>
              </div>
            </div>
            <Btn onClick={() => { disableMfa(currentUser.id); setMfaStep("off") }} variant="outline" className="text-red-500 border-red-200 hover:bg-red-50"><XCircle className="w-4 h-4" />Disable MFA</Btn>
          </div>
        )}
      </Card>

      {/* Notification preferences */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"><Bell className="w-5 h-5 text-primary" /></div>
            <div>
              <p className="font-semibold text-foreground">Notification preferences</p>
              <p className="text-xs text-muted-foreground">Choose what you want to be notified about</p>
            </div>
          </div>
          {saved && <span className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Saved</span>}
        </div>
        <div className="space-y-3">
          {[
            { key: "taskAssigned" as const, label: "Task assigned", desc: "When someone assigns a task to you" },
            { key: "statusUpdate" as const, label: "Status updates", desc: "When tasks you created change status" },
            { key: "connectionRequest" as const, label: "Connection requests", desc: "When someone sends you a connection request" },
            { key: "overdueAlert" as const, label: "Overdue alerts", desc: "When your tasks become overdue" },
            { key: "emailNotifications" as const, label: "Email notifications", desc: "Receive notifications via email" },
            { key: "pushNotifications" as const, label: "Push notifications", desc: "Receive browser push notifications" },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <button
                onClick={() => saveNotifPrefs(item.key, !currentUser.notificationPrefs[item.key])}
                className={cn("relative w-11 h-6 rounded-full transition-colors flex-shrink-0", currentUser.notificationPrefs[item.key] ? "bg-primary" : "bg-muted")}
              >
                <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform", currentUser.notificationPrefs[item.key] ? "translate-x-5" : "")} />
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ADMIN VIEW
// ─────────────────────────────────────────────────────────────

function AdminView() {
  const { users, tasks, connections, sprints, notifications } = useTaskStore()
  const [tab, setTab] = useState<"overview" | "users" | "tasks" | "sprints">("overview")

  const stats = [
    { label: "Total Users", value: users.length, icon: Users, color: "bg-primary" },
    { label: "Total Tasks", value: tasks.length, icon: CheckSquare, color: "bg-blue-500" },
    { label: "Active Sprint", value: sprints.filter(s => s.status === "active").length, icon: Zap, color: "bg-green-500" },
    { label: "Connections", value: connections.filter(c => c.status === "accepted").length, icon: Link2, color: "bg-indigo-500" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"><Shield className="w-5 h-5 text-white" /></div>
        <div>
          <h2 className="font-bold text-foreground text-lg">Admin Panel</h2>
          <p className="text-muted-foreground text-sm">Platform management and oversight</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} />)}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(["overview","users","tasks","sprints"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn("px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors", tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Sprint Progress</p>
            <div className="space-y-3">
              {sprints.map(s => {
                const st = tasks.filter(t => s.taskIds.includes(t.id))
                const dn = st.filter(t => t.status === "done").length
                const pct = st.length > 0 ? Math.round((dn / st.length) * 100) : 0
                return (
                  <div key={s.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-foreground">{s.name}</span>
                      <span className="text-muted-foreground">{dn}/{st.length} &bull; {pct}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", s.status === "completed" ? "bg-green-500" : s.status === "active" ? "bg-primary" : "bg-muted-foreground/30")} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Task Distribution</p>
            <div className="space-y-2">
              {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map(s => {
                const count = tasks.filter(t => t.status === s).length
                const pct = tasks.length > 0 ? Math.round((count / tasks.length) * 100) : 0
                return (
                  <div key={s} className="flex items-center gap-3">
                    <StatusBadge status={s} />
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground w-12 text-right">{count} ({pct}%)</span>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {tab === "users" && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/30">
                {["User","Email","Role","MFA","Tasks","Workload","Joined"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>)}
              </tr></thead>
              <tbody>
                {users.map(u => {
                  const openTasks = tasks.filter(t => t.assigneeId === u.id && t.status !== "done")
                  const wlPct = Math.min(100, Math.round((openTasks.reduce((s,t) => s + t.estimatedHours, 0) / 40) * 100))
                  return (
                    <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><Avatar name={u.name} size="sm" /><span className="font-medium text-foreground">{u.name}</span></div></td>
                      <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3"><span className="capitalize px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">{u.role}</span></td>
                      <td className="px-4 py-3"><span className={cn("text-xs font-semibold", u.mfaEnabled ? "text-green-600" : "text-muted-foreground")}>{u.mfaEnabled ? "On" : "Off"}</span></td>
                      <td className="px-4 py-3 text-foreground">{openTasks.length}</td>
                      <td className="px-4 py-3 w-24"><div className="flex items-center gap-2"><div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden"><div className={cn("h-full", wlPct >= 80 ? "bg-red-500" : wlPct >= 60 ? "bg-orange-500" : "bg-primary")} style={{ width: `${wlPct}%` }} /></div><span className="text-xs text-muted-foreground">{wlPct}%</span></div></td>
                      <td className="px-4 py-3 text-muted-foreground">{fmtDate(u.createdAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "tasks" && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/30">
                {["Task ID","Title","Assignee","Priority","Status","Deadline","Sprint"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>)}
              </tr></thead>
              <tbody>
                {tasks.map(t => {
                  const assignee = users.find(u => u.id === t.assigneeId)
                  const sprint = sprints.find(s => s.id === t.sprintId)
                  return (
                    <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.taskCode}</td>
                      <td className="px-4 py-3 font-medium text-foreground max-w-[200px] truncate">{t.title}</td>
                      <td className="px-4 py-3"><div className="flex items-center gap-1.5"><Avatar name={assignee?.name ?? "?"} size="sm" /><span className="text-muted-foreground text-xs">{assignee?.name}</span></div></td>
                      <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                      <td className="px-4 py-3"><StatusBadge status={isOverdue(t.deadline, t.status) ? "overdue" : t.status} /></td>
                      <td className="px-4 py-3 text-muted-foreground">{fmtDate(t.deadline)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{sprint?.name ?? "—"}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "sprints" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sprints.map(s => {
            const st = tasks.filter(t => s.taskIds.includes(t.id))
            const dn = st.filter(t => t.status === "done").length
            const pct = st.length > 0 ? Math.round((dn / st.length) * 100) : 0
            return (
              <Card key={s.id} className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-foreground">{s.name}</h3>
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold capitalize", statusColor[s.status])}>{s.status}</span>
                </div>
                <p className="text-xs font-mono text-muted-foreground mb-2">{s.code}</p>
                <p className="text-sm text-foreground/70 mb-4">{s.description}</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground"><span>{fmtDate(s.startDate)} → {fmtDate(s.endDate)}</span><span>{dn}/{st.length} done</span></div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-right text-xs font-semibold text-foreground">{pct}%</p>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN APP SHELL
// ─────────────────────────────────────────────────────────────

function AppShell() {
  const activeView = useTaskStore(s => s.activeView)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const views: Record<string, React.ReactNode> = {
    dashboard: <DashboardView />,
    tasks: <TasksView />,
    sprints: <SprintsView />,
    connections: <ConnectionsView />,
    search: <SearchView />,
    workload: <WorkloadView />,
    notifications: <NotificationsView />,
    templates: <TemplatesView />,
    settings: <SettingsView />,
    admin: <AdminView />,
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col lg:ml-64 min-w-0">
        <Topbar onMenuToggle={() => setSidebarOpen(o => !o)} />
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {views[activeView] ?? <DashboardView />}
        </main>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────

export default function TaskSKA() {
  const isAuthenticated = useTaskStore(s => s.isAuthenticated)

  if (!isAuthenticated) return <AuthScreen />
  return <AppShell />
}
