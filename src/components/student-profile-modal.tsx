import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useTeacherStore, Student } from "@/store/useStore"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { QrCode } from "lucide-react"

interface StudentProfileModalProps {
  student: Student | null
  onClose: () => void
}

export function StudentProfileModal({ student, onClose }: StudentProfileModalProps) {
  const gradesMap = useTeacherStore(s => s.grades)
  const attendanceMap = useTeacherStore(s => s.attendance)

  if (!student) return null

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

        <div className="grid grid-cols-3 gap-4 py-4">
          <div className="flex flex-col p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Gen. Average</span>
            <span className="text-2xl font-bold text-slate-900 mt-1">{generalAvg}</span>
          </div>
          <div className="flex flex-col p-4 bg-red-50 rounded-xl border border-red-100">
            <span className="text-xs text-red-600 font-medium">Total Absences</span>
            <span className="text-2xl font-bold text-red-700 mt-1">{absences}</span>
          </div>
          <div className="flex flex-col p-4 bg-amber-50 rounded-xl border border-amber-100">
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
                      <TableCell className={`text-center font-bold ${g.quarterGrade >= 75 ? 'text-[#1ca560]' : 'text-red-500'}`}>
                        {g.quarterGrade}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
