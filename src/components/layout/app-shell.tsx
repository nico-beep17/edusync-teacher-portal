"use client"

import { usePathname, useRouter } from "next/navigation"
import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"
import { AIAssistant } from "@/components/ai/ai-assistant"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useTeacherStore } from "@/store/useStore"
import { Loader2 } from "lucide-react"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const setUser = useTeacherStore((s) => s.setUser)
  const isFullScreenPage = pathname === "/" || pathname === "/login" || pathname === "/register" || pathname === "/paywall"

  const [checking, setChecking] = useState(!isFullScreenPage)

  useEffect(() => {
    if (isFullScreenPage) {
       setChecking(false)
       return
    }

    const checkAuth = async () => {
       const supabase = createClient()
       if (!supabase) { setChecking(false); return }
       
       const { data: { session } } = await supabase.auth.getSession()
       
       if (!session) {
           const devUser = useTeacherStore.getState().user
           if (devUser?.isDev) { setChecking(false); return }
           router.push('/login')
       } else {
           setUser(session.user)
           setChecking(false)
       }
       
       supabase.auth.onAuthStateChange((event: string, session: any) => {
           if (session) setUser(session.user)
           if (event === 'SIGNED_OUT') router.push('/login')
       })
    }
    checkAuth()
  }, [pathname, isFullScreenPage, router, setUser])

  if (checking) {
    return (
      <div className="h-screen w-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #EFF2F6 0%, #F4F7FA 50%, #EAF0F8 100%)" }}>
        <Loader2 className="w-8 h-8 text-[#003876] animate-spin" />
      </div>
    )
  }

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
