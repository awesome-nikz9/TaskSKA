"use client"

import { useState } from "react"
import Link from "next/link"
import { useTaskStore } from "@/lib/store"
import { Mail, Lock, ArrowLeft, CheckCircle2, Eye, EyeOff } from "lucide-react"

export default function ResetPasswordPage() {
  const { resetPassword } = useTaskStore()
  const [step, setStep] = useState<"email" | "code" | "password" | "done">("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [newPwd, setNewPwd] = useState("")
  const [confirmPwd, setConfirmPwd] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    setStep("code")
  }

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) { setError("Enter the 6-digit code"); return }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 500))
    setLoading(false)
    setError("")
    setStep("password")
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPwd !== confirmPwd) { setError("Passwords do not match"); return }
    if (newPwd.length < 8) { setError("Password must be at least 8 characters"); return }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    const result = resetPassword(email, newPwd)
    setLoading(false)
    if (!result.success) { setError(result.message) } else { setStep("done") }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[--color-background] p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-black text-sm">T</span>
          </div>
          <span className="font-bold text-lg text-foreground">TaskSKA</span>
        </div>

        {step === "done" ? (
          <div className="bg-card border border-border rounded-2xl p-10 shadow-sm text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Password Reset!</h2>
            <p className="text-muted-foreground text-sm mb-6">Your password has been updated. Sign in with your new credentials.</p>
            <Link href="/login" className="inline-block w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl text-center hover:bg-primary/90 transition">
              Back to sign in
            </Link>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
            <Link href="/login" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition">
              <ArrowLeft className="w-4 h-4" /> Back to login
            </Link>

            {/* Steps indicator */}
            <div className="flex items-center gap-2 mb-6">
              {["email", "code", "password"].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${["email", "code", "password"].indexOf(step) >= i ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                    {i + 1}
                  </div>
                  {i < 2 && <div className={`flex-1 h-0.5 w-8 ${["email", "code", "password"].indexOf(step) > i ? "bg-primary" : "bg-border"}`} />}
                </div>
              ))}
            </div>

            {step === "email" && (
              <>
                <h2 className="text-2xl font-bold text-foreground mb-1">Reset password</h2>
                <p className="text-muted-foreground text-sm mb-6">Enter your email and we&apos;ll send a reset code.</p>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@taskska.com" required
                        className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                    </div>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition disabled:opacity-50">
                    {loading ? "Sending code..." : "Send reset code"}
                  </button>
                </form>
              </>
            )}

            {step === "code" && (
              <>
                <h2 className="text-2xl font-bold text-foreground mb-1">Enter code</h2>
                <p className="text-muted-foreground text-sm mb-6">A 6-digit code was sent to <strong>{email}</strong>. (Demo: use any 6 digits)</p>
                <form onSubmit={handleCodeSubmit} className="space-y-4">
                  <input type="text" maxLength={6} inputMode="numeric"
                    value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="w-full text-center text-3xl font-mono tracking-widest border border-border rounded-xl px-4 py-4 bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
                  {error && <p className="text-destructive text-sm">{error}</p>}
                  <button type="submit" disabled={loading}
                    className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition disabled:opacity-50">
                    {loading ? "Verifying..." : "Verify code"}
                  </button>
                </form>
              </>
            )}

            {step === "password" && (
              <>
                <h2 className="text-2xl font-bold text-foreground mb-1">New password</h2>
                <p className="text-muted-foreground text-sm mb-6">Choose a strong password for your account.</p>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">New password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input type={showPwd ? "text" : "password"} value={newPwd} onChange={(e) => setNewPwd(e.target.value)} required
                        className="w-full pl-10 pr-10 py-2.5 border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                      <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Confirm password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} required
                        className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                    </div>
                  </div>
                  {error && <p className="text-destructive text-sm">{error}</p>}
                  <button type="submit" disabled={loading}
                    className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition disabled:opacity-50">
                    {loading ? "Updating..." : "Update password"}
                  </button>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
