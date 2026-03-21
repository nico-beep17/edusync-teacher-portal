"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Save, CalendarIcon, CheckCircle2, Lock, Eye, EyeOff, FileDown, X, ShieldAlert, ChevronLeft, ChevronRight } from "lucide-react"
import { useTeacherStore } from "@/store/useStore"
import { useEffect, useRef, useState, use } from "react"
import { QRScannerModal } from "@/components/attendance/qr-scanner-modal"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
  const subjectName = subject.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  
  const globalStudents = useTeacherStore(s => s.students) // Using global students for now, wait we could filter by subject if we had a relation
  const globalAttendance = useTeacherStore(s => (s.subjectAttendance || {})[subject] || {})
  const globalSchoolInfo = useTeacherStore(s => s.schoolInfo)
  const updateAttendance = useTeacherStore(s => s.updateSubjectAttendance)

  const [localAtt, setLocalAtt] = useState<Record<string, Record<string, string>>>({})
  const [saved, setSaved] = useState(false)


  // PIN unlock state
  const [pinOpen, setPinOpen] = useState(false)
  const [pendingEdit, setPendingEdit] = useState<{ lrn: string; dateId: string } | null>(null)
  const [unlockedDates, setUnlockedDates] = useState<Set<string>>(new Set())
  const [weekOffset, setWeekOffset] = useState(0)

  useEffect(() => {
    const initialAtt: Record<string, Record<string, string>> = {}
    globalStudents.forEach(s => {
      initialAtt[s.lrn] = {}
      const records = globalAttendance[s.lrn] || []
      records.forEach(r => { initialAtt[s.lrn][r.date] = r.status })
    })
    setLocalAtt(initialAtt)
    setMounted(true)
  }, [globalStudents, globalAttendance])

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
    setLocalAtt(prev => ({ ...prev, [lrn]: { ...prev[lrn], [dateId]: next } }))
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

  const males = globalStudents.filter(s => s.sex === 'M')
  const females = globalStudents.filter(s => s.sex === 'F')

  const presentToday = globalStudents.filter(s => localAtt[s.lrn]?.[todayId] === 'P').length
  const absentToday = globalStudents.filter(s => localAtt[s.lrn]?.[todayId] === 'A').length
  const lateToday = globalStudents.filter(s => localAtt[s.lrn]?.[todayId] === 'L').length

  const handleMarkAllPresent = () => {
    // Only mark today (no PIN needed for today)
    const newAtt = { ...localAtt }
    globalStudents.forEach(s => {
      newAtt[s.lrn] = { ...(newAtt[s.lrn] || {}), [todayId]: 'P' }
    })
    setLocalAtt(newAtt)
  }

  const handleSave = () => {
    globalStudents.forEach(s => {
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
          <h1 className="text-3xl font-black tracking-tight" style={{ color: '#111A24' }}>Subject Attendance</h1>
          <p className="text-sm mt-1" style={{ color: '#8898AC' }}>{subjectName}</p>
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
            <QRScannerModal subject={subject} />
            <button
              onClick={handleMarkAllPresent}
              className="skeu-btn-ghost h-9 px-3 mr-2 bg-white rounded-lg text-sm text-slate-600 hover:text-green-700 hover:bg-green-50/50 transition-colors"
              title="Mark all students present today"
              style={{ border: "1px solid #DDE4EE", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
            >
              ✓ All Present
            </button>
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
              <TableRow className="bg-blue-50/50">
                <TableCell colSpan={totalCols} className="font-bold text-xs tracking-wider text-blue-900 border-y py-2">MALE</TableCell>
              </TableRow>
              {males.map((s, i) => renderStudentRow(s, i))}
              <TableRow className="bg-pink-50/50">
                <TableCell colSpan={totalCols} className="font-bold text-xs tracking-wider text-pink-900 border-y py-2">FEMALE</TableCell>
              </TableRow>
              {females.map((s, i) => renderStudentRow(s, i))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>


    </div>
  )
}
