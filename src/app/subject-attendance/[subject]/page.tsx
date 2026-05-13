"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Save, CalendarIcon, CheckCircle2, Lock, Eye, EyeOff, FileDown, X, ShieldAlert, ChevronLeft, ChevronRight, UserPlus, Trash2, ArrowLeft, Clock, Users, Undo2 } from "lucide-react"
import { useTeacherStore } from "@/store/useStore"
import { useEffect, useRef, useState, use, useMemo } from "react"
import { QRScannerModal } from "@/components/attendance/qr-scanner-modal"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Student } from "@/store/useStore"
import { toast } from "sonner"

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ─── PIN Dialog ─────────────────────────────────────────────────────────────
function PinDialog({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const correctPin = useTeacherStore(s => s.teacherPin)
  const [digits, setDigits] = useState(['', '', '', ''])
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  const [show, setShow] = useState(false)
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  useEffect(() => { refs[0].current?.focus() }, [])

  const handleDigit = (idx: number, val: string) => {
    const d = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[idx] = d
    setDigits(next)
    setError(false)

    if (d && idx < 3) {
      refs[idx + 1].current?.focus()
    }
    // Auto-submit when all 4 entered
    if (idx === 3 && d) {
      const pin = [...next.slice(0, 3), d].join('')
      if (pin === correctPin) {
        onSuccess()
      } else {
        setError(true)
        setShake(true)
        setTimeout(() => { setShake(false); setDigits(['', '', '', '']); refs[0].current?.focus() }, 600)
      }
    }
  }

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      refs[idx - 1].current?.focus()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-xs mx-4 rounded-2xl overflow-hidden ${shake ? 'animate-bounce' : ''}`}
        style={{
          background: "linear-gradient(160deg, #FFFFFF 0%, #FAFCFF 100%)",
          border: "1px solid #DDE4EE",
          boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 20px 60px rgba(0,0,0,0.18)"
        }}
      >
        {/* Top LED strip */}
        <div className="h-1" style={{ background: "linear-gradient(90deg, #D08010, #E8A020, #D08010)", boxShadow: "0 2px 6px rgba(208,128,16,0.4)" }} />

        <div className="px-6 py-6">
          <button onClick={onCancel} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>

          <div className="flex flex-col items-center text-center mb-6">
            <div
              className="h-12 w-12 rounded-xl flex items-center justify-center mb-3"
              style={{
                background: "linear-gradient(180deg, #FFF8E8 0%, #FFECC0 100%)",
                border: "1px solid #E8C878",
                boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 3px 8px rgba(208,128,16,0.2)"
              }}
            >
              <ShieldAlert size={22} style={{ color: "#D08010" }} />
            </div>
            <h3 className="text-base font-black" style={{ color: "#111A24" }}>Teacher PIN Required</h3>
            <p className="text-xs mt-1" style={{ color: "#8898AC" }}>
              Past-date attendance is locked.<br />Enter your 4-digit PIN to edit.
            </p>
          </div>

          {/* PIN Inputs */}
          <div className="flex gap-3 justify-center mb-4">
            {digits.map((d, i) => (
              <div key={i} className="relative">
                <input
                  ref={refs[i]}
                  type={show ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleDigit(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className="w-12 h-14 text-center text-2xl font-black rounded-xl skeu-input"
                  style={{ border: error ? "1px solid #C03030" : undefined }}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mb-4">
            {error && (
              <p className="text-xs font-bold" style={{ color: "#C03030" }}>⚠️ Incorrect PIN. Try again.</p>
            )}
            {!error && <div />}
            <button
              onClick={() => setShow(s => !s)}
              className="flex items-center gap-1 text-xs"
              style={{ color: "#8898AC" }}
            >
              {show ? <EyeOff size={12} /> : <Eye size={12} />}
              {show ? "Hide" : "Show"}
            </button>
          </div>

          <button
            onClick={onCancel}
            className="skeu-btn-ghost w-full h-10 rounded-xl text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function SubjectAttendancePage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = use(params)
  const [mounted, setMounted] = useState(false)

  // Look up this workload entry for metadata (subject name, section)
  const workload = useTeacherStore(s => s.workload)
  const workloadEntry = workload.find(w => w.slug === subject)
  const displayName = workloadEntry
    ? `${workloadEntry.subject} — Section ${workloadEntry.section}`
    : subject.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  // Use the per-workload student roster if one exists
  // Only fall back to ARIES masterlist if this IS the adviser's own section
  const globalStudents = useTeacherStore(s => s.students)
  const workloadStudents = useTeacherStore(s => s.workloadStudents)
  const schoolInfo = useTeacherStore(s => s.schoolInfo)
  const isAdviserSection = workloadEntry?.section?.toUpperCase() === schoolInfo.section?.toUpperCase()

  const hasCustomRoster = (workloadStudents[subject]?.length ?? 0) > 0

  // IMPORTANT: useMemo prevents new array reference on every render (avoids infinite useEffect loop)
  const activeStudents = useMemo(() => {
    if (hasCustomRoster) return workloadStudents[subject]
    if (isAdviserSection) return globalStudents
    return [] // Non-advisory section with no roster → show empty
  }, [workloadStudents, subject, globalStudents, hasCustomRoster, isAdviserSection])

  // Use a stable empty object to avoid creating a new reference each render
  const subjectAttendance = useTeacherStore(s => s.subjectAttendance)
  const globalAttendance = useMemo(() =>
    (subjectAttendance || {})[subject] || {}
  , [subjectAttendance, subject])

  const globalSchoolInfo = useTeacherStore(s => s.schoolInfo)
  const updateAttendance = useTeacherStore(s => s.updateSubjectAttendance)

  const [localAtt, setLocalAtt] = useState<Record<string, Record<string, string>>>({})
  const [saved, setSaved] = useState(false)
  const [rosterOpen, setRosterOpen] = useState(false)
  const [undoStack, setUndoStack] = useState<Array<{ lrn: string; dateId: string; prev: string; next: string }>>([])

  // PIN unlock state
  const [pinOpen, setPinOpen] = useState(false)
  const [pendingEdit, setPendingEdit] = useState<{ lrn: string; dateId: string } | null>(null)
  const [unlockedDates, setUnlockedDates] = useState<Set<string>>(new Set())
  const [weekOffset, setWeekOffset] = useState(0)

  // Use a stable string key so the effect only re-runs when the student count/IDs actually change
  const studentKey = activeStudents.map(s => s.lrn).join(',')

  useEffect(() => {
    const initialAtt: Record<string, Record<string, string>> = {}
    activeStudents.forEach(s => {
      initialAtt[s.lrn] = {}
      const records = globalAttendance[s.lrn] || []
      records.forEach(r => { initialAtt[s.lrn][r.date] = r.status })
    })
    setLocalAtt(initialAtt)
    setMounted(true)
  }, [studentKey]) // stable string key — no infinite loop

  if (!mounted) return null

  // Generate last 5 weekdays offset by weekOffset
  const todayObj = new Date()
  const todayId = todayObj.toISOString().split('T')[0]

  const anchorDate = new Date()
  anchorDate.setDate(anchorDate.getDate() + (weekOffset * 7))

  const weekDates: { label: string; dayName: string; dateId: string; isToday: boolean }[] = []
  let d = new Date(anchorDate)
  while (weekDates.length < 5) {
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) {
      weekDates.unshift({
        label: String(d.getDate()).padStart(2, '0'),
        dayName: DAY_NAMES[dow],
        dateId: d.toISOString().split('T')[0],
        isToday: d.toDateString() === todayObj.toDateString()
      })
    }
    d.setDate(d.getDate() - 1)
  }

  const isDateLocked = (dateId: string) =>
    dateId !== todayId && !unlockedDates.has(dateId)

  const totalCols = 2 + weekDates.length + 1

  const doEdit = (lrn: string, dateId: string) => {
    const current = localAtt[lrn]?.[dateId] || ''
    let next: string
    if (current === '') next = 'P'
    else if (current === 'P') next = 'A'
    else if (current === 'A') next = 'L'
    else next = 'P'
    setUndoStack(prev => [...prev, { lrn, dateId, prev: current, next }])
    setLocalAtt(prev => ({ ...prev, [lrn]: { ...prev[lrn], [dateId]: next } }))
  }

  const handleUndo = () => {
    setUndoStack(prev => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      setLocalAtt(att => ({ ...att, [last.lrn]: { ...att[last.lrn], [last.dateId]: last.prev } }))
      return prev.slice(0, -1)
    })
  }

  const handleCellClick = (lrn: string, dateId: string) => {
    if (isDateLocked(dateId)) {
      setPendingEdit({ lrn, dateId })
      setPinOpen(true)
    } else {
      doEdit(lrn, dateId)
    }
  }

  const handlePinSuccess = () => {
    if (pendingEdit) {
      // Unlock the whole date column for this session
      setUnlockedDates(prev => new Set([...prev, pendingEdit.dateId]))
      doEdit(pendingEdit.lrn, pendingEdit.dateId)
      setPendingEdit(null)
    }
    setPinOpen(false)
  }

  const getStatusStyle = (status: string, locked: boolean) => {
    if (locked) return { bg: '#F4F7FC', color: '#B8C4D4', border: '#DDE4EE', cursor: 'pointer' }
    switch (status) {
      case 'P': return { bg: '#E8F7EE', color: '#003876', border: '#A8D8BA', cursor: 'pointer' }
      case 'A': return { bg: '#FFF0F0', color: '#C03030', border: '#E8AAAA', cursor: 'pointer' }
      case 'L': return { bg: '#FFFBEC', color: '#D08010', border: '#E8D080', cursor: 'pointer' }
      default: return { bg: '#F8FAFB', color: '#C8D4E0', border: '#DDE4EE', cursor: 'pointer' }
    }
  }

  const renderStudentRow = (student: any, idx: number) => (
    <TableRow key={student.lrn} className="hover:bg-slate-50/50 transition-colors">
      <TableCell className="text-slate-500 text-xs">{idx + 1}</TableCell>
      <TableCell className="font-medium border-r text-sm whitespace-nowrap">{student.name}</TableCell>
      {weekDates.map((day) => {
        const status = localAtt[student.lrn]?.[day.dateId] || ''
        const locked = isDateLocked(day.dateId)
        const st = getStatusStyle(status, locked)
        return (
          <TableCell key={day.dateId} className="p-1">
            <button
              onClick={() => handleCellClick(student.lrn, day.dateId)}
              title={locked ? `Past date — PIN required to edit` : undefined}
              className="relative flex items-center justify-center mx-auto h-8 w-10 rounded-md text-xs font-bold border transition-all active:scale-90 select-none"
              style={{
                background: st.bg,
                color: st.color,
                borderColor: st.border,
                cursor: st.cursor,
                boxShadow: locked
                  ? "0 1px 2px rgba(0,0,0,0.04) inset"
                  : "0 1px 0 rgba(255,255,255,0.8) inset, 0 2px 4px rgba(0,0,0,0.06)"
              }}
            >
              {locked && !status
                ? <Lock size={10} style={{ color: '#C8D4E0' }} />
                : locked && status
                  ? <span>{status}<Lock size={8} style={{ position: 'absolute', bottom: 1, right: 2, color: '#C8D4E0' }} /></span>
                  : (status || '—')
              }
            </button>
          </TableCell>
        )
      })}
      <TableCell className="font-bold text-red-600 bg-red-50/30 border-l text-center">
        {Object.values(localAtt[student.lrn] || {}).filter(s => s === 'A').length || <span className="text-slate-300">0</span>}
      </TableCell>
    </TableRow>
  )

  const males = activeStudents.filter(s => s.sex === 'M')
  const females = activeStudents.filter(s => s.sex === 'F')

  const presentToday = activeStudents.filter(s => localAtt[s.lrn]?.[todayId] === 'P').length
  const absentToday = activeStudents.filter(s => localAtt[s.lrn]?.[todayId] === 'A').length
  const lateToday = activeStudents.filter(s => localAtt[s.lrn]?.[todayId] === 'L').length

  const handleMarkAllPresent = () => {
    const newAtt = { ...localAtt }
    activeStudents.forEach(s => {
      newAtt[s.lrn] = { ...(newAtt[s.lrn] || {}), [todayId]: 'P' }
    })
    setLocalAtt(newAtt)
  }

  const handleSave = () => {
    activeStudents.forEach(s => {
      weekDates.forEach(d => {
        const stat = localAtt[s.lrn]?.[d.dateId]
        if (stat) updateAttendance(subject, s.lrn, { date: d.dateId, status: stat as 'P' | 'A' | 'L' })
      })
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }



  return (
    <div className="flex flex-col gap-6">
      {/* PIN Dialog */}
      {pinOpen && (
        <PinDialog
          onSuccess={handlePinSuccess}
          onCancel={() => { setPinOpen(false); setPendingEdit(null) }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between sm:items-center gap-4">
        <div>
          <Link href="/subject-attendance" className="inline-flex items-center gap-1 text-xs font-semibold mb-2 transition-colors hover:text-[#003876]" style={{ color: '#8898AC' }}>
            <ArrowLeft size={12} /> Back to Subject Attendance
          </Link>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: '#111A24' }}>Subject Attendance</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <p className="text-sm font-semibold" style={{ color: '#5A6A7E' }}>{displayName}</p>
            {workloadEntry?.scheduleDays?.length ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#EEF2F8', color: '#5A6A7E', border: '1px solid #D4DCE6' }}>
                <Clock size={9} className="inline mr-0.5" />
                {workloadEntry.scheduleDays.join(' ')}
                {workloadEntry.startTime && ` • ${(() => { const [h,m]=workloadEntry.startTime.split(':').map(Number); return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}` })()}`}
                {workloadEntry.endTime && ` – ${(() => { const [h,m]=workloadEntry.endTime.split(':').map(Number); return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}` })()}`}
              </span>
            ) : null}
          </div>
          {hasCustomRoster
            ? <p className="text-xs mt-0.5" style={{ color: '#8898AC' }}>{workloadStudents[subject].length} students in this section's roster</p>
            : isAdviserSection
              ? <p className="text-xs mt-0.5" style={{ color: '#8898AC' }}>{globalStudents.length} students from your advisory masterlist</p>
              : <p
                  className="text-xs mt-0.5 text-amber-600 cursor-pointer hover:underline"
                  onClick={() => {
                    setRosterOpen(true)
                    setTimeout(() => document.getElementById('section-roster')?.scrollIntoView({ behavior: 'smooth' }), 100)
                  }}
                >⚠ No student roster yet — click here to set up roster</p>
          }
        </div>
        <div className="flex flex-wrap items-center gap-2">



          {/* Save */}
          <button
            onClick={handleSave}
            className="skeu-btn h-9 px-4 rounded-lg text-sm flex items-center gap-2"
          >
            {saved ? <><CheckCircle2 size={14} /> Saved!</> : <><Save size={14} /> Save Record</>}
          </button>
        </div>
      </div>

      {/* Save toast */}
      {saved && (
        <div className="animate-in slide-in-from-top-2 fade-in duration-300 flex items-center gap-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl px-4 py-3 shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-[#003876] shrink-0" />
          <p className="font-semibold text-sm">Attendance records saved to local storage.</p>
        </div>
      )}

      {/* PIN unlock notice removed for decluttering */}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { count: presentToday, label: "Present", sub: "Today", bg: "#E8F7EE", border: "#A8D8BA", color: "#003876", dark: "#1A3A28" },
          { count: absentToday, label: "Absent", sub: "Today", bg: "#FFF0F0", border: "#E8AAAA", color: "#C03030", dark: "#3A0A0A" },
          { count: lateToday, label: "Late", sub: "Today", bg: "#FFFBEC", border: "#E8D080", color: "#D08010", dark: "#3A2A08" },
        ].map(({ count, label, sub, bg, border, color, dark }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ background: bg, border: `1px solid ${border}`, boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 2px 5px rgba(0,0,0,0.05)" }}
          >
            <div className="h-10 w-10 rounded-full flex items-center justify-center font-black text-lg" style={{ background: border, color }}>
              {count}
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: dark }}>{label}</p>
              <p className="text-xs" style={{ color }}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <Card className="bg-white/80 backdrop-blur-md shadow-sm border border-slate-200/60 overflow-hidden">
        <CardHeader className="bg-white/50 border-b flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle>Attendance Register</CardTitle>
            <CardDescription className="mt-1 flex items-center gap-3 flex-wrap">
              <span>Click cell to cycle: <span className="font-semibold text-[#003876]">Present (P)</span> → <span className="font-semibold text-red-500">Absent (A)</span> → <span className="font-semibold text-amber-500">Late (L)</span></span>
              <span className="flex items-center gap-1 text-xs" style={{ color: "#8898AC" }}>
                <Lock size={10} /> Past dates require PIN
              </span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {activeStudents.length > 0 && (
              <>
                <QRScannerModal subject={subject} />
                {undoStack.length > 0 && (
                  <button
                    onClick={handleUndo}
                    className="skeu-btn-ghost h-9 px-3 bg-white rounded-lg text-sm text-slate-600 hover:text-amber-700 hover:bg-amber-50/50 transition-colors flex items-center gap-1.5"
                    title="Undo last change"
                    style={{ border: "1px solid #DDE4EE", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                  >
                    <Undo2 size={13} /> Undo ({undoStack.length})
                  </button>
                )}
                <button
                  onClick={handleMarkAllPresent}
                  className="skeu-btn-ghost h-9 px-3 mr-2 bg-white rounded-lg text-sm text-slate-600 hover:text-green-700 hover:bg-green-50/50 transition-colors"
                  title="Mark all students present today"
                  style={{ border: "1px solid #DDE4EE", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                >
                  ✓ All Present
                </button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => setWeekOffset(prev => prev - 1)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Prev Week
            </Button>
            {weekOffset !== 0 && (
              <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>
                This Week
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setWeekOffset(prev => prev + 1)} disabled={weekOffset >= 0}>
              Next Week <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="w-[50px]">No.</TableHead>
                <TableHead className="w-[250px] border-r">Learner&apos;s Name</TableHead>
                {weekDates.map((day) => (
                  <TableHead key={day.dateId} className="text-center w-[70px]">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px] font-medium text-slate-400 uppercase">{day.dayName}</span>
                      <span className={`font-bold text-sm ${day.isToday ? 'text-[#003876]' : 'text-slate-700'}`}>{day.label}</span>
                      {day.isToday
                        ? <span className="text-[8px] font-black text-[#003876] uppercase tracking-wider">Today</span>
                        : <span className="text-[9px]" style={{ color: '#C8D4E0' }}><Lock size={8} /></span>
                      }
                    </div>
                  </TableHead>
                ))}
                <TableHead className="text-center bg-red-50/50 text-red-700 w-[80px] text-xs leading-tight">
                  Total<br />Absent
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={totalCols} className="py-16">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
                        style={{ background: 'linear-gradient(180deg, #FFF8EC, #FFEFCC)', border: '1px solid #E8D080' }}
                      >
                        <Users size={24} style={{ color: '#C07800' }} />
                      </div>
                      <p className="text-base font-black" style={{ color: '#111A24' }}>No Students Yet</p>
                      <p className="text-sm mt-1 max-w-sm" style={{ color: '#8898AC' }}>
                        {isAdviserSection
                          ? 'Your advisory masterlist is empty. Add students via the Dashboard.'
                          : 'Set up the section roster below to start tracking attendance for this subject.'
                        }
                      </p>
                      {!isAdviserSection && (
                        <button
                          onClick={() => {
                            setRosterOpen(true)
                            setTimeout(() => document.getElementById('section-roster')?.scrollIntoView({ behavior: 'smooth' }), 100)
                          }}
                          className="mt-4 h-9 px-5 rounded-lg text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                          style={{
                            background: 'linear-gradient(180deg, #E3001B, #B5081C)',
                            border: '1px solid #8A0615',
                            boxShadow: '0 1px 0 rgba(255,255,255,0.15) inset, 0 4px 12px rgba(227,0,27,0.3)'
                          }}
                        >
                          ↓ Set Up Roster
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  <TableRow className="bg-blue-50/50">
                    <TableCell colSpan={totalCols} className="font-bold text-xs tracking-wider text-blue-900 border-y py-2">MALE</TableCell>
                  </TableRow>
                  {males.map((s, i) => renderStudentRow(s, i))}
                  <TableRow className="bg-pink-50/50">
                    <TableCell colSpan={totalCols} className="font-bold text-xs tracking-wider text-pink-900 border-y py-2">FEMALE</TableCell>
                  </TableRow>
                  {females.map((s, i) => renderStudentRow(s, i))}
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Section Roster Manager — only show when roster needs setup AND user clicked ── */}
      {activeStudents.length === 0 && !isAdviserSection && rosterOpen && (
        <div
          id="section-roster"
          className="rounded-xl overflow-hidden scroll-mt-20"
          style={{
            background: 'linear-gradient(160deg, #FFFFFF 0%, #F8FBFF 100%)',
            border: '1px solid #DDE4EE',
            boxShadow: '0 1px 0 rgba(255,255,255,1) inset, 0 4px 12px rgba(0,0,0,0.07)'
          }}
        >
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <p className="font-black text-sm" style={{ color: '#111A24' }}>Section Roster{workloadEntry ? ` — ${workloadEntry.section}` : ''}</p>
              <p className="text-xs mt-0.5" style={{ color: '#8898AC' }}>
                No roster yet. Add students manually, import from Excel/CSV, or use AI Camera.
              </p>
            </div>
          </div>
          <RosterEditor slug={subject} currentRoster={workloadStudents[subject] || []} />
        </div>
      )}

    </div>
  )
}

// ── Roster Editor sub-component ─────────────────────────────────────────────
function RosterEditor({ slug, currentRoster }: { slug: string; currentRoster: Student[] }) {
  const setWorkloadStudents = useTeacherStore(s => s.setWorkloadStudents)
  const [newLrn, setNewLrn] = useState('')
  const [newName, setNewName] = useState('')
  const [newSex, setNewSex] = useState<'M' | 'F'>('M')
  const fileRef = useRef<HTMLInputElement>(null)
  const [importStatus, setImportStatus] = useState<string | null>(null)
  const [rosterUndoStack, setRosterUndoStack] = useState<Student[]>([])

  const handleAdd = () => {
    if (!newLrn.trim() || !newName.trim()) return
    const alreadyIn = currentRoster.some(s => s.lrn === newLrn.trim())
    if (alreadyIn) { toast.error('LRN already in roster.'); return }
    const updated: Student[] = [...currentRoster, { lrn: newLrn.trim(), name: newName.trim().toUpperCase(), sex: newSex, status: 'Enrolled' }]
    setWorkloadStudents(slug, updated)
    setNewLrn('')
    setNewName('')
  }

  const handleRemove = (lrn: string) => {
    const removed = currentRoster.find(s => s.lrn === lrn)
    if (removed) setRosterUndoStack(prev => [...prev, removed])
    setWorkloadStudents(slug, currentRoster.filter(s => s.lrn !== lrn))
  }

  const handleRosterUndo = () => {
    setRosterUndoStack(prev => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      setWorkloadStudents(slug, [...currentRoster, last])
      return prev.slice(0, -1)
    })
  }

  // ── CSV / Excel Import ──────────────────────────────────────────────
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      let text = ''

      if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        text = await file.text()
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // For Excel files, try to parse as CSV-like (basic approach)
        // For full .xlsx support, ExcelJS would be needed server-side
        setImportStatus('⚠ For best results, save your Excel file as CSV first. Attempting basic parse...')
        text = await file.text()
      } else {
        toast.error('Please upload a .csv, .txt, or .xlsx file')
        return
      }

      // Parse CSV: detect columns by header
      const lines = text.split(/\r?\n/).filter(l => l.trim())
      if (lines.length < 2) { toast.error('File appears empty or has no data rows.'); return }

      // Try to detect columns from header
      const headerLine = lines[0].toLowerCase()
      const sep = headerLine.includes('\t') ? '\t' : ','
      const headers = lines[0].split(sep).map(h => h.trim().toLowerCase().replace(/"/g, ''))

      // Find column indices
      let lrnCol = headers.findIndex(h => h.includes('lrn') || h.includes('learner'))
      let nameCol = headers.findIndex(h => h.includes('name') || h.includes('learner'))
      let sexCol = headers.findIndex(h => h.includes('sex') || h.includes('gender'))

      // If name and LRN matched the same column (e.g. "learner"), separate them
      if (lrnCol === nameCol && lrnCol >= 0) {
        // Look for a second column
        nameCol = headers.findIndex((h, i) => i !== lrnCol && (h.includes('name') || h.includes('learner')))
        if (nameCol < 0) nameCol = lrnCol === 0 ? 1 : 0
      }

      // Fallback: assume col 0 = LRN, col 1 = Name, col 2 = Sex
      if (lrnCol < 0) lrnCol = 0
      if (nameCol < 0) nameCol = Math.min(1, headers.length - 1)
      if (sexCol < 0) sexCol = headers.length > 2 ? 2 : -1

      const imported: Student[] = []
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(sep).map(c => c.trim().replace(/"/g, ''))
        const lrn = cols[lrnCol]?.trim()
        const name = cols[nameCol]?.trim().toUpperCase()
        if (!lrn || !name) continue

        let sex: 'M' | 'F' = 'M'
        if (sexCol >= 0) {
          const raw = (cols[sexCol] || '').trim().toUpperCase()
          if (raw.startsWith('F') || raw === 'FEMALE') sex = 'F'
        }

        // Skip duplicates
        if (!currentRoster.some(s => s.lrn === lrn) && !imported.some(s => s.lrn === lrn)) {
          imported.push({ lrn, name, sex, status: 'Enrolled' })
        }
      }

      if (imported.length === 0) {
        setImportStatus('⚠ No valid rows found. Ensure file has LRN and Name columns.')
      } else {
        setWorkloadStudents(slug, [...currentRoster, ...imported])
        setImportStatus(`✅ Imported ${imported.length} students successfully!`)
      }

      setTimeout(() => setImportStatus(null), 5000)
    } catch (err: any) {
      setImportStatus(`❌ Import error: ${err.message}`)
      setTimeout(() => setImportStatus(null), 5000)
    }

    // Reset file input
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="p-5">
      {/* Import status toast */}
      {importStatus && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium animate-in slide-in-from-top-1 fade-in duration-200 ${
          importStatus.startsWith('✅') ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          : importStatus.startsWith('❌') ? 'bg-red-50 border border-red-200 text-red-700'
          : 'bg-amber-50 border border-amber-200 text-amber-700'
        }`}>
          {importStatus}
        </div>
      )}

      {/* Add row */}
      <div className="flex flex-wrap gap-2 mb-4 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">LRN</label>
          <input
            className="skeu-input h-9 px-3 text-sm rounded-lg w-[150px]"
            placeholder="LRN"
            value={newLrn}
            onChange={e => setNewLrn(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Full Name</label>
          <input
            className="skeu-input h-9 px-3 text-sm rounded-lg w-[260px]"
            placeholder="DELA CRUZ, JUAN M."
            value={newName}
            onChange={e => setNewName(e.target.value.toUpperCase())}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sex</label>
          <select
            className="skeu-input h-9 px-3 text-sm rounded-lg"
            value={newSex}
            onChange={e => setNewSex(e.target.value as 'M' | 'F')}
          >
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
        </div>
        <button onClick={handleAdd} className="skeu-btn h-9 px-4 rounded-lg text-sm flex items-center gap-1.5">
          <UserPlus size={13} /> Add Student
        </button>

        {/* Excel/CSV Import */}
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt,.xlsx,.xls"
          onChange={handleFileImport}
          className="hidden"
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="h-9 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
        >
          📄 Import from Excel/CSV
        </button>

        {currentRoster.length > 0 && (
          <>
            {rosterUndoStack.length > 0 && (
              <button
                onClick={handleRosterUndo}
                className="h-9 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
              >
                <Undo2 size={12} /> Undo Remove ({rosterUndoStack.length})
              </button>
            )}
            <button
              onClick={() => { if (confirm('Clear this entire section roster?')) setWorkloadStudents(slug, []) }}
              className="h-9 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            >
              <Trash2 size={12} /> Clear Roster
            </button>
          </>
        )}
      </div>

      {/* Roster list */}
      {currentRoster.length > 0 ? (
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">No.</th>
                <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">LRN</th>
                <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Name</th>
                <th className="text-center px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Sex</th>
                <th className="w-[50px]"></th>
              </tr>
            </thead>
            <tbody>
              {currentRoster.map((s, i) => (
                <tr key={s.lrn} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="px-3 py-2 text-slate-400 text-xs">{i + 1}</td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-600">{s.lrn}</td>
                  <td className="px-3 py-2 font-medium text-slate-800">{s.name}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${s.sex === 'M' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>{s.sex}</span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => handleRemove(s.lrn)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <X size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
      <div className="text-center py-8 text-slate-400 text-sm">
          <UserPlus size={28} className="mx-auto mb-2 opacity-30" />
          No students in roster yet. Add manually, import from Excel/CSV, or use AI Camera above.
        </div>
      )}
    </div>
  )
}
