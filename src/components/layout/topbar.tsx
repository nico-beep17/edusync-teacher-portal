"use client"

import {
  Bell, Search, Settings, LogOut, ChevronDown, Cloud, WifiOff
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Map pathname to readable page title
const pageTitles: Record<string, string> = {
  "/": "Advisory Dashboard",
  "/attendance": "SF2 Daily Attendance",
  "/composite": "Composite Grades",
  "/sf5": "SF5 Promotion & Retention",
  "/workload": "Teaching Workload",
}

export function Topbar() {
  const pathname = usePathname()
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
       window.removeEventListener('online', handleOnline)
       window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Don't render topbar on login page
  if (pathname === "/login") return null

  // Resolve page title (handles dynamic routes like /ecr/[subject])
  const pageTitle = pageTitles[pathname] || (pathname.startsWith("/ecr/") ? "E-Class Record" : "DepAid")

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200/60 bg-white/80 px-4 lg:px-6 backdrop-blur-md">
      {/* Left: Page Title (with mobile offset for hamburger) */}
      <div className="flex items-center gap-3 pl-12 lg:pl-0">
        <h2 className="text-base font-bold text-slate-800 tracking-tight truncate">{pageTitle}</h2>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* PWA Sync Indicator */}
        <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors ${isOnline ? 'bg-emerald-50 text-[#1ca560] border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
           {isOnline ? (
              <><Cloud size={12} className="animate-pulse" /> Cloud Sync</>
           ) : (
              <><WifiOff size={12} /> Offline</>
           )}
        </div>

        {/* Search */}
        <div className="relative hidden w-[200px] xl:block">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search students..."
            className="h-8 w-full rounded-md border border-slate-200 bg-slate-50/50 pl-9 pr-4 text-sm outline-none focus:border-[#1ca560] focus:ring-1 focus:ring-[#1ca560] transition-colors"
          />
        </div>

        {/* Notifications */}
        <button className="relative flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
          <Bell size={16} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-red-500"></span>
        </button>

        {/* Settings */}
        <button className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
          <Settings size={16} />
        </button>

        <div className="border-l h-5 mx-0.5 border-slate-200 hidden sm:block"></div>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 hover:bg-slate-50 p-1 pr-2 rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#1ca560] cursor-pointer">
              <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-emerald-400 to-[#1ca560] shadow-inner border border-emerald-600/30 shrink-0"></div>
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-xs font-semibold text-slate-800 leading-none">C. Rubino</span>
                <span className="text-[9px] uppercase font-bold text-[#1ca560] tracking-wider mt-0.5">Teacher I</span>
              </div>
              <ChevronDown size={12} className="text-slate-400 hidden sm:block" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[180px] bg-white p-1 shadow-lg border border-slate-200/60">
            <DropdownMenuItem className="text-sm text-slate-600 cursor-pointer p-2 rounded-md">
              <Settings className="mr-2 h-3.5 w-3.5" />
              <span>Preferences</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <Link href="/login" className="w-full">
               <DropdownMenuItem className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer font-medium p-2 rounded-md">
                 <LogOut className="mr-2 h-3.5 w-3.5" />
                 <span>Log Out</span>
               </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
