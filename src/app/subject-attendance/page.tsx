"use client"

import { ClipboardCheck, Users, ArrowRight, Clock, Calendar, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useTeacherStore } from "@/store/useStore"
import { useState, useEffect } from "react"

const GRADIENTS = [
  "from-blue-500 to-cyan-500",
  "from-blue-500 to-teal-500",
  "from-purple-500 to-pink-500",
  "from-orange-500 to-amber-500",
  "from-rose-500 to-red-500",
  "from-indigo-500 to-blue-500",
  "from-teal-500 to-blue-500",
  "from-fuchsia-500 to-purple-500",
]

function formatTime12(t: string) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hr = h % 12 || 12
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`
}

export default function SubjectAttendanceIndex() {
  const [mounted, setMounted] = useState(false)
  const workload = useTeacherStore(s => s.workload)
  const workloadStudents = useTeacherStore(s => s.workloadStudents)
  const globalStudents = useTeacherStore(s => s.students)
  const schoolInfo = useTeacherStore(s => s.schoolInfo)

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  // Summarize
  const totalSubjects = workload.length
  const readySubjects = workload.filter(w => {
    const isAdvisory = w.section?.toUpperCase() === schoolInfo.section?.toUpperCase()
    return (workloadStudents[w.slug]?.length > 0) || isAdvisory
  }).length

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: '#111A24' }}>Subject Attendance</h1>
          <p className="text-sm mt-1" style={{ color: '#8898AC' }}>Track attendance for your teaching workload subjects. Separate from Advisory (SF2).</p>
        </div>
        <Link
          href="/workload"
          className="skeu-btn-ghost inline-flex items-center h-9 px-4 rounded-lg text-sm gap-2 font-bold transition-all hover:-translate-y-0.5"
        >
          <Calendar size={14} /> Manage Workload
        </Link>
      </div>

      {/* Summary strip */}
      {workload.length > 0 && (
        <div
          className="rounded-xl px-5 py-3.5 flex flex-wrap items-center gap-x-8 gap-y-2"
          style={{
            background: 'linear-gradient(160deg, #FAFCFF 0%, #F4F7FC 100%)',
            border: '1px solid #DDE4EE',
            boxShadow: '0 1px 0 rgba(255,255,255,1) inset, 0 2px 6px rgba(0,0,0,0.05)'
          }}
        >
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(180deg, #E0F0FF, #C8E0FF)', border: '1px solid #A8C8F0' }}
            >
              <ClipboardCheck size={12} style={{ color: '#003876' }} />
            </div>
            <div>
              <p className="text-xs font-bold" style={{ color: '#111A24' }}>{totalSubjects} Subject{totalSubjects !== 1 ? 's' : ''}</p>
              <p className="text-[10px]" style={{ color: '#8898AC' }}>in your workload</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(180deg, #E8F7EE, #D0F0DD)', border: '1px solid #A8D8BA' }}
            >
              <Users size={12} style={{ color: '#1A6B38' }} />
            </div>
            <div>
              <p className="text-xs font-bold" style={{ color: '#111A24' }}>{readySubjects} / {totalSubjects} Ready</p>
              <p className="text-[10px]" style={{ color: '#8898AC' }}>have student rosters</p>
            </div>
          </div>
          {readySubjects < totalSubjects && (
            <p className="text-[10px] font-semibold text-amber-600 ml-auto">
              ⚠ {totalSubjects - readySubjects} subject{totalSubjects - readySubjects !== 1 ? 's' : ''} need roster setup
            </p>
          )}
        </div>
      )}

      {/* Subject Cards */}
      {workload.length === 0 ? (
        <div
          className="rounded-xl py-14 flex flex-col items-center justify-center text-center"
          style={{
            background: 'linear-gradient(160deg, #FFFFFF 0%, #FAFCFF 100%)',
            border: '1px solid #DDE4EE',
            boxShadow: '0 1px 0 rgba(255,255,255,1) inset, 0 4px 12px rgba(0,0,0,0.07)'
          }}
        >
          <ClipboardCheck size={40} style={{ color: '#C8D4E0' }} className="mb-4" />
          <p className="text-base font-black" style={{ color: '#5A6A7E' }}>No subjects in your workload yet</p>
          <p className="text-sm mt-1" style={{ color: '#8898AC' }}>
            Add subjects via{' '}
            <Link href="/workload" className="font-bold underline" style={{ color: '#003876' }}>My Workload</Link>
            {' '}to start tracking attendance.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workload.map((w, i) => {
            const isAdvisory = w.section?.toUpperCase() === schoolInfo.section?.toUpperCase()
            const rosterCount = isAdvisory ? globalStudents.length : (workloadStudents[w.slug]?.length || 0)
            const hasRoster = rosterCount > 0
            const scheduleText = w.scheduleDays?.length
              ? `${w.scheduleDays.join(' ')}${w.startTime ? ` • ${formatTime12(w.startTime)}` : ''}${w.endTime ? ` – ${formatTime12(w.endTime)}` : ''}`
              : w.schedule || ''

            return (
              <Link
                key={w.id}
                href={`/subject-attendance/${w.slug}`}
                className="group block"
              >
                <div
                  className="rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                  style={{
                    background: 'linear-gradient(160deg, #FFFFFF 0%, #FAFCFF 100%)',
                    border: '1px solid #DDE4EE',
                    boxShadow: '0 1px 0 rgba(255,255,255,1) inset, 0 4px 12px rgba(0,0,0,0.08)'
                  }}
                >
                  {/* Gradient top bar */}
                  <div className={`h-1.5 bg-gradient-to-r ${w.gradient || GRADIENTS[i % GRADIENTS.length]}`} />

                  <div className="p-5">
                    {/* Title row */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-lg font-black tracking-tight" style={{ color: '#111A24' }}>{w.subject}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{
                              background: isAdvisory ? '#E8F7EE' : '#EEF2F8',
                              color: isAdvisory ? '#1A6B38' : '#5A6A7E',
                              border: `1px solid ${isAdvisory ? '#A8D8BA' : '#D4DCE6'}`
                            }}
                          >
                            {w.section} {isAdvisory && '— Advisory'}
                          </span>
                        </div>
                      </div>
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center transition-all group-hover:bg-[#003876] group-hover:scale-105"
                        style={{
                          background: 'linear-gradient(180deg, #F4F7FC, #EEF2F8)',
                          border: '1px solid #D4DCE6'
                        }}
                      >
                        <ChevronRight size={14} className="text-slate-400 group-hover:text-white transition-colors" />
                      </div>
                    </div>

                    {/* Roster + Schedule row */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: '#8898AC' }}>
                        <Users size={11} />
                        {hasRoster ? (
                          <span><strong className="text-slate-700">{rosterCount}</strong> students in roster</span>
                        ) : (
                          <span className="text-amber-600 font-semibold">No roster — tap to set up</span>
                        )}
                      </div>

                      {scheduleText && (
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: '#8898AC' }}>
                          <Clock size={11} />
                          <span>{scheduleText}</span>
                        </div>
                      )}
                    </div>

                    {/* Status badges */}
                    <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid #EEF2F8' }}>
                      {hasRoster ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: '#E8F7EE', color: '#1A6B38', border: '1px solid #A8D8BA' }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: '#FFF8EC', color: '#C07800', border: '1px solid #E8D080' }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Needs Setup
                        </span>
                      )}
                      <span className="text-[10px] font-medium ml-auto" style={{ color: '#B8C4D4' }}>
                        Take Attendance →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
