"use client"

import { useState, use } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, FileDown, CheckCircle2, Plus, Minus } from "lucide-react"
import { computeDepEdGrade } from "@/lib/deped-grading"
import { useTeacherStore } from "@/store/useStore"
import { useEffect } from "react"

export default function EClassRecordPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = use(params)
  const [mounted, setMounted] = useState(false)
  const subjectName = subject.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  // Standard DepEd Weights for core subjects
  const weights = { ww: 0.30, pt: 0.50, qa: 0.20 }

  // Dynamic columns — teachers can add/remove WW and PT activities
  const [wwCount, setWwCount] = useState(2)
  const [ptCount, setPtCount] = useState(2)

  // HPS for each column — dynamically keyed by ww_0, ww_1, ... pt_0, pt_1, ... qa
  const [hps, setHps] = useState<Record<string, number>>({
    ww_0: 20, ww_1: 20,
    pt_0: 30, pt_1: 20,
    qa: 50
  })

  const [students, setStudents] = useState<any[]>([])
  const [transmitted, setTransmitted] = useState(false)
  
  const updateGrade = useTeacherStore(s => s.updateGrade)
  const globalStudents = useTeacherStore(s => s.students)
  const globalGrades = useTeacherStore(s => s.grades)

  useEffect(() => {
    setStudents(globalStudents.map(s => {
       const existingGrade = globalGrades[s.lrn]?.find(g => 
         g.subject.toLowerCase().includes(subjectName.toLowerCase()) ||
         subjectName.toLowerCase().includes(g.subject.toLowerCase())
       )
       // Build scores object from existing data or zeros
       const scores: Record<string, number> = { qa: existingGrade?.qa || 0 }
       for (let i = 0; i < wwCount; i++) {
         if (i === 0) scores[`ww_0`] = existingGrade?.ww1 || 0
         else if (i === 1) scores[`ww_1`] = existingGrade?.ww2 || 0
         else scores[`ww_${i}`] = 0
       }
       for (let i = 0; i < ptCount; i++) {
         if (i === 0) scores[`pt_0`] = existingGrade?.pt1 || 0
         else if (i === 1) scores[`pt_1`] = existingGrade?.pt2 || 0
         else scores[`pt_${i}`] = 0
       }
       return { lrn: s.lrn, name: s.name, sex: s.sex, scores }
    }))
    setMounted(true)
  }, [globalStudents, globalGrades, subjectName])

  if (!mounted) return null

  // Dynamic HPS totals
  const hpsWW = Array.from({ length: wwCount }, (_, i) => hps[`ww_${i}`] || 0).reduce((a, b) => a + b, 0)
  const hpsPT = Array.from({ length: ptCount }, (_, i) => hps[`pt_${i}`] || 0).reduce((a, b) => a + b, 0)
  const hpsQA = hps.qa || 0

  // Total column span = 2 (No + Name) + wwCount + 2 (Total + PS) + ptCount + 2 (Total + PS) + 1 (QA) + 1 (PS) + 2 (Initial + Quarter)
  const totalColSpan = 2 + wwCount + 2 + ptCount + 2 + 2 + 2

  const handleScoreChange = (lrn: string, field: string, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value)
    if (isNaN(numValue)) return
    setStudents(prev => prev.map(s => {
      if (s.lrn === lrn) return { ...s, scores: { ...s.scores, [field]: numValue } }
      return s
    }))
  }

  const handleHpsChange = (field: string, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value)
    if (isNaN(numValue)) return
    setHps(prev => ({ ...prev, [field]: numValue }))
  }

  const addWWColumn = () => {
    const newIdx = wwCount
    setWwCount(prev => prev + 1)
    setHps(prev => ({ ...prev, [`ww_${newIdx}`]: 20 }))
    setStudents(prev => prev.map(s => ({ ...s, scores: { ...s.scores, [`ww_${newIdx}`]: 0 } })))
  }

  const removeWWColumn = () => {
    if (wwCount <= 1) return
    const removeIdx = wwCount - 1
    setWwCount(prev => prev - 1)
    setHps(prev => { const n = { ...prev }; delete n[`ww_${removeIdx}`]; return n })
    setStudents(prev => prev.map(s => {
      const scores = { ...s.scores }; delete scores[`ww_${removeIdx}`]
      return { ...s, scores }
    }))
  }

  const addPTColumn = () => {
    const newIdx = ptCount
    setPtCount(prev => prev + 1)
    setHps(prev => ({ ...prev, [`pt_${newIdx}`]: 20 }))
    setStudents(prev => prev.map(s => ({ ...s, scores: { ...s.scores, [`pt_${newIdx}`]: 0 } })))
  }

  const removePTColumn = () => {
    if (ptCount <= 1) return
    const removeIdx = ptCount - 1
    setPtCount(prev => prev - 1)
    setHps(prev => { const n = { ...prev }; delete n[`pt_${removeIdx}`]; return n })
    setStudents(prev => prev.map(s => {
      const scores = { ...s.scores }; delete scores[`pt_${removeIdx}`]
      return { ...s, scores }
    }))
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
         const overrideQG = student.scores._qgOverride
         updateGrade(student.lrn, {
             subject: subjectName,
             ww1: student.scores.ww_0 || 0, ww2: student.scores.ww_1 || 0,
             pt1: student.scores.pt_0 || 0, pt2: student.scores.pt_1 || 0,
             qa: student.scores.qa || 0,
             quarterGrade: overrideQG ? overrideQG : grades.quarterGrade
         })
     })
     setTransmitted(true)
     setTimeout(() => setTransmitted(false), 4000)
  }

  const handleExport = async () => {
      try {
          const res = await fetch('/api/export/ecr', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ subject: subjectName, students })
          });
          if (!res.ok) throw new Error("Template mapping failed.");
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${subjectName}_ECR_Q1.xlsx`;
          a.click();
          window.URL.revokeObjectURL(url);
      } catch (err: any) {
          alert("Export: " + err.message);
      }
  }

  const renderStudentRow = (student: any, idx: number) => {
    const totalWW = Array.from({ length: wwCount }, (_, i) => student.scores[`ww_${i}`] || 0).reduce((a: number, b: number) => a + b, 0)
    const totalPT = Array.from({ length: ptCount }, (_, i) => student.scores[`pt_${i}`] || 0).reduce((a: number, b: number) => a + b, 0)
    const totalQA = student.scores.qa || 0

    const grades = computeDepEdGrade(
      { ww: totalWW, pt: totalPT, qa: totalQA },
      { ww: hpsWW, pt: hpsPT, qa: hpsQA },
      weights
    )

    return (
      <TableRow key={student.lrn} className="hover:bg-slate-50/50 transition-colors">
        <TableCell className="text-slate-500 text-xs">{idx + 1}</TableCell>
        <TableCell className="font-medium border-r text-sm whitespace-nowrap">{student.name}</TableCell>
        
        {/* WW Inputs — dynamic */}
        {Array.from({ length: wwCount }, (_, i) => (
          <TableCell key={`ww_${i}`} className="p-1">
            <Input className="h-8 w-12 mx-auto text-center font-medium" value={student.scores[`ww_${i}`] || ''} onChange={(e) => handleScoreChange(student.lrn, `ww_${i}`, e.target.value)} />
          </TableCell>
        ))}
        <TableCell className="text-center font-bold bg-blue-50/30 text-blue-900">{totalWW}</TableCell>
        <TableCell className="text-center font-semibold text-blue-700 bg-blue-50/50 border-r">{grades.psWW.toFixed(2)}</TableCell>
        
        {/* PT Inputs — dynamic */}
        {Array.from({ length: ptCount }, (_, i) => (
          <TableCell key={`pt_${i}`} className="p-1">
            <Input className="h-8 w-12 mx-auto text-center font-medium" value={student.scores[`pt_${i}`] || ''} onChange={(e) => handleScoreChange(student.lrn, `pt_${i}`, e.target.value)} />
          </TableCell>
        ))}
        <TableCell className="text-center font-bold bg-emerald-50/30 text-emerald-900">{totalPT}</TableCell>
        <TableCell className="text-center font-semibold text-emerald-700 bg-emerald-50/50 border-r">{grades.psPT.toFixed(2)}</TableCell>
        
        {/* QA */}
        <TableCell className="p-1"><Input className="h-8 w-14 mx-auto text-center font-medium" value={student.scores.qa || ''} onChange={(e) => handleScoreChange(student.lrn, 'qa', e.target.value)} /></TableCell>
        <TableCell className="text-center font-semibold text-purple-700 bg-purple-50/50 border-r">{grades.psQA.toFixed(2)}</TableCell>
        
        {/* Final */}
        <TableCell className="text-center font-medium bg-slate-50 text-slate-600">{grades.initialGrade.toFixed(2)}</TableCell>
        <TableCell className={`text-center bg-slate-100/80 p-1`}>
          <input
            type="number"
            min={60}
            max={100}
            className={`h-8 w-14 mx-auto text-center font-bold text-lg rounded border-0 outline-none transition-colors focus:ring-2 focus:ring-[#1ca560] ${
              student.scores._qgOverride 
                ? 'bg-amber-50 text-amber-700' 
                : (grades.quarterGrade >= 75 ? 'bg-transparent text-[#1ca560]' : 'bg-transparent text-red-500')
            }`}
            value={student.scores._qgOverride || grades.quarterGrade}
            onChange={(e) => {
              const val = parseInt(e.target.value)
              if (isNaN(val)) return
              if (val === grades.quarterGrade) {
                // If they typed back the auto value, clear override
                handleScoreChange(student.lrn, '_qgOverride', '0')
              } else {
                handleScoreChange(student.lrn, '_qgOverride', e.target.value)
              }
            }}
            title={student.scores._qgOverride ? `Auto: ${grades.quarterGrade} (overridden)` : `Auto-transmuted from ${grades.initialGrade.toFixed(2)}`}
          />
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
             <FileDown className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button 
            onClick={handleSaveGrades} 
            className={`font-bold transition-all active:scale-95 shadow-md ${
              transmitted 
                ? 'bg-emerald-700 shadow-emerald-500/20' 
                : 'bg-gradient-to-r from-[#1ca560] to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/20'
            }`}>
            {transmitted 
              ? <><CheckCircle2 className="mr-2 h-4 w-4" /> Transmitted!</>
              : <><Send className="mr-2 h-4 w-4" /> Transmit to Class Adviser</>
            }
          </Button>
        </div>
      </div>

      {/* Transmission Success Banner */}
      {transmitted && (
        <div className="animate-in slide-in-from-top-2 fade-in duration-300 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-[#1ca560] shrink-0" />
          <div>
            <p className="font-semibold text-sm">Grades Transmitted Successfully</p>
            <p className="text-xs text-emerald-600 mt-0.5">{subjectName} Q1 grades have been sent to the Class Adviser's Composite Aggregator.</p>
          </div>
        </div>
      )}

      <Card className="bg-white/80 backdrop-blur-md shadow-sm border border-slate-200/60 overflow-hidden">
        <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle>Grading Sheet (Auto-Computing)</CardTitle>
            <CardDescription className="mt-1">
              Weights: <span className="font-semibold text-blue-600">WW ({weights.ww * 100}%)</span> • <span className="font-semibold text-emerald-600">PT ({weights.pt * 100}%)</span> • <span className="font-semibold text-purple-600">QA ({weights.qa * 100}%)</span>
            </CardDescription>
          </div>
          {/* Column Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-blue-700">WW:</span>
              <button onClick={removeWWColumn} disabled={wwCount <= 1} className="h-6 w-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200 disabled:opacity-30 transition-colors">
                <Minus size={12} />
              </button>
              <span className="text-xs font-bold text-slate-800 w-4 text-center">{wwCount}</span>
              <button onClick={addWWColumn} className="h-6 w-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200 transition-colors">
                <Plus size={12} />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-emerald-700">PT:</span>
              <button onClick={removePTColumn} disabled={ptCount <= 1} className="h-6 w-6 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-200 disabled:opacity-30 transition-colors">
                <Minus size={12} />
              </button>
              <span className="text-xs font-bold text-slate-800 w-4 text-center">{ptCount}</span>
              <button onClick={addPTColumn} className="h-6 w-6 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-200 transition-colors">
                <Plus size={12} />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader className="bg-slate-50/50">
              {/* Top Header Grouping */}
              <TableRow>
                <TableHead colSpan={2} className="border-r w-[250px]"></TableHead>
                <TableHead colSpan={wwCount + 2} className="text-center border-r bg-blue-50/50 text-blue-800 font-semibold">Written Works ({weights.ww * 100}%)</TableHead>
                <TableHead colSpan={ptCount + 2} className="text-center border-r bg-emerald-50/50 text-emerald-800 font-semibold">Performance Tasks ({weights.pt * 100}%)</TableHead>
                <TableHead colSpan={2} className="text-center border-r bg-purple-50/50 text-purple-800 font-semibold">Quarterly Assessment ({weights.qa * 100}%)</TableHead>
                <TableHead colSpan={2} className="text-center font-bold text-slate-800">Final Grade</TableHead>
              </TableRow>
              {/* Sub Headers */}
              <TableRow className="border-b-2 border-slate-200">
                <TableHead className="w-[40px] text-xs">No.</TableHead>
                <TableHead className="border-r">Learner's Name</TableHead>
                
                {/* WW columns */}
                {Array.from({ length: wwCount }, (_, i) => (
                  <TableHead key={`ww_h_${i}`} className="text-center w-[60px] bg-blue-50/20 text-xs">{i + 1}</TableHead>
                ))}
                <TableHead className="text-center w-[70px] bg-blue-50/50 font-semibold">Total</TableHead>
                <TableHead className="text-center w-[70px] bg-blue-100/50 font-bold border-r">PS</TableHead>
                
                {/* PT columns */}
                {Array.from({ length: ptCount }, (_, i) => (
                  <TableHead key={`pt_h_${i}`} className="text-center w-[60px] bg-emerald-50/20 text-xs">{i + 1}</TableHead>
                ))}
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
                {Array.from({ length: wwCount }, (_, i) => (
                  <TableCell key={`ww_hps_${i}`} className="p-1">
                    <Input className="h-7 w-12 mx-auto text-center text-xs font-bold" value={hps[`ww_${i}`] || 0} onChange={(e) => handleHpsChange(`ww_${i}`, e.target.value)} />
                  </TableCell>
                ))}
                <TableCell className="text-center font-bold text-slate-700">{hpsWW}</TableCell>
                <TableCell className="text-center font-bold text-blue-700 border-r">100.00</TableCell>
                
                {Array.from({ length: ptCount }, (_, i) => (
                  <TableCell key={`pt_hps_${i}`} className="p-1">
                    <Input className="h-7 w-12 mx-auto text-center text-xs font-bold" value={hps[`pt_${i}`] || 0} onChange={(e) => handleHpsChange(`pt_${i}`, e.target.value)} />
                  </TableCell>
                ))}
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
                <TableCell colSpan={totalColSpan} className="font-bold text-xs tracking-wider text-blue-900">MALE</TableCell>
              </TableRow>
              {males.map((student, idx) => renderStudentRow(student, idx))}

              {/* Female Section */}
              <TableRow className="bg-pink-50/50">
                <TableCell colSpan={totalColSpan} className="font-bold text-xs tracking-wider text-pink-900">FEMALE</TableCell>
              </TableRow>
              {females.map((student, idx) => renderStudentRow(student, males.length + idx))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
