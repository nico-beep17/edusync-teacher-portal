"use client"

import Link from "next/link"
import { Clock } from "lucide-react"
import type { WorkloadEntry } from "@/store/useStore"

interface ScheduleWidgetProps {
  workload: WorkloadEntry[]
}

export function ScheduleWidget({ workload }: ScheduleWidgetProps) {
  const DAY_MAP: Record<number, string> = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri' }
  const now = new Date()
  const todayDay = DAY_MAP[now.getDay()]
  const nowMin = now.getHours() * 60 + now.getMinutes()

  const todaySubjects = todayDay
    ? workload.filter(w => w.scheduleDays?.includes(todayDay) && w.startTime && w.endTime)
        .sort((a, b) => {
          const aMin = a.startTime!.split(':').map(Number)
          const bMin = b.startTime!.split(':').map(Number)
          return (aMin[0] * 60 + aMin[1]) - (bMin[0] * 60 + bMin[1])
        })
    : []

  const formatTime12 = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hr = h % 12 || 12
    return `${hr}:${String(m).padStart(2, '0')} ${ampm}`
  }
  const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #FFFFFF 0%, #FAFCFF 100%)',
        border: '1px solid #DDE4EE',
        boxShadow: '0 1px 0 rgba(255,255,255,1) inset, 0 4px 12px rgba(0,0,0,0.07)'
      }}
    >
      <div
        className="flex items-center gap-3 px-5 py-3.5"
        style={{
          background: 'linear-gradient(180deg, #FAFCFF 0%, #F4F7FC 100%)',
          borderBottom: '1px solid #DDE4EE'
        }}
      >
        <div className="h-8 w-8 rounded-lg flex items-center justify-center"
          style={{
            background: 'linear-gradient(180deg, #E0F0FF, #C8E0FF)',
            border: '1px solid #A8C8F0',
            boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset'
          }}
        >
          <Clock size={14} style={{ color: '#003876' }} />
        </div>
        <div>
          <p className="font-black text-sm" style={{ color: '#111A24' }}>Today's Schedule</p>
          <p className="skeu-label mt-0.5">
            {todayDay ? `${todayDay} • ${todaySubjects.length} subject${todaySubjects.length !== 1 ? 's' : ''} today` : 'Weekend — no classes'}
          </p>
        </div>
      </div>

      {todaySubjects.length === 0 ? (
        <div className="px-5 py-6 text-center">
          <p className="text-sm" style={{ color: '#8898AC' }}>
            {todayDay ? 'No subjects scheduled for today. Add schedules via My Workload.' : '🎉 Enjoy your weekend, Teacher!'}
          </p>
          {!todayDay && workload.some(w => w.scheduleDays?.includes('Mon') && w.startTime && w.endTime) && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid #EEF2F8' }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#B8C4D4' }}>Monday Preview</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {workload
                  .filter(w => w.scheduleDays?.includes('Mon') && w.startTime && w.endTime)
                  .sort((a, b) => {
                    const aM = a.startTime!.split(':').map(Number)
                    const bM = b.startTime!.split(':').map(Number)
                    return (aM[0] * 60 + aM[1]) - (bM[0] * 60 + bM[1])
                  })
                  .map(w => (
                    <span key={w.id} className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: '#EEF2F8', color: '#5A6A7E', border: '1px solid #D4DCE6' }}>
                      {w.subject} • {(() => { const [h,m]=w.startTime!.split(':').map(Number); return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}` })()}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {todaySubjects.map(w => {
            const start = toMin(w.startTime!)
            const end = toMin(w.endTime!)
            const isNow = nowMin >= start && nowMin < end
            const minsUntil = start - nowMin
            const isDone = nowMin >= end
            const isSoon = minsUntil > 0 && minsUntil <= 30

            let statusLabel = ''
            let statusColor = ''
            let statusBg = ''
            let borderColor = '#DDE4EE'
            let cardBg = 'linear-gradient(160deg, #FFFFFF 0%, #FAFCFF 100%)'

            if (isNow) {
              statusLabel = '🔴 Now Teaching'
              statusColor = '#C03030'
              statusBg = '#FFF0F0'
              borderColor = '#E8AAAA'
              cardBg = 'linear-gradient(160deg, #FFFAFA 0%, #FFF5F5 100%)'
            } else if (isSoon) {
              statusLabel = `⏱️ Starts in ${minsUntil} min`
              statusColor = '#D08010'
              statusBg = '#FFFBEC'
              borderColor = '#E8D080'
              cardBg = 'linear-gradient(160deg, #FFFDF5 0%, #FFF9EC 100%)'
            } else if (isDone) {
              statusLabel = '✅ Done'
              statusColor = '#5A8A6A'
              statusBg = '#F0FBF5'
              borderColor = '#A8D8BA'
            } else {
              statusLabel = 'Upcoming'
              statusColor = '#5A6A7E'
              statusBg = '#F4F7FC'
            }

            return (
              <Link
                key={w.id}
                href={`/subject-attendance/${w.slug}`}
                className="group block rounded-xl p-4 transition-all hover:-translate-y-0.5"
                style={{
                  background: cardBg,
                  border: `1px solid ${borderColor}`,
                  boxShadow: '0 1px 0 rgba(255,255,255,1) inset, 0 2px 6px rgba(0,0,0,0.06)'
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-black text-sm" style={{ color: '#111A24' }}>{w.subject}</p>
                    <p className="text-xs font-semibold" style={{ color: '#5A6A7E' }}>Section {w.section}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: statusBg, color: statusColor, border: `1px solid ${borderColor}` }}>
                    {statusLabel}
                  </span>
                </div>
                <p className="text-xs" style={{ color: '#8898AC' }}>
                  <Clock size={10} className="inline mr-1" />
                  {formatTime12(w.startTime!)} – {formatTime12(w.endTime!)}
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
