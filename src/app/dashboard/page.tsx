"use client"

import { useTeacherStore } from "@/store/useStore"
import { useEffect, useState } from "react"
import { StudentProfileModal } from "@/components/student-profile-modal"
import { AlertTriangle, Trash2, Users, UserCheck, Calculator, FileText } from "lucide-react"
import { toast } from 'sonner'

import { WelcomeBanner } from "./components/WelcomeBanner"
import { QuickActions } from "./components/QuickActions"
import { StatCards } from "./components/StatCards"
import { ScheduleWidget } from "./components/ScheduleWidget"
import { ChartsSection } from "./components/ChartsSection"
import { AISuggestions } from "./components/AISuggestions"
import { SARDOPanel } from "./components/SARDOPanel"
import { Masterlist } from "./components/Masterlist"

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

function ConfirmDeleteMultipleModal({
  count, onConfirm, onCancel
}: {
  count: number; onConfirm: () => void; onCancel: () => void
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
            <h3 className="text-base font-black" style={{ color: "#111A24" }}>Remove Selected Students?</h3>
            <p className="text-sm mt-1" style={{ color: "#8898AC" }}>
              Are you sure you want to remove <strong style={{ color: "#C03030" }}>{count}</strong> students from the masterlist?
            </p>
            <p className="text-xs mt-2 font-medium" style={{ color: "#C08080" }}>This action cannot be undone.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={onCancel} className="skeu-btn-ghost flex-1 h-10 rounded-xl text-sm">Cancel</button>
            <button onClick={onConfirm} className="flex-1 h-10 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
              style={{ background: "linear-gradient(180deg, #E04040, #C03030)", border: "1px solid #A02020", boxShadow: "0 1px 0 rgba(255,255,255,0.15) inset, 0 4px 12px rgba(192,48,48,0.35)" }}>
              Remove {count} Students
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdviserDashboard() {
  const [mounted, setMounted] = useState(false)
  const [masterlistOpen, setMasterlistOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ lrn: string; name: string } | null>(null)
  const [selectedLrns, setSelectedLrns] = useState<string[]>([])
  const [deleteMultiplePrompt, setDeleteMultiplePrompt] = useState(false)
  const masterList = useTeacherStore((state) => state.students)
  const gradesMap = useTeacherStore((state) => state.grades)
  const attendanceMap = useTeacherStore((state) => state.attendance)
  const pushToCloud = useTeacherStore((state) => state.pushToCloud)
  const removeStudent = useTeacherStore((state) => state.removeStudent)
  const workload = useTeacherStore((state) => state.workload)
  const schoolInfo = useTeacherStore((state) => state.schoolInfo)

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
      {deleteTarget && (
        <ConfirmDeleteStudentModal
          name={deleteTarget.name}
          onConfirm={() => { removeStudent(deleteTarget.lrn); setDeleteTarget(null) }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {deleteMultiplePrompt && (
        <ConfirmDeleteMultipleModal
          count={selectedLrns.length}
          onConfirm={() => {
             selectedLrns.forEach(lrn => removeStudent(lrn))
             setSelectedLrns([])
             setDeleteMultiplePrompt(false)
          }}
          onCancel={() => setDeleteMultiplePrompt(false)}
        />
      )}

      <WelcomeBanner schoolInfo={schoolInfo} handleSync={handleSync} syncing={syncing} synced={synced} />
      <QuickActions />
      <StatCards statCards={statCards} />
      <ScheduleWidget workload={workload} />
      <ChartsSection chartData={chartData} sexData={sexData} totalStudents={totalStudents} />
      <AISuggestions presentToday={presentToday} subjectsWithCompleteData={subjectsWithCompleteData} interventionList={interventionList} />
      {interventionList.length > 0 && (
        <SARDOPanel interventionList={interventionList} onReviewProfile={setSelectedStudent} />
      )}
      <Masterlist
        masterList={masterList}
        totalStudents={totalStudents}
        selectedLrns={selectedLrns}
        setSelectedLrns={setSelectedLrns}
        setDeleteTarget={setDeleteTarget}
        setSelectedStudent={setSelectedStudent}
        masterlistOpen={masterlistOpen}
        setMasterlistOpen={setMasterlistOpen}
        onRequestDeleteMultiple={() => setDeleteMultiplePrompt(true)}
      />

      <StudentProfileModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
    </div>
  )
}
