"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, FileDown, Calculator, CheckCircle2 } from "lucide-react"
import { computeDepEdGrade } from "@/lib/deped-grading"
import { exportToCSV } from "@/lib/export-utils"
import { useTeacherStore } from "@/store/useStore"
import { useEffect } from "react"

export default function EClassRecordPage({ params }: { params: { subject: string } }) {
  const [mounted, setMounted] = useState(false)
  const subjectName = params.subject.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  // Standard DepEd Weights for core subjects (Languages, Math, Science)
  const weights = { ww: 0.30, pt: 0.50, qa: 0.20 }

  const [hps, setHps] = useState({ ww1: 20, ww2: 20, pt1: 30, pt2: 20, qa: 50 })
  const [students, setStudents] = useState<any[]>([])
  
  const updateGrade = useTeacherStore(s => s.updateGrade)
  const globalStudents = useTeacherStore(s => s.students)
  const globalGrades = useTeacherStore(s => s.grades)

  useEffect(() => {
    setStudents(globalStudents.map(s => {
       const existingGrade = globalGrades[s.lrn]?.find(g => g.subject === subjectName)
       return {
           lrn: s.lrn,
           name: s.name,
           sex: s.sex,
           scores: existingGrade ? { ww1: existingGrade.ww1, ww2: existingGrade.ww2, pt1: existingGrade.pt1, pt2: existingGrade.pt2, qa: existingGrade.qa } : { ww1: 0, ww2: 0, pt1: 0, pt2: 0, qa: 0 }
       }
    }))
    setMounted(true)
  }, [globalStudents, globalGrades, subjectName])

  if (!mounted) return null

  // Highest Possible Scores Totals
  const hpsWW = hps.ww1 + hps.ww2
  const hpsPT = hps.pt1 + hps.pt2
  const hpsQA = hps.qa

  const handleScoreChange = (lrn: string, field: string, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value)
    if (isNaN(numValue)) return

    setStudents(prev => prev.map(s => {
      if (s.lrn === lrn) {
        return { ...s, scores: { ...s.scores, [field]: numValue } }
      }
      return s
    }))
  }

  const handleHpsChange = (field: string, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value)
    if (isNaN(numValue)) return
    setHps(prev => ({ ...prev, [field]: numValue }))
  }

  // Pre-calculate Male and Female lists to render
  const males = students.filter(s => s.sex === 'M')
  const females = students.filter(s => s.sex === 'F')

  const handleSaveGrades = () => {
     students.forEach(student => {
         const grades = computeDepEdGrade(
             { ww: student.scores.ww1 + student.scores.ww2, pt: student.scores.pt1 + student.scores.pt2, qa: student.scores.qa },
             { ww: hpsWW, pt: hpsPT, qa: hpsQA },
             weights
         )
         updateGrade(student.lrn, {
             subject: subjectName,
             ww1: student.scores.ww1, ww2: student.scores.ww2,
             pt1: student.scores.pt1, pt2: student.scores.pt2,
             qa: student.scores.qa,
             quarterGrade: grades.quarterGrade
         })
     })
     alert(`[Subject Transmission]: The E-Class Record and strictly computed Quarterly Grades for ${subjectName} have been permanently transmitted to the Class Adviser's Composite Aggregator.`)
  }

  const handleExport = async () => {
      try {
          const res = await fetch('/api/export/ecr', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ subject: subjectName, students })
          });
          
          if (!res.ok) {
             const errorData = await res.json();
             throw new Error(errorData.error || "Template mapping failed.");
          }
          
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `CAMIGAO_${subjectName}_ECR_Q1.xlsx`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
      } catch (err: any) {
          alert("Native Export Error: " + err.message + "\n\nPlease ensure your DepEd Templates (.xlsx format) are inside public/templates/");
      }
  }

  const renderStudentRow = (student: any, idx: number) => {
    // Current Totals
    const totalWW = student.scores.ww1 + student.scores.ww2
    const totalPT = student.scores.pt1 + student.scores.pt2
    const totalQA = student.scores.qa

    // Perform DepEd specific Grade algorithm computation
    const grades = computeDepEdGrade(
      { ww: totalWW, pt: totalPT, qa: totalQA },
      { ww: hpsWW, pt: hpsPT, qa: hpsQA },
      weights
    )

    return (
      <TableRow key={student.lrn} className="hover:bg-slate-50/50 transition-colors">
        <TableCell className="text-slate-500 text-xs">{idx + 1}</TableCell>
        <TableCell className="font-medium border-r text-sm whitespace-nowrap">{student.name}</TableCell>
        
        {/* Written Works Inputs */}
        <TableCell className="p-1"><Input className="h-8 w-12 mx-auto text-center font-medium" value={student.scores.ww1 || ''} onChange={(e) => handleScoreChange(student.lrn, 'ww1', e.target.value)} /></TableCell>
        <TableCell className="p-1"><Input className="h-8 w-12 mx-auto text-center font-medium" value={student.scores.ww2 || ''} onChange={(e) => handleScoreChange(student.lrn, 'ww2', e.target.value)} /></TableCell>
        <TableCell className="text-center font-bold bg-blue-50/30 text-blue-900">{totalWW}</TableCell>
        <TableCell className="text-center font-semibold text-blue-700 bg-blue-50/50 border-r">{grades.psWW.toFixed(2)}</TableCell>
        
        {/* Performance Tasks Inputs */}
        <TableCell className="p-1"><Input className="h-8 w-12 mx-auto text-center font-medium" value={student.scores.pt1 || ''} onChange={(e) => handleScoreChange(student.lrn, 'pt1', e.target.value)} /></TableCell>
        <TableCell className="p-1"><Input className="h-8 w-12 mx-auto text-center font-medium" value={student.scores.pt2 || ''} onChange={(e) => handleScoreChange(student.lrn, 'pt2', e.target.value)} /></TableCell>
        <TableCell className="text-center font-bold bg-emerald-50/30 text-emerald-900">{totalPT}</TableCell>
        <TableCell className="text-center font-semibold text-emerald-700 bg-emerald-50/50 border-r">{grades.psPT.toFixed(2)}</TableCell>
        
        {/* Quarterly Assessment Input */}
        <TableCell className="p-1"><Input className="h-8 w-14 mx-auto text-center font-medium" value={student.scores.qa || ''} onChange={(e) => handleScoreChange(student.lrn, 'qa', e.target.value)} /></TableCell>
        <TableCell className="text-center font-semibold text-purple-700 bg-purple-50/50 border-r">{grades.psQA.toFixed(2)}</TableCell>
        
        {/* Final Grades Output */}
        <TableCell className="text-center font-medium bg-slate-50 text-slate-600">{grades.initialGrade.toFixed(2)}</TableCell>
        <TableCell className={`text-center font-bold text-lg bg-slate-100/80 ${grades.quarterGrade >= 75 ? 'text-[#1ca560]' : 'text-red-500'}`}>
          {grades.quarterGrade}
        </TableCell>
      </TableRow>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{subjectName}</h1>
          <p className="text-muted-foreground mt-1">Interactive E-Class Record • Quarter 1</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleExport} variant="outline" className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200">
             <FileDown className="mr-2 h-4 w-4" /> Download Blank Template
          </Button>
          <Button onClick={handleSaveGrades} className="bg-gradient-to-r from-[#1ca560] to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-md shadow-emerald-500/20 font-bold transition-all active:scale-95">
            <Send className="mr-2 h-4 w-4" /> Transmit to Class Adviser
          </Button>
        </div>
      </div>

      <Card className="bg-white/80 backdrop-blur-md shadow-sm border border-slate-200/60 overflow-hidden">
        <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle>Grading Sheet (Auto-Computing)</CardTitle>
            <CardDescription className="mt-1">
              Weights: <span className="font-semibold text-blue-600">WW ({weights.ww * 100}%)</span> • <span className="font-semibold text-emerald-600">PT ({weights.pt * 100}%)</span> • <span className="font-semibold text-purple-600">QA ({weights.qa * 100}%)</span>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[1200px]">
            <TableHeader className="bg-slate-50/50">
              {/* Top Header Grouping */}
              <TableRow>
                <TableHead colSpan={2} className="border-r w-[250px]"></TableHead>
                <TableHead colSpan={4} className="text-center border-r bg-blue-50/50 text-blue-800 font-semibold">Written Works ({weights.ww * 100}%)</TableHead>
                <TableHead colSpan={4} className="text-center border-r bg-emerald-50/50 text-emerald-800 font-semibold">Performance Tasks ({weights.pt * 100}%)</TableHead>
                <TableHead colSpan={2} className="text-center border-r bg-purple-50/50 text-purple-800 font-semibold">Quarterly Assessment ({weights.qa * 100}%)</TableHead>
                <TableHead colSpan={2} className="text-center font-bold text-slate-800">Final Grade</TableHead>
              </TableRow>
              {/* Sub Headers (Highest Possible Scores) */}
              <TableRow className="border-b-2 border-slate-200">
                <TableHead className="w-[40px] text-xs">No.</TableHead>
                <TableHead className="border-r">Learner's Name</TableHead>
                
                {/* WW */}
                <TableHead className="text-center w-[60px] bg-blue-50/20 text-xs">1</TableHead>
                <TableHead className="text-center w-[60px] bg-blue-50/20 text-xs">2</TableHead>
                <TableHead className="text-center w-[70px] bg-blue-50/50 font-semibold">Total</TableHead>
                <TableHead className="text-center w-[70px] bg-blue-100/50 font-bold border-r">PS</TableHead>
                
                {/* PT */}
                <TableHead className="text-center w-[60px] bg-emerald-50/20 text-xs">1</TableHead>
                <TableHead className="text-center w-[60px] bg-emerald-50/20 text-xs">2</TableHead>
                <TableHead className="text-center w-[70px] bg-emerald-50/50 font-semibold">Total</TableHead>
                <TableHead className="text-center w-[70px] bg-emerald-100/50 font-bold border-r">PS</TableHead>
                
                {/* QA */}
                <TableHead className="text-center w-[80px] bg-purple-50/20 font-medium">Score</TableHead>
                <TableHead className="text-center w-[80px] bg-purple-100/50 font-bold border-r">PS</TableHead>
                
                {/* Final */}
                <TableHead className="text-center w-[80px] font-semibold text-xs leading-tight">Initial Grade</TableHead>
                <TableHead className="text-center w-[80px] font-bold text-slate-900 bg-slate-100/80 leading-tight">Quarter Grade</TableHead>
              </TableRow>
              {/* Highest Possible Scores Input Row */}
              <TableRow className="bg-amber-50/30">
                <TableCell colSpan={2} className="text-right font-semibold text-xs text-amber-800 border-r py-2">HIGHEST POSSIBLE SCORE ➔</TableCell>
                <TableCell className="p-1"><Input className="h-7 w-12 mx-auto text-center text-xs font-bold" value={hps.ww1} onChange={(e) => handleHpsChange('ww1', e.target.value)} /></TableCell>
                <TableCell className="p-1"><Input className="h-7 w-12 mx-auto text-center text-xs font-bold" value={hps.ww2} onChange={(e) => handleHpsChange('ww2', e.target.value)} /></TableCell>
                <TableCell className="text-center font-bold text-slate-700">{hpsWW}</TableCell>
                <TableCell className="text-center font-bold text-blue-700 border-r">100.00</TableCell>
                
                <TableCell className="p-1"><Input className="h-7 w-12 mx-auto text-center text-xs font-bold" value={hps.pt1} onChange={(e) => handleHpsChange('pt1', e.target.value)} /></TableCell>
                <TableCell className="p-1"><Input className="h-7 w-12 mx-auto text-center text-xs font-bold" value={hps.pt2} onChange={(e) => handleHpsChange('pt2', e.target.value)} /></TableCell>
                <TableCell className="text-center font-bold text-slate-700">{hpsPT}</TableCell>
                <TableCell className="text-center font-bold text-emerald-700 border-r">100.00</TableCell>
                
                <TableCell className="p-1"><Input className="h-7 w-14 mx-auto text-center text-xs font-bold" value={hps.qa} onChange={(e) => handleHpsChange('qa', e.target.value)} /></TableCell>
                <TableCell className="text-center font-bold text-purple-700 border-r">100.00</TableCell>
                <TableCell className="bg-slate-50"></TableCell>
                <TableCell className="bg-slate-100/80"></TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Male Section */}
              <TableRow className="bg-blue-50/50">
                <TableCell colSpan={14} className="font-bold text-xs tracking-wider text-blue-900">MALE</TableCell>
              </TableRow>
              {males.map((student, idx) => renderStudentRow(student, idx))}

              {/* Female Section */}
              <TableRow className="bg-pink-50/50">
                <TableCell colSpan={14} className="font-bold text-xs tracking-wider text-pink-900">FEMALE</TableCell>
              </TableRow>
              {females.map((student, idx) => renderStudentRow(student, males.length + idx))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
