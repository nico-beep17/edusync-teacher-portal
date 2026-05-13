"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, FileOutput, ArrowRight, Plus, Trash2, X, AlertTriangle, Camera, UserPlus, Loader2, CloudDownload, Clock } from "lucide-react"
import Link from "next/link"
import { useTeacherStore } from "@/store/useStore"
import { useState, useEffect, useMemo } from "react"
import { fetchSectionStudents } from "@/lib/section-roster"

const GRADIENTS = [
  "from-blue-500 to-cyan-500",
  "from-blue-500 to-teal-500",
  "from-purple-500 to-pink-500",
  "from-orange-500 to-amber-500",
  "from-rose-500 to-red-500",
  "from-indigo-500 to-blue-500",
  "from-teal-500 to-blue-500",
  "from-fuchsia-500 to-purple-500",
]

// Helper: "14:30" → "2:30 PM"
function formatTime12(t: string) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hr = h % 12 || 12
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`
}

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────
function ConfirmDeleteModal({
  item,
  onConfirm,
  onCancel,
}: {
  item: { subject: string; section: string }
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-sm mx-4 rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #FFFFFF 0%, #FFF8F8 100%)",
          border: "1px solid #E8CCCC",
          boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 20px 60px rgba(0,0,0,0.18)"
        }}
      >
        <div className="h-1" style={{ background: "linear-gradient(90deg, #C03030, #E04040, #C03030)", boxShadow: "0 2px 6px rgba(192,48,48,0.4)" }} />
        <div className="px-6 py-6">
          <div className="flex flex-col items-center text-center mb-5">
            <div
              className="h-12 w-12 rounded-xl flex items-center justify-center mb-3"
              style={{ background: "linear-gradient(180deg, #FFF4F4 0%, #FFE8E8 100%)", border: "1px solid #E8CCCC", boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 3px 8px rgba(192,48,48,0.15)" }}
            >
              <AlertTriangle size={22} style={{ color: "#C03030" }} />
            </div>
            <h3 className="text-base font-black" style={{ color: "#111A24" }}>Remove from Workload?</h3>
            <p className="text-sm mt-1" style={{ color: "#8898AC" }}>
              This will remove <strong style={{ color: "#C03030" }}>{item.subject}</strong> (Section {item.section}) from your workload and E-Class Records.
            </p>
            <p className="text-xs mt-2 font-medium" style={{ color: "#C08080" }}>
              Grades already transmitted to the adviser are NOT deleted.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="skeu-btn-ghost flex-1 h-10 rounded-xl text-sm"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 h-10 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
              style={{
                background: "linear-gradient(180deg, #E04040, #C03030)",
                border: "1px solid #A02020",
                boxShadow: "0 1px 0 rgba(255,255,255,0.15) inset, 0 4px 12px rgba(192,48,48,0.35)"
              }}
            >
              Yes, Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WorkloadDashboard() {
  const [mounted, setMounted] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newSubject, setNewSubject] = useState({ subject: "", section: "", students: "", scheduleDays: [] as string[], startTime: "", endTime: "" })
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; subject: string; section: string } | null>(null)
  const [cloudFetchStatus, setCloudFetchStatus] = useState<'idle' | 'checking' | 'found' | 'not_found'>('idle')
  const [cloudStudentCount, setCloudStudentCount] = useState(0)

  const workload = useTeacherStore(s => s.workload)
  const addWorkload = useTeacherStore(s => s.addWorkload)
  const removeWorkload = useTeacherStore(s => s.removeWorkload)
  const globalStudents = useTeacherStore(s => s.students)
  const workloadStudents = useTeacherStore(s => s.workloadStudents)
  const schoolInfo = useTeacherStore(s => s.schoolInfo)

  // --- Autocomplete suggestions derived from existing data ---
  const subjectSuggestions = useMemo(() => {
    const set = new Set<string>()
    workload.forEach(w => set.add(w.subject))
    return Array.from(set)
  }, [workload])

  const sectionSuggestions = useMemo(() => {
    const set = new Set<string>()
    set.add(schoolInfo.section) // Always include the adviser's own section
    workload.forEach(w => set.add(w.section))
    return Array.from(set)
  }, [workload, schoolInfo.section])

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  // Check if the entered section has existing student data in this app
  const enteredSection = newSubject.section.trim().toUpperCase()
  const isAdviserSection = enteredSection === schoolInfo.section.toUpperCase()
  const slug = newSubject.subject.trim() && enteredSection
    ? `${newSubject.subject.toLowerCase().replace(/\s+/g, '-')}-${enteredSection.toLowerCase()}`
    : ''
  const hasExistingRoster = slug
    ? (workloadStudents[slug]?.length > 0 || isAdviserSection)
    : false
  const showRosterNotice = !!(enteredSection && newSubject.subject.trim() && !hasExistingRoster)

  const handleAdd = async () => {
    if (!newSubject.subject.trim() || !newSubject.section.trim()) return

    // Build display schedule string from structured data
    const dayAbbrs = newSubject.scheduleDays.length > 0 ? newSubject.scheduleDays.join('/') : ''
    const timeStr = newSubject.startTime && newSubject.endTime
      ? `${formatTime12(newSubject.startTime)}-${formatTime12(newSubject.endTime)}`
      : ''
    const scheduleDisplay = [dayAbbrs, timeStr].filter(Boolean).join(' ') || 'TBA'

    addWorkload({
      id: Date.now().toString(),
      subject: newSubject.subject.trim(),
      section: enteredSection,
      students: parseInt(newSubject.students) || 0,
      schedule: scheduleDisplay,
      scheduleDays: newSubject.scheduleDays,
      startTime: newSubject.startTime,
      endTime: newSubject.endTime,
      slug,
      gradient: GRADIENTS[workload.length % GRADIENTS.length]
    })

    // If it's the adviser's own section, auto-link global students
    if (isAdviserSection) {
      useTeacherStore.getState().setWorkloadStudents(slug, [...globalStudents])
    } else if (!workloadStudents[slug]?.length) {
      // Try to fetch from Supabase (from another teacher in same school)
      setCloudFetchStatus('checking')
      try {
        const cloudStudents = await fetchSectionStudents(
          schoolInfo.schoolId,
          enteredSection,
          schoolInfo.gradeLevel
        )
        if (cloudStudents && cloudStudents.length > 0) {
          useTeacherStore.getState().setWorkloadStudents(slug, cloudStudents)
          setCloudFetchStatus('found')
          setCloudStudentCount(cloudStudents.length)
          setTimeout(() => setCloudFetchStatus('idle'), 5000)
        } else {
          setCloudFetchStatus('not_found')
          setTimeout(() => setCloudFetchStatus('idle'), 5000)
        }
      } catch {
        setCloudFetchStatus('not_found')
        setTimeout(() => setCloudFetchStatus('idle'), 5000)
      }
    }

    setNewSubject({ subject: "", section: "", students: "", scheduleDays: [], startTime: "", endTime: "" })
    setShowAddForm(false)
  }

  const handleDeleteClick = (e: React.MouseEvent, w: { id: string; subject: string; section: string }) => {
    e.preventDefault()
    e.stopPropagation()
    setDeleteTarget(w)
  }

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      removeWorkload(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="flex flex-col gap-8">

      {/* Delete confirm modal */}
      {deleteTarget && (
        <ConfirmDeleteModal
          item={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "#111A24" }}>Teaching Workload</h1>
          <p className="mt-1 text-sm" style={{ color: "#8898AC" }}>Manage your subject assignments and E-Class Records.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={showAddForm ? "skeu-btn-ghost h-9 px-4 rounded-lg text-sm flex items-center gap-2" : "skeu-btn h-9 px-4 rounded-lg text-sm flex items-center gap-2"}
        >
          {showAddForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Add Subject</>}
        </button>
      </div>

      {/* Add Subject Form */}
      {showAddForm && (
        <div
          className="rounded-xl overflow-hidden animate-in slide-in-from-top-2 fade-in duration-300"
          style={{
            background: "linear-gradient(160deg, #FFFFFF 0%, #F2FBF6 100%)",
            border: "1px solid #A8D8BA",
            boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 4px 14px rgba(28,165,96,0.1)"
          }}
        >
          <div className="px-5 py-4" style={{ borderBottom: "1px solid #D4E8DC", background: "linear-gradient(180deg, #F4FBF7 0%, #EDF8F2 100%)" }}>
            <p className="font-black text-sm" style={{ color: "#111A24" }}>Add New Subject to Workload</p>
            <p className="skeu-label mt-0.5">This creates a new E-Class Record you can manage.</p>
          </div>

          {/* Autocomplete lists */}
          <datalist id="subject-suggestions">
            {subjectSuggestions.map(s => <option key={s} value={s} />)}
            {/* Common subject names */}
            {['Filipino', 'English', 'Mathematics', 'Science', 'AP', 'TLE/EPP', 'MAPEH', 'ESP'].map(s => <option key={s} value={s} />)}
          </datalist>
          <datalist id="section-suggestions">
            {sectionSuggestions.map(s => <option key={s} value={s} />)}
          </datalist>

          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Subject Name with autocomplete */}
              <div className="space-y-1.5">
                <Label className="skeu-label">Subject Name *</Label>
                <input
                  list="subject-suggestions"
                  placeholder="e.g. English 8"
                  value={newSubject.subject}
                  onChange={e => setNewSubject({ ...newSubject, subject: e.target.value })}
                  className="skeu-input w-full h-10 px-3 text-sm rounded-lg"
                  autoComplete="off"
                />
              </div>
              {/* Section with autocomplete */}
              <div className="space-y-1.5">
                <Label className="skeu-label">Section *</Label>
                <input
                  list="section-suggestions"
                  placeholder="e.g. ARIES"
                  value={newSubject.section}
                  onChange={e => setNewSubject({ ...newSubject, section: e.target.value.toUpperCase() })}
                  className="skeu-input w-full h-10 px-3 text-sm rounded-lg uppercase"
                  autoComplete="off"
                />
              </div>
              {/* Students count */}
              <div className="space-y-1.5">
                <Label className="skeu-label">No. of Students</Label>
                <input
                  type="number"
                  placeholder="e.g. 35"
                  value={newSubject.students}
                  onChange={e => setNewSubject({ ...newSubject, students: e.target.value })}
                  className="skeu-input w-full h-10 px-3 text-sm rounded-lg"
                />
              </div>
              {/* Schedule — Day toggles + Time pickers */}
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
                <Label className="skeu-label">Schedule</Label>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Day toggles */}
                  <div className="flex gap-1">
                    {['Mon','Tue','Wed','Thu','Fri'].map(day => {
                      const selected = newSubject.scheduleDays.includes(day)
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const days = selected
                              ? newSubject.scheduleDays.filter(d => d !== day)
                              : [...newSubject.scheduleDays, day]
                            setNewSubject({ ...newSubject, scheduleDays: days })
                          }}
                          className={`h-9 w-11 rounded-lg text-xs font-bold transition-all active:scale-95 border ${
                            selected
                              ? 'bg-[#003876] text-white border-[#002050] shadow-sm'
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {day.slice(0, day === 'Thu' ? 2 : 1)}
                        </button>
                      )
                    })}
                  </div>
                  {/* Time pickers */}
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-slate-400" />
                    <input
                      type="time"
                      value={newSubject.startTime}
                      onChange={e => setNewSubject({ ...newSubject, startTime: e.target.value })}
                      className="skeu-input h-9 px-2 text-sm rounded-lg w-[110px]"
                    />
                    <span className="text-xs text-slate-400">to</span>
                    <input
                      type="time"
                      value={newSubject.endTime}
                      onChange={e => setNewSubject({ ...newSubject, endTime: e.target.value })}
                      className="skeu-input h-9 px-2 text-sm rounded-lg w-[110px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Smart roster notice — shown when section has no existing data */}
            {showRosterNotice && (
              <div
                className="mb-4 rounded-xl px-4 py-3 text-sm flex flex-col gap-2 animate-in slide-in-from-top-1 fade-in duration-200"
                style={{ background: '#FFFBEC', border: '1px solid #E8D080' }}
              >
                <div className="flex items-center gap-2 font-bold" style={{ color: '#9A6800' }}>
                  <AlertTriangle size={14} />
                  No student data found for Section <span className="font-black">{enteredSection}</span>
                </div>
                <p className="text-xs" style={{ color: '#8A7040' }}>
                  This section isn't in our system yet. After adding, you'll need to set up the student roster manually or use AI Camera to scan a class list.
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5" style={{ background: '#FFF0C0', border: '1px solid #E8D080', color: '#9A6800' }}>
                    <UserPlus size={11} /> Manual entry available in Attendance → Section Roster
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5" style={{ background: '#F0F0FF', border: '1px solid #C0C0F0', color: '#4040A0' }}>
                    <Camera size={11} /> AI Camera scan also available
                  </span>
                </div>
              </div>
            )}

            {/* If it IS the adviser's own section, show green confirmation */}
            {isAdviserSection && enteredSection && newSubject.subject.trim() && (
              <div
                className="mb-4 rounded-xl px-4 py-3 text-sm flex items-center gap-2 animate-in slide-in-from-top-1 fade-in duration-200"
                style={{ background: '#E8F7EE', border: '1px solid #A8D8BA' }}
              >
                <Users size={14} style={{ color: '#1C6B40' }} />
                <span style={{ color: '#1C6B40' }}>
                  <strong>{schoolInfo.section}</strong> masterlist detected — {globalStudents.length} students will be auto-linked to this subject's attendance.
                </span>
              </div>
            )}

            <button onClick={handleAdd} className="skeu-btn h-9 px-4 rounded-lg text-sm flex items-center gap-2">
              <Plus size={14} /> Add to Workload
            </button>
          </div>
        </div>
      )}

      {/* Cloud fetch status toast */}
      {cloudFetchStatus === 'checking' && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl px-4 py-3 shadow-sm animate-in fade-in duration-200">
          <Loader2 size={16} className="animate-spin shrink-0" />
          <span className="text-sm font-medium">Checking cloud database for student roster from the section adviser...</span>
        </div>
      )}
      {cloudFetchStatus === 'found' && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 shadow-sm animate-in slide-in-from-top-2 fade-in duration-300">
          <CloudDownload size={16} className="shrink-0" />
          <span className="text-sm font-medium">✅ Found {cloudStudentCount} students from the section adviser's database! Roster auto-imported.</span>
        </div>
      )}
      {cloudFetchStatus === 'not_found' && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 shadow-sm animate-in slide-in-from-top-2 fade-in duration-300">
          <AlertTriangle size={16} className="shrink-0" />
          <span className="text-sm font-medium">Section adviser not found in our system. Go to Attendance → Section Roster to add students manually, via Excel/CSV, or AI Camera.</span>
        </div>
      )}

      {/* Grid of Subjects */}
      {workload.length === 0 ? (
        <div className="skeu-card py-14 flex flex-col items-center justify-center text-center">
          <FileOutput size={40} style={{ color: "#C8D4E0" }} className="mb-4" />
          <p className="text-base font-black" style={{ color: "#5A6A7E" }}>No subjects in your workload yet</p>
          <p className="text-sm mt-1" style={{ color: "#8898AC" }}>Click "Add Subject" to create your first E-Class Record.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {workload.map((w) => (
            <div key={w.id} className="group relative flex flex-col">
                <div
                  className="flex-1 rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 relative"
                  style={{
                    background: "linear-gradient(160deg, #FFFFFF 0%, #FAFCFF 100%)",
                    border: "1px solid #DDE4EE",
                    boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 4px 12px rgba(0,0,0,0.08)"
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 0 rgba(255,255,255,1) inset, 0 8px 24px rgba(0,0,0,0.12)" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 0 rgba(255,255,255,1) inset, 0 4px 12px rgba(0,0,0,0.08)" }}
                >
                  {/* Color accent top bar */}
                  <div className={`w-full h-1.5 bg-gradient-to-r ${w.gradient}`} />

                  <div className="p-5 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-xl font-black" style={{ color: "#111A24" }}>{w.subject}</p>
                        <p className="text-sm font-semibold mt-0.5" style={{ color: "#5A6A7E" }}>Section: {w.section}</p>
                      </div>
                    </div>

                    <div className="skeu-divider mb-3" />

                    <div className="flex flex-col gap-1.5 text-sm mb-6" style={{ color: "#8898AC" }}>
                      <div className="flex items-center gap-2">
                        <Users size={13} /> {w.students} Enrolled Students
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Clock size={12} />
                        {w.scheduleDays?.length ? (
                          <span>
                            <span className="font-semibold text-slate-600">{w.scheduleDays.join(' ')}</span>
                            {w.startTime && w.endTime && (
                              <span className="ml-1 text-slate-400">• {formatTime12(w.startTime)} – {formatTime12(w.endTime)}</span>
                            )}
                          </span>
                        ) : (
                          <span>{w.schedule}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-auto pt-2 border-t border-slate-100">
                      <Link href={`/ecr/${w.slug}`} className="skeu-btn flex-1 h-9 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-sm">
                        <FileOutput size={12} /> E-Class Record
                      </Link>
                      <Link href={`/subject-attendance/${w.slug}`} className="skeu-btn-ghost flex-1 h-9 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200 transition-colors hover:bg-slate-50 active:scale-95 text-slate-700 bg-white">
                        <Users size={12} /> Attendance
                      </Link>
                    </div>
                  </div>
                </div>

              {/* Delete button — shows on hover, opens modal */}
              <button
                onClick={(e) => handleDeleteClick(e, w)}
                className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-all duration-200 h-8 w-8 rounded-lg flex items-center justify-center"
                style={{
                  background: "linear-gradient(180deg, #FFF0F0, #FFE4E4)",
                  border: "1px solid #E8AAAA",
                  boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 2px 6px rgba(192,48,48,0.15)"
                }}
                title="Remove from workload"
              >
                <Trash2 size={13} style={{ color: "#C03030" }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
