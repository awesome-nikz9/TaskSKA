"use client"
import { useState } from "react"
import { useTaskStore } from "@/lib/store"
import { Mail, Lock, ArrowLeft, CheckCircle2 } from "lucide-react"

interface Props { onBack: () => void }

export default function ResetPasswordForm({ onBack }: Props) {
  const resetPassword = useTaskStore((s) => s.resetPassword)
  const [step, setStep] = useState<"email" | "reset" | "done">("email")
  const [email, setEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    setStep("reset")
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (newPassword !== confirm) return setError("Passwords do not match")
    if (newPassword.length < 8) return setError("Password must be at least 8 characters")
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    const result = resetPassword(email, newPassword)
    setLoading(false)
    if (result.success) setStep("done")
    else setError(result.message)
  }

  if (step === "done") {
    return (
      <div className="bg-card rounded-2xl shadow-2xl border border-border p-8 text-center space-y-4">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Password Reset!</h2>
        <p className="text-muted-foreground text-sm">Your password has been updated successfully.</p>
        <button onClick={onBack} className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition">
          Back to Login
        </button>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
      <div className="bg-primary px-8 py-8">
        <h1 className="text-2xl font-bold text-primary-foreground">Reset Password</h1>
        <p className="text-primary-foreground/70 text-sm mt-1">
          {step === "email" ? "Enter your email to receive reset instructions" : "Create your new password"}
        </p>
      </div>

      <div className="px-8 py-8">
        {step === "email" ? (
          <form onSubmit={handleEmailSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@taskska.com" required className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold text-sm transition disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />Sending...</> : "Send Reset Link"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-5">
            <div className="px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg text-sm text-muted-foreground">
              Reset link sent to <span className="font-medium text-foreground">{email}</span>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" required className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition" />
              </div>
            </div>
            {error && <div className="px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">{error}</div>}
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold text-sm transition disabled:opacity-60">
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <button onClick={onBack} className="w-full mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="w-4 h-4" />Back to Login
        </button>
      </div>
    </div>
  )
}
