"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authStore } from "@/lib/store";
import { Zap, Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const requirements = [
    { label: "At least 8 characters", met: form.password.length >= 8 },
    { label: "Contains a number", met: /\d/.test(form.password) },
    { label: "Passwords match", met: form.password === form.confirm && form.confirm.length > 0 },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!requirements.every((r) => r.met)) {
      setError("Please meet all password requirements.");
      return;
    }
    setLoading(true);
    const result = authStore.register(form.name, form.email, form.password);
    setLoading(false);
    if (!result.ok) { setError(result.error || "Registration failed."); return; }
    router.push("/login?registered=1");
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex w-[45%] bg-sidebar flex-col justify-between p-12">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold text-white">TaskSKA</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4 text-balance">
            Join thousands of Taskmasters
          </h2>
          <p className="text-blue-200/70 leading-relaxed text-pretty">
            Create your free account and start managing tasks, building connections, and shipping work that matters.
          </p>
        </div>
        <div className="space-y-3">
          {["Free forever for individuals", "No credit card required", "Set up in under 2 minutes"].map((t) => (
            <div key={t} className="flex items-center gap-3 text-blue-200/80 text-sm">
              <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col p-6">
        <div className="flex justify-end mb-4">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Already have one?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
              <input
                type="text" required placeholder="Jane Smith"
                className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email Address</label>
              <input
                type="email" required placeholder="jane@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"} required placeholder="Create a strong password"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring pr-10"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2 space-y-1">
                  {requirements.map((r) => (
                    <div key={r.label} className={`flex items-center gap-1.5 text-xs ${r.met ? "text-green-600" : "text-muted-foreground"}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${r.met ? "bg-green-500" : "bg-muted-foreground"}`} />
                      {r.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Confirm Password</label>
              <input
                type="password" required placeholder="Repeat your password"
                className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-xs text-muted-foreground text-center">
            By creating an account you agree to our{" "}
            <a href="#" className="underline">Terms</a> and{" "}
            <a href="#" className="underline">Privacy Policy</a>.
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}
