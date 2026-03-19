"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import {
  LayoutDashboard,
  ClipboardCheck,
  BarChart3,
  Award,
  BookOpen,
  UserPlus,
  QrCode,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Menu,
  X
} from "lucide-react"

const navItems = [
  // ─── ADVISORY DUTIES (what a class adviser does daily) ───
  { label: "ADVISORY", type: "header" as const },
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Overview & Masterlist"
  },
  {
    href: "/attendance",
    label: "SF2 Attendance",
    icon: ClipboardCheck,
    description: "Daily attendance & QR"
  },
  {
    href: "/composite",
    label: "Composite Grades",
    icon: BarChart3,
    description: "Collect & aggregate"
  },
  {
    href: "/sf5",
    label: "SF5 Promotion",
    icon: Award,
    description: "Promotion & retention"
  },

  // ─── SUBJECT TEACHER DUTIES ───
  { label: "SUBJECT TEACHING", type: "header" as const },
  {
    href: "/workload",
    label: "My Workload",
    icon: BookOpen,
    description: "ECR & grading sheets"
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Don't render sidebar on login page
  if (pathname === "/login") return null

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo Header */}
      <div className={`flex items-center h-16 px-4 border-b border-slate-200/60 shrink-0 ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-[#1ca560] text-white shadow-md shadow-emerald-500/20">
          <GraduationCap size={20} />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="text-lg font-bold tracking-tight text-slate-900 leading-tight">EduSync</span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Teacher Portal</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item, idx) => {
          if (item.type === "header") {
            if (collapsed) return <div key={idx} className="my-3 border-t border-slate-200/60" />
            return (
              <div key={idx} className="pt-5 pb-2 px-3 first:pt-0">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  {item.label}
                </span>
              </div>
            )
          }

          const Icon = item.icon!
          const active = isActive(item.href!)

          return (
            <Link
              key={item.href}
              href={item.href!}
              title={collapsed ? item.label : undefined}
              className={`
                group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150
                ${active
                  ? 'bg-emerald-50 text-[#1ca560] shadow-sm border border-emerald-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                }
                ${collapsed ? 'justify-center px-2' : ''}
              `}
            >
              <Icon
                size={20}
                className={`shrink-0 transition-colors ${active ? 'text-[#1ca560]' : 'text-slate-400 group-hover:text-slate-600'}`}
              />
              {!collapsed && (
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate leading-tight">{item.label}</span>
                  {item.description && (
                    <span className={`text-[10px] truncate leading-tight mt-0.5 ${active ? 'text-emerald-600/70' : 'text-slate-400'}`}>
                      {item.description}
                    </span>
                  )}
                </div>
              )}
              {!collapsed && active && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#1ca560] shrink-0" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer / School Info */}
      {!collapsed && (
        <div className="shrink-0 border-t border-slate-200/60 p-4">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-bold text-slate-700 leading-tight">Grade 8 — ARIES</p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">S.Y. 2025-2026 • Quarter 1</p>
          </div>
        </div>
      )}

      {/* Collapse Toggle (desktop only) */}
      <div className="hidden lg:flex shrink-0 border-t border-slate-200/60 p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /> Collapse</>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden flex items-center justify-center h-10 w-10 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-600 hover:text-slate-900 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute top-0 left-0 h-full w-72 bg-white shadow-2xl animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 flex items-center justify-center h-8 w-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X size={18} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden lg:flex flex-col shrink-0 h-screen sticky top-0 bg-white border-r border-slate-200/60
          transition-[width] duration-200 ease-in-out overflow-hidden
          ${collapsed ? 'w-[68px]' : 'w-[260px]'}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
