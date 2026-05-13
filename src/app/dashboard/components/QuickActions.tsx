"use client"

import Link from "next/link"
import { ClipboardCheck, BookOpen, Calculator, FileText, Award } from "lucide-react"

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {[
        { label: 'SF2 Attendance', icon: ClipboardCheck, href: '/attendance', color: '#003876' },
        { label: 'My Workload', icon: BookOpen, href: '/workload', color: '#0052A3' },
        { label: 'Composite Grades', icon: Calculator, href: '/composite', color: '#D08010' },
        { label: 'Books (SF3)', icon: FileText, href: '/sf3', color: '#2060C0' },
        { label: 'Honor Roll', icon: Award, href: '/honors', color: '#7040C0' },
      ].map(({ label, icon: Icon, href, color }) => (
        <Link
          key={href}
          href={href}
          className="group flex items-center gap-3 rounded-xl px-4 py-3 transition-all hover:-translate-y-0.5"
          style={{
            background: 'linear-gradient(160deg, #FFFFFF 0%, #FAFCFF 100%)',
            border: '1px solid #DDE4EE',
            boxShadow: '0 1px 0 rgba(255,255,255,1) inset, 0 2px 6px rgba(0,0,0,0.05)'
          }}
        >
          <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-all group-hover:scale-105"
            style={{
              background: `linear-gradient(180deg, color-mix(in srgb, ${color} 12%, white), color-mix(in srgb, ${color} 8%, white))`,
              border: `1px solid color-mix(in srgb, ${color} 25%, white)`,
              boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset'
            }}
          >
            <Icon size={15} style={{ color }} />
          </div>
          <span className="text-xs font-bold" style={{ color: '#111A24' }}>{label}</span>
        </Link>
      ))}
    </div>
  )
}
