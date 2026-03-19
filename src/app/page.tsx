"use client"

import { useTeacherStore } from "@/store/useStore"
import { useEffect, useState } from "react"
import { EnrollStudentModal } from "@/components/enrollment/enroll-student-modal"
import { StudentProfileModal } from "@/components/student-profile-modal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, UserCheck, Calculator, FileText, TrendingUp, PieChart as PieChartIcon, Cloud } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Label as RechartsLabel } from 'recharts'

export default function AdviserDashboard() {
  const [mounted, setMounted] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const masterList = useTeacherStore((state) => state.students)
  const gradesMap = useTeacherStore((state) => state.grades)
  const pushToCloud = useTeacherStore((state) => state.pushToCloud)

  // Avoid hydration mismatch for persisted store
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const maleCount = masterList.filter(s => s.sex === 'M').length
  const femaleCount = masterList.filter(s => s.sex === 'F').length
  const totalStudents = masterList.length

  // Compute Live Analytics
  const subjects = ['Filipino', 'English', 'Mathematics', 'Science', 'Ap', 'Epp/tle', 'Mapeh', 'Esp']
  const chartData = subjects.map(sub => {
    let sum = 0; let count = 0;
    masterList.forEach(s => {
      const g = gradesMap[s.lrn]?.find(x => x.subject === sub)
      if (g && g.quarterGrade > 0) { sum += g.quarterGrade; count++; }
    })
    return { subject: sub.substring(0, 4).toUpperCase(), average: count > 0 ? Number((sum/count).toFixed(2)) : 0 }
  })

  const sexData = [
    { name: 'Male', value: maleCount },
    { name: 'Female', value: femaleCount }
  ]
  const COLORS = ['#3b82f6', '#ec4899']

  return (
    <div className="flex flex-col gap-8">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Grade 8 - ARIES</h1>
          <p className="text-muted-foreground mt-1">Class Advisory Dashboard • S.Y. 2025-2026</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={pushToCloud} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-emerald-200 bg-emerald-50 text-[#1ca560] shadow-sm hover:bg-emerald-100 hover:text-[#158045] h-9 px-4 py-2">
            <Cloud className="mr-2 h-4 w-4" />
            Sync PWA to Cloud
          </button>
          <EnrollStudentModal />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white/50 backdrop-blur-sm border-white/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">{maleCount} Male • {femaleCount} Female</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white/50 backdrop-blur-sm border-white/20 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#1ca560]/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Present Today (SF2)</CardTitle>
            <UserCheck className="h-4 w-4 text-[#1ca560]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1ca560]">32</div>
            <p className="text-xs text-muted-foreground mt-1">2 Absent</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white/50 backdrop-blur-sm border-white/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Composite Grades</CardTitle>
            <Calculator className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">Q1</div>
            <p className="text-xs text-muted-foreground mt-1">7/8 Subjects Submitted</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white/50 backdrop-blur-sm border-white/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Generated Forms</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">SF1, SF5</div>
            <p className="text-xs text-muted-foreground mt-1">Ready for Print (DepEd Format)</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Section */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Class Average Bar Chart */}
        <Card className="bg-white/80 backdrop-blur-md shadow-sm border border-slate-200/60 md:col-span-2 overflow-hidden">
          <CardHeader className="bg-white/50 border-b flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="flex items-center"><TrendingUp className="mr-2 h-5 w-5 text-[#1ca560]" /> Subject Performance (Q1)</CardTitle>
              <CardDescription>Live class average per learning area.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="subject" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dy={10} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                />
                <Bar dataKey="average" fill="#1ca560" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.average >= 90 ? '#10b981' : entry.average >= 75 ? '#1ca560' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Demographics Pie Chart */}
        <Card className="bg-white/80 backdrop-blur-md shadow-sm border border-slate-200/60 overflow-hidden">
          <CardHeader className="bg-white/50 border-b pb-4">
            <CardTitle className="flex items-center"><PieChartIcon className="mr-2 h-5 w-5 text-indigo-500" /> Demographics</CardTitle>
            <CardDescription>Sex ratio of enrolled learners.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sexData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {sexData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                  <RechartsLabel
                    value={totalStudents} position="center"
                    className="text-3xl font-bold fill-slate-800"
                  />
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Masterlist Section */}
      <Card className="bg-white/80 backdrop-blur-md shadow-sm border border-slate-200/60 overflow-hidden">
        <CardHeader className="bg-white/50 border-b">
          <CardTitle>Class Masterlist (SF1)</CardTitle>
          <CardDescription>
            List of officially enrolled students for this section.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="w-[150px]">LRN</TableHead>
                <TableHead>Legal Name</TableHead>
                <TableHead>Sex</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Male Section Header */}
              <TableRow className="bg-blue-50/30">
                <TableCell colSpan={5} className="font-semibold text-xs tracking-wider text-blue-800">MALE</TableCell>
              </TableRow>
              {masterList.filter(s => s.sex === 'M').map((student, idx) => (
                <TableRow key={student.lrn} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-mono text-sm">{student.lrn}</TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${student.sex === 'M' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>
                      {student.sex}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      {student.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <button onClick={() => setSelectedStudent(student)} className="text-sm text-slate-500 hover:text-[#1ca560] transition-colors font-medium">
                      View Records
                    </button>
                  </TableCell>
                </TableRow>
              ))}
              {/* Female Section Header */}
              <TableRow className="bg-pink-50/30">
                <TableCell colSpan={5} className="font-semibold text-xs tracking-wider text-pink-800">FEMALE</TableCell>
              </TableRow>
              {masterList.filter(s => s.sex === 'F').map((student, idx) => (
                <TableRow key={student.lrn} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-mono text-sm">{student.lrn}</TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${student.sex === 'M' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>
                      {student.sex}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      {student.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <button onClick={() => setSelectedStudent(student)} className="text-sm text-slate-500 hover:text-[#1ca560] transition-colors font-medium">
                      View Records
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* Dynamic Profile Modal */}
      <StudentProfileModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
    </div>
  )
}
