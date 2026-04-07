"use client"
import { useState } from "react"
import LoginForm from "./LoginForm"
import RegisterForm from "./RegisterForm"
import ResetPasswordForm from "./ResetPasswordForm"
import MfaForm from "./MfaForm"
import { useTaskStore } from "@/lib/store"

type AuthView = "login" | "register" | "reset" | "mfa"

export default function AuthPage() {
  const [view, setView] = useState<AuthView>("login")
  const { mfaPending, pendingUserId } = useTaskStore()

  if (mfaPending && pendingUserId) {
    return <MfaForm userId={pendingUserId} onBack={() => setView("login")} />
  }

  return (
    <div className="min-h-screen bg-sidebar flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-8 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <svg className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <span className="text-xl font-bold text-sidebar-foreground tracking-tight">TaskSKA</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {view === "login" && <LoginForm onRegister={() => setView("register")} onReset={() => setView("reset")} />}
          {view === "register" && <RegisterForm onLogin={() => setView("login")} />}
          {view === "reset" && <ResetPasswordForm onBack={() => setView("login")} />}
        </div>
      </div>

      <footer className="text-center py-4 text-sidebar-foreground/40 text-sm">
        &copy; 2026 TaskSKA. All rights reserved. — MIT 651/652 Capstone Project
      </footer>
    </div>
  )
}
