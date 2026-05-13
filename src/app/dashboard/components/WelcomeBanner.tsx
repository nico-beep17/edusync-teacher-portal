"use client"

import { EnrollStudentModal } from "@/components/enrollment/enroll-student-modal"
import { Cloud, CheckCircle2, Loader2, GraduationCap } from "lucide-react"

interface WelcomeBannerProps {
  schoolInfo: {
    gradeLevel: string
    section: string
    schoolYear: string
    quarter: string
  }
  handleSync: () => void
  syncing: boolean
  synced: boolean
}

export function WelcomeBanner({ schoolInfo, handleSync, syncing, synced }: WelcomeBannerProps) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #003876 0%, #0052A3 50%, #006FD6 100%)',
        boxShadow: '0 4px 20px rgba(0,56,118,0.3), 0 1px 0 rgba(255,255,255,0.05) inset'
      }}
    >
      <div className="px-6 py-5 flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <p className="text-blue-200 text-xs font-semibold tracking-wider uppercase mb-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {(() => {
              const h = new Date().getHours()
              return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening'
            })()}, Teacher! 👋
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/15 text-white border border-white/20">
              <GraduationCap size={10} className="inline mr-1" />
              Grade {schoolInfo.gradeLevel || '8'} — {schoolInfo.section || 'ARIES'}
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-blue-200">
              S.Y. {schoolInfo.schoolYear || '2025-2026'} • Q{schoolInfo.quarter || '1'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center h-9 px-4 rounded-lg text-sm gap-2 font-bold transition-all hover:-translate-y-0.5 disabled:opacity-50"
            style={{
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(4px)'
            }}
          >
            {syncing ? <Loader2 size={14} className="animate-spin" /> : synced ? <CheckCircle2 size={14} /> : <Cloud size={14} />}
            {syncing ? 'Syncing...' : synced ? 'Synced!' : 'Sync to Cloud'}
          </button>
          <EnrollStudentModal />
        </div>
      </div>
    </div>
  )
}
