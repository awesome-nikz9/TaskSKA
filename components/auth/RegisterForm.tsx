"use client"
import { useState } from "react"
import { useTaskStore } from "@/lib/store"
import { Eye, EyeOff, Lock, Mail, User, CheckCircle2 } from "lucide-react"

interface Props { onLogin: () => void }

export default function RegisterForm({ onLogin }: Props) {
  const register = useTaskStore((s) => s.register)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const passwordStrength = () => {
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return score
  }

  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"]
  const strengthColors = ["", "bg-red-500", "bg-yellow-500", "bg-blue-400", "bg-green-500"]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (password !== confirm) return setError("Passwords do not match")
    if (password.length < 8) return setError("Password must be at least 8 characters")
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    const result = register(name, email, password)
    setLoading(false)
    if (result.success) setSuccess(true)
    else setError(result.message)
  }

  if (success) {
    return (
      <div className="bg-card rounded-2xl shadow-2xl border border-border p-8 text-center space-y-4">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Account Created!</h2>
        <p className="text-muted-foreground text-sm">Your TaskSKA account has been successfully registered. You can now sign in.</p>
        <button onClick={onLogin} className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition">
          Go to Login
        </button>
      </div>
    )
  }

  const strength = passwordStrength()

  return (
    <div className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
      <div className="bg-primary px-8 py-8">
        <h1 className="text-2xl font-bold text-primary-foreground">Create account</h1>
        <p className="text-primary-foreground/70 text-sm mt-1">Join TaskSKA and manage your tasks efficiently</p>
      </div>

      <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@taskska.com" required className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition" />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {password && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (<div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColors[strength] : "bg-muted"}`} />))}
              </div>
              <p className="text-xs text-muted-foreground">Strength: <span className="font-medium text-foreground">{strengthLabels[strength]}</span></p>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition" />
          </div>
        </div>

        {error && <div className="px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">{error}</div>}

        <button type="submit" disabled={loading} className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold text-sm transition disabled:opacity-60 flex items-center justify-center gap-2">
          {loading ? <><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />Creating account...</> : "Create Account"}
        </button>

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <button type="button" onClick={onLogin} className="text-primary font-semibold hover:underline">Sign in</button>
        </div>
      </form>
    </div>
  )
}
