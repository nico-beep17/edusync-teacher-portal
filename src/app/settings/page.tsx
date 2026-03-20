"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Plus, Trash2, Save, CheckCircle2, BookOpen,
  Upload, Download, Camera, FileSpreadsheet,
  Sparkles, Settings2, School, ShieldCheck, Eye, EyeOff
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTeacherStore } from "@/store/useStore"

interface Subject {
  id: string
  name: string
  abbreviation: string
  wwWeight: number
  ptWeight: number
  qaWeight: number
}

const DEFAULT_SUBJECTS: Subject[] = [
  { id: "1", name: "Filipino", abbreviation: "FIL", wwWeight: 30, ptWeight: 50, qaWeight: 20 },
  { id: "2", name: "English", abbreviation: "ENG", wwWeight: 30, ptWeight: 50, qaWeight: 20 },
  { id: "3", name: "Mathematics", abbreviation: "MATH", wwWeight: 30, ptWeight: 50, qaWeight: 20 },
  { id: "4", name: "Science", abbreviation: "SCI", wwWeight: 30, ptWeight: 50, qaWeight: 20 },
  { id: "5", name: "Araling Panlipunan", abbreviation: "AP", wwWeight: 30, ptWeight: 50, qaWeight: 20 },
  { id: "6", name: "EPP/TLE", abbreviation: "TLE", wwWeight: 20, ptWeight: 60, qaWeight: 20 },
  { id: "7", name: "MAPEH", abbreviation: "MPH", wwWeight: 20, ptWeight: 60, qaWeight: 20 },
  { id: "8", name: "Edukasyon sa Pagpapakatao", abbreviation: "ESP", wwWeight: 30, ptWeight: 50, qaWeight: 20 },
]

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false)
  const globalSchoolInfo = useTeacherStore((s) => s.schoolInfo)
  const setGlobalSchoolInfo = useTeacherStore((s) => s.setSchoolInfo)
  
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [saved, setSaved] = useState(false)
  const [schoolInfo, setSchoolInfo] = useState(globalSchoolInfo || {
    schoolName: "QUEZON NATIONAL HIGH SCHOOL",
    schoolId: "316405",
    district: "Panabo City",
    division: "Panabo City",
    region: "XI",
    gradeLevel: "8",
    section: "ARIES",
    schoolYear: "2025-2026",
    quarter: "1",
    adviserName: "Teacher's Name",
    schoolHeadName: "MYRNA EVANGELISTA PURIFICACION"
  })

  // PIN Management
  const teacherPin = useTeacherStore(s => s.teacherPin)
  const setTeacherPin = useTeacherStore(s => s.setTeacherPin)
  const [pinForm, setPinForm] = useState({ current: '', newPin: '', confirm: '' })
  const [pinSaved, setPinSaved] = useState(false)
  const [pinError, setPinError] = useState('')
  const [showPins, setShowPins] = useState(false)

  useEffect(() => {
    // Load from localStorage or use defaults
    const savedSubjects = localStorage.getItem('depaid-subjects')
    setSubjects(savedSubjects ? JSON.parse(savedSubjects) : DEFAULT_SUBJECTS)
    if (globalSchoolInfo) {
       setSchoolInfo(globalSchoolInfo)
    }
    setMounted(true)
  }, [globalSchoolInfo])

  if (!mounted) return null

  const handleAddSubject = () => {
    setSubjects(prev => [...prev, {
      id: Date.now().toString(),
      name: "",
      abbreviation: "",
      wwWeight: 30,
      ptWeight: 50,
      qaWeight: 20
    }])
  }

  const handleRemoveSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id))
  }

  const handleSubjectChange = (id: string, field: keyof Subject, value: string | number) => {
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  const handleSave = () => {
    localStorage.setItem('depaid-subjects', JSON.stringify(subjects))
    setGlobalSchoolInfo(schoolInfo)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleExportConfig = () => {
    const config = { subjects, schoolInfo }
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `depaid_settings_${schoolInfo.section}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const config = JSON.parse(ev.target?.result as string)
        if (config.subjects) setSubjects(config.subjects)
        if (config.schoolInfo) {
           setSchoolInfo(config.schoolInfo)
           setGlobalSchoolInfo(config.schoolInfo)
        }
        alert("Settings imported successfully!")
      } catch {
        alert("Invalid config file.")
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage subjects, school info, and data import/export.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExportConfig} className="bg-white">
            <Download className="mr-2 h-4 w-4" /> Export Config
          </Button>
          <label>
            <input type="file" accept=".json" className="hidden" onChange={handleImportConfig} />
            <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
              <Upload className="mr-2 h-4 w-4" /> Import Config
            </div>
          </label>
          <Button onClick={handleSave} className={`transition-all active:scale-95 ${saved ? 'bg-blue-700' : 'bg-[#E3001B] hover:bg-[#B30015]'}`}>
            {saved ? <><CheckCircle2 className="mr-2 h-4 w-4" /> Saved!</> : <><Save className="mr-2 h-4 w-4" /> Save Settings</>}
          </Button>
        </div>
      </div>

      {saved && (
        <div className="animate-in slide-in-from-top-2 fade-in duration-300 flex items-center gap-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl px-4 py-3 shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-[#003876] shrink-0" />
          <p className="font-semibold text-sm">All settings saved to local storage.</p>
        </div>
      )}

      {/* School Information */}
      <Card className="bg-white shadow-sm border border-slate-200/60">
        <CardHeader className="border-b bg-slate-50/50 pb-4">
          <div className="flex items-center gap-2">
            <School className="h-5 w-5 text-[#003876]" />
            <CardTitle>School Information</CardTitle>
          </div>
          <CardDescription>This information appears on all generated forms (SF1, SF2, SF5).</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <Label>School Name</Label>
              <Input value={schoolInfo.schoolName} onChange={e => setSchoolInfo({...schoolInfo, schoolName: e.target.value})} className="bg-white font-semibold" />
            </div>
            <div className="space-y-1.5">
              <Label>School ID</Label>
              <Input value={schoolInfo.schoolId} onChange={e => setSchoolInfo({...schoolInfo, schoolId: e.target.value})} className="bg-white" />
            </div>
            <div className="space-y-1.5">
              <Label>Division</Label>
              <Input value={schoolInfo.division} onChange={e => setSchoolInfo({...schoolInfo, division: e.target.value})} className="bg-white" />
            </div>
            <div className="space-y-1.5">
              <Label>Region</Label>
              <Input value={schoolInfo.region} onChange={e => setSchoolInfo({...schoolInfo, region: e.target.value})} className="bg-white" />
            </div>
            <div className="space-y-1.5">
              <Label>Grade Level</Label>
              <Input value={schoolInfo.gradeLevel} onChange={e => setSchoolInfo({...schoolInfo, gradeLevel: e.target.value})} className="bg-white" />
            </div>
            <div className="space-y-1.5">
              <Label>Section</Label>
              <Input value={schoolInfo.section} onChange={e => setSchoolInfo({...schoolInfo, section: e.target.value})} className="bg-white" />
            </div>
            <div className="space-y-1.5">
              <Label>School Year</Label>
              <Input value={schoolInfo.schoolYear} onChange={e => setSchoolInfo({...schoolInfo, schoolYear: e.target.value})} className="bg-white" />
            </div>
            <div className="space-y-1.5">
              <Label>Current Quarter</Label>
              <Input value={schoolInfo.quarter} onChange={e => setSchoolInfo({...schoolInfo, quarter: e.target.value})} className="bg-white" />
            </div>
            <div className="space-y-1.5">
              <Label>Class Adviser Name</Label>
              <Input value={schoolInfo.adviserName} onChange={e => setSchoolInfo({...schoolInfo, adviserName: e.target.value})} className="bg-white" />
            </div>
            <div className="space-y-1.5">
              <Label>School Head Name</Label>
              <Input value={schoolInfo.schoolHeadName} onChange={e => setSchoolInfo({...schoolInfo, schoolHeadName: e.target.value})} className="bg-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subject Management */}
      <Card className="bg-white shadow-sm border border-slate-200/60 overflow-hidden">
        <CardHeader className="border-b bg-slate-50/50 pb-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle>Subject Configuration</CardTitle>
              <CardDescription className="mt-1">Add, edit, or remove subjects and their DepEd grading weights.</CardDescription>
            </div>
          </div>
          <Button onClick={handleAddSubject} size="sm" variant="outline" className="bg-white border-blue-200 text-blue-600 hover:bg-blue-50">
            <Plus className="mr-2 h-4 w-4" /> Add Subject
          </Button>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="w-[250px]">Subject Name</TableHead>
                <TableHead className="w-[100px]">Abbreviation</TableHead>
                <TableHead className="text-center w-[100px]">WW %</TableHead>
                <TableHead className="text-center w-[100px]">PT %</TableHead>
                <TableHead className="text-center w-[100px]">QA %</TableHead>
                <TableHead className="text-center w-[80px]">Total</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((subject) => {
                const total = subject.wwWeight + subject.ptWeight + subject.qaWeight
                const isValid = total === 100
                return (
                  <TableRow key={subject.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <Input 
                        value={subject.name} 
                        onChange={e => handleSubjectChange(subject.id, 'name', e.target.value)}
                        placeholder="e.g. Filipino"
                        className="bg-transparent border-transparent hover:border-slate-200 focus:border-[#003876] h-9"
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        value={subject.abbreviation} 
                        onChange={e => handleSubjectChange(subject.id, 'abbreviation', e.target.value.toUpperCase())}
                        placeholder="FIL"
                        className="bg-transparent border-transparent hover:border-slate-200 focus:border-[#003876] h-9 text-center font-mono"
                        maxLength={4}
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number"
                        value={subject.wwWeight} 
                        onChange={e => handleSubjectChange(subject.id, 'wwWeight', parseInt(e.target.value) || 0)}
                        className="bg-transparent border-transparent hover:border-slate-200 focus:border-blue-500 h-9 text-center w-16 mx-auto"
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number"
                        value={subject.ptWeight} 
                        onChange={e => handleSubjectChange(subject.id, 'ptWeight', parseInt(e.target.value) || 0)}
                        className="bg-transparent border-transparent hover:border-slate-200 focus:border-blue-500 h-9 text-center w-16 mx-auto"
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number"
                        value={subject.qaWeight} 
                        onChange={e => handleSubjectChange(subject.id, 'qaWeight', parseInt(e.target.value) || 0)}
                        className="bg-transparent border-transparent hover:border-slate-200 focus:border-purple-500 h-9 text-center w-16 mx-auto"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isValid ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-600'}`}>
                        {total}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <button 
                        onClick={() => handleRemoveSubject(subject.id)}
                        className="flex items-center justify-center h-8 w-8 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Data Import/Export Hub */}
      <Card className="bg-white shadow-sm border border-slate-200/60">
        <CardHeader className="border-b bg-slate-50/50 pb-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-purple-600" />
            <div>
              <CardTitle>Data Import & Export Hub</CardTitle>
              <CardDescription className="mt-1">Import student data from Excel files, photos, or export DepEd forms.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Import from Excel */}
            <label className="cursor-pointer group">
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) alert(`File "${file.name}" selected. Excel import will parse and load student data.`)
              }} />
              <div className="flex flex-col items-center p-6 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/30 hover:border-blue-300 hover:bg-blue-50/30 transition-all group-hover:shadow-sm">
                <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                  <FileSpreadsheet size={24} />
                </div>
                <p className="font-semibold text-sm text-slate-800">Import Excel</p>
                <p className="text-[11px] text-slate-500 text-center mt-1">Upload .xlsx or .csv files with student data</p>
              </div>
            </label>

            {/* Import from Camera */}
            <label className="cursor-pointer group">
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) alert(`Photo captured! AI OCR will extract student data from the image.`)
              }} />
              <div className="flex flex-col items-center p-6 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/30 hover:border-blue-300 hover:bg-blue-50/30 transition-all group-hover:shadow-sm">
                <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                  <Camera size={24} />
                </div>
                <p className="font-semibold text-sm text-slate-800">Capture Photo</p>
                <p className="text-[11px] text-slate-500 text-center mt-1">Take a photo of Form 138 or attendance sheet</p>
              </div>
            </label>

            {/* Import from Image File */}
            <label className="cursor-pointer group">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) alert(`Image "${file.name}" selected. AI will extract and structure data from the document.`)
              }} />
              <div className="flex flex-col items-center p-6 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/30 hover:border-purple-300 hover:bg-purple-50/30 transition-all group-hover:shadow-sm">
                <div className="h-12 w-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-3">
                  <Sparkles size={24} />
                </div>
                <p className="font-semibold text-sm text-slate-800">AI Smart Import</p>
                <p className="text-[11px] text-slate-500 text-center mt-1">Upload any image for AI-powered data extraction</p>
              </div>
            </label>

            {/* Export All Forms */}
            <button onClick={() => alert("Export hub: Select which DepEd forms to download (SF1, SF2, SF5, Composite)")} className="group text-left">
              <div className="flex flex-col items-center p-6 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/30 hover:border-amber-300 hover:bg-amber-50/30 transition-all group-hover:shadow-sm">
                <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                  <Download size={24} />
                </div>
                <p className="font-semibold text-sm text-slate-800">Export Forms</p>
                <p className="text-[11px] text-slate-500 text-center mt-1">Download SF1, SF2, SF5, and Composite as Excel</p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* PIN Management */}
      <Card className="bg-white shadow-sm border border-slate-200/60">
        <CardHeader className="border-b bg-slate-50/50 pb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-amber-600" />
            <div>
              <CardTitle>Teacher PIN / Security</CardTitle>
              <CardDescription className="mt-1">
                Your 4-digit PIN is required to edit past-date attendance. Default PIN is <strong>1234</strong>.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {pinSaved && (
            <div className="mb-4 flex items-center gap-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl px-4 py-3">
              <CheckCircle2 className="h-5 w-5 text-[#003876] shrink-0" />
              <p className="font-semibold text-sm">PIN updated successfully!</p>
            </div>
          )}
          {pinError && (
            <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
              ⚠️ {pinError}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                Current PIN
                <button type="button" onClick={() => setShowPins(v => !v)} className="ml-1 text-slate-400 hover:text-slate-600">
                  {showPins ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              </Label>
              <Input
                type={showPins ? "text" : "password"}
                placeholder="••••"
                maxLength={4}
                value={pinForm.current}
                onChange={e => setPinForm(p => ({ ...p, current: e.target.value.replace(/\D/g, '').slice(0,4) }))}
                className="bg-white font-mono tracking-widest text-lg text-center h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label>New PIN</Label>
              <Input
                type={showPins ? "text" : "password"}
                placeholder="••••"
                maxLength={4}
                value={pinForm.newPin}
                onChange={e => setPinForm(p => ({ ...p, newPin: e.target.value.replace(/\D/g, '').slice(0,4) }))}
                className="bg-white font-mono tracking-widest text-lg text-center h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm New PIN</Label>
              <Input
                type={showPins ? "text" : "password"}
                placeholder="••••"
                maxLength={4}
                value={pinForm.confirm}
                onChange={e => setPinForm(p => ({ ...p, confirm: e.target.value.replace(/\D/g, '').slice(0,4) }))}
                className="bg-white font-mono tracking-widest text-lg text-center h-11"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button
              onClick={() => {
                setPinError('')
                if (pinForm.current !== teacherPin) { setPinError('Current PIN is incorrect.'); return }
                if (pinForm.newPin.length !== 4) { setPinError('New PIN must be exactly 4 digits.'); return }
                if (pinForm.newPin !== pinForm.confirm) { setPinError('New PINs do not match.'); return }
                setTeacherPin(pinForm.newPin)
                setPinForm({ current: '', newPin: '', confirm: '' })
                setPinSaved(true)
                setTimeout(() => setPinSaved(false), 3000)
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <ShieldCheck className="mr-2 h-4 w-4" /> Update PIN
            </Button>
            <p className="text-xs text-slate-500">
              Current PIN: <span className="font-mono font-bold text-slate-700">{showPins ? teacherPin : '••••'}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
