"use client"

import { Bell, Search, Settings, LogOut, ChevronDown, Cloud, WifiOff } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useTeacherStore } from "@/store/useStore"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const pageTitles: Record<string, string> = {
  "/": "Advisory Dashboard",
  "/attendance": "SF2 Daily Attendance",
  "/composite": "Composite Grades",
  "/sf3": "SF3 Book Issuance",
  "/sf5": "SF5 Promotion & Retention",
  "/workload": "Teaching Workload",
  "/settings": "Settings",
}

export function Topbar() {
  const pathname = usePathname()
  const [isOnline, setIsOnline] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifs(false)
      }
    }
    if (showNotifs) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNotifs])

  const students = useTeacherStore(s => s.students)
  const gradesMap = useTeacherStore(s => s.grades)
  const attendanceMap = useTeacherStore(s => s.attendance)
  const user = useTeacherStore(s => s.user)

  const handleLogout = async () => {
    const supabase = createClient()
    if (supabase) {
      await supabase.auth.signOut()
    }
  }

  const searchResults = searchQuery.trim().length >= 2
    ? students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.lrn.includes(searchQuery)).slice(0, 5)
    : []

  const alerts: { icon: string; text: string; type: "warn" | "error" }[] = []
  students.forEach(s => {
    const absences = (attendanceMap[s.lrn] || []).filter((a: any) => a.status === 'A').length
    if (absences >= 2) alerts.push({ icon: '⚠️', text: `${s.name.split(',')[0]} — ${absences} absences`, type: "warn" })
  })
  students.forEach(s => {
    const failing = (gradesMap[s.lrn] || []).filter((g: any) => g.quarterGrade > 0 && g.quarterGrade < 75)
    if (failing.length > 0) alerts.push({ icon: '🔴', text: `${s.name.split(',')[0]} failing ${failing.map((f: any) => f.subject).join(', ')}`, type: "error" })
  })

  useEffect(() => {
    setMounted(true)
    setIsOnline(navigator.onLine)
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  if (["/login", "/register", "/paywall"].includes(pathname)) return null
  const pageTitle = pageTitles[pathname] || (pathname.startsWith("/ecr/") ? "E-Class Record" : "DepAid")

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between px-4 lg:px-6 skeu-topbar">

      {/* Left: Page Title */}
      <div className="flex items-center gap-3 pl-12 lg:pl-0">
        {/* Precision divider */}
        <div className="hidden lg:block h-5 w-px" style={{ background: "linear-gradient(180deg, transparent, #C8D4E0, transparent)" }} />
        <h2 className="text-sm font-black tracking-wide truncate" style={{ color: "#111A24" }}>
          {pageTitle}
        </h2>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-2.5">

        {/* Status indicator */}
        {mounted && (
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"
            style={isOnline ? {
              background: "linear-gradient(180deg, #E8F7EE 0%, #DDEEE5 100%)",
              border: "1px solid #A8D8BA",
              color: "#003876",
              boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 2px 4px rgba(0,0,0,0.06)"
            } : {
              background: "linear-gradient(180deg, #FFF8EC 0%, #FFEECC 100%)",
              border: "1px solid #D4B060",
              color: "#C07808",
              boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 2px 4px rgba(0,0,0,0.06)"
            }}
          >
            <div className={isOnline ? "skeu-led-green" : "skeu-led-amber"} style={{ width: 6, height: 6 }} />
            {isOnline ? "Cloud Sync" : "Offline"}
          </div>
        )}

        {/* Search */}
        <div className="relative hidden w-[200px] xl:block">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 z-10" style={{ color: "#8898AC" }} />
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setShowResults(true) }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            className="h-8 w-full rounded-md pl-8 pr-3 text-xs skeu-input"
          />
          {showResults && searchResults.length > 0 && (
            <div
              className="absolute top-full left-0 w-[276px] mt-1.5 overflow-hidden z-50 rounded-lg"
              style={{
                background: "linear-gradient(180deg, #FFFFFF 0%, #FAFCFF 100%)",
                border: "1px solid #D4DCE6",
                boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 8px 24px rgba(0,0,0,0.12)"
              }}
            >
              {searchResults.map(s => (
                <Link
                  key={s.lrn}
                  href="/"
                  onClick={() => { setSearchQuery(""); setShowResults(false) }}
                  className="flex items-center gap-3 px-3 py-2.5 border-b last:border-0 transition-colors"
                  style={{ borderColor: "#EEF2F8" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(227,10,36,0.04)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}
                >
                  <div
                    className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                    style={s.sex === 'M'
                      ? { background: "linear-gradient(135deg, #E0EEFF, #C8D8F8)", color: "#2060C0", border: "1px solid #B0C8F0" }
                      : { background: "linear-gradient(135deg, #FFE0EE, #F8C8E0)", color: "#C030A0", border: "1px solid #F0B0D8" }
                    }
                  >
                    {s.sex}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: "#111A24" }}>{s.name}</p>
                    <p className="text-[10px] font-mono" style={{ color: "#8898AC" }}>{s.lrn}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg transition-all active:scale-95"
            style={{
              background: showNotifs
                ? "linear-gradient(180deg, #EEF2F8 0%, #E4E9EF 100%)"
                : "linear-gradient(180deg, #FFFFFF 0%, #F4F7FC 100%)",
              border: "1px solid #C8D4E0",
              borderBottomWidth: showNotifs ? 1 : 2,
              borderBottomColor: showNotifs ? "#C8D4E0" : "#B0BECE",
              boxShadow: showNotifs
                ? "0 2px 4px rgba(0,0,0,0.1) inset"
                : "0 1px 0 rgba(255,255,255,1) inset, 0 3px 7px rgba(0,0,0,0.08)",
              color: "#5A6A7E"
            }}
          >
            <Bell size={14} />
            {alerts.length > 0 && (
              <span
                className="absolute -right-1 -top-1 h-4 w-4 rounded-full text-white text-[9px] font-black flex items-center justify-center"
                style={{
                  background: "linear-gradient(180deg, #D84040 0%, #C03030 100%)",
                  border: "1px solid #901010",
                  boxShadow: "0 1px 0 rgba(255,255,255,0.2) inset, 0 2px 5px rgba(192,48,48,0.4)"
                }}
              >
                {alerts.length > 9 ? '9+' : alerts.length}
              </span>
            )}
          </button>

          {showNotifs && (
            <div
              className="absolute top-full right-0 w-[310px] mt-2 overflow-hidden z-50 rounded-xl"
              style={{
                background: "linear-gradient(180deg, #FFFFFF 0%, #FAFCFF 100%)",
                border: "1px solid #D4DCE6",
                boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 12px 32px rgba(0,0,0,0.12)"
              }}
            >
              <div
                className="px-4 py-2.5 flex items-center justify-between"
                style={{
                  background: "linear-gradient(180deg, #F4F7FC 0%, #EEF2F8 100%)",
                  borderBottom: "1px solid #D4DCE6"
                }}
              >
                <span className="text-xs font-black" style={{ color: "#111A24" }}>Notifications</span>
                <span className="skeu-label">{alerts.length} alert{alerts.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="max-h-[280px] overflow-y-auto">
                {alerts.length === 0
                  ? <div className="px-4 py-8 text-center text-sm" style={{ color: "#8898AC" }}>No alerts — all clear! ✅</div>
                  : alerts.map((a, i) => (
                    <div
                      key={i}
                      className="px-4 py-2.5 transition-colors"
                      style={{ borderBottom: "1px solid #EEF2F8" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(227,10,36,0.04)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "")}
                    >
                      <p className="text-xs font-semibold" style={{ color: a.type === "error" ? "#C03030" : "#C07808" }}>
                        {a.icon} {a.text}
                      </p>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <Link
          href="/settings"
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-all active:scale-95"
          style={{
            background: "linear-gradient(180deg, #FFFFFF 0%, #F4F7FC 100%)",
            border: "1px solid #C8D4E0",
            borderBottom: "2px solid #B0BECE",
            boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 3px 7px rgba(0,0,0,0.08)",
            color: "#5A6A7E"
          }}
        >
          <Settings size={14} />
        </Link>

        <div className="hidden sm:block h-5 w-px" style={{ background: "linear-gradient(180deg, transparent, #C8D4E0, transparent)" }} />

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2 rounded-lg px-2 py-1 transition-all outline-none cursor-pointer"
            style={{
              background: "linear-gradient(180deg, #FFFFFF 0%, #F4F7FC 100%)",
              border: "1px solid #C8D4E0",
              borderBottom: "2px solid #B0BECE",
              boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 3px 7px rgba(0,0,0,0.08)"
            }}
          >
            <div
              className="h-6 w-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-black overflow-hidden"
              style={{
                background: "linear-gradient(145deg, #E30A24, #003876, #178848)",
                border: "2px solid #8A0615",
                boxShadow: "0 1px 0 rgba(255,255,255,0.25) inset, 0 2px 5px rgba(227,10,36,0.35)",
                color: "#FFFFFF"
              }}
            >
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-white">{user?.email?.charAt(0).toUpperCase() || 'T'}</span>
              )}
            </div>
            <div className="hidden sm:flex flex-col items-start text-left max-w-[120px]">
              <span className="text-[11px] font-bold leading-none truncate w-full" style={{ color: "#111A24" }}>
                 {user?.user_metadata?.full_name || user?.email || 'Teacher I'}
              </span>
              <span className="text-[9px] font-black uppercase tracking-wider mt-0.5" style={{ color: "#003876" }}>Teacher Portral</span>
            </div>
            <ChevronDown size={11} className="hidden sm:block ml-1" style={{ color: "#8898AC" }} />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-[175px] p-1"
            style={{
              background: "linear-gradient(180deg, #FFFFFF 0%, #FAFCFF 100%)",
              border: "1px solid #D4DCE6",
              boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 12px 32px rgba(0,0,0,0.12)"
            }}
          >
            <DropdownMenuItem className="text-xs cursor-pointer p-2 rounded-md" style={{ color: "#3A4A5E" }}>
              <Settings className="mr-2 h-3.5 w-3.5" />
              <span>Preferences</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator style={{ background: "#DDE4EE" }} />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer p-2 rounded-md text-xs w-full" style={{ color: "#C03030" }}>
              <LogOut className="mr-2 h-3.5 w-3.5" />
              <span>Log Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  )
}
