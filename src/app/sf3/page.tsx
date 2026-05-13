"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { useState, useEffect, useMemo } from "react"
import { useTeacherStore } from "@/store/useStore"
import { Book, Save, BookOpen, Clock, Download, Trash2 } from "lucide-react"
import { toast } from "sonner"

export default function SF3Page() {
  const [mounted, setMounted] = useState(false)
  const [csrfToken, setCsrfToken] = useState('')
  const students = useTeacherStore(s => s.students)
  const books = useTeacherStore(s => s.books)
  const schoolInfo = useTeacherStore(s => s.schoolInfo)
  const setSf3Record = useTeacherStore(s => s.setSf3Record)
  const sf3Subjects = useTeacherStore(s => s.sf3Subjects)
  const clearSf3Books = useTeacherStore(s => s.clearSf3Books)

  const [selectedLrn, setSelectedLrn] = useState<string>('')
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [dateField, setDateField] = useState(() => new Date().toISOString().split('T')[0])
  const [saved, setSaved] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetch('/api/export/sf')
      .then(r => r.json())
      .then(d => {
        if (d.csrfToken) {
          setCsrfToken(d.csrfToken)
          document.cookie = `csrf-token=${d.csrfToken}; path=/; SameSite=Strict`
        }
      })
      .catch(() => {})
  }, [])

  const handleIssueSubmit = () => {
    if (!selectedLrn || !selectedSubject) return
    const existing = books[selectedLrn]?.[selectedSubject] || {}
    setSf3Record(selectedLrn, selectedSubject, { ...existing, dateIssued: dateField })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSetRemarks = (subject: string, value: string) => {
    const existing = books[selectedLrn]?.[subject] || {}
    setSf3Record(selectedLrn, subject, { ...existing, remarks: value })
  }

  const handleSetReturnCode = (subject: string, value: string) => {
    const existing = books[selectedLrn]?.[subject] || {}
    setSf3Record(selectedLrn, subject, { ...existing, returnCode: value })
  }

  const selectedStudentName = useMemo(() => {
    return students.find(s => s.lrn === selectedLrn)?.name || ''
  }, [students, selectedLrn])

  // Flatten books for the selected student into a list
  const studentBooks = useMemo(() => {
    if (!selectedLrn) return []
    const subMap = books[selectedLrn] || {}
    return Object.entries(subMap).map(([subject, rec]) => ({
      subject,
      dateIssued: rec.dateIssued || '',
      dateReturned: rec.dateReturned || '',
      returnCode: rec.returnCode || '',
      remarks: rec.remarks || '',
    }))
  }, [books, selectedLrn])

  const handleReturn = (subject: string) => {
    const existing = books[selectedLrn]?.[subject] || {}
    setSf3Record(selectedLrn, subject, { ...existing, dateReturned: dateField })
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      // Debug: console.log('[SF3 EXPORT] books payload:', JSON.stringify(books, null, 2))
      const res = await fetch('/api/export/sf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken || ''
        },
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
      toast.error("Export Error: " + err.message)
    } finally {
      setExporting(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: '#111A24' }}>School Form 3 (SF3)</h1>
          <p className="text-sm mt-1" style={{ color: '#8898AC' }}>Books Issued and Returned Data Entry</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            type="date"
            value={dateField}
            onChange={e => setDateField(e.target.value)}
            className="skeu-input w-[140px] h-9 text-sm"
          />
          <button
            onClick={() => {
              if (confirm('Clear all SF3 book data? This cannot be undone.'))
                clearSf3Books()
            }}
            className="h-9 px-3 rounded-lg text-sm font-semibold flex items-center gap-1.5 border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          >
            <Trash2 size={13} /> Clear Data
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="skeu-btn h-9 px-4 rounded-lg text-sm font-bold flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(180deg, #E30A24, #B5081C)', color: '#FFF' }}
          >
            <Download size={14} /> {exporting ? 'Generating…' : 'Export SF3 Excel'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Column: Data Entry Form */}
        <div className="md:col-span-1 space-y-4">
          <div className="rounded-xl overflow-hidden" style={{ background: "linear-gradient(160deg, #FFFFFF 0%, #FAFCFF 100%)", border: "1px solid #DDE4EE", boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 4px 12px rgba(0,0,0,0.08)" }}>
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-base font-black flex items-center gap-2" style={{ color: '#111A24' }}>
                <BookOpen size={16} className="text-indigo-500" />
                Issue a Book
              </h2>
              <p className="text-xs text-slate-500 mt-1">Select a learner and subject to record the issued book.</p>
            </div>

            <div className="p-5 flex flex-col gap-4">
              {/* Learner Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Select Learner</label>
                <div className="relative">
                  <select
                    className="skeu-input h-10 px-3 text-sm rounded-lg w-full focus:outline-none appearance-none pr-8 bg-white"
                    value={selectedLrn}
                    onChange={e => setSelectedLrn(e.target.value)}
                    style={{ color: selectedLrn ? '#111A24' : '#8898AC' }}
                  >
                    <option value="" disabled>-- Select a student --</option>
                    <optgroup label="Males">
                      {students.filter(s => s.sex === 'M').map(s => <option key={s.lrn} value={s.lrn}>{s.name}</option>)}
                    </optgroup>
                    <optgroup label="Females">
                      {students.filter(s => s.sex === 'F').map(s => <option key={s.lrn} value={s.lrn}>{s.name}</option>)}
                    </optgroup>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>

              {/* Subject Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Subject / Book</label>
                <div className="relative">
                  <select
                    className="skeu-input h-10 px-3 text-sm rounded-lg w-full focus:outline-none appearance-none pr-8 bg-white"
                    value={selectedSubject}
                    onChange={e => setSelectedSubject(e.target.value)}
                    style={{ color: selectedSubject ? '#111A24' : '#8898AC' }}
                  >
                    <option value="" disabled>-- Select subject --</option>
                    {sf3Subjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>


              <button
                onClick={handleIssueSubmit}
                className="skeu-btn mt-2 h-10 w-full rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                disabled={!selectedLrn || !selectedSubject}
                style={{ opacity: (!selectedLrn || !selectedSubject) ? 0.5 : 1 }}
              >
                {saved ? <><Save size={14} /> Saved!</> : <><Save size={14} /> Record as Issued</>}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Inventory Table */}
        <div className="md:col-span-2">
          {selectedLrn ? (
            <div className="rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ background: "linear-gradient(160deg, #FFFFFF 0%, #FAFCFF 100%)", border: "1px solid #DDE4EE", boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 4px 12px rgba(0,0,0,0.08)" }}>
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div>
                  <h2 className="text-base font-black flex items-center gap-2" style={{ color: '#111A24' }}>
                    <Book size={16} className="text-blue-500" />
                    Learner Inventory
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Books currently assigned to <span className="font-bold text-slate-800">{selectedStudentName}</span>
                  </p>
                </div>
                <div className="text-xs font-bold px-2 py-1 bg-slate-200/50 text-slate-600 rounded">
                  {studentBooks.length} Total
                </div>
              </div>

              {/* SF3 Field Legend — always visible */}
              <div className="mx-0 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[10.5px] text-slate-600 leading-relaxed">
                <div className="grid grid-cols-2 gap-x-4">
                  <div>
                    <p className="font-bold text-slate-700 mb-0.5">📅 Date Returned column codes (for unreturned books):</p>
                    <span className="mr-3"><strong>FM</strong> = Force Majeure</span>
                    <span className="mr-3"><strong>TDO</strong> = Transferred/Dropout</span>
                    <span><strong>NEG</strong> = Negligence</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-700 mb-0.5">📋 Remark/Action Taken column codes:</p>
                    <span className="mr-3"><strong>LLTR</strong> = Secured Letter <em>(for FM)</em></span>
                    <span className="mr-3"><strong>TLTR</strong> = Teacher Letter <em>(for TDO)</em></span>
                    <span><strong>PTL</strong> = Paid by Learner <em>(for NEG)</em></span>
                  </div>
                </div>
              </div>
              <div className="p-0">
                {studentBooks.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center">
                    <Book className="w-12 h-12 text-slate-200 mb-3" />
                    <p className="text-base font-bold" style={{ color: '#5A6A7E' }}>No books issued yet</p>
                    <p className="text-sm mt-1" style={{ color: '#8898AC' }}>Use the form to record an issued book.</p>
                  </div>
                ) : (
                  <Table className="min-w-full">
                    <TableHeader className="bg-slate-50/50 border-b-0">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-10 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Subject / Book</TableHead>
                        <TableHead className="h-10 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[90px]">Date Issued</TableHead>
                        <TableHead className="h-10 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[115px]">Date Returned</TableHead>
                        <TableHead className="h-10 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[120px]">Remark / Action</TableHead>
                        <TableHead className="h-10 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[90px] text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentBooks.map(b => (
                        <TableRow key={b.subject} className={`transition-colors ${b.dateReturned ? "bg-slate-50/50 opacity-60" : "bg-white"}`}>
                          <TableCell className="font-bold text-slate-800 py-3">{b.subject}</TableCell>
                          <TableCell className="text-xs text-slate-600 font-medium py-3">{b.dateIssued}</TableCell>

                          {/* Date Returned column: shows actual date if returned, else FM/TDO/NEG select */}
                          <TableCell className="py-2">
                            {b.dateReturned ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-1 rounded border border-emerald-200 whitespace-nowrap">
                                ✓ {b.dateReturned}
                              </span>
                            ) : (
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-1 rounded border border-amber-200 flex items-center gap-1 w-fit whitespace-nowrap">
                                  <Clock size={10} /> Borrowed
                                </span>
                                <select
                                  className="text-[10px] border border-slate-200 rounded px-1.5 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-red-300 text-slate-700 w-full"
                                  value={b.returnCode}
                                  onChange={e => handleSetReturnCode(b.subject, e.target.value)}
                                >
                                  <option value="">— code —</option>
                                  <option value="FM">FM</option>
                                  <option value="TDO">TDO</option>
                                  <option value="NEG">NEG</option>
                                </select>
                              </div>
                            )}
                          </TableCell>

                          {/* Remark/Action Taken column: LLTR / TLTR / PTL */}
                          <TableCell className="py-2">
                            {!b.dateReturned ? (
                              <select
                                className="w-full text-[10px] border border-slate-200 rounded px-1.5 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-amber-300 text-slate-700"
                                value={b.remarks}
                                onChange={e => handleSetRemarks(b.subject, e.target.value)}
                              >
                                <option value="">— action —</option>
                                <option value="LLTR">LLTR</option>
                                <option value="TLTR">TLTR</option>
                                <option value="PTL">PTL</option>
                              </select>
                            ) : (
                              <span className="text-[11px] text-slate-400">{b.remarks || '—'}</span>
                            )}
                          </TableCell>

                          <TableCell className="text-right py-3">
                            {!b.dateReturned && (
                              <button
                                onClick={() => handleReturn(b.subject)}
                                className="skeu-btn-ghost h-7 px-3 rounded text-[11px] font-bold whitespace-nowrap text-amber-700 border border-amber-200 hover:bg-amber-50"
                              >
                                Mark Return
                              </button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/30 flex flex-col items-center justify-center text-center p-12 min-h-[300px]">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 border border-slate-200 shadow-sm shadow-slate-200/50">
                <BookOpen className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-lg font-black" style={{ color: '#5A6A7E' }}>Select a Learner First</p>
              <p className="text-sm mt-1 max-w-[250px]" style={{ color: '#8898AC' }}>Choose a student from the dropdown menu to view and manage their assigned books.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
