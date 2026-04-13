"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { authStore } from "@/lib/store";
import { Zap, Eye, EyeOff, ShieldCheck, ArrowLeft } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login, refresh } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params.get("registered")) setSuccess("Account created! Please sign in.");
    if (params.get("reset")) setSuccess("Password reset successfully. Please sign in.");
  }, [params]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = login(email, password);
    setLoading(false);
    if (!result.ok) { setError(result.error || "Login failed."); return; }
    if (result.needsMfa && result.user) {
      setPendingUserId(result.user.id);
      return;
    }
    refresh();
    if (result.user?.role === "admin") router.push("/admin");
    else router.push("/dashboard");
  };

  const handleMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUserId) return;
    setError("");
    setLoading(true);
    const result = authStore.verifyMfa(pendingUserId, mfaCode);
    setLoading(false);
    if (!result.ok) { setError(result.error || "Invalid code."); return; }
    refresh();
    router.push("/dashboard");
  };

  if (pendingUserId) {
    return (
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Two-Factor Authentication</h1>
          <p className="text-muted-foreground text-sm mt-1">Enter the 6-digit code from your authenticator app. (Demo: use <strong>123456</strong>)</p>
        </div>
        {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
        <form onSubmit={handleMfa} className="space-y-4">
          <input
            type="text" required maxLength={6} placeholder="123456"
            className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm text-center tracking-widest text-lg font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
          />
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? "Verifying..." : "Verify Code"}
          </button>
          <button type="button" onClick={() => setPendingUserId(null)} className="w-full text-sm text-muted-foreground hover:text-foreground">
            Back to login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
        <p className="text-muted-foreground text-sm mt-1">
          New to TaskSKA?{" "}
          <Link href="/register" className="text-primary hover:underline font-medium">Create an account</Link>
        </p>
      </div>

      {success && <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm border border-green-200">{success}</div>}
      {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Email Address</label>
          <input
            type="email" required placeholder="jane@example.com"
            className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={email} onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-foreground">Password</label>
            <Link href="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
          </div>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"} required placeholder="Your password"
              className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring pr-10"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex w-[45%] bg-sidebar flex-col justify-between p-12">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold text-white">TaskSKA</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4 text-balance">Your tasks are waiting for you</h2>
          <p className="text-blue-200/70 leading-relaxed text-pretty">Sign in to access your dashboard, manage tasks, and stay connected with your team.</p>
        </div>
        <p className="text-sidebar-foreground/40 text-sm">&copy; 2026 TaskSKA</p>
      </div>
      <div className="flex-1 flex flex-col p-6">
        <div className="flex justify-end mb-4">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Suspense fallback={<div />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
