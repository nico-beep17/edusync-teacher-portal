"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Save, CalendarIcon, CheckCircle2, Lock, Eye, EyeOff, FileDown, X, ShieldAlert, ChevronLeft, ChevronRight } from "lucide-react"
import { useTeacherStore } from "@/store/useStore"
import { useEffect, useRef, useState } from "react"
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
export default function AttendancePage() {
  const [mounted, setMounted] = useState(false)
  const globalStudents = useTeacherStore(s => s.students)
  const globalAttendance = useTeacherStore(s => s.attendance)
  const updateAttendance = useTeacherStore(s => s.updateAttendance)

  const [localAtt, setLocalAtt] = useState<Record<string, Record<string, string>>>({})
  const [saved, setSaved] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [sf2ModalOpen, setSf2ModalOpen] = useState(false)
  const [sf2Summary, setSf2Summary] = useState({
    lateEnrollmentM: 0, lateEnrollmentF: 0,
    dropOutM: 0, dropOutF: 0,
    transferredOutM: 0, transferredOutF: 0,
    transferredInM: 0, transferredInF: 0,
  })

  // Export month: default current month
  const [exportMonth, setExportMonth] = useState(() => {
    const n = new Date()
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
  })

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
      if (!newAtt[s.lrn]) newAtt[s.lrn] = {}
      newAtt[s.lrn][todayId] = 'P'
    })
    setLocalAtt(newAtt)
  }

  const handleSave = () => {
    globalStudents.forEach(s => {
      weekDates.forEach(d => {
        const stat = localAtt[s.lrn]?.[d.dateId]
        if (stat) updateAttendance(s.lrn, { date: d.dateId, status: stat as 'P' | 'A' | 'L' })
      })
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleExport = async (formCode: 'sf2' | 'sf4', summaryOverride?: any) => {
    setExporting(true)
    try {
      const [y, m] = exportMonth.split('-').map(Number)
      const attPayload: Record<string, any[]> = {}
      globalStudents.forEach(s => {
        attPayload[s.lrn] = (globalAttendance[s.lrn] || []).map(r => ({ date: r.date, status: r.status }))
      })
      const si: any = { section: 'ARIES', gradeLevel: 'Grade 8', schoolYear: '2025-2026', quarter: 'Q1', adviserName: 'JENIVIVE ORTEGA PUNAY', schoolId: '316405', schoolName: 'QUEZON NATIONAL HIGH SCHOOL' }
      if (summaryOverride) si.sf2Summary = summaryOverride
      const res = await fetch('/api/export/sf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form: formCode,
          students: globalStudents,
          attendance: attPayload,
          year: y,
          month: m - 1, 
          schoolInfo: si
        })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Export failed')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      // Place SF code at the end
      const prefix = formCode === 'sf2' ? 'Attendance' : 'Monthly_Movement'
      a.download = `${prefix}_Grade8_ARIES_${exportMonth}_${formCode.toUpperCase()}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(`${formCode.toUpperCase()} Export Error: ` + err.message)
    } finally {
      setExporting(false)
    }
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
          <h1 className="text-3xl font-black tracking-tight" style={{ color: '#111A24' }}>Daily Attendance (SF2)</h1>
          <p className="text-sm mt-1" style={{ color: '#8898AC' }}>Grade 8 - ARIES • Class Advisory</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <QRScannerModal />

          {/* Mark all present */}
          <button
            onClick={handleMarkAllPresent}
            className="skeu-btn-ghost h-9 px-3 rounded-lg text-sm"
          >
            ✓ Mark All Present
          </button>

          {/* Month picker for export */}
          <div className="flex flex-col sm:flex-row items-center gap-0 rounded-lg overflow-hidden" style={{ border: '1px solid #C8D4E0', boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset' }}>
            <div className="flex items-center gap-1.5 px-2.5 h-9 bg-white border-r border-slate-200">
              <CalendarIcon size={13} style={{ color: '#8898AC' }} />
              <input
                type="month"
                value={exportMonth}
                onChange={e => setExportMonth(e.target.value)}
                className="text-sm font-medium border-0 outline-none bg-transparent"
                style={{ color: '#111A24' }}
              />
            </div>
            <button
              onClick={() => setSf2ModalOpen(true)}
              disabled={exporting || globalStudents.length === 0}
              className="h-9 px-3 text-sm font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 border-r border-[#8A0615]"
              style={{ background: 'linear-gradient(180deg, #E30A24, #B5081C)', color: '#FFF' }}
            >
              <FileDown size={13} />
              SF2
            </button>
            <button
              disabled
              title="Coming Soon"
              className="h-9 px-3 text-sm font-bold flex items-center gap-1.5 transition-all rounded-lg opacity-50 cursor-not-allowed"
              style={{ background: 'linear-gradient(180deg, #888, #666)', color: '#FFF' }}
            >
              SF4
            </button>
          </div>

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

      {/* PIN lock notice */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
        style={{
          background: "linear-gradient(160deg, #FFFBF2 0%, #FFF7E6 100%)",
          border: "1px solid #E8C878",
          boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 2px 5px rgba(0,0,0,0.05)"
        }}
      >
        <div className="flex items-center justify-center h-7 w-7 rounded-lg shrink-0" style={{ background: "#FFF0CC", border: "1px solid #E8C878" }}>
          <Lock size={14} style={{ color: "#D08010" }} />
        </div>
        <div>
          <p className="font-bold text-sm" style={{ color: "#2A1A0E" }}>
            Past-date attendance is locked
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#8A6828" }}>
            Only <strong>today&apos;s</strong> column is editable. Clicking a past date requires your <strong>Teacher PIN</strong> to prevent student tampering.
            {unlockedDates.size > 0 && <span className="text-[#003876]"> ({unlockedDates.size} date{unlockedDates.size !== 1 ? 's' : ''} unlocked this session)</span>}
          </p>
        </div>
      </div>

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
          <div className="flex items-center gap-2">
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

      {/* SF2 Summary Modal */}
      <Dialog open={sf2ModalOpen} onOpenChange={setSf2ModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>SF2 Monthly Summary</DialogTitle>
            <p className="text-sm text-slate-500 mt-1">Fill in details before exporting. Auto-computed fields are calculated from your attendance data.</p>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {[
              { label: 'Late Enrollment', mKey: 'lateEnrollmentM', fKey: 'lateEnrollmentF' },
              { label: 'Drop Out', mKey: 'dropOutM', fKey: 'dropOutF' },
              { label: 'Transferred Out', mKey: 'transferredOutM', fKey: 'transferredOutF' },
              { label: 'Transferred In', mKey: 'transferredInM', fKey: 'transferredInF' },
            ].map(({ label, mKey, fKey }) => (
              <div key={mKey}>
                <Label className="text-xs font-semibold text-slate-600">{label}</Label>
                <div className="flex gap-2 mt-1">
                  <div className="flex-1">
                    <Label className="text-[10px] text-blue-600">Male</Label>
                    <Input
                      type="number" min={0}
                      value={(sf2Summary as any)[mKey]}
                      onChange={e => setSf2Summary(prev => ({ ...prev, [mKey]: Number(e.target.value) || 0 }))}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-[10px] text-pink-600">Female</Label>
                    <Input
                      type="number" min={0}
                      value={(sf2Summary as any)[fKey]}
                      onChange={e => setSf2Summary(prev => ({ ...prev, [fKey]: Number(e.target.value) || 0 }))}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={() => { setSf2ModalOpen(false); handleExport('sf2', sf2Summary) }}
              disabled={exporting}
              className="w-full h-10 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              style={{ background: 'linear-gradient(180deg, #E30A24, #B5081C)', color: '#FFF' }}
            >
              <FileDown size={14} />
              {exporting ? 'Generating...' : 'Export SF2'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
