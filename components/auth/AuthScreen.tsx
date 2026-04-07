"use client"
import { useState } from "react"
import LoginForm from "./LoginForm"
import RegisterForm from "./RegisterForm"
import MfaForm from "./MfaForm"
import ResetPasswordForm from "./ResetPasswordForm"

export type AuthView = "login" | "register" | "mfa" | "reset"

interface AuthScreenProps {
  pendingUserId: string | null
}

export default function AuthScreen({ pendingUserId }: AuthScreenProps) {
  const [view, setView] = useState<AuthView>(pendingUserId ? "mfa" : "login")

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-black text-lg">T</span>
          </div>
          <span className="text-sidebar-foreground font-bold text-xl tracking-tight">TaskSKA</span>
        </div>
        <div className="space-y-6">
          <h1 className="text-sidebar-foreground text-4xl font-bold leading-tight text-balance">
            Manage tasks.<br />Track progress.<br />Deliver results.
          </h1>
          <p className="text-sidebar-foreground/60 text-lg leading-relaxed">
            A world-standard task management system built for collaborative teams with enterprise-grade security and MFA.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { label: "Sprints", value: "5" },
              { label: "Use Cases", value: "30+" },
              { label: "Security", value: "MFA" },
              { label: "Course", value: "MIT651/652" },
            ].map((s) => (
              <div key={s.label} className="bg-sidebar-accent rounded-xl p-4">
                <div className="text-primary text-2xl font-bold">{s.value}</div>
                <div className="text-sidebar-foreground/60 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-sidebar-foreground/40 text-sm">
          TaskSKA &copy; 2026 &mdash; Capstone Project MIT651/652
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-black text-sm">T</span>
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">TaskSKA</span>
          </div>

          {view === "login" && <LoginForm onNavigate={setView} />}
          {view === "register" && <RegisterForm onNavigate={setView} />}
          {view === "mfa" && <MfaForm onNavigate={setView} pendingUserId={pendingUserId} />}
          {view === "reset" && <ResetPasswordForm onNavigate={setView} />}
        </div>
      </div>
    </div>
  )
}
