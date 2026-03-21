"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Calculator, Printer, FileDown, Inbox, CheckCircle2, Clock, Loader2 } from "lucide-react"
import { useTeacherStore } from "@/store/useStore"
import { useEffect, useState } from "react"
import { exportToCSV } from "@/lib/export-utils"
import Link from "next/link"

const computeAverage = (grades: any[], requiredSubjects: string[]) => {
  if (grades.length === 0) return "0"
  
  let sum = 0;
  let count = 0;
  
  requiredSubjects.forEach(sub => {
    const gradeEntry = grades.find(g => g.subject.toLowerCase().includes(sub.toLowerCase()))
    if (gradeEntry) {
       sum += gradeEntry.quarterGrade;
       count++;
    }
  })
  
  if (count === 0) return "0";
  return (sum / count).toFixed(2);
}

export default function CompositeGradesPage() {
  const [mounted, setMounted] = useState(false)
  const [finalized, setFinalized] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const students = useTeacherStore(s => s.students)
  const gradesMap = useTeacherStore(s => s.grades)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // The core subjects that should have grades
  const subjects = ['Filipino', 'English', 'Mathematics', 'Science', 'Ap', 'Epp/tle', 'Mapeh', 'Esp']

  const handleExport = async () => {
      setIsExporting(true)
      try {
          const exportStudents = students.map(s => {
              const sGrades = gradesMap[s.lrn] || []
              return { ...s, average: parseFloat(computeAverage(sGrades, subjects)) }
          })
          const res = await fetch('/api/export/sf', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ form: 'composite', students: exportStudents, schoolInfo: useTeacherStore.getState().schoolInfo })
          });
          if (!res.ok) throw new Error("Template mapping failed. Ensure 'Composite G8 ARIES.xlsx' is in public/templates/");
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          
          // Better File Naming Convention
          const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
          a.download = `Composite_Grades_Grade8_ARIES_Q1_${timestamp}.xlsx`;
          
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
      } catch (err: any) {
          alert("Native Export Error: " + err.message);
      } finally {
          setIsExporting(false)
      }
  }
  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Composite Grades (Form 138 Data)</h1>
          <p className="text-muted-foreground mt-1">Grade 8 - ARIES • Quarter 1</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/print-cards">
            <Button variant="outline" className="bg-white hover:bg-blue-50 text-[#003876] border-blue-200 shadow-sm transition-colors">
               <Printer className="mr-2 h-4 w-4" /> Print Cards (SF9)
            </Button>
          </Link>
          <Button onClick={() => window.print()} variant="outline" className="bg-white hover:bg-slate-50 text-slate-700 shadow-sm">
             <Printer className="mr-2 h-4 w-4" /> Print Composite
          </Button>
          <Button onClick={handleExport} disabled={isExporting} className="bg-[#E3001B] hover:bg-[#B30015] transition-all">
            {isExporting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin outline-none" />
                Generating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <FileDown className="w-4 h-4" /> Export to Excel
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Grade Submissions Inbox Widget */}
      <Card className="bg-gradient-to-r from-indigo-50/50 to-blue-50/50 border border-indigo-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl transform translate-x-8 -translate-y-8"></div>
        <CardContent className="p-4 sm:p-5">
           <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
               <div>
                  <div className="flex items-center font-bold text-slate-800 text-lg mb-1">
                      <Inbox className="w-5 h-5 mr-2 text-indigo-500" /> Subject Teacher Submissions
                  </div>
                  <p className="text-sm text-slate-500 max-w-xl">
                      Tracking final E-Class Records transmitted remotely by your co-teachers. 
                      Once a subject hits 100%, it automatically computes into the General Average.
                  </p>
               </div>
               
               <div className="flex flex-wrap gap-2 justify-end w-full md:w-auto">
                  {subjects.map(sub => {
                     const submittedCount = students.filter(s => {
                         const sGrades = gradesMap[s.lrn] || [];
                         return sGrades.some(g => g.subject.toLowerCase().includes(sub.toLowerCase()));
                     }).length;
                     const totalCount = students.length;
                     const isComplete = totalCount > 0 && submittedCount === totalCount;
                     
                     return (
                        <div key={sub} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border ${isComplete ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-slate-600 border-slate-200 shadow-sm'}`}>
                           {isComplete ? <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> : <Clock className="w-3.5 h-3.5 text-amber-500" />}
                           {sub}
                           <span className={`ml-1 px-1.5 py-0.5 rounded-sm ${isComplete ? 'bg-blue-100/50 text-blue-800' : 'bg-slate-100 text-slate-500'}`}>
                             {submittedCount}/{totalCount}
                           </span>
                        </div>
                     )
                  })}
               </div>
           </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-md shadow-sm border border-slate-200/60 overflow-hidden">
        <CardHeader className="bg-white/50 border-b flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle>Master Grade Aggregator</CardTitle>
            <CardDescription className="mt-1">
              Automatically synchronized from Subject Teacher ECR submissions.
            </CardDescription>
          </div>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => {
              const allComplete = subjects.every(sub => students.every(s => {
                const gList = gradesMap[s.lrn] || []
                return gList.some(g => g.subject.toLowerCase().includes(sub.toLowerCase()))
              }))
              if (!allComplete) {
                alert('Cannot finalize: Not all subjects have complete grades. Check the Subject Teacher Submissions widget above.')
                return
              }
              setFinalized(true)
              setTimeout(() => setFinalized(false), 4000)
            }}
            className={finalized ? 'bg-blue-100 text-blue-700' : ''}
          >
            {finalized 
              ? <><CheckCircle2 className="mr-2 h-4 w-4" /> Finalized!</>
              : <><Calculator className="mr-2 h-4 w-4" /> Finalize General Average</>
            }
          </Button>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[1000px]">
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="w-[50px]">No.</TableHead>
                <TableHead className="w-[250px] border-r">Learner's Name</TableHead>
                <TableHead className="text-center font-semibold">Filipino</TableHead>
                <TableHead className="text-center font-semibold">English</TableHead>
                <TableHead className="text-center font-semibold">Math</TableHead>
                <TableHead className="text-center font-semibold">Science</TableHead>
                <TableHead className="text-center font-semibold">AP</TableHead>
                <TableHead className="text-center font-semibold">TLE</TableHead>
                <TableHead className="text-center font-semibold">MAPEH</TableHead>
                <TableHead className="text-center font-semibold border-r">EsP</TableHead>
                <TableHead className="text-center font-bold text-slate-800 bg-slate-100/50">Gen. Average</TableHead>
                <TableHead className="text-center font-bold text-slate-800 bg-slate-100/50">Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Male Section Header */}
              <TableRow className="bg-blue-50/30">
                <TableCell colSpan={12} className="font-semibold text-xs tracking-wider text-blue-800">MALE</TableCell>
              </TableRow>
              {students.filter(s => s.sex === 'M').map((student, idx) => {
                const sGrades = gradesMap[student.lrn] || []
                const avg = parseFloat(computeAverage(sGrades, subjects))
                const remarks = avg >= 75 ? "Passed" : (avg === 0 ? "Pending" : "Failed")
                
                const getGrade = (sub: string) => sGrades.find(g => g.subject.toLowerCase().includes(sub.toLowerCase()))?.quarterGrade || '-'
                
                return (
                  <TableRow key={student.lrn} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="text-slate-500">{idx + 1}</TableCell>
                    <TableCell className="font-medium border-r">{student.name}</TableCell>
                    <TableCell className="text-center">{getGrade('Filipino')}</TableCell>
                    <TableCell className="text-center">{getGrade('English')}</TableCell>
                    <TableCell className="text-center">{getGrade('Mathematics')}</TableCell>
                    <TableCell className="text-center">{getGrade('Science')}</TableCell>
                    <TableCell className="text-center">{getGrade('Ap')}</TableCell>
                    <TableCell className="text-center">{getGrade('Epp/tle')}</TableCell>
                    <TableCell className="text-center">{getGrade('Mapeh')}</TableCell>
                    <TableCell className="text-center border-r">{getGrade('Esp')}</TableCell>
                    <TableCell className="text-center font-bold text-slate-900 bg-slate-50/50">{avg > 0 ? avg : '-'}</TableCell>
                    <TableCell className={`text-center font-medium ${remarks === 'Passed' ? 'text-[#003876]' : remarks === 'Pending' ? 'text-amber-500' : 'text-red-500'} bg-slate-50/50`}>{remarks}</TableCell>
                  </TableRow>
                )
              })}

              {/* Female Section Header */}
              <TableRow className="bg-pink-50/30">
                <TableCell colSpan={12} className="font-semibold text-xs tracking-wider text-pink-800">FEMALE</TableCell>
              </TableRow>
              {students.filter(s => s.sex === 'F').map((student, idx) => {
                const sGrades = gradesMap[student.lrn] || []
                const avg = parseFloat(computeAverage(sGrades, subjects))
                const remarks = avg >= 75 ? "Passed" : (avg === 0 ? "Pending" : "Failed")
                
                const getGrade = (sub: string) => sGrades.find(g => g.subject.toLowerCase().includes(sub.toLowerCase()))?.quarterGrade || '-'
                
                return (
                  <TableRow key={student.lrn} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="text-slate-500">{idx + 1}</TableCell>
                    <TableCell className="font-medium border-r">{student.name}</TableCell>
                    <TableCell className="text-center">{getGrade('Filipino')}</TableCell>
                    <TableCell className="text-center">{getGrade('English')}</TableCell>
                    <TableCell className="text-center">{getGrade('Mathematics')}</TableCell>
                    <TableCell className="text-center">{getGrade('Science')}</TableCell>
                    <TableCell className="text-center">{getGrade('Ap')}</TableCell>
                    <TableCell className="text-center">{getGrade('Epp/tle')}</TableCell>
                    <TableCell className="text-center">{getGrade('Mapeh')}</TableCell>
                    <TableCell className="text-center border-r">{getGrade('Esp')}</TableCell>
                    <TableCell className="text-center font-bold text-slate-900 bg-slate-50/50">{avg > 0 ? avg : '-'}</TableCell>
                    <TableCell className={`text-center font-medium ${remarks === 'Passed' ? 'text-[#003876]' : remarks === 'Pending' ? 'text-amber-500' : 'text-red-500'} bg-slate-50/50`}>{remarks}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
