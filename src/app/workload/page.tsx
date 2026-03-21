"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, FileOutput, ArrowRight, Plus, Trash2, X, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useTeacherStore } from "@/store/useStore"
import { useState, useEffect } from "react"

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
  const [newSubject, setNewSubject] = useState({ subject: "", section: "", students: "", schedule: "" })
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; subject: string; section: string } | null>(null)

  const workload = useTeacherStore(s => s.workload)
  const addWorkload = useTeacherStore(s => s.addWorkload)
  const removeWorkload = useTeacherStore(s => s.removeWorkload)

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const handleAdd = () => {
    if (!newSubject.subject.trim() || !newSubject.section.trim()) return
    const slug = `${newSubject.subject.toLowerCase().replace(/\s+/g, '-')}-${newSubject.section.toLowerCase().replace(/\s+/g, '-')}`
    addWorkload({
      id: Date.now().toString(),
      subject: newSubject.subject.trim(),
      section: newSubject.section.trim().toUpperCase(),
      students: parseInt(newSubject.students) || 0,
      schedule: newSubject.schedule.trim() || "TBA",
      slug,
      gradient: GRADIENTS[workload.length % GRADIENTS.length]
    })
    setNewSubject({ subject: "", section: "", students: "", schedule: "" })
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
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {[
                { label: "Subject Name *", key: "subject", ph: "e.g. English 8" },
                { label: "Section *", key: "section", ph: "e.g. ARIES" },
                { label: "No. of Students", key: "students", ph: "e.g. 35", type: "number" },
                { label: "Schedule", key: "schedule", ph: "e.g. M/W/F 8:00-9:00 AM" },
              ].map(({ label, key, ph, type }) => (
                <div key={key} className="space-y-1.5">
                  <Label className="skeu-label">{label}</Label>
                  <input
                    type={type || "text"}
                    placeholder={ph}
                    value={(newSubject as any)[key]}
                    onChange={e => setNewSubject({ ...newSubject, [key]: e.target.value })}
                    className="skeu-input w-full h-10 px-3 text-sm rounded-lg"
                  />
                </div>
              ))}
            </div>
            <button onClick={handleAdd} className="skeu-btn h-9 px-4 rounded-lg text-sm flex items-center gap-2">
              <Plus size={14} /> Add to Workload
            </button>
          </div>
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
                      <div className="text-xs">{w.schedule}</div>
                    </div>

                    <div className="flex gap-2 mt-auto pt-2 border-t border-slate-100">
                      <Link href={`/ecr/${w.slug}`} className="skeu-btn flex-1 h-9 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-sm">
                        <FileOutput size={12} /> E-Class Record
                      </Link>
                      <Link href={`/attendance/${w.slug}`} className="skeu-btn-ghost flex-1 h-9 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200 transition-colors hover:bg-slate-50 active:scale-95 text-slate-700 bg-white">
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
