"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTaskStore } from "@/lib/store"
import Sidebar from "@/components/layout/Sidebar"
import Header from "@/components/layout/Header"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated } = useTaskStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[--color-background]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center animate-pulse">
            <span className="text-white font-black text-sm">T</span>
          </div>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[--color-background] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
