"use client"

import { useState, useEffect, useRef } from "react"
import { useTeacherStore } from "@/store/useStore"
import { Download, Settings2, CheckCircle2, X, Plus, Trash2 } from "lucide-react"

const formatDateShort = (iso: string) => {
  if (!iso) return ""
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: '2-digit' })
}

function DateCellInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [editing, setEditing] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) ref.current?.focus()
  }, [editing])

  if (editing) {
    return (
      <input
        ref={ref}
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={() => setEditing(false)}
        className="w-full text-[10px] border border-blue-400 rounded px-1 py-0.5 outline-none bg-white"
        style={{ minWidth: 90 }}
      />
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="w-full text-center text-[10px] px-1 py-1 rounded transition-colors hover:bg-blue-50 group"
      title={placeholder}
    >
      {value ? (
        <span className="text-slate-700 font-medium">{formatDateShort(value)}</span>
      ) : (
        <span className="text-slate-300 group-hover:text-blue-400">—</span>
      )}
    </button>
  )
}

export default function SF3Page() {
  const [mounted, setMounted] = useState(false)
  const students = useTeacherStore(s => s.students)
  const books = useTeacherStore(s => s.books)
  const sf3Subjects = useTeacherStore(s => s.sf3Subjects)
  const schoolInfo = useTeacherStore(s => s.schoolInfo)
  const setSf3Record = useTeacherStore(s => s.setSf3Record)
  const setSf3Subjects = useTeacherStore(s => s.setSf3Subjects)

  const [saved, setSaved] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [editingSubjects, setEditingSubjects] = useState(false)
  const [subjectDraft, setSubjectDraft] = useState<string[]>([])
  const [newSubject, setNewSubject] = useState("")

  useEffect(() => { setMounted(true) }, [])

  const handleSetRecord = (lrn: string, subject: string, field: 'dateIssued' | 'dateReturned', value: string) => {
    const existing = books[lrn]?.[subject] || {}
    setSf3Record(lrn, subject, { ...existing, [field]: value || undefined })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/export/sf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form: 'sf3', students, books, schoolInfo })
      })
      if (!res.ok) throw new Error("SF3 Export failed")
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Books_Issued_Grade${schoolInfo.gradeLevel}_${schoolInfo.section}_SF3.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      alert("Export Error: " + err.message)
    } finally {
      setExporting(false)
    }
  }

  const males = students.filter(s => s.sex === 'M')
  const females = students.filter(s => s.sex === 'F')

  const openSubjectEditor = () => {
    setSubjectDraft([...sf3Subjects])
    setEditingSubjects(true)
  }

  const saveSubjects = () => {
    const cleaned = subjectDraft.map(s => s.trim()).filter(Boolean)
    setSf3Subjects(cleaned)
    setEditingSubjects(false)
  }

  if (!mounted) return null

  const renderStudentRows = (list: typeof students, startIdx: number) =>
    list.map((student, i) => {
      const row = books[student.lrn] || {}
      return (
        <tr key={student.lrn} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
          <td
            className="text-center text-[11px] text-slate-400 font-medium border-r border-b border-slate-200 py-1 px-1 sticky left-0 z-10"
            style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc', minWidth: 36 }}
          >
            {startIdx + i + 1}
          </td>
          <td
            className="text-[11px] font-semibold text-slate-800 border-r border-b border-slate-200 px-2 py-1 whitespace-nowrap sticky"
            style={{ left: 36, background: i % 2 === 0 ? '#fff' : '#f8fafc', minWidth: 200, zIndex: 10 }}
          >
            {student.name}
          </td>
          {sf3Subjects.map(subject => {
            const rec = row[subject] || {}
            return (
              <>
                <td
                  key={subject + '-issued'}
                  className="border-r border-b border-slate-100 p-0"
                  style={{ minWidth: 96 }}
                >
                  <DateCellInput
                    value={rec.dateIssued || ''}
                    onChange={v => handleSetRecord(student.lrn, subject, 'dateIssued', v)}
                    placeholder="Click to set Issued date"
                  />
                </td>
                <td
                  key={subject + '-returned'}
                  className="border-r border-b border-slate-100 p-0"
                  style={{ minWidth: 96, borderRight: '2px solid #DDE4EE' }}
                >
                  <DateCellInput
                    value={rec.dateReturned || ''}
                    onChange={v => handleSetRecord(student.lrn, subject, 'dateReturned', v)}
                    placeholder="Click to set Returned date"
                  />
                </td>
              </>
            )
          })}
          {/* Remarks column */}
          <td className="border-b border-slate-100 px-2 py-1 text-[10px] text-slate-400 min-w-[120px]" />
        </tr>
      )
    })

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: '#111A24' }}>
            School Form 3 <span className="text-lg font-semibold text-slate-400">(SF3)</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8898AC' }}>
            Books Issued and Returned — Grade {schoolInfo.gradeLevel} {schoolInfo.section} · {schoolInfo.schoolYear}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {saved && (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1.5">
              <CheckCircle2 size={12} /> Auto-saved
            </span>
          )}
          <button
            onClick={openSubjectEditor}
            className="h-9 px-3 rounded-lg text-sm font-semibold flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
            style={{ color: '#5A6A7E' }}
          >
            <Settings2 size={14} /> Manage Subjects
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="h-9 px-4 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(180deg,#E30A24,#B5081C)', color: '#fff' }}
          >
            <Download size={14} />
            {exporting ? 'Generating…' : 'Export SF3 Excel'}
          </button>
        </div>
      </div>

      {/* School Info bar */}
      <div className="rounded-xl px-4 py-3 flex flex-wrap gap-x-6 gap-y-1 text-xs" style={{ background: '#F4F7FA', border: '1px solid #DDE4EE' }}>
        <span><span className="font-bold text-slate-500">School:</span> <span className="text-slate-800">{schoolInfo.schoolName}</span></span>
        <span><span className="font-bold text-slate-500">School ID:</span> <span className="text-slate-800">{schoolInfo.schoolId}</span></span>
        <span><span className="font-bold text-slate-500">Grade Level:</span> <span className="text-slate-800">{schoolInfo.gradeLevel}</span></span>
        <span><span className="font-bold text-slate-500">Section:</span> <span className="text-slate-800">{schoolInfo.section}</span></span>
        <span><span className="font-bold text-slate-500">School Year:</span> <span className="text-slate-800">{schoolInfo.schoolYear}</span></span>
      </div>

      {/* How to use tip */}
      <div className="text-xs text-slate-500 bg-blue-50/60 border border-blue-200/50 rounded-lg px-4 py-2.5 flex items-center gap-2">
        <span className="text-blue-500 font-bold">💡 Tip:</span>
        Click any cell under a subject column to set the date a book was issued or returned. Dates auto-save instantly.
      </div>

      {/* Matrix Table */}
      <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="border-collapse w-full" style={{ minWidth: 700 }}>
            <thead>
              {/* Subject row */}
              <tr className="bg-slate-800">
                <th
                  className="text-center text-[10px] font-bold text-slate-300 uppercase border-r border-slate-600 py-2 px-1 sticky left-0 z-20 bg-slate-800"
                  style={{ minWidth: 36 }}
                  rowSpan={2}
                >
                  No.
                </th>
                <th
                  className="text-left text-[10px] font-bold text-slate-300 uppercase border-r border-slate-600 px-3 py-2 sticky z-20 bg-slate-800"
                  style={{ left: 36, minWidth: 200 }}
                  rowSpan={2}
                >
                  Learner&apos;s Name
                  <span className="block font-normal text-slate-500 text-[9px] normal-case">(Last Name, First Name, Middle Name)</span>
                </th>
                {sf3Subjects.map(sub => (
                  <th
                    key={sub}
                    colSpan={2}
                    className="text-center text-[10px] font-bold text-white px-2 py-2 border-l-2 border-slate-600"
                    style={{ borderRight: '2px solid #475569' }}
                  >
                    <div className="leading-tight">{sub}</div>
                  </th>
                ))}
                <th
                  className="text-center text-[10px] font-bold text-slate-300 uppercase border-l-2 border-slate-600 px-2 py-2"
                  rowSpan={2}
                  style={{ minWidth: 120 }}
                >
                  Remarks/<br/>Action Taken
                </th>
              </tr>
              {/* Issued/Returned sub-row */}
              <tr className="bg-slate-700">
                {sf3Subjects.map(sub => (
                  <>
                    <th
                      key={sub + '-issued'}
                      className="text-center text-[10px] text-blue-300 font-bold py-1.5 px-1 border-l-2 border-slate-600"
                      style={{ minWidth: 96 }}
                    >
                      Date Issued
                    </th>
                    <th
                      key={sub + '-ret'}
                      className="text-center text-[10px] text-amber-300 font-bold py-1.5 px-1"
                      style={{ minWidth: 96, borderRight: '2px solid #475569' }}
                    >
                      Date Returned
                    </th>
                  </>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Male section */}
              <tr className="bg-blue-50">
                <td
                  colSpan={2 + sf3Subjects.length * 2 + 1}
                  className="px-3 py-1.5 text-[11px] font-black text-blue-800 uppercase tracking-widest border-b border-blue-200"
                >
                  ● Male
                </td>
              </tr>
              {renderStudentRows(males, 0)}

              {/* Female section */}
              <tr className="bg-pink-50">
                <td
                  colSpan={2 + sf3Subjects.length * 2 + 1}
                  className="px-3 py-1.5 text-[11px] font-black text-pink-800 uppercase tracking-widest border-b border-pink-200 border-t border-t-slate-200"
                >
                  ● Female
                </td>
              </tr>
              {renderStudentRows(females, males.length)}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subject Editor Modal */}
      {editingSubjects && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-slate-800">Manage Subject Columns</h3>
              <button onClick={() => setEditingSubjects(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">Drag to reorder. These become columns in the SF3 matrix and the Excel export.</p>
            <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
              {subjectDraft.map((sub, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className="flex-1 h-9 text-sm border border-slate-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-blue-300 bg-slate-50"
                    value={sub}
                    onChange={e => {
                      const next = [...subjectDraft]
                      next[i] = e.target.value
                      setSubjectDraft(next)
                    }}
                  />
                  <button
                    onClick={() => setSubjectDraft(subjectDraft.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mb-4">
              <input
                className="flex-1 h-9 text-sm border border-dashed border-blue-300 rounded-lg px-3 outline-none focus:ring-2 focus:ring-blue-300 bg-blue-50/40"
                placeholder="Add new subject…"
                value={newSubject}
                onChange={e => setNewSubject(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newSubject.trim()) {
                    setSubjectDraft([...subjectDraft, newSubject.trim()])
                    setNewSubject("")
                  }
                }}
              />
              <button
                onClick={() => {
                  if (newSubject.trim()) {
                    setSubjectDraft([...subjectDraft, newSubject.trim()])
                    setNewSubject("")
                  }
                }}
                className="h-9 px-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingSubjects(false)}
                className="flex-1 h-10 rounded-xl text-sm font-semibold border border-slate-200 hover:bg-slate-50 text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={saveSubjects}
                className="flex-1 h-10 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(180deg,#003876,#002560)' }}
              >
                Save Columns
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
