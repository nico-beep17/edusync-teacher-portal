"use client"

import { useState, use, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Send, FileDown, CheckCircle2, Plus, Minus, AlertTriangle, Scan, UserPlus, ChevronUp, ChevronDown, RotateCcw, Info } from "lucide-react"
import { computeDepEdGrade } from "@/lib/deped-grading"
import { useTeacherStore } from "@/store/useStore"
import { toast } from "sonner"

// ─── Editable Weight Banner ───────────────────────────────────────────────────
function WeightInput({
  label, value, color, onChange
}: {
  label: string; value: number; color: string; onChange: (v: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [raw, setRaw] = useState(String(value))

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-black" style={{ color }}>{label}</span>
      {editing ? (
        <input
          type="number"
          min={1}
          max={98}
          className="h-6 w-12 text-center text-xs font-bold rounded border px-1"
          style={{ borderColor: color, color }}
          value={raw}
          onChange={e => setRaw(e.target.value)}
          onBlur={() => {
            const n = parseInt(raw)
            if (!isNaN(n) && n >= 1 && n <= 98) onChange(n)
            setEditing(false)
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.currentTarget.blur() }
            if (e.key === 'Escape') { setRaw(String(value)); setEditing(false) }
          }}
          autoFocus
        />
      ) : (
        <button
          onClick={() => { setRaw(String(value)); setEditing(true) }}
          className="h-6 px-2 text-xs font-black rounded border transition-all hover:opacity-80"
          style={{ borderColor: color, color, background: `${color}12` }}
          title="Click to edit weight"
        >
          {value}%
        </button>
      )}
    </div>
  )
}

// ─── Empty Student State ───────────────────────────────────────────────────────
function EmptyStudentState({ onAddManually, onScan, csrfToken }: { onAddManually: () => void, onScan: (students: any[]) => void, csrfToken: string }) {
  return (
    <div
      className="rounded-xl p-8 flex flex-col items-center text-center my-4"
      style={{
        background: "linear-gradient(160deg, #FAFCFF 0%, #F4F7FC 100%)",
        border: "1px dashed #C8D4E0"
      }}
    >
      <div
        className="h-14 w-14 rounded-xl flex items-center justify-center mb-4"
        style={{ background: "linear-gradient(180deg, #EEF2F8, #E4E9EF)", border: "1px solid #C8D4E0", boxShadow: "0 1px 0 rgba(255,255,255,1) inset" }}
      >
        <UserPlus size={24} style={{ color: "#8898AC" }} />
      </div>
      <p className="font-black text-base mb-1" style={{ color: "#111A24" }}>No students found for this section</p>
      <p className="text-sm mb-6 max-w-sm" style={{ color: "#8898AC" }}>
        This section's student list hasn't been set up yet by the class adviser.
        Add students manually or use the AI scanner to import from Form 138.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onAddManually}
          className="skeu-btn h-10 px-5 rounded-xl text-sm flex items-center gap-2 justify-center"
        >
          <UserPlus size={14} /> Add Students Manually
        </button>
        <label className="cursor-pointer">
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0]
            if (file) {
               const toastId = toast.loading(`Scanning form... Please wait while AI extracts data.`)
               const reader = new FileReader()
               reader.readAsDataURL(file)
               reader.onloadend = async () => {
                 try {
                    const res = await fetch('/api/extract-form', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'x-csrf-token': csrfToken || ''
                      },
                      body: JSON.stringify({ base64Image: reader.result })
                    })
                   if (!res.ok) throw new Error('Extraction failed')
                   const data = await res.json()
                   if (data.students && data.students.length > 0) {
                     let valid = 0
                     const newStudents: any[] = []
                     data.students.forEach((st: any) => {
                       const lrn = st.lrn || String(Math.floor(Math.random() * 900000000000) + 100000000000)
                       const mInitial = st.middleName ? ` ${st.middleName.charAt(0).toUpperCase()}.` : ""
                       const suffixStr = st.suffix ? ` ${st.suffix.toUpperCase()}` : ""
                       const name = `${st.lastName ? st.lastName.toUpperCase() : 'UNKNOWN'}, ${st.firstName ? st.firstName.toUpperCase() : 'UNKNOWN'}${mInitial}${suffixStr}`
                       const sex = (st.sex === 'M' || st.sex === 'F') ? st.sex : "M"
                       newStudents.push({ lrn, name, sex, scores: {} })
                       valid++
                     })
                     onScan(newStudents)
                     toast.success(`Successfully extracted ${valid} students!`, { id: toastId })
                   } else {
                     toast.error('No students found in the image', { id: toastId })
                   }
                 } catch (err) {
                   toast.error('AI Extraction failed. Ensure OpenAI API Key is valid.', { id: toastId })
                 }
               }
            }
          }} />
          <div className="skeu-btn-ghost h-10 px-5 rounded-xl text-sm flex items-center gap-2 justify-center">
            <Scan size={14} /> Use AI Scanner (Form 138)
          </div>
        </label>
      </div>
    </div>
  )
}

