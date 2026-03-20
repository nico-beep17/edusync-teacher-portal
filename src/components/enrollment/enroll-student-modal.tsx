"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, Wand2, UploadCloud, Loader2, CheckCircle2 } from "lucide-react"
import { useTeacherStore } from "@/store/useStore"
import { useRef } from "react"

export function EnrollStudentModal() {
  const [activeTab, setActiveTab] = useState<'manual' | 'ai' | 'bulk'>('manual')
  const [open, setOpen] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scanSuccess, setScanSuccess] = useState(false)
  const addStudent = useTeacherStore((state) => state.addStudent)

  const [form, setForm] = useState({
    lrn: "",
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: "",
    sex: "M"
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.lrn || !form.firstName || !form.lastName) return

    const mInitial = form.middleName ? ` ${form.middleName.charAt(0).toUpperCase()}.` : ""
    const suffixStr = form.suffix ? ` ${form.suffix.toUpperCase()}` : ""
    const fullName = `${form.lastName.toUpperCase()}, ${form.firstName.toUpperCase()}${mInitial}${suffixStr}`

    addStudent({
      lrn: form.lrn,
      name: fullName,
      sex: form.sex as 'M' | 'F',
      status: 'ENROLLED'
    })

    setOpen(false) // Close modal
    setForm({ lrn: "", firstName: "", middleName: "", lastName: "", suffix: "", sex: "M" }) // Reset
    setActiveTab('manual')
    setScanSuccess(false)
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsScanning(true)
    
    // Convert selected file to base64
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onloadend = async () => {
      const base64Image = reader.result

      try {
        const res = await fetch('/api/extract-form', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Image })
        })

        if (!res.ok) {
           const err = await res.json()
           throw new Error(err.error || 'Failed to extract')
        }

        const data = await res.json()
        
        setIsScanning(false)
        setScanSuccess(true)
        
        let validStudents = 0
        
        if (data.students && Array.isArray(data.students)) {
             data.students.forEach((st: any) => {
                 const newLrn = st.lrn || String(Math.floor(Math.random() * 900000000000) + 100000000000)
                 const mInitial = st.middleName ? ` ${st.middleName.charAt(0).toUpperCase()}.` : ""
                 const suffixStr = st.suffix ? ` ${st.suffix.toUpperCase()}` : ""
                 const formattedName = `${st.lastName ? st.lastName.toUpperCase() : 'UNKNOWN'}, ${st.firstName ? st.firstName.toUpperCase() : 'UNKNOWN'}${mInitial}${suffixStr}`
                 
                 const sex = (st.sex === 'M' || st.sex === 'F') ? st.sex : "M"
                 addStudent({ lrn: newLrn, name: formattedName, sex, status: 'ENROLLED' })
                 validStudents++
             })
        }
        
        setTimeout(() => {
            setScanSuccess(false)
            if (validStudents > 0) {
               alert(`AI OCR Successfully extracted and enrolled ${validStudents} student(s) into the masterlist!`)
               setOpen(false)
            } else {
               alert(`AI could not identify clear student data from the image.`)
            }
            setActiveTab('manual')
        }, 1200)

      } catch (error) {
        console.error(error)
        alert('OCR Failed. Please ensure your OpenAI API Key is in .env.local')
        setIsScanning(false)
      }
    }
  }

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const rows = text.split('\n')
    let addedCount = 0

    rows.forEach(row => {
        const cols = row.split(',')
        if (cols.length >= 3) {
            const lrn = cols[0].trim()
            const name = cols[1].trim()
            const sex = cols[2].trim().toUpperCase()
            
            if (lrn && name && (sex === 'M' || sex === 'F')) {
                addStudent({
                    lrn, name, sex: sex as 'M' | 'F', status: 'ENROLLED'
                })
                addedCount++
            }
        }
    })
    
    alert(`Successfully bulk-enrolled ${addedCount} students into the local matrix!`)
    setOpen(false)
    setActiveTab('manual')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-[#E3001B] hover:bg-[#B30015] text-white shadow-lg shadow-blue-500/20">
            <UserPlus className="mr-2 h-4 w-4" /> Enroll Student(s)
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] bg-white/95 backdrop-blur-xl border border-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">New Student Enrollment</DialogTitle>
          <DialogDescription>
            Add a new student to your Masterlist using their Form 138.
          </DialogDescription>
        </DialogHeader>

        {/* Custom Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-lg mt-2 relative z-10 gap-0.5">
           <button 
             onClick={() => setActiveTab('manual')}
             className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'manual' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
             Manual
           </button>
           <button 
             onClick={() => setActiveTab('ai')}
             className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'ai' ? 'bg-white shadow text-[#003876]' : 'text-slate-500 hover:text-slate-700'}`}>
             <Wand2 className="h-3 w-3" /> AI Scan
           </button>
           <button 
             onClick={() => setActiveTab('bulk')}
             className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'bulk' ? 'bg-white shadow text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}>
             <UploadCloud className="h-3 w-3" /> CSV Bulk
           </button>
        </div>

        {activeTab === 'manual' && (
          <form className="grid gap-4 py-4 mt-2">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lrn" className="text-right">LRN</Label>
              <Input id="lrn" value={form.lrn} onChange={e => setForm({...form, lrn: e.target.value})} placeholder="12-digit Learner Reference Number" className="col-span-3 bg-white" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firstName" className="text-right">First Name</Label>
              <Input id="firstName" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} placeholder="Juan" className="col-span-3 bg-white" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="middleName" className="text-right">Middle Name</Label>
              <Input id="middleName" value={form.middleName} onChange={e => setForm({...form, middleName: e.target.value})} placeholder="Santos (Optional)" className="col-span-3 bg-white" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastName" className="text-right">Last Name</Label>
              <Input id="lastName" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} placeholder="Dela Cruz" className="col-span-3 bg-white" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="suffix" className="text-right">Suffix</Label>
              <Input id="suffix" value={form.suffix} onChange={e => setForm({...form, suffix: e.target.value})} placeholder="Jr., III (Optional)" className="col-span-3 bg-white" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sex" className="text-right">Sex</Label>
              <Select value={form.sex} onValueChange={(val) => setForm({...form, sex: val || 'M'})}>
                <SelectTrigger className="w-full col-span-3 bg-white">
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
        )}

        {activeTab === 'ai' && (
          <div className="flex flex-col items-center justify-center p-8 mt-2 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 min-h-[250px] transition-all relative overflow-hidden">
             {isScanning ? (
                <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                    <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 relative">
                       <Loader2 size={28} className="animate-spin absolute" />
                    </div>
                    <p className="font-semibold text-slate-800 text-center mb-1">AI Cognitive Engine Processing...</p>
                    <p className="text-sm text-slate-500 text-center max-w-[280px]">Extracting LRN, Learner Name, and historical records utilizing OCR.</p>
                </div>
             ) : scanSuccess ? (
                <div className="flex flex-col items-center justify-center animate-in slide-in-from-bottom flex-in duration-500">
                    <div className="h-16 w-16 bg-blue-100 text-[#003876] rounded-full flex items-center justify-center mb-4">
                       <CheckCircle2 size={32} />
                    </div>
                    <p className="font-semibold text-blue-700 text-center mb-1">Extraction Complete!</p>
                    <p className="text-sm text-slate-500 text-center max-w-[280px]">Redirecting to finalize Form 138 data...</p>
                </div>
             ) : (
                <div className="flex flex-col items-center justify-center animate-in fade-in duration-500">
                    <div className="h-16 w-16 bg-blue-100 text-[#003876] rounded-full flex items-center justify-center mb-4 shadow-inner">
                        <UploadCloud size={28} />
                    </div>
                    <p className="font-semibold text-slate-800 text-center mb-1">Upload exactly as printed</p>
                    <p className="text-sm text-slate-500 text-center max-w-[280px] mb-6">
                        Upload a scan or photo of DepEd Form 138. The GPT-4o Vision Engine will safely read and structure the data.
                    </p>
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                    <Button onClick={handleUploadClick} variant="outline" className="bg-white border-blue-200 text-[#003876] hover:bg-blue-50 shadow-sm relative overflow-hidden group">
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-blue-100/50 to-transparent -translate-x-[150%] animate-[shimmer_2s_infinite]"></span>
                        <Wand2 className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
                        Choose Photo to Scan
                    </Button>
                </div>
             )}
          </div>
        )}

        {/* Bulk CSV Upload Tab Content */}
        {activeTab === 'bulk' && (
          <div className="flex flex-col items-center justify-center p-8 mt-2 border-2 border-dashed border-amber-200 rounded-xl bg-amber-50/30 min-h-[250px] transition-all overflow-hidden fade-in duration-300">
             <div className="h-16 w-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
                 <UploadCloud size={28} />
             </div>
             <p className="font-semibold text-slate-800 text-center mb-2 text-lg">Mass CSV Onboarding</p>
             <p className="text-sm text-slate-500 text-center max-w-[300px] mb-6">
                 Bypass scanning limits. Upload a standard registrar list formatted exactly as:<br/>
                 <kbd className="bg-white border rounded px-2 py-0.5 mt-2 inline-block font-mono text-amber-700 shadow-sm font-bold">LRN, LASTNAME FIRSTNAME, M</kbd>
             </p>
             <input type="file" accept=".csv" className="hidden" id="csv-upload" onChange={handleCSVUpload} />
             <Button onClick={() => document.getElementById('csv-upload')?.click()} variant="outline" className="bg-amber-500 hover:bg-amber-600 text-white border-transparent shadow shadow-amber-500/20 font-bold active:scale-95">
                <UploadCloud className="mr-2 h-4 w-4" /> Initialize CSV Matrix
             </Button>
          </div>
        )}

        <DialogFooter className="pt-2 border-t mt-2">
          {activeTab === 'manual' && (
            <Button onClick={handleSubmit} className="w-full bg-[#E3001B] hover:bg-[#B30015]">Complete Enrollment</Button>
          )}
          {activeTab === 'ai' && (
             <Button type="button" disabled className="w-full bg-slate-200/60 text-slate-400">
               {isScanning ? 'Processing...' : scanSuccess ? 'Data Extracted!' : 'Scan before continuing'}
             </Button>
          )}
          {activeTab === 'bulk' && (
             <Button onClick={() => setOpen(false)} variant="outline" className="w-full text-slate-500 bg-white">
               Cancel Setup
             </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
