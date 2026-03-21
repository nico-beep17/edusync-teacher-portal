"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect, useMemo } from "react"
import { useTeacherStore } from "@/store/useStore"
import { Book, Save, BookOpen, Clock, Download } from "lucide-react"

export default function SF3Page() {
  const [mounted, setMounted] = useState(false)
  const students = useTeacherStore(s => s.students)
  const books = useTeacherStore(s => s.books)
  const schoolInfo = useTeacherStore(s => s.schoolInfo)
  const issueBook = useTeacherStore(s => s.issueBook)
  const returnBook = useTeacherStore(s => s.returnBook)
  
  const [selectedLrn, setSelectedLrn] = useState<string>('')
  const [bookTitle, setBookTitle] = useState('')
  const [dateField, setDateField] = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const handleIssueSubmit = () => {
      if (!selectedLrn || !bookTitle.trim()) return;
      issueBook(selectedLrn, { title: bookTitle.trim(), dateIssued: dateField })
      setBookTitle('')
  }

  const selectedStudentName = useMemo(() => {
     return students.find(s => s.lrn === selectedLrn)?.name || ''
  }, [students, selectedLrn])

  const studentBooks = selectedLrn ? (books[selectedLrn] || []) : []

  const handleReturn = (lrn: string, bookId: string) => {
      returnBook(lrn, bookId, dateField)
  }

  const handleExport = async () => {
      try {
          const res = await fetch('/api/export/sf', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ form: 'sf3', students, books, schoolInfo })
          });
          if (!res.ok) throw new Error("SF3 Export failed");
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Books_Issued_Grade8_ARIES_SF3.xlsx`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
      } catch (err: any) {
          alert("Export Error: " + err.message);
      }
  }

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
             onClick={handleExport} 
             className="skeu-btn h-9 px-4 rounded-lg text-sm font-bold flex items-center gap-2 transition-transform active:scale-95" 
             style={{ background: 'linear-gradient(180deg, #E30A24, #B5081C)', color: '#FFF' }}
          >
             <Download size={14} /> Export SF3 Excel
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
              <p className="text-xs text-slate-500 mt-1">Select a learner and assign a book to them.</p>
            </div>
            
            <div className="p-5 flex flex-col gap-4">
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

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Book Title</label>
                <Input 
                   placeholder="e.g. Science 8 Learner's Module" 
                   value={bookTitle} 
                   onChange={e => setBookTitle(e.target.value)}
                   className="skeu-input h-10 text-sm"
                   onKeyDown={e => e.key === 'Enter' && handleIssueSubmit()}
                />
              </div>

              <button 
                onClick={handleIssueSubmit} 
                className="skeu-btn mt-2 h-10 w-full rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                disabled={!selectedLrn || !bookTitle.trim()}
                style={{ opacity: (!selectedLrn || !bookTitle.trim()) ? 0.5 : 1 }}
              >
                <Save size={14} /> Issue Book to Learner
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
              
              <div className="p-0">
                {studentBooks.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center">
                    <Book className="w-12 h-12 text-slate-200 mb-3" />
                    <p className="text-base font-bold" style={{ color: '#5A6A7E' }}>No books issued yet</p>
                    <p className="text-sm mt-1" style={{ color: '#8898AC' }}>Use the form to issue the first book.</p>
                  </div>
                ) : (
                  <Table className="min-w-full">
                    <TableHeader className="bg-slate-50/50 border-b-0">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-10 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Book Title</TableHead>
                        <TableHead className="h-10 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[110px]">Date Issued</TableHead>
                        <TableHead className="h-10 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[120px]">Status</TableHead>
                        <TableHead className="h-10 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[110px] text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentBooks.map(b => (
                        <TableRow key={b.id} className={`transition-colors ${b.dateReturned ? "bg-slate-50/50 opacity-60" : "bg-white"}`}>
                          <TableCell className="font-bold text-slate-800 py-3">{b.title}</TableCell>
                          <TableCell className="text-xs text-slate-600 font-medium py-3">{b.dateIssued}</TableCell>
                          <TableCell className="py-3">
                            {b.dateReturned ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-1 rounded border border-emerald-200 whitespace-nowrap">
                                Returned {b.dateReturned}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-1 rounded border border-amber-200 flex items-center gap-1 w-fit whitespace-nowrap">
                                <Clock size={10} /> Borrowed
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right py-3">
                            {!b.dateReturned && (
                              <button 
                                onClick={() => handleReturn(selectedLrn, b.id)}
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
