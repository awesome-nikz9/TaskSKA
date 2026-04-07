"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useTaskStore } from "@/lib/store"
import { Eye, EyeOff, Shield, CheckCircle2, Lock, Mail } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { login, mfaPending, pendingUserId, verifyMfa } = useTaskStore()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [mfaCode, setMfaCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    const result = login(email, password)
    setLoading(false)
    if (!result.success) {
      setError(result.message)
    } else if (!result.requiresMfa) {
      router.push("/dashboard")
    }
  }

  const handleMfa = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    await new Promise((r) => setTimeout(r, 500))
    if (!pendingUserId) return
    const result = verifyMfa(pendingUserId, mfaCode)
    setLoading(false)
    if (!result.success) {
      setError(result.message)
    } else {
      router.push("/dashboard")
    }
  }

  const demoAccounts = [
    { label: "Admin", email: "admin@taskska.com", password: "Admin@1234", color: "bg-red-100 text-red-700 border-red-200" },
    { label: "Taskmaster", email: "john@taskska.com", password: "User@1234", color: "bg-blue-100 text-blue-700 border-blue-200" },
    { label: "User", email: "sarah@taskska.com", password: "User@1234", color: "bg-green-100 text-green-700 border-green-200" },
  ]

  return (
    <div className="min-h-screen flex bg-[--color-background]">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[--color-sidebar] flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <span className="text-white font-black text-lg">T</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">TaskSKA</span>
        </div>
        <div>
          <h1 className="text-white text-4xl font-bold leading-tight mb-6 text-balance">
            World-class task management for modern teams
          </h1>
          <div className="space-y-4">
            {["MFA-secured authentication", "Sprint-based project tracking", "Real-time workload analytics", "Automated task workflows"].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-300 shrink-0" />
                <span className="text-blue-100 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-blue-300 text-xs">TaskSKA &copy; 2026 — MIT651 / MIT652 Capstone</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-black text-sm">T</span>
            </div>
            <span className="font-bold text-lg text-foreground">TaskSKA</span>
          </div>

          {mfaPending ? (
            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
              <div className="flex flex-col items-center mb-6">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Shield className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Two-Factor Verification</h2>
                <p className="text-muted-foreground text-sm mt-1 text-center">Enter the 6-digit code from your authenticator app</p>
              </div>
              <form onSubmit={handleMfa} className="space-y-4">
                <input
                  type="text"
                  maxLength={6}
                  inputMode="numeric"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full text-center text-3xl font-mono tracking-widest border border-border rounded-xl px-4 py-4 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {error && <p className="text-destructive text-sm text-center">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || mfaCode.length !== 6}
                  className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Verify Code"}
                </button>
              </form>
              <p className="text-center text-xs text-muted-foreground mt-4">Demo: enter any 6 digits (e.g. 123456)</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-foreground mb-1">Welcome back</h2>
              <p className="text-muted-foreground text-sm mb-6">Sign in to your TaskSKA account</p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@taskska.com"
                      required
                      className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-foreground">Password</label>
                    <Link href="/reset-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-10 py-2.5 border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {error && <p className="text-destructive text-sm">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-4">
                {"Don't have an account? "}
                <Link href="/register" className="text-primary font-medium hover:underline">Create one</Link>
              </p>

              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-3 font-medium">Demo accounts</p>
                <div className="flex flex-wrap gap-2">
                  {demoAccounts.map((a) => (
                    <button
                      key={a.label}
                      onClick={() => { setEmail(a.email); setPassword(a.password) }}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition hover:opacity-80 ${a.color}`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
