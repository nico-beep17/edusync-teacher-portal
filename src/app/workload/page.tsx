"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, FileOutput, ArrowRight, Plus, Trash2, X } from "lucide-react"
import Link from "next/link"
import { useTeacherStore } from "@/store/useStore"
import { useState, useEffect } from "react"

const GRADIENTS = [
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-purple-500 to-pink-500",
  "from-orange-500 to-amber-500",
  "from-rose-500 to-red-500",
  "from-indigo-500 to-blue-500",
  "from-teal-500 to-emerald-500",
  "from-fuchsia-500 to-purple-500",
]

export default function WorkloadDashboard() {
  const [mounted, setMounted] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newSubject, setNewSubject] = useState({ subject: "", section: "", students: "", schedule: "" })
  
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

  return (
    <div className="flex flex-col gap-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teaching Workload</h1>
          <p className="text-muted-foreground mt-1">Manage your subject assignments and E-Class Records.</p>
        </div>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)} 
          className={showAddForm ? "bg-slate-600 hover:bg-slate-700" : "bg-[#1ca560] hover:bg-[#158045]"}
        >
          {showAddForm ? <><X className="mr-2 h-4 w-4" /> Cancel</> : <><Plus className="mr-2 h-4 w-4" /> Add Subject</>}
        </Button>
      </div>

      {/* Add Subject Form */}
      {showAddForm && (
        <Card className="bg-white border border-emerald-200 shadow-sm animate-in slide-in-from-top-2 fade-in duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Add New Subject to Workload</CardTitle>
            <CardDescription>This will create a new E-Class Record entry for you to manage.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label>Subject Name *</Label>
                <Input 
                  value={newSubject.subject} 
                  onChange={e => setNewSubject({...newSubject, subject: e.target.value})}
                  placeholder="e.g. English 8"
                  className="bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Section *</Label>
                <Input 
                  value={newSubject.section} 
                  onChange={e => setNewSubject({...newSubject, section: e.target.value})}
                  placeholder="e.g. ARIES"
                  className="bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label>No. of Students</Label>
                <Input 
                  type="number"
                  value={newSubject.students} 
                  onChange={e => setNewSubject({...newSubject, students: e.target.value})}
                  placeholder="e.g. 35"
                  className="bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Schedule</Label>
                <Input 
                  value={newSubject.schedule} 
                  onChange={e => setNewSubject({...newSubject, schedule: e.target.value})}
                  placeholder="e.g. M/W/F 8:00-9:00 AM"
                  className="bg-white"
                />
              </div>
            </div>
            <Button onClick={handleAdd} className="mt-4 bg-[#1ca560] hover:bg-[#158045]">
              <Plus className="mr-2 h-4 w-4" /> Add to Workload
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Grid of Subjects */}
      {workload.length === 0 ? (
        <Card className="bg-white/80 py-12 flex flex-col items-center justify-center text-center border-dashed border-2">
          <FileOutput className="h-12 w-12 text-slate-300 mb-4" />
          <p className="text-lg font-semibold text-slate-500">No subjects in your workload yet</p>
          <p className="text-sm text-slate-400 mt-1">Click "Add Subject" to create your first E-Class Record.</p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {workload.map((w) => (
            <div key={w.id} className="group relative">
              <Link href={`/ecr/${w.slug}`} className="block">
                <Card className="h-full bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 overflow-hidden relative">
                  <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${w.gradient}`}></div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl font-bold">{w.subject}</CardTitle>
                        <CardDescription className="font-semibold text-slate-600 mt-1">Section: {w.section}</CardDescription>
                      </div>
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${w.gradient} text-white`}>
                        <FileOutput className="h-4 w-4" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="flex items-center text-sm text-slate-500">
                        <Users className="h-4 w-4 mr-2" />
                        {w.students} Enrolled Students
                      </div>
                      <div className="flex items-center text-sm text-slate-500 mt-1">
                        {w.schedule}
                      </div>
                    </div>
                    <div className="mt-6 flex items-center text-sm font-semibold text-[#1ca560] group-hover:text-[#158045] transition-colors">
                      Open E-Class Record <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
              {/* Remove button */}
              <button 
                onClick={(e) => { e.preventDefault(); removeWorkload(w.id) }}
                className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 rounded-full bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center"
                title="Remove from workload"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
