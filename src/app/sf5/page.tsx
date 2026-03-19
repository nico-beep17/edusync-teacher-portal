"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Printer, Download } from "lucide-react"
import { useTeacherStore } from "@/store/useStore"
import { useEffect, useState } from "react"
import { exportToCSV } from "@/lib/export-utils"

const computeAverage = (grades: any[], requiredSubjects: string[]) => {
  if (grades.length === 0) return "0"
  let sum = 0
  let count = 0
  requiredSubjects.forEach(sub => {
    const gradeEntry = grades.find(g => g.subject.toLowerCase().includes(sub.toLowerCase()))
    if (gradeEntry) { sum += gradeEntry.quarterGrade; count++ }
  })
  if (count === 0) return "0"
  return (sum / count).toFixed(2)
}

export default function SF5Page() {
  const [mounted, setMounted] = useState(false)
  const students = useTeacherStore(s => s.students)
  const gradesMap = useTeacherStore(s => s.grades)

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const subjects = ['Filipino', 'English', 'Mathematics', 'Science', 'Ap', 'Epp/tle', 'Mapeh', 'Esp']

  let promotedM = 0;
  let promotedF = 0;
  let retainedM = 0;
  let retainedF = 0;
  let conditionM = 0;
  let conditionF = 0;

  // Pre-calculate statistics
  students.forEach(s => {
      const avg = parseFloat(computeAverage(gradesMap[s.lrn] || [], subjects))
      if (avg >= 75) {
          s.sex === 'M' ? promotedM++ : promotedF++
      } else if (avg > 0) { // Failed, but has grades
          s.sex === 'M' ? retainedM++ : retainedF++
      } else {
          // Pending/Blank
          s.sex === 'M' ? conditionM++ : conditionF++
      }
  })

  const handleExport = async () => {
      try {
          const exportStudents = students.map(s => {
              const sGrades = gradesMap[s.lrn] || []
              const avg = parseFloat(computeAverage(sGrades, subjects))
              const status = avg >= 75 ? "PROMOTED" : (avg > 0 ? "RETAINED" : "PENDING")
              return { ...s, average: avg, status }
          })
          const res = await fetch('/api/export/sf5', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ students: exportStudents })
          });
          if (!res.ok) {
              const e = await res.json()
              throw new Error(e.error || "Template mapping failed. Put 'School-Forms-1-7 .xlsx' in public/templates/");
          }
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `SF5_Report.xlsx`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
      } catch (err: any) {
          alert("Native Export Error: " + err.message);
      }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">School Form 5 (SF5)</h1>
          <p className="text-muted-foreground mt-1">Report on Promotion and Level of Proficiency</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => window.print()} variant="outline" className="bg-white hover:bg-slate-50 text-slate-700">
             <Printer className="mr-2 h-4 w-4" /> Print Report
          </Button>
          <Button onClick={handleExport} className="bg-[#1ca560] hover:bg-[#158045]">
            <Download className="mr-2 h-4 w-4" /> Download Excel
          </Button>
        </div>
      </div>

      {/* Main SF5 Table Card */}
      <Card className="bg-white shadow-sm border border-slate-200/60 overflow-hidden">
        <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between pb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 w-full gap-4 text-sm">
            <div><span className="text-slate-500">Region:</span> <span className="font-semibold">XI</span></div>
            <div><span className="text-slate-500">Division:</span> <span className="font-semibold">Panabo City</span></div>
            <div><span className="text-slate-500">School ID:</span> <span className="font-semibold">316405</span></div>
            <div><span className="text-slate-500">School Year:</span> <span className="font-semibold">2025 - 2026</span></div>
            <div className="col-span-2"><span className="text-slate-500">School Name:</span> <span className="font-semibold">QUEZON NATIONAL HIGH SCHOOL</span></div>
            <div><span className="text-slate-500">Grade Level:</span> <span className="font-semibold">Grade 8</span></div>
            <div><span className="text-slate-500">Section:</span> <span className="font-semibold">ARIES</span></div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader className="bg-slate-100 border-b-2 border-slate-300">
              <TableRow>
                <TableHead className="w-[150px] font-bold text-slate-800">LRN</TableHead>
                <TableHead className="w-[300px] border-r font-bold text-slate-800">LEARNER'S NAME</TableHead>
                <TableHead className="text-center font-bold text-slate-800 w-[120px]">GENERAL AVERAGE</TableHead>
                <TableHead className="text-center font-bold text-slate-800 border-r w-[150px]">ACTION TAKEN</TableHead>
                <TableHead className="text-sm font-semibold text-slate-600">Did Not Meet Expectations of the ff. Learning Area/s</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* MALE rows */}
              <TableRow className="bg-blue-50/50">
                <TableCell colSpan={5} className="font-bold tracking-wider text-blue-900 border-y py-2">MALE</TableCell>
              </TableRow>
              {students.filter(s => s.sex === 'M').map((s) => {
                 const avg = parseFloat(computeAverage(gradesMap[s.lrn] || [], subjects))
                 const status = avg >= 75 ? "PROMOTED" : (avg > 0 ? "RETAINED" : "PENDING")
                 return (
                    <TableRow key={s.lrn}>
                      <TableCell className="font-mono text-xs text-slate-600">{s.lrn}</TableCell>
                      <TableCell className="font-semibold border-r">{s.name}</TableCell>
                      <TableCell className="text-center font-bold">{avg > 0 ? avg : '-'}</TableCell>
                      <TableCell className={`text-center font-bold border-r ${status==='PROMOTED'?'text-[#1ca560]':status==='RETAINED'?'text-red-500':'text-amber-500'}`}>{status}</TableCell>
                      <TableCell className="text-slate-400 italic">None</TableCell>
                    </TableRow>
                 )
              })}
              
              {/* FEMALE rows */}
              <TableRow className="bg-pink-50/50">
                <TableCell colSpan={5} className="font-bold tracking-wider text-pink-900 border-y py-2">FEMALE</TableCell>
              </TableRow>
              {students.filter(s => s.sex === 'F').map((s) => {
                 const avg = parseFloat(computeAverage(gradesMap[s.lrn] || [], subjects))
                 const status = avg >= 75 ? "PROMOTED" : (avg > 0 ? "RETAINED" : "PENDING")
                 return (
                    <TableRow key={s.lrn}>
                      <TableCell className="font-mono text-xs text-slate-600">{s.lrn}</TableCell>
                      <TableCell className="font-semibold border-r">{s.name}</TableCell>
                      <TableCell className="text-center font-bold">{avg > 0 ? avg : '-'}</TableCell>
                      <TableCell className={`text-center font-bold border-r ${status==='PROMOTED'?'text-[#1ca560]':status==='RETAINED'?'text-red-500':'text-amber-500'}`}>{status}</TableCell>
                      <TableCell className="text-slate-400 italic">None</TableCell>
                    </TableRow>
                 )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary Table block at bottom typical of SF5 */}
      <div className="grid md:grid-cols-2 gap-6 mt-4">
        <Card className="border-slate-200">
          <CardHeader className="bg-slate-50 py-3 border-b">
            <CardTitle className="text-sm">Summary Table</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>STATUS</TableHead>
                    <TableHead className="text-center">MALE</TableHead>
                    <TableHead className="text-center">FEMALE</TableHead>
                    <TableHead className="text-center font-bold">TOTAL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-semibold text-slate-700">PROMOTED</TableCell>
                    <TableCell className="text-center">{promotedM}</TableCell>
                    <TableCell className="text-center">{promotedF}</TableCell>
                    <TableCell className="text-center font-bold">{promotedM + promotedF}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold text-slate-700">INCOMPLETE (PENDING)</TableCell>
                    <TableCell className="text-center">{conditionM}</TableCell>
                    <TableCell className="text-center">{conditionF}</TableCell>
                    <TableCell className="text-center font-bold text-amber-500">{conditionM + conditionF}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold text-slate-700">RETAINED</TableCell>
                    <TableCell className="text-center">{retainedM}</TableCell>
                    <TableCell className="text-center">{retainedF}</TableCell>
                    <TableCell className="text-center font-bold text-red-500">{retainedM + retainedF}</TableCell>
                  </TableRow>
                </TableBody>
             </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
