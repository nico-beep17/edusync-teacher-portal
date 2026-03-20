"use client"

import { usePathname } from "next/navigation"
import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"
import { AIAssistant } from "@/components/ai/ai-assistant"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isFullScreenPage = pathname === "/login" || pathname === "/register" || pathname === "/paywall"

  if (isFullScreenPage) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
          <div className="mx-auto max-w-[1400px]">
            {children}
          </div>
        </main>
      </div>
      <AIAssistant />
    </div>
  )
}
