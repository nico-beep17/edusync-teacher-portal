import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useTeacherStore, Student } from "@/store/useStore"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { QrCode, Sparkles, Pencil } from "lucide-react"
import { useState, useEffect } from "react"
import QRCode from "react-qr-code"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

interface StudentProfileModalProps {
  student: Student | null
  onClose: () => void
}

export function StudentProfileModal({ student, onClose }: StudentProfileModalProps) {
  const gradesMap = useTeacherStore(s => s.grades)
  const attendanceMap = useTeacherStore(s => s.attendance)
  const editStudent = useTeacherStore(s => s.editStudent)
  const [activeTab, setActiveTab] = useState<'overview' | 'badge' | 'edit'>('overview')

  const [editForm, setEditForm] = useState({
      lrn: "",
      name: "",
      sex: "M"
  })

  // Sync form when student selected
  useEffect(() => {
    if (student) {
      setEditForm({ lrn: student.lrn, name: student.name, sex: student.sex })
      setActiveTab('overview')
    }
  }, [student])

  if (!student) return null

  const handleSaveEdit = (e: React.FormEvent) => {
      e.preventDefault()
      if (!student) return
      editStudent(student.lrn, {
          lrn: editForm.lrn,
          name: editForm.name,
          sex: editForm.sex as 'M' | 'F',
          status: student.status
      })
      alert("Student Profile Updated Successfully")
      setActiveTab('overview')
  }

  const studentGrades = gradesMap[student.lrn] || []
  const studentAtt = attendanceMap[student.lrn] || []

  // Count absences
  const absences = studentAtt.filter(a => a.status === 'A').length
  const lates = studentAtt.filter(a => a.status === 'L').length

  // Calculate General Average
  let sum = 0; let count = 0;
  studentGrades.forEach(g => {
    if (g.quarterGrade > 0) {
      sum += g.quarterGrade
      count++
    }
  })
  const generalAvg = count > 0 ? (sum / count).toFixed(2) : 'N/A'

  return (
    <Dialog open={!!student} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{student.name}</DialogTitle>
              <div className="flex items-center mt-2 group cursor-pointer transition-colors hover:text-blue-600 rounded p-1 -ml-1">
                 <QrCode size={16} className="text-slate-400 group-hover:text-blue-600 mr-2" />
                 <DialogDescription className="font-mono text-sm tracking-widest text-slate-600 group-hover:text-blue-600 select-all">{student.lrn}</DialogDescription>
              </div>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${student.sex === 'M' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>
              {student.sex === 'M' ? 'Male' : 'Female'}
            </span>
          </div>
        </DialogHeader>

        <div className="flex items-center gap-4 py-2 border-b border-slate-100 px-6">
           <button onClick={() => setActiveTab('overview')} className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${activeTab === 'overview' ? 'border-[#003876] text-[#003876]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Academic Overview</button>
           <button onClick={() => setActiveTab('badge')} className={`text-sm font-semibold pb-2 border-b-2 flex items-center transition-colors ${activeTab === 'badge' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              <QrCode size={14} className="mr-1.5" /> ID Badge
           </button>
           <button onClick={() => setActiveTab('edit')} className={`text-sm font-semibold pb-2 border-b-2 flex items-center transition-colors ${activeTab === 'edit' ? 'border-amber-600 text-amber-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              <Pencil size={14} className="mr-1.5" /> Edit Profile
           </button>
        </div>

        <div className="px-6 pb-6 pt-2">
        {activeTab === 'overview' ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-3 gap-4 py-4">
              <div className="flex flex-col p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 font-medium">Gen. Average</span>
                <span className="text-2xl font-bold text-slate-900 mt-1">{generalAvg}</span>
              </div>
              <div className="flex flex-col p-4 bg-red-50/50 rounded-xl border border-red-100">
                <span className="text-xs text-red-600 font-medium">Total Absences</span>
                <span className="text-2xl font-bold text-red-700 mt-1">{absences}</span>
              </div>
              <div className="flex flex-col p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                <span className="text-xs text-amber-600 font-medium">Total Lates</span>
                <span className="text-2xl font-bold text-amber-700 mt-1">{lates}</span>
              </div>
            </div>

            <div className="mt-2">
              <h4 className="font-semibold text-sm mb-3">Academic Performance</h4>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Learning Area</TableHead>
                      <TableHead className="text-center">Initial Grade</TableHead>
                      <TableHead className="text-center font-bold">Quarter Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentGrades.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-slate-500 py-6">No grades recorded.</TableCell>
                      </TableRow>
                    ) : (
                      studentGrades.map((g, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{g.subject}</TableCell>
                          <TableCell className="text-center text-slate-500">-</TableCell>
                          <TableCell className={`text-center font-bold ${g.quarterGrade >= 75 ? 'text-[#003876]' : 'text-red-500'}`}>
                            {g.quarterGrade}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        ) : activeTab === 'badge' ? (
          <div className="flex flex-col items-center justify-center py-6 animate-in fade-in zoom-in-95 duration-500">
             <div className="relative flex flex-col items-center w-[300px] h-[480px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden group">
                {/* ID Header Graphic */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#003876] to-blue-700 pointer-events-none">
                   <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                </div>
                
                {/* ID Content */}
                <div className="z-10 flex flex-col items-center mt-6 text-center text-white drop-shadow-sm">
                   <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50 mb-2 shadow-lg overflow-hidden">
                      <img src="/depaid-logo.svg" alt="DepAid" className="w-12 h-12 object-cover" />
                   </div>
                   <h2 className="font-extrabold text-sm tracking-widest text-blue-50">QUEZON NATL HIGH</h2>
                   <p className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">DepAid ID • SY 2025-2026</p>
                </div>

                {/* QR Focus */}
                <div className="z-10 mt-10 bg-white p-4 rounded-xl shadow-lg border border-slate-100 transform transition-transform group-hover:scale-105 duration-300">
                   <QRCode 
                      value={student.lrn} 
                      size={140}
                      level="H"
                      fgColor="#1e293b"
                   />
                </div>

                <div className="mt-8 flex flex-col items-center">
                   <h1 className="text-xl font-bold text-slate-900 tracking-tight text-center leading-tight px-4">{student.name}</h1>
                   <div className="flex items-center gap-1.5 mt-2 bg-slate-100 rounded-full px-3 py-1">
                      <Sparkles size={12} className="text-amber-500" />
                      <span className="font-mono text-xs font-semibold tracking-widest text-[#003876]">{student.lrn}</span>
                   </div>
                   <p className="text-xs font-bold text-slate-400 mt-4 tracking-widest uppercase">Grade 8 ARIES</p>
                </div>
             </div>
             <p className="text-xs text-slate-400 italic mt-6 bg-slate-50 px-4 py-2 rounded-md border border-slate-100">
                Screenshot / Print this ID Badge heavily enabling QR Daily Attendance tracking.
             </p>
          </div>
        ) : activeTab === 'edit' ? (
          <form onSubmit={handleSaveEdit} className="grid gap-4 py-4 animate-in fade-in zoom-in-95 duration-300">
             <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-800 border border-amber-200 mb-2 shadow-sm">
                 <strong>Safe Edit Mode:</strong> Changing the LRN here will safely migrate all underlying grades and attendance to the newly corrected number without data loss.
             </div>
             
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="edit-lrn" className="text-right font-medium text-slate-700">Learner Ref (LRN)</Label>
               <Input id="edit-lrn" value={editForm.lrn} onChange={e => setEditForm({...editForm, lrn: e.target.value})} className="col-span-3 bg-white" required />
             </div>
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="edit-name" className="text-right font-medium text-slate-700">Legal Name</Label>
               <Input id="edit-name" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value.toUpperCase()})} placeholder="DELA CRUZ, JUAN M. JR." className="col-span-3 bg-white" required />
             </div>
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="edit-sex" className="text-right font-medium text-slate-700">Sex</Label>
               <Select value={editForm.sex} onValueChange={(val) => setEditForm({...editForm, sex: val || 'M'})}>
                 <SelectTrigger className="w-full col-span-3 bg-white">
                   <SelectValue placeholder="Select sex" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="M">Male</SelectItem>
                   <SelectItem value="F">Female</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             
             <div className="flex justify-end gap-3 mt-6 border-t border-slate-100 pt-4">
                 <Button type="button" variant="outline" onClick={() => setActiveTab('overview')} className="h-10 px-5">Cancel</Button>
                 <Button type="submit" className="h-10 px-6 bg-[#003876] hover:bg-blue-800 text-white shadow-md">Save Changes</Button>
             </div>
          </form>
        ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
