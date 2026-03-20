"use client"

import { useTeacherStore } from "@/store/useStore"
import { useEffect, useState } from "react"
import { EnrollStudentModal } from "@/components/enrollment/enroll-student-modal"
import { StudentProfileModal } from "@/components/student-profile-modal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, UserCheck, Calculator, FileText, TrendingUp, PieChart as PieChartIcon, Cloud, AlertTriangle, Trash2, Sparkles, Loader2, CheckCircle2 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Label as RechartsLabel } from 'recharts'

// ─── Confirm Delete Modal ──────────────────────────────────────────────────────
function ConfirmDeleteStudentModal({
  name, onConfirm, onCancel
}: {
  name: string; onConfirm: () => void; onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm mx-4 rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(160deg, #FFFFFF 0%, #FFF8F8 100%)", border: "1px solid #E8CCCC", boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 20px 60px rgba(0,0,0,0.18)" }}>
        <div className="h-1" style={{ background: "linear-gradient(90deg, #C03030, #E04040, #C03030)" }} />
        <div className="px-6 py-6">
          <div className="flex flex-col items-center text-center mb-5">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-3"
              style={{ background: "linear-gradient(180deg, #FFF4F4, #FFE8E8)", border: "1px solid #E8CCCC", boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset" }}>
              <AlertTriangle size={22} style={{ color: "#C03030" }} />
            </div>
            <h3 className="text-base font-black" style={{ color: "#111A24" }}>Remove Student?</h3>
            <p className="text-sm mt-1" style={{ color: "#8898AC" }}>
              Remove <strong style={{ color: "#C03030" }}>{name}</strong> from the masterlist?
            </p>
            <p className="text-xs mt-2 font-medium" style={{ color: "#C08080" }}>This cannot be undone. Attendance and grades linked to this student will also be removed.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={onCancel} className="skeu-btn-ghost flex-1 h-10 rounded-xl text-sm">Cancel</button>
            <button onClick={onConfirm} className="flex-1 h-10 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
              style={{ background: "linear-gradient(180deg, #E04040, #C03030)", border: "1px solid #A02020", boxShadow: "0 1px 0 rgba(255,255,255,0.15) inset, 0 4px 12px rgba(192,48,48,0.35)" }}>
              Yes, Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdviserDashboard() {
  const [mounted, setMounted] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ lrn: string; name: string } | null>(null)
  const masterList = useTeacherStore((state) => state.students)
  const gradesMap = useTeacherStore((state) => state.grades)
  const attendanceMap = useTeacherStore((state) => state.attendance)
  const pushToCloud = useTeacherStore((state) => state.pushToCloud)
  const removeStudent = useTeacherStore((state) => state.removeStudent)

  useEffect(() => { setMounted(true) }, [])
  
  const [syncing, setSyncing] = useState(false)
  const [synced, setSynced] = useState(false)
  if (!mounted) return null
  
  const handleSync = async () => {
    setSyncing(true)
    await pushToCloud()
    setSyncing(false)
    setSynced(true)
    setTimeout(() => setSynced(false), 2000)
  }

  const maleCount = masterList.filter(s => s.sex === 'M').length
  const femaleCount = masterList.filter(s => s.sex === 'F').length
  const totalStudents = masterList.length

  const subjects = ['Filipino', 'English', 'Mathematics', 'Science', 'Ap', 'Epp/tle', 'Mapeh', 'Esp']
  const chartData = subjects.map(sub => {
    let sum = 0; let count = 0;
    masterList.forEach(s => {
      const g = gradesMap[s.lrn]?.find(x => x.subject.toLowerCase().includes(sub.toLowerCase()))
      if (g && g.quarterGrade > 0) { sum += g.quarterGrade; count++; }
    })
    return { subject: sub.substring(0, 4).toUpperCase(), average: count > 0 ? Number((sum / count).toFixed(2)) : 0 }
  })

  const sexData = [{ name: 'Male', value: maleCount }, { name: 'Female', value: femaleCount }]
  const COLORS = ['#3b82f6', '#ec4899']

  const todayStr = new Date().toISOString().split('T')[0]
  const presentToday = masterList.filter(s => (attendanceMap[s.lrn] || []).some(r => r.date === todayStr && r.status === 'P')).length
  const absentToday = masterList.filter(s => (attendanceMap[s.lrn] || []).some(r => r.date === todayStr && r.status === 'A')).length

  const subjectsWithCompleteData = subjects.filter(sub =>
    masterList.every(s => (gradesMap[s.lrn] || []).some(g => g.subject.toLowerCase().includes(sub.toLowerCase())))
  ).length

  const interventionList = masterList.map(s => {
    const gList = gradesMap[s.lrn] || [];
    const aList = attendanceMap[s.lrn] || [];
    const absences = aList.filter(a => a.status === 'A').length;
    let sum = 0, count = 0;
    gList.forEach(g => { if (g.quarterGrade > 0) { sum += g.quarterGrade; count++; } });
    const avg = count > 0 ? Number((sum / count).toFixed(2)) : 0;
    return { ...s, average: avg, absences };
  }).filter(s => (s.average > 0 && s.average < 75) || s.absences >= 2);

  // Stat card config
  const statCards = [
    {
      label: "Total Students", value: totalStudents, sub: `${maleCount} Male • ${femaleCount} Female`,
      icon: Users, iconColor: "#5A6A7E", accent: "#5A6A7E"
    },
    {
      label: "Present Today (SF2)", value: presentToday, sub: absentToday > 0 ? `${absentToday} Absent Today` : "No absences today",
      icon: UserCheck, iconColor: "#003876", accent: "#003876"
    },
    {
      label: "Composite Grades", value: "Q1", sub: `${subjectsWithCompleteData}/8 Subjects Complete`,
      icon: Calculator, iconColor: "#D08010", accent: "#D08010"
    },
    {
      label: "Generated Forms", value: "SF1, SF5", sub: "Ready for Print (DepEd Format)",
      icon: FileText, iconColor: "#2060C0", accent: "#2060C0"
    },
  ]

  return (
    <div className="flex flex-col gap-6">

      {/* Delete modal */}
      {deleteTarget && (
        <ConfirmDeleteStudentModal
          name={deleteTarget.name}
          onConfirm={() => { removeStudent(deleteTarget.lrn); setDeleteTarget(null) }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "#111A24" }}>Grade 8 — ARIES</h1>
          <p className="mt-1 text-sm" style={{ color: "#8898AC" }}>Class Advisory Dashboard • S.Y. 2025-2026</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="skeu-btn-ghost inline-flex items-center h-9 px-4 rounded-lg text-sm gap-2 disabled:opacity-50 transition-all"
          >
            {syncing ? <Loader2 size={14} className="animate-spin" /> : synced ? <CheckCircle2 size={14} className="text-[#003876]" /> : <Cloud size={14} />} 
            {syncing ? 'Syncing...' : synced ? 'Synced!' : 'Sync to Cloud'}
          </button>
          <EnrollStudentModal />
        </div>
      </div>

      {/* Stat Cards — raised aluminum plates */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, sub, icon: Icon, iconColor, accent }) => (
          <div key={label} className="skeu-card p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="skeu-label">{label}</p>
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background: `linear-gradient(180deg, color-mix(in srgb, ${iconColor} 12%, white) 0%, color-mix(in srgb, ${iconColor} 8%, white) 100%)`,
                  border: `1px solid color-mix(in srgb, ${iconColor} 25%, white)`,
                  boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 2px 4px rgba(0,0,0,0.06)"
                }}
              >
                <Icon size={15} style={{ color: iconColor }} />
              </div>
            </div>
            <div className="text-3xl font-black leading-none mb-1" style={{ color: accent }}>{value}</div>
            <p className="text-xs mt-1" style={{ color: "#8898AC" }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-5 md:grid-cols-3">
        {/* Bar Chart */}
        <div className="skeu-card p-0 overflow-hidden md:col-span-2">
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{
              background: "linear-gradient(180deg, #FAFCFF 0%, #F4F7FC 100%)",
              borderBottom: "1px solid #DDE4EE"
            }}
          >
            <div>
              <p className="font-black text-sm flex items-center gap-2" style={{ color: "#111A24" }}>
                <TrendingUp size={15} style={{ color: "#003876" }} /> Subject Performance (Q1)
              </p>
              <p className="skeu-label mt-0.5">Live class average per learning area</p>
            </div>
          </div>
          <div className="px-4 py-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F8" />
                <XAxis dataKey="subject" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#8898AC', fontWeight: 700 }} dy={8} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#8898AC' }} domain={[0, 100]} />
                <Tooltip
                  cursor={{ fill: 'rgba(28,165,96,0.05)' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #DDE4EE', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', background: '#FFFFFF' }}
                  labelStyle={{ fontWeight: 'bold', color: '#111A24', fontSize: 12 }}
                />
                <Bar dataKey="average" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.average >= 90 ? '#003876' : entry.average >= 75 ? '#2080D0' : '#D08010'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="skeu-card p-0 overflow-hidden">
          <div
            className="px-5 py-4"
            style={{
              background: "linear-gradient(180deg, #FAFCFF 0%, #F4F7FC 100%)",
              borderBottom: "1px solid #DDE4EE"
            }}
          >
            <p className="font-black text-sm flex items-center gap-2" style={{ color: "#111A24" }}>
              <PieChartIcon size={15} style={{ color: "#2060C0" }} /> Demographics
            </p>
            <p className="skeu-label mt-0.5">Sex ratio of enrolled learners</p>
          </div>
          <div className="h-[260px] flex items-center justify-center px-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sexData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                  {sexData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                  <RechartsLabel value={totalStudents} position="center" className="text-3xl font-bold fill-slate-800" />
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #DDE4EE', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Suggestions */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #FAFCFF 0%, #F5F8FD 100%)",
          border: "1px solid #DDE4EE",
          boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 4px 12px rgba(0,0,0,0.07)"
        }}
      >
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{
            background: "linear-gradient(180deg, #FAFCFF 0%, #F4F7FC 100%)",
            borderBottom: "1px solid #DDE4EE"
          }}
        >
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(180deg, #EEE8FF, #E4D8FF)",
              border: "1px solid #C8B8F0",
              boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset"
            }}
          >
            <Sparkles size={14} style={{ color: "#7040C0" }} />
          </div>
          <div>
            <p className="font-black text-sm flex items-center gap-2" style={{ color: "#111A24" }}>
              AI Suggestions
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: "#EEE8FF", color: "#7040C0", border: "1px solid #C8B8F0" }}>Smart</span>
            </p>
            <p className="skeu-label mt-0.5">Data-driven recommendations for your class</p>
          </div>
        </div>
        <div className="p-5 space-y-2.5">
          {presentToday === 0 && (
            <div className="flex items-start gap-3 rounded-lg px-4 py-3" style={{ background: "#FAFCFF", border: "1px solid #DDE4EE", boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset" }}>
              <span className="text-lg leading-tight">📋</span>
              <div>
                <p className="text-sm font-bold" style={{ color: "#111A24" }}>Record today's attendance</p>
                <p className="text-xs mt-0.5" style={{ color: "#8898AC" }}>No attendance data for today. Go to SF2 Attendance to mark your class.</p>
              </div>
            </div>
          )}
          {subjectsWithCompleteData < 8 && (
            <div className="flex items-start gap-3 rounded-lg px-4 py-3" style={{ background: "#FAFCFF", border: "1px solid #DDE4EE", boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset" }}>
              <span className="text-lg leading-tight">📊</span>
              <div>
                <p className="text-sm font-bold" style={{ color: "#111A24" }}>{8 - subjectsWithCompleteData} subjects still need complete grades</p>
                <p className="text-xs mt-0.5" style={{ color: "#8898AC" }}>Follow up with subject teachers to transmit their E-Class Records before the deadline.</p>
              </div>
            </div>
          )}
          {interventionList.length > 0 && (
            <div className="flex items-start gap-3 rounded-lg px-4 py-3" style={{ background: "#FFF8EC", border: "1px solid #E8D080", boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset" }}>
              <span className="text-lg leading-tight">⚠️</span>
              <div>
                <p className="text-sm font-bold" style={{ color: "#3A2A00" }}>{interventionList.length} student{interventionList.length > 1 ? 's' : ''} need{interventionList.length === 1 ? 's' : ''} intervention</p>
                <p className="text-xs mt-0.5" style={{ color: "#8A6828" }}>Schedule a SARDO meeting with parents of students below 75 avg or with excessive absences.</p>
              </div>
            </div>
          )}
          {subjectsWithCompleteData === 8 && interventionList.length === 0 && (
            <div className="flex items-start gap-3 rounded-lg px-4 py-3" style={{ background: "#F0FBF5", border: "1px solid #A8D8BA", boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset" }}>
              <span className="text-lg leading-tight">✨</span>
              <div>
                <p className="text-sm font-bold" style={{ color: "#1A3A28" }}>All clear! Your class is on track.</p>
                <p className="text-xs mt-0.5" style={{ color: "#5A8A6A" }}>All subjects submitted and no students flagged for intervention. Great job, Teacher!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SARDO Intervention Panel */}
      {interventionList.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: "linear-gradient(160deg, #FFFBF5 0%, #FFF7EE 100%)",
              border: "1px solid #E8C878",
              boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 4px 12px rgba(208,128,16,0.1)"
            }}
          >
            <div
              className="flex items-center gap-3 px-5 py-4"
              style={{ borderBottom: "1px solid #E8D080", background: "linear-gradient(180deg, #FFFEF8 0%, #FFF9EC 100%)" }}
            >
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(180deg, #FFE8C0, #FFD890)", border: "1px solid #E8C060", boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset" }}
              >
                <AlertTriangle size={14} style={{ color: "#C07800" }} />
              </div>
              <div>
                <p className="font-black text-sm" style={{ color: "#3A2800" }}>SARDO Intervention Required</p>
                <p className="skeu-label mt-0.5" style={{ color: "#8A6828" }}>
                  Students below 75 avg or with ≥2 absences flagged automatically
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow style={{ background: "rgba(232,192,96,0.1)", borderBottom: "1px solid #E8D080" }}>
                    <TableHead className="font-bold text-xs" style={{ color: "#7A5018" }}>Learner Name</TableHead>
                    <TableHead className="font-bold text-xs text-center" style={{ color: "#7A5018" }}>Gen. Average</TableHead>
                    <TableHead className="font-bold text-xs text-center" style={{ color: "#7A5018" }}>Absences</TableHead>
                    <TableHead className="text-right font-bold text-xs" style={{ color: "#7A5018" }}>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interventionList.map(student => (
                    <TableRow key={student.lrn} className="transition-colors" style={{ borderBottom: "1px solid rgba(232,200,120,0.3)" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(232,192,96,0.08)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "")}
                    >
                      <TableCell className="font-medium text-sm" style={{ color: "#2A1A00" }}>{student.name}</TableCell>
                      <TableCell className="text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                          style={student.average < 75 && student.average > 0
                            ? { background: "#FFF0F0", color: "#C03030", border: "1px solid #E8AAAA" }
                            : { background: "#EEF2F8", color: "#5A6A7E", border: "1px solid #D4DCE6" }
                          }>
                          {student.average > 0 ? student.average.toFixed(2) : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                          style={student.absences >= 2
                            ? { background: "#FFF8EC", color: "#C07800", border: "1px solid #E8C878" }
                            : { background: "#EEF2F8", color: "#5A6A7E", border: "1px solid #D4DCE6" }
                          }>
                          {student.absences} absent
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="text-xs font-bold underline underline-offset-2"
                          style={{ color: "#D08010" }}
                        >
                          Review Profile
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* Masterlist — SF1 */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #FFFFFF 0%, #FAFCFF 100%)",
          border: "1px solid #DDE4EE",
          boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 4px 14px rgba(0,0,0,0.08)"
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ background: "linear-gradient(180deg, #FAFCFF 0%, #F4F7FC 100%)", borderBottom: "1px solid #DDE4EE" }}
        >
          <div>
            <p className="font-black text-sm" style={{ color: "#111A24" }}>Class Masterlist (SF1)</p>
            <p className="skeu-label mt-0.5">Officially enrolled students for this section</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow style={{ background: "#F4F7FC", borderBottom: "1px solid #DDE4EE" }}>
                <TableHead className="skeu-label w-[150px]">LRN</TableHead>
                <TableHead className="skeu-label">Legal Name</TableHead>
                <TableHead className="skeu-label">Sex</TableHead>
                <TableHead className="skeu-label">Status</TableHead>
                <TableHead className="skeu-label text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Male section */}
              <TableRow style={{ background: "#EEF5FF", borderBottom: "1px solid #DDE4EE" }}>
                <TableCell colSpan={5} className="font-black text-xs tracking-wider py-1.5" style={{ color: "#1040A0" }}>MALE</TableCell>
              </TableRow>
              {masterList.filter(s => s.sex === 'M').map(student => (
                <TableRow key={student.lrn} className="group transition-colors"
                  style={{ borderBottom: "1px solid #EEF2F8" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(28,165,96,0.03)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}
                >
                  <TableCell className="font-mono text-xs" style={{ color: "#8898AC" }}>{student.lrn}</TableCell>
                  <TableCell>
                    <button onClick={() => setSelectedStudent(student)} className="font-semibold text-sm text-left transition-colors" style={{ color: "#111A24" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#003876")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#111A24")}
                    >
                      {student.name}
                    </button>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "#EEF5FF", color: "#1040A0", border: "1px solid #B8C8F0" }}>Male</span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "#E8F7EE", color: "#003876", border: "1px solid #A8D8BA" }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#003876" }} />
                      {student.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setSelectedStudent(student)} className="text-xs font-bold transition-colors" style={{ color: "#8898AC" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#003876")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#8898AC")}
                      >View</button>
                      <button
                        onClick={() => setDeleteTarget({ lrn: student.lrn, name: student.name })}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                        style={{ color: "#B8C4D4" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#C03030"; (e.currentTarget as HTMLElement).style.background = "#FFF0F0" }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#B8C4D4"; (e.currentTarget as HTMLElement).style.background = "" }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {/* Female section */}
              <TableRow style={{ background: "#FFF0F8", borderBottom: "1px solid #DDE4EE" }}>
                <TableCell colSpan={5} className="font-black text-xs tracking-wider py-1.5" style={{ color: "#A03080" }}>FEMALE</TableCell>
              </TableRow>
              {masterList.filter(s => s.sex === 'F').map(student => (
                <TableRow key={student.lrn} className="group transition-colors"
                  style={{ borderBottom: "1px solid #EEF2F8" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(28,165,96,0.03)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}
                >
                  <TableCell className="font-mono text-xs" style={{ color: "#8898AC" }}>{student.lrn}</TableCell>
                  <TableCell>
                    <button onClick={() => setSelectedStudent(student)} className="font-semibold text-sm text-left transition-colors" style={{ color: "#111A24" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#003876")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#111A24")}
                    >
                      {student.name}
                    </button>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "#FFF0F8", color: "#A03080", border: "1px solid #F0B8D8" }}>Female</span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "#E8F7EE", color: "#003876", border: "1px solid #A8D8BA" }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#003876" }} />
                      {student.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setSelectedStudent(student)} className="text-xs font-bold transition-colors" style={{ color: "#8898AC" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#003876")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#8898AC")}
                      >View</button>
                      <button
                        onClick={() => setDeleteTarget({ lrn: student.lrn, name: student.name })}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                        style={{ color: "#B8C4D4" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#C03030"; (e.currentTarget as HTMLElement).style.background = "#FFF0F0" }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#B8C4D4"; (e.currentTarget as HTMLElement).style.background = "" }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <StudentProfileModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
    </div>
  )
}
