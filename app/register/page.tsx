"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useTaskStore } from "@/lib/store"
import { Eye, EyeOff, User, Mail, Lock, CheckCircle2 } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useTaskStore()
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" })
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const passwordRules = [
    { label: "At least 8 characters", ok: form.password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(form.password) },
    { label: "Lowercase letter", ok: /[a-z]/.test(form.password) },
    { label: "Number", ok: /\d/.test(form.password) },
    { label: "Special character", ok: /[@$!%*?&]/.test(form.password) },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (form.password !== form.confirm) { setError("Passwords do not match"); return }
    if (!passwordRules.every((r) => r.ok)) { setError("Password does not meet requirements"); return }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 700))
    const result = register(form.name, form.email, form.password)
    setLoading(false)
    if (!result.success) { setError(result.message) } else { setSuccess(true) }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[--color-background] p-6">
        <div className="bg-card border border-border rounded-2xl p-10 shadow-sm max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Account Created!</h2>
          <p className="text-muted-foreground text-sm mb-6">Your TaskSKA account is ready. Sign in to get started.</p>
          <Link href="/login" className="inline-block w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl text-center hover:bg-primary/90 transition">
            Sign in now
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-[--color-background]">
      <div className="hidden lg:flex lg:w-1/2 bg-[--color-sidebar] flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <span className="text-white font-black text-lg">T</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">TaskSKA</span>
        </div>
        <div>
          <h1 className="text-white text-4xl font-bold leading-tight mb-6 text-balance">
            Join TaskSKA and take control of your work
          </h1>
          <p className="text-blue-200 text-sm leading-relaxed">
            Create your free account and start managing tasks, collaborating with your team, and tracking progress — all in one secure platform.
          </p>
        </div>
        <p className="text-blue-300 text-xs">TaskSKA &copy; 2026 — MIT651 / MIT652 Capstone</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-black text-sm">T</span>
            </div>
            <span className="font-bold text-lg text-foreground">TaskSKA</span>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-foreground mb-1">Create account</h2>
            <p className="text-muted-foreground text-sm mb-6">Get started with TaskSKA for free</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Full name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Jane Doe"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPwd ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-2.5 border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2 grid grid-cols-2 gap-1">
                    {passwordRules.map((r) => (
                      <div key={r.label} className={`flex items-center gap-1.5 text-xs ${r.ok ? "text-green-600" : "text-muted-foreground"}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${r.ok ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                        {r.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={form.confirm}
                    onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition disabled:opacity-50"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
