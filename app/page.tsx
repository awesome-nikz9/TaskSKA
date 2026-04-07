"use client";

import Link from "next/link";
import { CheckCircle, Users, Search, BarChart3, Bell, Shield, ArrowRight, Zap, Star } from "lucide-react";

const features = [
  {
    icon: CheckCircle,
    title: "Smart Task Management",
    desc: "Create, assign, and track tasks with deadlines, statuses, and system-generated IDs. Full lifecycle from Not Started to Completed.",
  },
  {
    icon: Users,
    title: "Team Connections",
    desc: "Connect with collaborators by email. Send, accept, or decline connection requests to build your trusted task network.",
  },
  {
    icon: Search,
    title: "Powerful Search",
    desc: "Search across all tasks in your network by ID, title, description, or deadline. Find anything instantly.",
  },
  {
    icon: BarChart3,
    title: "Workload Intelligence",
    desc: "See exactly how busy each teammate is with AI-powered workload estimates based on tasks, deadlines, and historical data.",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    desc: "Get notified when tasks are assigned, statuses change, or connection requests arrive. Customise to stay in control.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    desc: "Multi-factor authentication, secure sessions, and role-based admin controls to protect your team's data.",
  },
];

const stats = [
  { value: "50K+", label: "Active Taskmasters" },
  { value: "2M+", label: "Tasks Completed" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "4.9", label: "User Rating" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">TaskSKA</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#sprints" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Roadmap</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-sidebar pt-24 pb-32">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-blue-400/10 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 text-blue-200 text-sm font-medium mb-6">
            <Star className="w-3.5 h-3.5" />
            Built for Taskmasters who ship great work
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight text-balance mb-6">
            Manage Tasks.<br />
            <span className="text-blue-300">Master Work.</span>
          </h1>
          <p className="text-xl text-blue-100/80 max-w-2xl mx-auto leading-relaxed mb-10 text-pretty">
            TaskSKA helps you create, assign, and track tasks across your team. Connect with collaborators, monitor workloads, and ship work — faster.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="flex items-center gap-2 px-8 py-3.5 bg-white text-primary font-semibold rounded-xl hover:bg-blue-50 transition-colors text-base shadow-lg"
            >
              Start for Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 px-8 py-3.5 border border-white/20 text-white font-medium rounded-xl hover:bg-white/10 transition-colors text-base"
            >
              Sign In
            </Link>
          </div>
          <p className="mt-4 text-blue-200/60 text-sm">No credit card required. Free forever for individuals.</p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-4xl font-extrabold text-white">{s.value}</div>
              <div className="text-blue-100/80 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground text-balance mb-4">Everything a Taskmaster needs</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto text-pretty">
              Built from the ground up to manage real work — not just to-do lists.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Sprint Roadmap */}
      <section id="sprints" className="py-24 bg-muted/40">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Built Sprint by Sprint</h2>
            <p className="text-muted-foreground text-pretty">Every feature shipped with care, validated by real user stories.</p>
          </div>
          <div className="space-y-4">
            {[
              { sprint: "Sprint 1", color: "bg-green-500", tag: "Shipped", title: "Authentication & MFA", items: ["Register account (TMS-8)", "Login with credentials (TMS-10)", "Password reset (TMS-11)", "Multi-Factor Authentication (TMS-12)", "Secure logout (TMS-13)", "Taskmaster role assignment (TMS-14)", "Admin login & management (TMS-15)"] },
              { sprint: "Sprint 2", color: "bg-blue-500", tag: "Shipped", title: "Task Creation & Status", items: ["Create tasks with title, description, deadline (TMS-22)", "Assign tasks to self or connections (TMS-23)", "Auto-generate unique Task IDs (TMS-24)", "View tasks sorted by deadline (TMS-25)", "Update task status (TMS-26)"] },
              { sprint: "Sprint 3", color: "bg-purple-500", tag: "Shipped", title: "Connections & Search", items: ["Request connections by email (TMS-27)", "Accept or decline requests (TMS-28)", "View all connections (TMS-29)", "Search tasks by ID/title/description/deadline (TMS-30)", "View full task details (TMS-31)"] },
              { sprint: "Sprint 4", color: "bg-amber-500", tag: "Shipped", title: "Workload, Notifications & Automation", items: ["View workload % per connection (TMS-33)", "Historical-data workload engine (TMS-34)", "Task assignment notifications (TMS-35)", "Status update notifications (TMS-36)", "Connection request notifications (TMS-37)", "Notification preferences (TMS-38)", "Task templates (TMS-39)", "Auto-assign by workload (TMS-40)", "Overdue auto-flagging (TMS-41)", "Task dependencies (TMS-42)"] },
              { sprint: "Sprint 5", color: "bg-slate-500", tag: "Complete", title: "QA, Security & Deployment", items: ["System integration testing (TMS-44)", "User acceptance testing (TMS-46)", "Performance hardening (TMS-47)", "Security audit (TMS-48)", "System documentation (TMS-49)", "Production deployment (TMS-50)"] },
            ].map((s) => (
              <div key={s.sprint} className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                  <h3 className="font-bold text-foreground">{s.sprint} — {s.title}</h3>
                  <span className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">{s.tag}</span>
                </div>
                <ul className="grid sm:grid-cols-2 gap-1.5">
                  {s.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-background">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">Simple, transparent pricing</h2>
          <p className="text-muted-foreground mb-12">Start free. Scale when you&apos;re ready.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { plan: "Free", price: "$0", period: "forever", features: ["Up to 5 connections", "Unlimited tasks", "Basic search", "Email support"], cta: "Get Started", primary: false },
              { plan: "Pro", price: "$12", period: "per user/month", features: ["Unlimited connections", "Task templates", "Workload analytics", "MFA & admin panel", "Priority support"], cta: "Start Free Trial", primary: true },
              { plan: "Enterprise", price: "Custom", period: "contact us", features: ["Everything in Pro", "SSO & advanced security", "SLA guarantee", "Dedicated account manager"], cta: "Contact Sales", primary: false },
            ].map((p) => (
              <div
                key={p.plan}
                className={`rounded-2xl p-6 border ${p.primary ? "border-primary shadow-lg shadow-primary/10 bg-primary text-primary-foreground" : "border-border bg-card"}`}
              >
                <h3 className={`font-bold text-lg mb-1 ${p.primary ? "text-white" : ""}`}>{p.plan}</h3>
                <div className="flex items-end gap-1 mb-1">
                  <span className={`text-4xl font-extrabold ${p.primary ? "text-white" : ""}`}>{p.price}</span>
                </div>
                <p className={`text-sm mb-6 ${p.primary ? "text-blue-100" : "text-muted-foreground"}`}>{p.period}</p>
                <ul className="space-y-2 mb-6">
                  {p.features.map((f) => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${p.primary ? "text-blue-100" : "text-muted-foreground"}`}>
                      <CheckCircle className={`w-4 h-4 shrink-0 ${p.primary ? "text-white" : "text-primary"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block text-center py-2.5 rounded-lg font-semibold text-sm transition-colors
                    ${p.primary ? "bg-white text-primary hover:bg-blue-50" : "bg-primary text-primary-foreground hover:opacity-90"}`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-sidebar text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-white mb-4 text-balance">Ready to master your tasks?</h2>
          <p className="text-blue-100/80 mb-8 text-pretty">Join thousands of teams already using TaskSKA to ship work faster and smarter.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-primary font-semibold rounded-xl hover:bg-blue-50 transition-colors"
          >
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-sidebar border-t border-sidebar-border py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-white font-bold">TaskSKA</span>
          </div>
          <p className="text-sidebar-foreground/50 text-sm">
            &copy; 2026 TaskSKA. All rights reserved. Built for Taskmasters.
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-sidebar-foreground/50 hover:text-white text-sm transition-colors">Privacy</a>
            <a href="#" className="text-sidebar-foreground/50 hover:text-white text-sm transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
