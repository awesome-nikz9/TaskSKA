"use client"
import { useState } from "react"
import { useTaskStore } from "@/lib/store"
import { Eye, EyeOff, Lock, Mail, Shield } from "lucide-react"

interface Props {
  onRegister: () => void
  onReset: () => void
}

export default function LoginForm({ onRegister, onReset }: Props) {
  const login = useTaskStore((s) => s.login)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    const result = login(email, password)
    setLoading(false)
    if (!result.success) setError(result.message)
  }

  return (
    <div className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
      <div className="bg-primary px-8 py-8">
        <div className="flex items-center gap-3 mb-1">
          <Shield className="w-6 h-6 text-primary-foreground/80" />
          <h1 className="text-2xl font-bold text-primary-foreground">Welcome back</h1>
        </div>
        <p className="text-primary-foreground/70 text-sm">Sign in to your TaskSKA account</p>
      </div>

      <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@taskska.com"
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="button" onClick={onReset} className="text-sm text-primary hover:underline font-medium">
            Forgot password?
          </button>
        </div>

        {error && (
          <div className="px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold text-sm transition disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Signing in...
            </>
          ) : "Sign In"}
        </button>

        <div className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <button type="button" onClick={onRegister} className="text-primary font-semibold hover:underline">
            Register now
          </button>
        </div>

        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground text-center mb-2">Demo accounts</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button type="button" onClick={() => { setEmail("admin@taskska.com"); setPassword("Admin@1234") }} className="px-3 py-2 bg-muted hover:bg-accent rounded-lg text-left transition">
              <div className="font-medium text-foreground">Admin</div>
              <div className="text-muted-foreground">admin@taskska.com</div>
            </button>
            <button type="button" onClick={() => { setEmail("john@taskska.com"); setPassword("User@1234") }} className="px-3 py-2 bg-muted hover:bg-accent rounded-lg text-left transition">
              <div className="font-medium text-foreground">Taskmaster</div>
              <div className="text-muted-foreground">john@taskska.com</div>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