// ─── Add Student Manually Modal ────────────────────────────────────────────────
function AddStudentModal({
  onAdd, onClose
}: {
  onAdd: (s: { lrn: string; name: string; sex: 'M' | 'F' }) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({ lrn: "", name: "", sex: "M" as 'M' | 'F' })
  const [error, setError] = useState("")

  const handleSubmit = () => {
    if (!form.name.trim()) { setError("Name is required."); return }
    onAdd({ lrn: form.lrn.trim() || `local-${Date.now()}`, name: form.name.trim().toUpperCase(), sex: form.sex })
    setForm({ lrn: "", name: "", sex: "M" })
    setError("")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-sm mx-4 rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #FFFFFF 0%, #FAFCFF 100%)",
          border: "1px solid #DDE4EE",
          boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 20px 60px rgba(0,0,0,0.18)"
        }}
      >
        <div className="h-1" style={{ background: "linear-gradient(90deg, #003876, #28CC70, #003876)", boxShadow: "0 2px 6px rgba(227,10,36,0.4)" }} />
        <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-5">
            <p className="font-black text-base" style={{ color: "#111A24" }}>Add Student</p>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><span className="text-lg">×</span></button>
          </div>
          {error && <p className="text-xs font-medium mb-3" style={{ color: "#C03030" }}>⚠️ {error}</p>}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="skeu-label block">LRN (optional)</label>
              <input className="skeu-input w-full h-9 px-3 text-sm rounded-lg" placeholder="12-digit LRN" value={form.lrn} onChange={e => setForm(p => ({ ...p, lrn: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="skeu-label block">Full Name *</label>
              <input className="skeu-input w-full h-9 px-3 text-sm rounded-lg" placeholder="DELA CRUZ, JUAN B." value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="skeu-label block">Sex</label>
              <div className="flex gap-2">
                {(['M', 'F'] as const).map(s => (
                  <button key={s} onClick={() => setForm(p => ({ ...p, sex: s }))}
                    className="flex-1 h-9 rounded-lg text-sm font-bold border-2 transition-all"
                    style={form.sex === s
                      ? { background: "#003876", borderColor: "#8A0615", color: "#FFF" }
                      : { background: "#F4F7FC", borderColor: "#C8D4E0", color: "#5A6A7E" }
                    }>
                    {s === 'M' ? 'Male' : 'Female'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={onClose} className="skeu-btn-ghost flex-1 h-10 rounded-xl text-sm">Cancel</button>
            <button onClick={handleSubmit} className="skeu-btn flex-1 h-10 rounded-xl text-sm">Add Student</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main ECR Page ─────────────────────────────────────────────────────────────
export default function EClassRecordPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = use(params)
  const [mounted, setMounted] = useState(false)
  const [csrfToken, setCsrfToken] = useState('')
  const subjectName = subject.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  // ── Editable weights (must sum ≤ 100, remainder auto-adjusts) ──
  const [wwPct, setWwPct] = useState(30)
  const [ptPct, setPtPct] = useState(50)
  const [qaPct, setQaPct] = useState(20)
  const [weightError, setWeightError] = useState("")

  const handleWeightChange = (field: 'ww' | 'pt' | 'qa', val: number) => {
    const others = { ww: wwPct, pt: ptPct, qa: qaPct }
    others[field] = val
    const total = others.ww + others.pt + others.qa
    if (total !== 100) {
      setWeightError(`Weights must sum to 100% (currently ${total}%)`)
    } else {
      setWeightError("")
    }
    if (field === 'ww') setWwPct(val)
    else if (field === 'pt') setPtPct(val)
    else setQaPct(val)
  }

  const weights = { ww: wwPct / 100, pt: ptPct / 100, qa: qaPct / 100 }

  // ── Dynamic columns ──
  const [wwCount, setWwCount] = useState(2)
  const [ptCount, setPtCount] = useState(2)

  // ── HPS ──
  const [hps, setHps] = useState<Record<string, number>>({
    ww_0: 20, ww_1: 20, pt_0: 30, pt_1: 20, qa: 50
  })

  // ── Students ──
  const [students, setStudents] = useState<any[]>([])
  const [transmitted, setTransmitted] = useState(false)
  const [showAddStudent, setShowAddStudent] = useState(false)

  const updateGrade = useTeacherStore(s => s.updateGrade)
  const globalStudents = useTeacherStore(s => s.students)
  const globalGrades = useTeacherStore(s => s.grades)
  const schoolInfo = useTeacherStore(s => s.schoolInfo)

  useEffect(() => {
    // ── Auto-populate from global store if students exist ──
    if (globalStudents.length > 0) {
      setStudents(globalStudents.map(s => {
        const existingGrade = globalGrades[s.lrn]?.find(g =>
          g.subject.toLowerCase().includes(subjectName.toLowerCase()) ||
          subjectName.toLowerCase().includes(g.subject.toLowerCase())
        )
        const scores: Record<string, number> = { qa: existingGrade?.qa || 0 }
        for (let i = 0; i < wwCount; i++) {
          scores[`ww_${i}`] = i === 0 ? (existingGrade?.ww1 || 0) : i === 1 ? (existingGrade?.ww2 || 0) : 0
        }
        for (let i = 0; i < ptCount; i++) {
          scores[`pt_${i}`] = i === 0 ? (existingGrade?.pt1 || 0) : i === 1 ? (existingGrade?.pt2 || 0) : 0
        }
        return { lrn: s.lrn, name: s.name, sex: s.sex, scores }
      }))
    }
    // else: leave empty → show empty state prompt
    fetch('/api/export/sf')
      .then(r => r.json())
      .then(d => {
        if (d.csrfToken) {
          setCsrfToken(d.csrfToken)
          document.cookie = `csrf-token=${d.csrfToken}; path=/; SameSite=Strict`
        }
      })
      .catch(() => {})
    setMounted(true)
  }, [globalStudents, globalGrades, subjectName])

  if (!mounted) return null

  const hpsWW = Array.from({ length: wwCount }, (_, i) => hps[`ww_${i}`] || 0).reduce((a, b) => a + b, 0)
  const hpsPT = Array.from({ length: ptCount }, (_, i) => hps[`pt_${i}`] || 0).reduce((a, b) => a + b, 0)
  const hpsQA = hps.qa || 0
  const totalColSpan = 2 + wwCount + 2 + ptCount + 2 + 2 + 2

  const handleScoreChange = (lrn: string, field: string, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value)
    if (isNaN(numValue)) return
    
    const maxScore = hps[field] || 0
    let finalValue = numValue
    if (numValue > maxScore && maxScore > 0) {
       finalValue = maxScore
    }

    setStudents(prev => prev.map(s => s.lrn === lrn ? { ...s, scores: { ...s.scores, [field]: finalValue } } : s))
  }

  const handleHpsChange = (field: string, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value)
    if (!isNaN(numValue)) setHps(prev => ({ ...prev, [field]: numValue }))
  }

  const addWWColumn = () => {
    const idx = wwCount
    setWwCount(p => p + 1)
    setHps(p => ({ ...p, [`ww_${idx}`]: 20 }))
    setStudents(p => p.map(s => ({ ...s, scores: { ...s.scores, [`ww_${idx}`]: 0 } })))
  }
  const removeWWColumn = () => {
    if (wwCount <= 1) return
    const idx = wwCount - 1
    setWwCount(p => p - 1)
    setHps(p => { const n = { ...p }; delete n[`ww_${idx}`]; return n })
    setStudents(p => p.map(s => { const sc = { ...s.scores }; delete sc[`ww_${idx}`]; return { ...s, scores: sc } }))
  }
  const addPTColumn = () => {
    const idx = ptCount
    setPtCount(p => p + 1)
    setHps(p => ({ ...p, [`pt_${idx}`]: 20 }))
    setStudents(p => p.map(s => ({ ...s, scores: { ...s.scores, [`pt_${idx}`]: 0 } })))
  }
  const removePTColumn = () => {
    if (ptCount <= 1) return
    const idx = ptCount - 1
    setPtCount(p => p - 1)
    setHps(p => { const n = { ...p }; delete n[`pt_${idx}`]; return n })
    setStudents(p => p.map(s => { const sc = { ...s.scores }; delete sc[`pt_${idx}`]; return { ...s, scores: sc } }))
  }

  const handleAddStudentManually = (s: { lrn: string; name: string; sex: 'M' | 'F' }) => {
    const scores: Record<string, number> = { qa: 0 }
    for (let i = 0; i < wwCount; i++) scores[`ww_${i}`] = 0
    for (let i = 0; i < ptCount; i++) scores[`pt_${i}`] = 0
    setStudents(prev => [...prev, { ...s, scores }])
    setShowAddStudent(false)
  }

  const males = students.filter(s => s.sex === 'M')
  const females = students.filter(s => s.sex === 'F')

  const handleSaveGrades = () => {
    students.forEach(student => {
      const totalWW = Array.from({ length: wwCount }, (_, i) => student.scores[`ww_${i}`] || 0).reduce((a: number, b: number) => a + b, 0)
      const totalPT = Array.from({ length: ptCount }, (_, i) => student.scores[`pt_${i}`] || 0).reduce((a: number, b: number) => a + b, 0)
      const grades = computeDepEdGrade(
        { ww: totalWW, pt: totalPT, qa: student.scores.qa || 0 },
        { ww: hpsWW, pt: hpsPT, qa: hpsQA },
        weights
      )
      updateGrade(student.lrn, {
        subject: subjectName,
        ww1: student.scores.ww_0 || 0, ww2: student.scores.ww_1 || 0,
        pt1: student.scores.pt_0 || 0, pt2: student.scores.pt_1 || 0,
        qa: student.scores.qa || 0,
        quarterGrade: student.scores._qgOverride || grades.quarterGrade
      })
    })
    setTransmitted(true)
    setTimeout(() => setTransmitted(false), 4000)
  }

  const handleExport = async () => {
    try {
      const res = await fetch('/api/export/ecr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken || ''
        },
        body: JSON.stringify({ subject: subjectName, students, schoolInfo, hps: { ww: hpsWW, pt: hpsPT, qa: hpsQA } })
      })
      if (!res.ok) throw new Error("Template mapping failed.")
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      const sanitizedName = (schoolInfo?.section || 'Class').replace(/\s/g, '_')
      a.href = url; a.download = `${subjectName}_ECR_Q1_${sanitizedName}.xlsx`; a.click()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      toast.error("Export: " + err.message)
    }
  }

  const renderStudentRow = (student: any, idx: number) => {
    const totalWW = Array.from({ length: wwCount }, (_, i) => student.scores[`ww_${i}`] || 0).reduce((a: number, b: number) => a + b, 0)
    const totalPT = Array.from({ length: ptCount }, (_, i) => student.scores[`pt_${i}`] || 0).reduce((a: number, b: number) => a + b, 0)
    const grades = computeDepEdGrade(
      { ww: totalWW, pt: totalPT, qa: student.scores.qa || 0 },
      { ww: hpsWW, pt: hpsPT, qa: hpsQA },
      weights
    )
    return (
      <TableRow key={student.lrn} className="hover:bg-slate-50/50 transition-colors">
        <TableCell className="text-slate-500 text-xs">{idx + 1}</TableCell>
        <TableCell className="font-medium border-r text-sm whitespace-nowrap">{student.name}</TableCell>
        {Array.from({ length: wwCount }, (_, i) => (
          <TableCell key={`ww_${i}`} className="p-1">
            <Input className="h-8 w-12 mx-auto text-center font-medium" value={student.scores[`ww_${i}`] || ''} onChange={e => handleScoreChange(student.lrn, `ww_${i}`, e.target.value)} />
          </TableCell>
        ))}
        <TableCell className="text-center font-bold bg-blue-50/30 text-blue-900">{totalWW}</TableCell>
        <TableCell className="text-center font-semibold text-blue-700 bg-blue-50/50 border-r">{grades.psWW.toFixed(2)}</TableCell>
        {Array.from({ length: ptCount }, (_, i) => (
          <TableCell key={`pt_${i}`} className="p-1">
            <Input className="h-8 w-12 mx-auto text-center font-medium" value={student.scores[`pt_${i}`] || ''} onChange={e => handleScoreChange(student.lrn, `pt_${i}`, e.target.value)} />
          </TableCell>
        ))}
        <TableCell className="text-center font-bold bg-blue-50/30 text-blue-900">{totalPT}</TableCell>
        <TableCell className="text-center font-semibold text-blue-700 bg-blue-50/50 border-r">{grades.psPT.toFixed(2)}</TableCell>
        <TableCell className="p-1"><Input className="h-8 w-14 mx-auto text-center font-medium" value={student.scores.qa || ''} onChange={e => handleScoreChange(student.lrn, 'qa', e.target.value)} /></TableCell>
        <TableCell className="text-center font-semibold text-purple-700 bg-purple-50/50 border-r">{grades.psQA.toFixed(2)}</TableCell>
        <TableCell className="text-center font-medium bg-slate-50 text-slate-600">{grades.initialGrade.toFixed(2)}</TableCell>
        <TableCell className="text-center bg-slate-100/80 p-1">
          <div className="relative flex items-center justify-center">
            <input
              type="number" min={60} max={100}
              className={`h-8 w-[60px] mx-auto py-0 pr-0 pb-0 text-center font-bold text-lg rounded border-0 outline-none transition-colors focus:ring-2 focus:ring-[#003876] z-10 ${student.scores._qgOverride ? 'bg-amber-50 text-amber-700 w-[50px] ml-1 mr-6' : (grades.quarterGrade >= 75 ? 'bg-transparent text-[#003876]' : 'bg-transparent text-red-500')}`}
              style={{ flexShrink: 0 }}
              value={student.scores._qgOverride || grades.quarterGrade}
              onChange={e => {
                const val = parseInt(e.target.value)
                if (isNaN(val)) return
                handleScoreChange(student.lrn, '_qgOverride', val === grades.quarterGrade ? '0' : e.target.value)
              }}
              title={student.scores._qgOverride ? `Auto: ${grades.quarterGrade} (overridden)` : `Auto-transmuted from ${grades.initialGrade.toFixed(2)}`}
            />
            {student.scores._qgOverride ? (
              <button
                onClick={() => handleScoreChange(student.lrn, '_qgOverride', '0')}
                title="Revert to computed grade"
                className="absolute right-1 text-red-600 hover:text-white hover:bg-red-500 bg-red-100 rounded p-[3px] transition-colors z-20 shadow-sm"
              >
                <RotateCcw size={12} strokeWidth={2.5} />
              </button>
            ) : null}
          </div>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <div className="flex flex-col gap-6">

      {showAddStudent && <AddStudentModal onAdd={handleAddStudentManually} onClose={() => setShowAddStudent(false)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "#111A24" }}>{subjectName}</h1>
          <p className="mt-1 text-sm" style={{ color: "#8898AC" }}>Interactive E-Class Record • Quarter 1</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExport} className="skeu-btn-ghost h-9 px-4 rounded-lg text-sm flex items-center gap-2">
            <FileDown size={14} /> Export
          </button>
          <button
            onClick={handleSaveGrades}
            className="h-9 px-4 rounded-lg text-sm font-bold flex items-center gap-2 transition-all active:scale-95"
            style={transmitted
              ? { background: "linear-gradient(180deg, #E30A24, #B5081C)", border: "1px solid #8A0615", color: "#FFF", boxShadow: "0 4px 12px rgba(227,10,36,0.3)" }
              : { background: "linear-gradient(180deg, #E30A24, #B5081C)", border: "1px solid #8A0615", color: "#FFF", boxShadow: "0 4px 12px rgba(227,10,36,0.3)" }
            }
          >
            {transmitted ? <><CheckCircle2 size={14} /> Transmitted!</> : <><Send size={14} /> Transmit to Adviser</>}
          </button>
        </div>
      </div>

      {/* Transmission Banner */}
      {transmitted && (
        <div className="animate-in slide-in-from-top-2 fade-in duration-300 flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: "#F0FBF5", border: "1px solid #A8D8BA", boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset" }}>
          <CheckCircle2 size={18} style={{ color: "#003876" }} />
          <div>
            <p className="font-bold text-sm" style={{ color: "#1A3A28" }}>Grades Transmitted Successfully</p>
            <p className="text-xs mt-0.5" style={{ color: "#5A8A6A" }}>{subjectName} Q1 grades sent to Class Adviser's Composite Aggregator.</p>
          </div>
        </div>
      )}

      {/* Grading Sheet Panel */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: "#FFFFFF",
          border: "1px solid #DDE4EE",
          boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 4px 14px rgba(0,0,0,0.08)"
        }}
      >
        {/* Panel Header — weights + column controls */}
        <div
          className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
          style={{ background: "linear-gradient(180deg, #FAFCFF 0%, #F4F7FC 100%)", borderBottom: "1px solid #DDE4EE" }}
        >
          <div>
            <div className="flex items-center gap-2">
              <p className="font-black text-sm" style={{ color: "#111A24" }}>Grading Sheet (Auto-Computing)</p>
              
              {/* Transmutation Legend Hover (Outside table overflow to prevent clipping) */}
              <div className="relative group cursor-help z-[100]">
                <div className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200 px-2 py-0.5 rounded-full">
                  <Info size={12} className="text-blue-600" />
                  <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Legend</span>
                </div>
                
                <div className="absolute top-[120%] left-0 w-64 bg-slate-800 border border-slate-700 text-white text-[10px] font-normal text-left p-3 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] hidden group-hover:block cursor-default pointer-events-none">
                  <p className="font-bold mb-1 text-xs text-white">DepEd Transmutation</p>
                  <p className="mb-2 text-slate-300 leading-snug">The Initial Grade is transmuted automatically based on DepEd Order No. 8, s. 2015.</p>
                  <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-slate-400">
                    <div><strong className="text-slate-300">Initial Grade</strong></div>
                    <div><strong className="text-slate-300">Transmuted</strong></div>
                    <div className="h-px bg-slate-700 col-span-2 my-0.5" />
                    <div>100.00</div><div>100</div>
                    <div>98.40 – 99.99</div><div>99</div>
                    <div>96.80 – 98.39</div><div>98</div>
                    <div>...</div><div>...</div>
                    <div>60.00 – 61.59</div><div className="text-emerald-400 font-semibold">75 (Passed)</div>
                    <div>0.00 – 59.99</div><div className="text-red-400 font-semibold">60-74 (Failed)</div>
                  </div>
                </div>
              </div>
            </div>
            {/* Editable weights */}
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <WeightInput label="WW" value={wwPct} color="#2060C0" onChange={v => handleWeightChange('ww', v)} />
              <WeightInput label="PT" value={ptPct} color="#003876" onChange={v => handleWeightChange('pt', v)} />
              <WeightInput label="QA" value={qaPct} color="#8040C0" onChange={v => handleWeightChange('qa', v)} />
              {weightError && (
                <span className="flex items-center gap-1 text-xs font-bold" style={{ color: "#C03030" }}>
                  <AlertTriangle size={11} /> {weightError}
                </span>
              )}
              {!weightError && (
                <span className="text-xs font-medium" style={{ color: "#8898AC" }}>
                  Click any % to edit · must sum to 100%
                </span>
              )}
            </div>
          </div>

          {/* Column controls */}
          <div className="flex items-center gap-4">
            {[
              { label: "WW", count: wwCount, add: addWWColumn, remove: removeWWColumn, color: "#2060C0" },
              { label: "PT", count: ptCount, add: addPTColumn, remove: removePTColumn, color: "#003876" },
            ].map(({ label, count, add, remove, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="text-xs font-black" style={{ color }}>{label}:</span>
                <button onClick={remove} disabled={count <= 1}
                  className="h-6 w-6 rounded flex items-center justify-center transition-colors disabled:opacity-30"
                  style={{ background: `${color}18`, color }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${color}28` }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${color}18` }}
                >
                  <Minus size={11} />
                </button>
                <span className="text-xs font-black w-4 text-center" style={{ color: "#111A24" }}>{count}</span>
                <button onClick={add}
                  className="h-6 w-6 rounded flex items-center justify-center transition-colors"
                  style={{ background: `${color}18`, color }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${color}28` }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${color}18` }}
                >
                  <Plus size={11} />
                </button>
              </div>
            ))}
            <button
              onClick={() => setShowAddStudent(true)}
              className="skeu-btn-ghost h-7 px-3 rounded-lg text-xs flex items-center gap-1.5"
            >
              <UserPlus size={12} /> Add Student
            </button>
          </div>
        </div>

        {/* Empty State */}
        {students.length === 0 ? (
        <EmptyStudentState 
          csrfToken={csrfToken}
          onAddManually={() => setShowAddStudent(true)} 
          onScan={(scannedStudents) => setStudents(scannedStudents)} 
        />
      ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead colSpan={2} className="border-r w-[250px]" />
                  <TableHead colSpan={wwCount + 2} className="text-center border-r bg-blue-50/50 text-blue-800 font-semibold">Written Works ({wwPct}%)</TableHead>
                  <TableHead colSpan={ptCount + 2} className="text-center border-r bg-blue-50/50 text-blue-800 font-semibold">Performance Tasks ({ptPct}%)</TableHead>
                  <TableHead colSpan={2} className="text-center border-r bg-purple-50/50 text-purple-800 font-semibold">Quarterly Assessment ({qaPct}%)</TableHead>
                  <TableHead colSpan={2} className="text-center font-bold text-slate-800">Final Grade</TableHead>
                </TableRow>
                <TableRow className="border-b-2 border-slate-200">
                  <TableHead className="w-[40px] text-xs">No.</TableHead>
                  <TableHead className="border-r">Learner's Name</TableHead>
                  {Array.from({ length: wwCount }, (_, i) => (
                    <TableHead key={`ww_h_${i}`} className="text-center w-[60px] bg-blue-50/20 text-xs">{i + 1}</TableHead>
                  ))}
                  <TableHead className="text-center w-[70px] bg-blue-50/50 font-semibold">Total</TableHead>
                  <TableHead className="text-center w-[70px] bg-blue-100/50 font-bold border-r">PS</TableHead>
                  {Array.from({ length: ptCount }, (_, i) => (
                    <TableHead key={`pt_h_${i}`} className="text-center w-[60px] bg-blue-50/20 text-xs">{i + 1}</TableHead>
                  ))}
                  <TableHead className="text-center w-[70px] bg-blue-50/50 font-semibold">Total</TableHead>
                  <TableHead className="text-center w-[70px] bg-blue-100/50 font-bold border-r">PS</TableHead>
                  <TableHead className="text-center w-[80px] bg-purple-50/20 font-medium">Score</TableHead>
                  <TableHead className="text-center w-[80px] bg-purple-100/50 font-bold border-r">PS</TableHead>
                  <TableHead className="text-center w-[80px] font-semibold text-xs leading-tight">Initial Grade</TableHead>
                  <TableHead className="text-center w-[90px] font-bold text-slate-900 bg-slate-100/80 leading-tight">Quarter Grade</TableHead>
                </TableRow>
                {/* HPS Row */}
                <TableRow className="bg-amber-50/30">
                  <TableCell colSpan={2} className="text-right font-semibold text-xs text-amber-800 border-r py-2">HIGHEST POSSIBLE SCORE ➔</TableCell>
                  {Array.from({ length: wwCount }, (_, i) => (
                    <TableCell key={`ww_hps_${i}`} className="p-1">
                      <Input className="h-7 w-12 mx-auto text-center text-xs font-bold" value={hps[`ww_${i}`] || 0} onChange={e => handleHpsChange(`ww_${i}`, e.target.value)} />
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-bold text-slate-700">{hpsWW}</TableCell>
                  <TableCell className="text-center font-bold text-blue-700 border-r">100.00</TableCell>
                  {Array.from({ length: ptCount }, (_, i) => (
                    <TableCell key={`pt_hps_${i}`} className="p-1">
                      <Input className="h-7 w-12 mx-auto text-center text-xs font-bold" value={hps[`pt_${i}`] || 0} onChange={e => handleHpsChange(`pt_${i}`, e.target.value)} />
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-bold text-slate-700">{hpsPT}</TableCell>
                  <TableCell className="text-center font-bold text-blue-700 border-r">100.00</TableCell>
                  <TableCell className="p-1"><Input className="h-7 w-14 mx-auto text-center text-xs font-bold" value={hps.qa} onChange={e => handleHpsChange('qa', e.target.value)} /></TableCell>
                  <TableCell className="text-center font-bold text-purple-700 border-r">100.00</TableCell>
                  <TableCell className="bg-slate-50" /><TableCell className="bg-slate-100/80" />
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-blue-50/50">
                  <TableCell colSpan={totalColSpan} className="font-bold text-xs tracking-wider text-blue-900">MALE</TableCell>
                </TableRow>
                {males.map((s, i) => renderStudentRow(s, i))}
                <TableRow className="bg-pink-50/50">
                  <TableCell colSpan={totalColSpan} className="font-bold text-xs tracking-wider text-pink-900">FEMALE</TableCell>
                </TableRow>
                {females.map((s, i) => renderStudentRow(s, males.length + i))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
