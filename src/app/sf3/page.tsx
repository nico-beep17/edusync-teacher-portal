"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { useTeacherStore } from "@/store/useStore"
import { Book, Save, BookOpen, Clock, Download } from "lucide-react"

export default function SF3Page() {
  const [mounted, setMounted] = useState(false)
  const students = useTeacherStore(s => s.students)
  const books = useTeacherStore(s => s.books)
  const schoolInfo = useTeacherStore(s => s.schoolInfo)
  const issueBook = useTeacherStore(s => s.issueBook)
  const returnBook = useTeacherStore(s => s.returnBook)
  
  const [issueInputs, setIssueInputs] = useState<Record<string, string>>({})
  const [dateField, setDateField] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const handleIssue = (lrn: string) => {
      const title = issueInputs[lrn]
      if (!title?.trim()) { alert("Enter a book title."); return; }
      issueBook(lrn, { title: title.trim(), dateIssued: dateField })
      setIssueInputs(prev => ({ ...prev, [lrn]: '' }))
  }

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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">School Form 3 (SF3)</h1>
          <p className="text-muted-foreground mt-1">Books Issued and Returned</p>
        </div>
        <div className="flex items-center gap-3">
          <Input 
             type="date" 
             value={dateField} 
             onChange={e => setDateField(e.target.value)}
             className="w-[150px]"
          />
          <Button onClick={handleExport} className="bg-[#E3001B] hover:bg-[#B30015]">
             <Download className="mr-2 h-4 w-4" /> Export SF3
          </Button>
        </div>
      </div>

      <Card className="bg-white shadow-sm border border-slate-200/60 overflow-hidden">
        <CardHeader className="bg-slate-50 border-b pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" /> Learner Book Inventory
          </CardTitle>
          <CardDescription>
              Track individual learning resources issued and returned per learner.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[800px]">
             <TableHeader className="bg-slate-100/50">
               <TableRow>
                 <TableHead className="w-[80px]">No.</TableHead>
                 <TableHead className="w-[250px] border-r">Learner's Name</TableHead>
                 <TableHead className="min-w-[300px]">Books Issued</TableHead>
                 <TableHead className="w-[300px] border-l">Quick Issue</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {/* MALES */}
               <TableRow className="bg-blue-50/30">
                 <TableCell colSpan={4} className="font-semibold text-xs text-blue-800 tracking-wider py-2">MALE</TableCell>
               </TableRow>
               {students.filter(s => s.sex === 'M').map((s, i) => (
                  <TableRow key={s.lrn}>
                     <TableCell className="text-slate-500">{i + 1}</TableCell>
                     <TableCell className="font-medium border-r">{s.name}</TableCell>
                     <TableCell>
                        <div className="flex flex-col gap-2">
                           {(books[s.lrn] || []).length === 0 && <span className="text-slate-400 text-sm italic">No books issued</span>}
                           {(books[s.lrn] || []).map(b => (
                               <div key={b.id} className={`flex items-center justify-between p-2 rounded-md border text-sm ${b.dateReturned ? 'bg-slate-50 border-slate-200' : 'bg-amber-50/50 border-amber-200'}`}>
                                  <div>
                                     <span className="font-semibold mr-2">{b.title}</span>
                                     <span className="text-xs text-slate-500">Issued: {b.dateIssued}</span>
                                     {b.dateReturned && <span className="text-xs text-blue-600 ml-2 font-medium bg-blue-100/50 px-1.5 py-0.5 rounded">Returned {b.dateReturned}</span>}
                                  </div>
                                  {!b.dateReturned && (
                                     <Button variant="ghost" size="sm" onClick={() => handleReturn(s.lrn, b.id)} className="h-7 text-xs text-amber-700 bg-amber-100/50 hover:bg-amber-100">
                                         Mark Returned
                                     </Button>
                                  )}
                               </div>
                           ))}
                        </div>
                     </TableCell>
                     <TableCell className="border-l">
                         <div className="flex items-center gap-2">
                             <Input 
                                placeholder="Book Title..." 
                                value={issueInputs[s.lrn] || ''} 
                                onChange={e => setIssueInputs({...issueInputs, [s.lrn]: e.target.value})}
                                onKeyDown={e => e.key === 'Enter' && handleIssue(s.lrn)}
                                className="h-8 text-sm"
                             />
                             <Button size="sm" onClick={() => handleIssue(s.lrn)} className="h-8 px-3">Issue</Button>
                         </div>
                     </TableCell>
                  </TableRow>
               ))}
               
               {/* FEMALES */}
               <TableRow className="bg-pink-50/30">
                 <TableCell colSpan={4} className="font-semibold text-xs text-pink-800 tracking-wider py-2 border-t">FEMALE</TableCell>
               </TableRow>
               {students.filter(s => s.sex === 'F').map((s, i) => (
                  <TableRow key={s.lrn}>
                     <TableCell className="text-slate-500">{i + 1}</TableCell>
                     <TableCell className="font-medium border-r">{s.name}</TableCell>
                     <TableCell>
                        <div className="flex flex-col gap-2">
                           {(books[s.lrn] || []).length === 0 && <span className="text-slate-400 text-sm italic">No books issued</span>}
                           {(books[s.lrn] || []).map(b => (
                               <div key={b.id} className={`flex items-center justify-between p-2 rounded-md border text-sm ${b.dateReturned ? 'bg-slate-50 border-slate-200' : 'bg-amber-50/50 border-amber-200'}`}>
                                  <div>
                                     <span className="font-semibold mr-2">{b.title}</span>
                                     <span className="text-xs text-slate-500">Issued: {b.dateIssued}</span>
                                     {b.dateReturned && <span className="text-xs text-blue-600 ml-2 font-medium bg-blue-100/50 px-1.5 py-0.5 rounded">Returned {b.dateReturned}</span>}
                                  </div>
                                  {!b.dateReturned && (
                                     <Button variant="ghost" size="sm" onClick={() => handleReturn(s.lrn, b.id)} className="h-7 text-xs text-amber-700 bg-amber-100/50 hover:bg-amber-100">
                                         Mark Returned
                                     </Button>
                                  )}
                               </div>
                           ))}
                        </div>
                     </TableCell>
                     <TableCell className="border-l">
                         <div className="flex items-center gap-2">
                             <Input 
                                placeholder="Book Title..." 
                                value={issueInputs[s.lrn] || ''} 
                                onChange={e => setIssueInputs({...issueInputs, [s.lrn]: e.target.value})}
                                onKeyDown={e => e.key === 'Enter' && handleIssue(s.lrn)}
                                className="h-8 text-sm"
                             />
                             <Button size="sm" onClick={() => handleIssue(s.lrn)} className="h-8 px-3">Issue</Button>
                         </div>
                     </TableCell>
                  </TableRow>
               ))}
             </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
