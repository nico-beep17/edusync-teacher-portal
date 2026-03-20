"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import {
  LayoutDashboard, ClipboardCheck, BarChart3,
  Award, BookOpen, Settings2, ChevronLeft, ChevronRight, Menu, X, Book, Trophy
} from "lucide-react"

const navItems = [
  { label: "ADVISORY", type: "header" as const },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, description: "Overview & masterlist" },
  { href: "/attendance", label: "Attendance (SF2)", icon: ClipboardCheck, description: "Daily attendance & QR" },
  { href: "/composite", label: "Composite Grades", icon: BarChart3, description: "Collect & aggregate" },
  { href: "/sf3", label: "Books Issued (SF3)", icon: Book, description: "Book inventory" },
  { href: "/sf5", label: "Promotion (SF5)", icon: Award, description: "Promotion & retention" },
  { href: "/honors", label: "Honor Roll", icon: Trophy, description: "Rankings & certificates" },
  { label: "SUBJECT TEACHING", type: "header" as const },
  { href: "/workload", label: "My Workload", icon: BookOpen, description: "ECR & grading sheets" },
  { label: "SYSTEM", type: "header" as const },
  { href: "/settings", label: "Settings", icon: Settings2, description: "Subjects, import & export" },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => { setMobileOpen(false) }, [pathname])

  if (["/login", "/register", "/paywall"].includes(pathname)) return null

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href)

  const sidebarContent = (
    <div className="flex flex-col h-full">

      {/* Logo Header */}
      <div
        className={`flex items-center h-16 px-4 shrink-0 ${collapsed ? "justify-center" : "gap-3"}`}
        style={{
          background: "linear-gradient(180deg, #FFFFFF 0%, #F5F8FC 100%)",
          borderBottom: "1px solid #DDE4EE",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
        }}
      >
        <div
          className="h-9 w-9 rounded-xl overflow-hidden shrink-0"
          style={{
            boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 3px 8px rgba(0,0,0,0.14), 0 1px 3px rgba(0,0,0,0.08)",
            border: "1px solid #D4DCE6"
          }}
        >
          <img src="/depaid-logo.svg" alt="DepAid" className="h-full w-full object-cover" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="text-base font-black tracking-tight leading-tight" style={{ color: "#111A24" }}>
              DepAid
            </span>
            <span className="skeu-label" style={{ marginTop: 2 }}>Teacher Portal</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
        {navItems.map((item, idx) => {
          if (item.type === "header") {
            if (collapsed) return (
              <div
                key={idx}
                className="my-3 mx-1"
                style={{
                  height: 1,
                  background: "linear-gradient(90deg, transparent, #D4DCE6, transparent)"
                }}
              />
            )
            return (
              <div key={idx} className="pt-5 pb-1.5 px-2 first:pt-1">
                <span className="skeu-label">{item.label}</span>
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
              className={`group flex items-center gap-3 rounded-lg text-sm transition-all duration-100 ${collapsed ? "justify-center p-2.5" : "px-3 py-2.5"}`}
              style={active ? {
                background: "linear-gradient(90deg, rgba(28,165,96,0.10) 0%, rgba(28,165,96,0.04) 100%)",
                borderLeft: "2.5px solid #003876",
                paddingLeft: collapsed ? undefined : "10px",
                boxShadow: "inset 0 1px 0 rgba(28,165,96,0.08), 0 1px 3px rgba(0,0,0,0.04)",
                borderRadius: "0 8px 8px 0",
              } : {
                borderLeft: "2.5px solid transparent",
                borderRadius: "0 8px 8px 0",
              }}
            >
              {/* LED dot for active */}
              {!collapsed && (
                <div
                  className={active ? "skeu-led-green shrink-0" : "skeu-led-off shrink-0"}
                  style={{ width: 7, height: 7 }}
                />
              )}
              <Icon
                size={18}
                className="shrink-0 transition-colors"
                style={{ color: active ? "#003876" : "#8898AC" }}
              />
              {!collapsed && (
                <div className="flex flex-col overflow-hidden flex-1">
                  <span
                    className="truncate leading-tight text-[13px]"
                    style={{
                      color: active ? "#003876" : "#3A4A5E",
                      fontWeight: active ? 700 : 500,
                    }}
                  >
                    {item.label}
                  </span>
                  {item.description && (
                    <span
                      className="text-[10px] truncate leading-tight mt-0.5"
                      style={{ color: active ? "#88C8A0" : "#B8C4D4" }}
                    >
                      {item.description}
                    </span>
                  )}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* School Info Footer */}
      {!collapsed && (
        <div
          className="shrink-0 p-3"
          style={{ borderTop: "1px solid #DDE4EE" }}
        >
          <div
            className="rounded-lg px-3 py-2.5"
            style={{
              background: "linear-gradient(160deg, #FAFCFF 0%, #F4F7FC 100%)",
              border: "1px solid #D4DCE6",
              boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 2px 5px rgba(0,0,0,0.06)"
            }}
          >
            <p className="text-xs font-bold" style={{ color: "#003876" }}>Grade 8 — ARIES</p>
            <p className="text-[10px] mt-0.5" style={{ color: "#8898AC" }}>S.Y. 2025-2026 • Quarter 1</p>
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <div
        className="hidden lg:flex shrink-0 p-2"
        style={{ borderTop: "1px solid #DDE4EE" }}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-colors"
          style={{ color: "#8898AC" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#003876")}
          onMouseLeave={e => (e.currentTarget.style.color = "#8898AC")}
        >
          {collapsed ? <ChevronRight size={14} /> : <><ChevronLeft size={14} /> Collapse</>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3.5 left-3.5 z-50 lg:hidden flex items-center justify-center h-9 w-9 rounded-lg transition-all active:scale-95"
        style={{
          background: "linear-gradient(180deg, #FFFFFF 0%, #F4F7FC 100%)",
          border: "1px solid #C8D4E0",
          boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 3px 8px rgba(0,0,0,0.1)",
          color: "#5A6A7E"
        }}
        aria-label="Open menu"
      >
        <Menu size={17} />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute top-0 left-0 h-full w-72 animate-in slide-in-from-left duration-200 skeu-sidebar">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-3 flex items-center justify-center h-7 w-7 rounded"
              style={{ color: "#8898AC" }}
            >
              <X size={15} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 h-screen sticky top-0 skeu-sidebar transition-[width] duration-200 ease-in-out overflow-hidden ${collapsed ? "w-[60px]" : "w-[256px]"}`}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
