"use client"

import { useState, useEffect } from "react"
import {
  Plus, Trash2, Save, CheckCircle2, BookOpen,
  Upload, Download, Camera, FileSpreadsheet,
  Sparkles, Settings2, School, ShieldCheck, Eye, EyeOff
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTeacherStore } from "@/store/useStore"
import { toast } from "sonner"
import JSZip from "jszip"
import { saveAs } from "file-saver"
import * as XLSX from "xlsx"

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
  
  // CSRF token for API calls
  const [csrfToken, setCsrfToken] = useState('')

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
  const [isExportingZip, setIsExportingZip] = useState(false)

  // Individual Form Export Modal
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [selectedFormType, setSelectedFormType] = useState<string | null>(null)
  const [exportMonth, setExportMonth] = useState(new Date().getMonth())
  const [exportYear, setExportYear] = useState(new Date().getFullYear())
  const [exportMode, setExportMode] = useState<string>('zip_archive')
  const [studentLrn, setStudentLrn] = useState<string>('')

  const handleAIImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const toastId = toast.loading(`Uploading image and running AI extraction...`)
    try {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onloadend = async () => {
        const res = await fetch('/api/extract-form', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken || ''
          },
          body: JSON.stringify({ base64Image: reader.result })
        })
        if (!res.ok) throw new Error("AI extraction failed.")
        const data = await res.json()
        if (data.students && data.students.length > 0) {
          data.students.forEach((s: any) => {
            const lrn = s.lrn || String(Math.floor(Math.random() * 900000000000) + 100000000000)
            const mInitial = s.middleName ? ` ${s.middleName.charAt(0).toUpperCase()}.` : ""
            const suffixStr = s.suffix ? ` ${s.suffix.toUpperCase()}` : ""
            const name = `${s.lastName ? s.lastName.toUpperCase() : 'UNKNOWN'}, ${s.firstName ? s.firstName.toUpperCase() : 'UNKNOWN'}${mInitial}${suffixStr}`
            const sex = (s.sex === 'M' || s.sex === 'F') ? s.sex : "M"
            useTeacherStore.getState().addStudent({ lrn, name, sex, status: 'ENROLLED' })
          })
          toast.success(`Globally imported ${data.students.length} students to the Masterlist!`, { id: toastId })
        } else {
          toast.error("No students detected in the image.", { id: toastId })
        }
      }
    } catch (err) {
      toast.error("Failed to import data via AI.", { id: toastId })
    }
  }

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const toastId = toast.loading(`Parsing ${file.name}...`)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 })

      if (!jsonData || jsonData.length < 2) {
        toast.error("Excel file appears to be empty or missing data rows.", { id: toastId })
        return
      }

      const headers: string[] = (jsonData[0] as any[]).map((h: any) => String(h || '').toLowerCase().trim())
      const colMap: Record<string, number> = {}
      headers.forEach((h, i) => {
        if (h.includes('lrn')) colMap['lrn'] = i
        else if (h.includes('name') || h.includes('learner')) colMap['name'] = i
        else if (h.includes('sex') || h.includes('gender')) colMap['sex'] = i
        else if (h.includes('status') || h.includes('remark')) colMap['status'] = i
      })

      if (colMap['lrn'] === undefined || colMap['name'] === undefined) {
        toast.error("Required columns not found. Expected: LRN, Name, Sex, Status (optional).", { id: toastId })
        return
      }

      let count = 0
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[]
        if (!row || row.every(cell => cell == null || String(cell).trim() === '')) continue

        const lrn = String(row[colMap['lrn']] || '').trim()
        const name = String(row[colMap['name']] || '').trim()
        let sex = String(row[colMap['sex']] || 'M').trim().toUpperCase()
        if (sex !== 'M' && sex !== 'F') sex = 'M'
        const status = colMap['status'] !== undefined ? String(row[colMap['status']] || 'ENROLLED').trim() : 'ENROLLED'

        if (lrn && name) {
          useTeacherStore.getState().addStudent({ lrn, name, sex: sex as 'M' | 'F', status })
          count++
        }
      }

      toast.success(`Imported ${count} students from Excel`, { id: toastId })
      e.target.value = ''
    } catch (err) {
      console.error(err)
      toast.error("Failed to parse Excel file. Ensure it is a valid .xlsx or .csv.", { id: toastId })
    }
  }

  const handleExportZip = async () => {
    setIsExportingZip(true)
    const toastId = toast.loading("Generating ZIP archive containing all DepEd Forms...")
    try {
      const store = useTeacherStore.getState()
      const students = store.students
      const attendance = store.attendance
      const schoolInfo = store.schoolInfo

      const zip = new JSZip()
      
      const fetchForm = async (formType: string, bodyData: any) => {
        const res = await fetch('/api/export/sf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken || ''
          },
          body: JSON.stringify(bodyData)
        })
        if (!res.ok) throw new Error(`Failed to generate ${formType}`)
        return await res.blob()
      }

      toast.loading("Generating SF1 Masterlist...", { id: toastId })
      const sf1 = await fetchForm('sf1', { form: 'sf1', students, schoolInfo })
      zip.file(`SF1_Masterlist_${schoolInfo.section}.xlsx`, sf1)

      toast.loading("Generating SF2 Attendance...", { id: toastId })
      const sf2 = await fetchForm('sf2', { form: 'sf2', students, attendance, schoolInfo, year: new Date().getFullYear(), month: new Date().getMonth() })
      zip.file(`SF2_Attendance_${schoolInfo.section}.xlsx`, sf2)

      toast.loading("Generating SF5 Promotion...", { id: toastId })
      const sf5 = await fetchForm('sf5', { form: 'sf5', students, schoolInfo })
      zip.file(`SF5_Promotion_${schoolInfo.section}.xlsx`, sf5)

      toast.loading("Compressing forms...", { id: toastId })
      const content = await zip.generateAsync({ type: "blob" })
      saveAs(content, `DepEd_Forms_${schoolInfo.section}_${new Date().toISOString().slice(0, 10)}.zip`)
      
      toast.success("All forms exported successfully as a ZIP archive!", { id: toastId })
    } catch (err) {
      console.error(err)
      toast.error("Failed to export ZIP archive.", { id: toastId })
    } finally {
      setIsExportingZip(false)
    }
  }

  const handleExportSingle = async (formType: string) => {
    const toastId = toast.loading(`Generating ${formType.toUpperCase()}...`)
    try {
      const store = useTeacherStore.getState()
      const students = store.students
      const attendance = store.attendance
      const schoolInfo = store.schoolInfo
      const grades = store.grades

      const body: any = { form: formType, students, schoolInfo }
      if (formType === 'sf2' || formType === 'sf4') {
        body.year = exportYear
        body.month = exportMonth
      }
      if (formType === 'sf3') {
        body.books = store.books
      }
      if (formType === 'sf9' || formType === 'sf10' || formType === 'composite') {
        body.grades = grades
        body.attendance = attendance
      }
      if (formType === 'sf9' || formType === 'sf10') {
        body.exportMode = exportMode
        if (exportMode === 'specific_student') {
          body.studentLrn = studentLrn
        }
      }

      const res = await fetch('/api/export/sf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error(`Failed to generate ${formType}`)
      const blob = await res.blob()
      const filename = res.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] || `${formType}.xlsx`
      saveAs(blob, filename)
      toast.success(`${formType.toUpperCase()} exported successfully!`, { id: toastId })
      setExportModalOpen(false)
    } catch (err) {
      console.error(err)
      toast.error(`Failed to export ${formType.toUpperCase()}.`, { id: toastId })
    }
  }

  const teacherPin = useTeacherStore(s => s.teacherPinPlain)
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
    // Fetch CSRF token for API calls
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
    // Math guardrail for grade integrity
    for (const sub of subjects) {
        if (sub.wwWeight + sub.ptWeight + sub.qaWeight !== 100) {
            toast.error(`Validation Error: Grading weights for "${sub.name || 'Subject'}" must exactly equal 100%. Please adjust before saving.`)
            return
        }
    }
    
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
        toast.success("Settings imported successfully!")
      } catch {
        toast.error("Invalid config file.")
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between sm:items-center gap-4">
        <div>
          <h1 data-testid="settings-heading" className="text-2xl font-black tracking-tight" style={{ color: "#111A24" }}>Settings</h1>
          <p className="skeu-label mt-1">Manage subjects, school info, and data import/export.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportConfig} className="skeu-btn-ghost inline-flex items-center h-9 px-4 rounded-xl text-sm gap-2">
            <Download size={16} /> Export Config
          </button>
          <label className="cursor-pointer">
            <input type="file" accept=".json" className="hidden" onChange={handleImportConfig} />
            <div className="skeu-btn-ghost inline-flex items-center h-9 px-4 rounded-xl text-sm gap-2">
              <Upload size={16} /> Import Config
            </div>
          </label>
          <button onClick={handleSave} className={`skeu-btn inline-flex items-center h-9 px-4 rounded-xl text-sm gap-2 transition-all active:scale-95 ${saved ? 'opacity-90' : ''}`}>
            {saved ? <><CheckCircle2 size={16} /> Saved!</> : <><Save size={16} /> Save Settings</>}
          </button>
        </div>
      </div>

      {saved && (
        <div className="animate-in slide-in-from-top-2 fade-in duration-300 flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: "linear-gradient(160deg, #E8F7EE 0%, #DDEEE5 100%)", border: "1px solid #A8D8BA", boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset" }}>
          <CheckCircle2 size={20} style={{ color: "#003876" }} className="shrink-0" />
          <p className="font-bold text-sm" style={{ color: "#003876" }}>All settings saved to local storage.</p>
        </div>
      )}

      {/* School Information */}
      <div className="skeu-card overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4"
          style={{ background: "linear-gradient(180deg, #FAFCFF 0%, #F4F7FC 100%)", borderBottom: "1px solid #DDE4EE" }}>
          <div className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(180deg, #E0F0FF, #C8E0FF)", border: "1px solid #A8C8F0", boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset" }}>
            <School size={14} style={{ color: "#003876" }} />
          </div>
          <div>
            <p className="font-black text-sm" style={{ color: "#111A24" }}>School Information</p>
            <p className="skeu-label mt-0.5">This information appears on all generated forms (SF1, SF2, SF5).</p>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <label className="skeu-label">School Name</label>
              <input
                value={schoolInfo.schoolName}
                onChange={e => setSchoolInfo({...schoolInfo, schoolName: e.target.value})}
                className="skeu-input px-3 py-2 w-full text-sm font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="skeu-label">School ID</label>
              <input
                value={schoolInfo.schoolId}
                onChange={e => setSchoolInfo({...schoolInfo, schoolId: e.target.value})}
                className="skeu-input px-3 py-2 w-full text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="skeu-label">Division</label>
              <input
                value={schoolInfo.division}
                onChange={e => setSchoolInfo({...schoolInfo, division: e.target.value})}
                className="skeu-input px-3 py-2 w-full text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="skeu-label">Region</label>
              <input
                value={schoolInfo.region}
                onChange={e => setSchoolInfo({...schoolInfo, region: e.target.value})}
                className="skeu-input px-3 py-2 w-full text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="skeu-label">Grade Level</label>
              <input
                value={schoolInfo.gradeLevel}
                onChange={e => setSchoolInfo({...schoolInfo, gradeLevel: e.target.value})}
                className="skeu-input px-3 py-2 w-full text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="skeu-label">Section</label>
              <input
                value={schoolInfo.section}
                onChange={e => setSchoolInfo({...schoolInfo, section: e.target.value})}
                className="skeu-input px-3 py-2 w-full text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="skeu-label">School Year</label>
              <input
                value={schoolInfo.schoolYear}
                onChange={e => setSchoolInfo({...schoolInfo, schoolYear: e.target.value})}
                className="skeu-input px-3 py-2 w-full text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="skeu-label">Current Quarter</label>
              <input
                value={schoolInfo.quarter}
                onChange={e => setSchoolInfo({...schoolInfo, quarter: e.target.value})}
                className="skeu-input px-3 py-2 w-full text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="skeu-label">Class Adviser Name</label>
              <input
                value={schoolInfo.adviserName}
                onChange={e => setSchoolInfo({...schoolInfo, adviserName: e.target.value})}
                className="skeu-input px-3 py-2 w-full text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="skeu-label">School Head Name</label>
              <input
                value={schoolInfo.schoolHeadName}
                onChange={e => setSchoolInfo({...schoolInfo, schoolHeadName: e.target.value})}
                className="skeu-input px-3 py-2 w-full text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Subject Management */}
      <div className="skeu-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4"
          style={{ background: "linear-gradient(180deg, #FAFCFF 0%, #F4F7FC 100%)", borderBottom: "1px solid #DDE4EE" }}>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(180deg, #E0F0FF, #C8E0FF)", border: "1px solid #A8C8F0", boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset" }}>
              <BookOpen size={14} style={{ color: "#003876" }} />
            </div>
            <div>
              <p className="font-black text-sm" style={{ color: "#111A24" }}>Subject Configuration</p>
              <p className="skeu-label mt-0.5">Add, edit, or remove subjects and their DepEd grading weights.</p>
            </div>
          </div>
          <button onClick={handleAddSubject} className="skeu-btn-ghost inline-flex items-center h-8 px-3 rounded-xl text-xs gap-1.5">
            <Plus size={14} /> Add Subject
          </button>
        </div>
        <div className="overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow style={{ background: "#F4F7FC", borderBottom: "1px solid #DDE4EE" }}>
                <TableHead className="skeu-label w-[250px]">Subject Name</TableHead>
                <TableHead className="skeu-label w-[100px]">Abbreviation</TableHead>
                <TableHead className="skeu-label text-center w-[100px]">WW %</TableHead>
                <TableHead className="skeu-label text-center w-[100px]">PT %</TableHead>
                <TableHead className="skeu-label text-center w-[100px]">QA %</TableHead>
                <TableHead className="skeu-label text-center w-[80px]">Total</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((subject) => {
                const total = subject.wwWeight + subject.ptWeight + subject.qaWeight
                const isValid = total === 100
                return (
                  <TableRow key={subject.id} className="group transition-colors"
                    style={{ borderBottom: "1px solid #EEF2F8" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(28,165,96,0.03)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "")}
                  >
                    <TableCell>
                      <input
                        value={subject.name}
                        onChange={e => handleSubjectChange(subject.id, 'name', e.target.value)}
                        placeholder="e.g. Filipino"
                        className="skeu-input px-2 py-1.5 text-sm w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        value={subject.abbreviation}
                        onChange={e => handleSubjectChange(subject.id, 'abbreviation', e.target.value.toUpperCase())}
                        placeholder="FIL"
                        maxLength={4}
                        className="skeu-input px-2 py-1.5 text-sm w-full text-center font-mono"
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="number"
                        value={subject.wwWeight}
                        onChange={e => handleSubjectChange(subject.id, 'wwWeight', parseInt(e.target.value) || 0)}
                        className="skeu-input px-2 py-1.5 text-sm w-16 mx-auto text-center"
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="number"
                        value={subject.ptWeight}
                        onChange={e => handleSubjectChange(subject.id, 'ptWeight', parseInt(e.target.value) || 0)}
                        className="skeu-input px-2 py-1.5 text-sm w-16 mx-auto text-center"
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="number"
                        value={subject.qaWeight}
                        onChange={e => handleSubjectChange(subject.id, 'qaWeight', parseInt(e.target.value) || 0)}
                        className="skeu-input px-2 py-1.5 text-sm w-16 mx-auto text-center"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isValid ? 'skeu-badge-green' : ''}`}
                        style={isValid ? {} : { background: "#FFF0F0", color: "#C03030", border: "1px solid #E8AAAA" }}>
                        {total}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleRemoveSubject(subject.id)}
                        className="flex items-center justify-center h-8 w-8 rounded-lg transition-colors"
                        style={{ color: "#B8C4D4" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#C03030"; (e.currentTarget as HTMLElement).style.background = "#FFF0F0" }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#B8C4D4"; (e.currentTarget as HTMLElement).style.background = "transparent" }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Data Import/Export Hub */}
      <div className="skeu-card overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4"
          style={{ background: "linear-gradient(180deg, #FAFCFF 0%, #F4F7FC 100%)", borderBottom: "1px solid #DDE4EE" }}>
          <div className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(180deg, #F0E8FF, #E4D8FF)", border: "1px solid #C8B8F0", boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset" }}>
            <FileSpreadsheet size={14} style={{ color: "#7040C0" }} />
          </div>
          <div>
            <p className="font-black text-sm" style={{ color: "#111A24" }}>Data Import & Export Hub</p>
            <p className="skeu-label mt-0.5">Import student data from Excel files, photos, or export DepEd forms.</p>
          </div>
        </div>
        <div className="p-5">
          {/* Individual Form Export */}
          <div className="mb-5 p-5 rounded-xl"
            style={{
              background: "linear-gradient(160deg, #FFFFFF 0%, #FAFCFF 100%)",
              border: "1px solid #DDE4EE",
              boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 2px 6px rgba(0,0,0,0.05)"
            }}>
            <p className="font-bold text-sm mb-3" style={{ color: "#111A24" }}>Individual Form Export</p>
            <div className="flex flex-wrap gap-2">
              {['sf1', 'sf2', 'sf3', 'sf4', 'sf5', 'sf6', 'sf8', 'sf9', 'sf10', 'composite'].map((ft) => (
                <button
                  key={ft}
                  onClick={() => { setSelectedFormType(ft); setExportModalOpen(true) }}
                  className="skeu-btn-ghost inline-flex items-center h-8 px-3 rounded-xl text-xs gap-1.5 capitalize"
                >
                  {ft === 'composite' ? 'Composite Grades' : ft.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Import from Excel */}
            <label className="cursor-pointer group">
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleExcelImport} />
              <div className="flex flex-col items-center p-6 rounded-xl transition-all group-hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(160deg, #FFFFFF 0%, #FAFCFF 100%)",
                  border: "2px dashed #DDE4EE",
                  boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 2px 6px rgba(0,0,0,0.05)"
                }}>
                <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: "linear-gradient(180deg, #E0F0FF, #C8E0FF)", border: "1px solid #A8C8F0", boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset" }}>
                  <FileSpreadsheet size={24} style={{ color: "#003876" }} />
                </div>
                <p className="font-bold text-sm" style={{ color: "#111A24" }}>Import Excel</p>
                <p className="text-[11px] text-center mt-1" style={{ color: "#8898AC" }}>Upload .xlsx or .csv files with student data</p>
              </div>
            </label>

            {/* Import from Camera */}
            <label className="cursor-pointer group">
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleAIImport} />
              <div className="flex flex-col items-center p-6 rounded-xl transition-all group-hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(160deg, #FFFFFF 0%, #FAFCFF 100%)",
                  border: "2px dashed #DDE4EE",
                  boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 2px 6px rgba(0,0,0,0.05)"
                }}>
                <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: "linear-gradient(180deg, #E0F0FF, #C8E0FF)", border: "1px solid #A8C8F0", boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset" }}>
                  <Camera size={24} style={{ color: "#003876" }} />
                </div>
                <p className="font-bold text-sm" style={{ color: "#111A24" }}>Capture Photo</p>
                <p className="text-[11px] text-center mt-1" style={{ color: "#8898AC" }}>Take a photo of Form 138 or attendance sheet</p>
              </div>
            </label>

            {/* Import from Image File */}
            <label className="cursor-pointer group">
              <input type="file" accept="image/*" className="hidden" onChange={handleAIImport} />
              <div className="flex flex-col items-center p-6 rounded-xl transition-all group-hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(160deg, #FFFFFF 0%, #FAFCFF 100%)",
                  border: "2px dashed #DDE4EE",
                  boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 2px 6px rgba(0,0,0,0.05)"
                }}>
                <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: "linear-gradient(180deg, #F0E8FF, #E4D8FF)", border: "1px solid #C8B8F0", boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset" }}>
                  <Sparkles size={24} style={{ color: "#7040C0" }} />
                </div>
                <p className="font-bold text-sm" style={{ color: "#111A24" }}>AI Smart Import</p>
                <p className="text-[11px] text-center mt-1" style={{ color: "#8898AC" }}>Upload any image for AI-powered data extraction</p>
              </div>
            </label>

            {/* Export All Forms */}
            <button disabled={isExportingZip} onClick={handleExportZip} data-testid="export-all-forms" className="group text-left">
              <div className={`flex flex-col items-center p-6 rounded-xl transition-all ${isExportingZip ? 'opacity-70' : 'group-hover:-translate-y-0.5'}`}
                style={{
                  background: "linear-gradient(160deg, #FFFFFF 0%, #FAFCFF 100%)",
                  border: "2px dashed #DDE4EE",
                  boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 2px 6px rgba(0,0,0,0.05)"
                }}>
                <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: "linear-gradient(180deg, #FFF4E0, #FFE8C0)", border: "1px solid #E8C878", boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset" }}>
                  {isExportingZip ? <div className="animate-spin w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full" /> : <Download size={24} style={{ color: "#D08010" }} />}
                </div>
                <p className="font-bold text-sm" style={{ color: "#111A24" }}>{isExportingZip ? 'Compressing...' : 'Export All Forms'}</p>
                <p className="text-[11px] text-center mt-1" style={{ color: "#8898AC" }}>Download SF1, SF2, and SF5 as a ZIP archive</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* PIN Management */}
      <div className="skeu-card overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4"
          style={{ background: "linear-gradient(180deg, #FAFCFF 0%, #F4F7FC 100%)", borderBottom: "1px solid #DDE4EE" }}>
          <div className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(180deg, #FFE8C0, #FFD890)", border: "1px solid #E8C060", boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset" }}>
            <ShieldCheck size={14} style={{ color: "#C07800" }} />
          </div>
          <div>
            <p className="font-black text-sm" style={{ color: "#111A24" }}>Teacher PIN / Security</p>
            <p className="skeu-label mt-0.5">Your 4-digit PIN is required to edit past-date attendance. Default PIN is <strong>1234</strong>.</p>
          </div>
        </div>
        <div className="p-5">
          {pinSaved && (
            <div className="mb-4 flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: "linear-gradient(160deg, #E8F7EE 0%, #DDEEE5 100%)", border: "1px solid #A8D8BA", boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset" }}>
              <CheckCircle2 size={20} style={{ color: "#003876" }} className="shrink-0" />
              <p className="font-bold text-sm" style={{ color: "#003876" }}>PIN updated successfully!</p>
            </div>
          )}
          {pinError && (
            <div className="mb-4 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium"
              style={{ background: "linear-gradient(160deg, #FFF8F8 0%, #FFF0F0 100%)", border: "1px solid #E8AAAA", color: "#C03030" }}>
              <span>⚠️</span> {pinError}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl">
            <div className="space-y-1.5">
              <label className="skeu-label flex items-center gap-1">
                Current PIN
                <button type="button" onClick={() => setShowPins(v => !v)} className="ml-1 transition-colors" style={{ color: "#B8C4D4" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#5A6A7E")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#B8C4D4")}>
                  {showPins ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              </label>
              <input
                type={showPins ? "text" : "password"}
                placeholder="••••"
                maxLength={4}
                value={pinForm.current}
                onChange={e => setPinForm(p => ({ ...p, current: e.target.value.replace(/\D/g, '').slice(0,4) }))}
                className="skeu-input px-3 py-2 w-full font-mono tracking-widest text-lg text-center h-11"
              />
            </div>
            <div className="space-y-1.5">
              <label className="skeu-label">New PIN</label>
              <input
                type={showPins ? "text" : "password"}
                placeholder="••••"
                maxLength={4}
                value={pinForm.newPin}
                onChange={e => setPinForm(p => ({ ...p, newPin: e.target.value.replace(/\D/g, '').slice(0,4) }))}
                className="skeu-input px-3 py-2 w-full font-mono tracking-widest text-lg text-center h-11"
              />
            </div>
            <div className="space-y-1.5">
              <label className="skeu-label">Confirm New PIN</label>
              <input
                type={showPins ? "text" : "password"}
                placeholder="••••"
                maxLength={4}
                value={pinForm.confirm}
                onChange={e => setPinForm(p => ({ ...p, confirm: e.target.value.replace(/\D/g, '').slice(0,4) }))}
                className="skeu-input px-3 py-2 w-full font-mono tracking-widest text-lg text-center h-11"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
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
              className="skeu-btn inline-flex items-center h-9 px-4 rounded-xl text-sm gap-2 transition-all active:scale-95"
            >
              <ShieldCheck size={16} /> Update PIN
            </button>
            <p className="text-xs" style={{ color: "#8898AC" }}>
              Current PIN: <span className="font-mono font-bold" style={{ color: "#5A6A7E" }}>{showPins ? teacherPin : '••••'}</span>
            </p>
            <div className="ml-auto flex items-center gap-2">
               <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "#8898AC" }}>Dev Mode</label>
               <input 
                 type="checkbox" 
                 checked={useTeacherStore.getState().devMode} 
                 onChange={(e) => useTeacherStore.getState().setDevMode(e.target.checked)}
                 className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
               />
            </div>
          </div>
        </div>
      </div>

      {/* Developer Debug Panel */}
      {useTeacherStore(s => s.devMode) && (
        <div className="skeu-card overflow-hidden border-2 border-dashed border-red-200 animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-3 px-5 py-4"
            style={{ background: "linear-gradient(180deg, #FFF8F8 0%, #FFF0F0 100%)", borderBottom: "1px solid #FFD0D0" }}>
            <div className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ background: "#C03030", border: "1px solid #A02020", boxShadow: "0 1px 0 rgba(255,255,255,0.3) inset" }}>
              <Settings2 size={14} className="text-white" />
            </div>
            <div>
              <p className="font-black text-sm" style={{ color: "#C03030" }}>Developer Debug Panel</p>
              <p className="text-[11px] font-medium opacity-70">Advanced tools for debugging and raw data management.</p>
            </div>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={() => {
                const data = useTeacherStore.getState()
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                saveAs(blob, `RAW_DUMP_${new Date().getTime()}.json`)
                toast.success("Raw store dump exported!")
              }}
              className="skeu-btn-ghost flex items-center justify-center h-10 rounded-xl text-xs gap-2 border-red-100 hover:bg-red-50"
            >
              <Download size={14} /> Download Raw State JSON
            </button>
            <button 
              onClick={() => {
                if (confirm("CRITICAL: This will permanently delete ALL local students, grades, and attendance. This cannot be undone. Proceed?")) {
                  localStorage.removeItem('depaid-teacher-storage')
                  window.location.reload()
                }
              }}
              className="flex items-center justify-center h-10 rounded-xl text-xs gap-2 bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-sm"
            >
              <Trash2 size={14} /> NUKE LOCAL DATABASE
            </button>
            <div className="sm:col-span-2 p-3 bg-gray-900 rounded-lg overflow-hidden">
               <p className="text-[10px] font-mono text-green-400 mb-2">// Active Store Summary</p>
               <pre className="text-[10px] font-mono text-gray-400 whitespace-pre-wrap">
                 {JSON.stringify({
                   studentsCount: useTeacherStore.getState().students.length,
                   gradesCount: Object.keys(useTeacherStore.getState().grades).length,
                   attendanceCount: Object.keys(useTeacherStore.getState().attendance).length,
                   pinEnc: useTeacherStore.getState().teacherPin,
                   school: useTeacherStore.getState().schoolInfo.schoolName
                 }, null, 2)}
               </pre>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {exportModalOpen && selectedFormType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="skeu-card w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4"
              style={{ background: "linear-gradient(180deg, #FAFCFF 0%, #F4F7FC 100%)", borderBottom: "1px solid #DDE4EE" }}>
              <p className="font-black text-sm" style={{ color: "#111A24" }}>
                Export {selectedFormType === 'composite' ? 'Composite Grades' : selectedFormType.toUpperCase()}
              </p>
              <button onClick={() => setExportModalOpen(false)} className="text-sm" style={{ color: "#8898AC" }}>✕</button>
            </div>
            <div className="p-5 space-y-4">
              {(selectedFormType === 'sf2' || selectedFormType === 'sf4') && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="skeu-label">Month</label>
                    <select
                      className="skeu-input px-3 py-2 w-full text-sm"
                      value={exportMonth}
                      onChange={e => setExportMonth(parseInt(e.target.value))}
                    >
                      {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                        <option key={m} value={i}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="skeu-label">Year</label>
                    <input
                      type="number"
                      className="skeu-input px-3 py-2 w-full text-sm"
                      value={exportYear}
                      onChange={e => setExportYear(parseInt(e.target.value))}
                    />
                  </div>
                </div>
              )}

              {(selectedFormType === 'sf9' || selectedFormType === 'sf10') && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="skeu-label">Export Mode</label>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input 
                          type="radio" 
                          name="exportMode" 
                          value="zip_archive" 
                          checked={exportMode === 'zip_archive'} 
                          onChange={(e) => setExportMode(e.target.value)} 
                        />
                        ZIP Archive (All Students)
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input 
                          type="radio" 
                          name="exportMode" 
                          value="specific_student" 
                          checked={exportMode === 'specific_student'} 
                          onChange={(e) => {
                            setExportMode(e.target.value);
                            if (!studentLrn && useTeacherStore.getState().students.length > 0) {
                              setStudentLrn(useTeacherStore.getState().students[0].lrn);
                            }
                          }} 
                        />
                        Specific Student
                      </label>
                    </div>
                  </div>

                  {exportMode === 'specific_student' && (
                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                      <label className="skeu-label">Select Student</label>
                      <select
                        className="skeu-input px-3 py-2 w-full text-sm"
                        value={studentLrn}
                        onChange={e => setStudentLrn(e.target.value)}
                      >
                        {useTeacherStore.getState().students.map((s) => (
                          <option key={s.lrn} value={s.lrn}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => handleExportSingle(selectedFormType)}
                className="skeu-btn w-full inline-flex items-center justify-center h-9 px-4 rounded-xl text-sm gap-2 transition-all active:scale-95"
              >
                <Download size={16} /> Export
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
