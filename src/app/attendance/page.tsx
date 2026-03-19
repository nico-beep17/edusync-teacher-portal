"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileDown, Printer, Save, CalendarIcon } from "lucide-react"
import { useTeacherStore } from "@/store/useStore"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { QRScannerModal } from "@/components/attendance/qr-scanner-modal"

// Mock Data
// const students = [
//   { lrn: "123456789012", name: "ANUBLING, REGIE C.", sex: "M" },
//   { lrn: "123456789013", name: "BARRIENTOS, JOHN PAUL M.", sex: "M" },
//   { lrn: "123456789014", name: "BULAHAN, ROVIC L.", sex: "M" },
//   { lrn: "123456789015", name: "CLARO, REANZ P.", sex: "F" },
// ]

// Generate exactly 5 days for a mock week
// const currentWeek = [
//   { date: "Oct 6", day: "Mon" },
//   { date: "Oct 7", day: "Tue" },
//   { date: "Oct 8", day: "Wed" },
//   { date: "Oct 9", day: "Thu" },
//   { date: "Oct 10", day: "Fri" }
// ]

export default function AttendancePage() {
  const [mounted, setMounted] = useState(false)
  const globalStudents = useTeacherStore(s => s.students)
  const globalAttendance = useTeacherStore(s => s.attendance)
  const updateAttendance = useTeacherStore(s => s.updateAttendance)
  
  // Local state purely for the currently viewed dates
  const [localAtt, setLocalAtt] = useState<Record<string, Record<string, string>>>({})

  useEffect(() => {
    // Populate local view with global state on mount
    const initialAtt: Record<string, Record<string, string>> = {}
    globalStudents.forEach(s => {
       initialAtt[s.lrn] = {}
       const records = globalAttendance[s.lrn] || []
       records.forEach(r => {
           initialAtt[s.lrn][r.date] = r.status
       })
    })
    setLocalAtt(initialAtt)
    setMounted(true)
  }, [globalStudents, globalAttendance])

  if (!mounted) return null

  // Generates exactly the last 5 literal days ending on 'Today' for dynamic UX mapping
  const todayObj = new Date();
  const weekDates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date()
    d.setDate(todayObj.getDate() - (4 - i))
    return {
      label: String(d.getDate()).padStart(2, '0'),
      dateId: d.toISOString().split('T')[0]
    }
  })

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daily Attendance (SF2)</h1>
          <p className="text-muted-foreground mt-1">Grade 8 - ARIES • Class Advisory</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <QRScannerModal />
          <Select defaultValue="october">
            <SelectTrigger className="w-[180px] bg-white">
              <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="september">September 2025</SelectItem>
              <SelectItem value="october">October 2025</SelectItem>
              <SelectItem value="november">November 2025</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={() => {
              const newAtt = { ...localAtt }
              globalStudents.forEach(s => {
                 weekDates.forEach(d => {
                     if (!newAtt[s.lrn]) newAtt[s.lrn] = {}
                     if (!newAtt[s.lrn][d.dateId]) newAtt[s.lrn][d.dateId] = 'P'
                 })
              })
              setLocalAtt(newAtt)
            }}
            variant="outline" className="bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 border-blue-200">
            Mark All Present
          </Button>
          <Button 
            onClick={() => {
               globalStudents.forEach(s => {
                  weekDates.forEach(d => {
                      const stat = localAtt[s.lrn]?.[d.dateId]
                      if (stat) updateAttendance(s.lrn, { date: d.dateId, status: stat as 'P'|'A'|'L' })
                  })
               })
               alert("Attendance Saved!")
            }}
            className="bg-[#1ca560] hover:bg-[#158045]">
            <Save className="mr-2 h-4 w-4" /> Save Record
          </Button>
        </div>
      </div>

      <Card className="bg-white/80 backdrop-blur-md shadow-sm border border-slate-200/60 overflow-hidden">
        <CardHeader className="bg-white/50 border-b flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle>Attendance Register</CardTitle>
            <CardDescription className="mt-1">
              Mark students as <span className="font-semibold text-red-500">Absent (A)</span> or <span className="font-semibold text-amber-500">Late (L)</span>. Blank means Present.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {/* <Button variant="outline" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-2">Week of Oct 6</span>
            <Button variant="outline" size="icon" className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button> */}
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="w-[50px]">No.</TableHead>
                <TableHead className="w-[300px]">Learner's Name</TableHead>
                {weekDates.map((day, idx) => (
                  <TableHead key={idx} className="text-center w-[80px]">
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-normal text-slate-500">{day.label}</span>
                      {/* <span className="font-medium text-slate-900">{day.date}</span> */}
                    </div>
                  </TableHead>
                ))}
                <TableHead className="text-center bg-red-50/50 text-red-700 w-[100px]">Total<br/>Absent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Male Section */}
              <TableRow className="bg-blue-50/50">
                <TableCell colSpan={8} className="font-bold text-xs tracking-wider text-blue-900 border-y py-2">MALE</TableCell>
              </TableRow>
              {globalStudents.filter(s => s.sex === 'M').map((student, idx) => (
                <TableRow key={student.lrn} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="text-slate-500 text-xs">{idx + 1}</TableCell>
                  <TableCell className="font-medium border-r text-sm whitespace-nowrap">{student.name}</TableCell>
                  {weekDates.map((day) => (
                    <TableCell key={day.dateId} className="p-1">
                      <Input 
                        value={localAtt[student.lrn]?.[day.dateId] || ''} 
                        onChange={(e) => setLocalAtt(prev => ({...prev, [student.lrn]: {...prev[student.lrn], [day.dateId]: e.target.value.toUpperCase()}}))}
                        placeholder="P"
                        className={`mx-auto h-8 w-10 text-center text-sm font-bold shadow-none border-transparent hover:border-slate-300 focus-visible:ring-1 focus-visible:ring-emerald-500
                        ${(localAtt[student.lrn]?.[day.dateId] === 'A') ? 'bg-red-100 text-red-600' : 
                          (localAtt[student.lrn]?.[day.dateId] === 'L') ? 'bg-amber-100 text-amber-600' : 
                          (localAtt[student.lrn]?.[day.dateId] === 'P') ? 'bg-emerald-50 text-[#1ca560]' : 'bg-transparent text-slate-400'}`}
                      />
                    </TableCell>
                  ))}
                  <TableCell className="font-bold text-red-600 bg-red-50/30 border-l text-center">
                    {Object.values(localAtt[student.lrn] || {}).filter(s => s === 'A').length}
                  </TableCell>
                </TableRow>
              ))}

              {/* Female Section */}
              <TableRow className="bg-pink-50/50">
                <TableCell colSpan={8} className="font-bold text-xs tracking-wider text-pink-900 border-y py-2">FEMALE</TableCell>
              </TableRow>
              {globalStudents.filter(s => s.sex === 'F').map((student, idx) => (
                <TableRow key={student.lrn} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="text-slate-500 text-xs">{idx + 1}</TableCell>
                  <TableCell className="font-medium border-r text-sm whitespace-nowrap">{student.name}</TableCell>
                  {weekDates.map((day) => (
                    <TableCell key={day.dateId} className="p-1">
                      <Input 
                        value={localAtt[student.lrn]?.[day.dateId] || ''} 
                        onChange={(e) => setLocalAtt(prev => ({...prev, [student.lrn]: {...prev[student.lrn], [day.dateId]: e.target.value.toUpperCase()}}))}
                        placeholder="P"
                        className={`mx-auto h-8 w-10 text-center text-sm font-bold shadow-none border-transparent hover:border-slate-300 focus-visible:ring-1 focus-visible:ring-emerald-500
                        ${(localAtt[student.lrn]?.[day.dateId] === 'A') ? 'bg-red-100 text-red-600' : 
                          (localAtt[student.lrn]?.[day.dateId] === 'L') ? 'bg-amber-100 text-amber-600' : 
                          (localAtt[student.lrn]?.[day.dateId] === 'P') ? 'bg-emerald-50 text-[#1ca560]' : 'bg-transparent text-slate-400'}`}
                      />
                    </TableCell>
                  ))}
                  <TableCell className="font-bold text-red-600 bg-red-50/30 border-l text-center">
                    {Object.values(localAtt[student.lrn] || {}).filter(s => s === 'A').length}
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
