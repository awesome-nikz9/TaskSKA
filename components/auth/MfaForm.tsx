"use client"
import { useState, useRef } from "react"
import { useTaskStore } from "@/lib/store"
import { Shield, ArrowLeft } from "lucide-react"

interface Props { userId: string; onBack: () => void }

export default function MfaForm({ userId, onBack }: Props) {
  const { verifyMfa, logout, users } = useTaskStore()
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const user = users.find((u) => u.id === userId)

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return
    const updated = [...code]
    updated[i] = val.slice(-1)
    setCode(updated)
    if (val && i < 5) refs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[i] && i > 0) refs.current[i - 1]?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const fullCode = code.join("")
    if (fullCode.length < 6) return setError("Please enter all 6 digits")
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    const result = verifyMfa(userId, fullCode)
    setLoading(false)
    if (!result.success) { setError(result.message); setCode(["", "", "", "", "", ""]); refs.current[0]?.focus() }
  }

  const handleBack = () => { logout(); onBack() }

  return (
    <div className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
      <div className="bg-primary px-8 py-8">
        <div className="flex items-center gap-3 mb-1">
          <Shield className="w-6 h-6 text-primary-foreground/80" />
          <h1 className="text-2xl font-bold text-primary-foreground">Two-Factor Auth</h1>
        </div>
        <p className="text-primary-foreground/70 text-sm">Enter the 6-digit code from your authenticator app</p>
      </div>

      <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Signing in as <span className="font-medium text-foreground">{user?.email}</span></p>
        </div>

        <div className="flex gap-2 justify-center">
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { refs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-11 h-12 text-center text-xl font-bold rounded-lg border-2 border-input bg-background text-foreground focus:outline-none focus:border-primary transition"
            />
          ))}
        </div>

        <div className="px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg text-sm text-muted-foreground">
          <strong className="text-foreground">Demo:</strong> Enter any 6-digit code (e.g., 123456) to verify
        </div>

        {error && <div className="px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">{error}</div>}

        <button type="submit" disabled={loading || code.join("").length < 6} className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold text-sm transition disabled:opacity-60 flex items-center justify-center gap-2">
          {loading ? <><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />Verifying...</> : "Verify Code"}
        </button>

        <button type="button" onClick={handleBack} className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </button>
      </form>
    </div>
  )
}
