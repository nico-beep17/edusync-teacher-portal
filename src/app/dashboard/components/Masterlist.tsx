"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import type { Student } from "@/store/useStore"

interface MasterlistProps {
  masterList: Student[]
  totalStudents: number
  selectedLrns: string[]
  setSelectedLrns: React.Dispatch<React.SetStateAction<string[]>>
  setDeleteTarget: (target: { lrn: string; name: string } | null) => void
  setSelectedStudent: (student: any) => void
  masterlistOpen: boolean
  setMasterlistOpen: React.Dispatch<React.SetStateAction<boolean>>
  onRequestDeleteMultiple: () => void
}

export function Masterlist({
  masterList,
  totalStudents,
  selectedLrns,
  setSelectedLrns,
  setDeleteTarget,
  setSelectedStudent,
  masterlistOpen,
  setMasterlistOpen,
  onRequestDeleteMultiple,
}: MasterlistProps) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #FFFFFF 0%, #FAFCFF 100%)",
        border: "1px solid #DDE4EE",
        boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 4px 14px rgba(0,0,0,0.08)"
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
        style={{ background: "linear-gradient(180deg, #FAFCFF 0%, #F4F7FC 100%)", borderBottom: masterlistOpen ? "1px solid #DDE4EE" : "none" }}
        onClick={() => setMasterlistOpen(prev => !prev)}
      >
        <div className="flex items-center gap-3">
          <div>
            <p className="font-black text-sm" style={{ color: "#111A24" }}>Class Masterlist (SF1)</p>
            <p className="skeu-label mt-0.5">Officially enrolled students for this section</p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#EEF2F8', color: '#5A6A7E', border: '1px solid #D4DCE6' }}>
            {totalStudents} students
          </span>
        </div>
        <div className="flex items-center gap-2">
          {selectedLrns.length > 0 && (
             <button
               onClick={(e) => { e.stopPropagation(); onRequestDeleteMultiple() }}
               className="h-8 px-3 rounded-lg text-xs font-bold transition-all text-white flex items-center gap-1.5"
               style={{ background: "linear-gradient(180deg, #E30A24, #B5081C)", border: "1px solid #8A0615" }}
             >
               <Trash2 size={13} /> Delete Selected ({selectedLrns.length})
             </button>
          )}
          {masterlistOpen ? <ChevronUp size={16} style={{ color: '#8898AC' }} /> : <ChevronDown size={16} style={{ color: '#8898AC' }} />}
        </div>
      </div>
      {masterlistOpen && <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow style={{ background: "#F4F7FC", borderBottom: "1px solid #DDE4EE" }}>
              <TableHead className="w-[40px] pr-0">
                 <input type="checkbox" className="accent-[#003876] w-3.5 h-3.5"
                   onChange={(e) => setSelectedLrns(e.target.checked ? masterList.map(s => s.lrn) : [])}
                   checked={selectedLrns.length === masterList.length && masterList.length > 0} 
                 />
              </TableHead>
              <TableHead className="skeu-label w-[150px]">LRN</TableHead>
              <TableHead className="skeu-label">Legal Name</TableHead>
              <TableHead className="skeu-label">Sex</TableHead>
              <TableHead className="skeu-label">Status</TableHead>
              <TableHead className="skeu-label text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow style={{ background: "#EEF5FF", borderBottom: "1px solid #DDE4EE" }}>
              <TableCell colSpan={6} className="font-black text-xs tracking-wider py-1.5" style={{ color: "#1040A0" }}>MALE</TableCell>
            </TableRow>
            {masterList.filter(s => s.sex === 'M').map(student => (
              <TableRow key={student.lrn} className="group transition-colors"
                style={{ borderBottom: "1px solid #EEF2F8" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(28,165,96,0.03)")}
                onMouseLeave={e => (e.currentTarget.style.background = "")}
              >
                <TableCell className="pr-0">
                   <input type="checkbox" className="accent-[#003876] w-3.5 h-3.5"
                     checked={selectedLrns.includes(student.lrn)}
                     onChange={(e) => setSelectedLrns(prev => e.target.checked ? [...prev, student.lrn] : prev.filter(lrn => lrn !== student.lrn))}
                   />
                </TableCell>
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

            <TableRow style={{ background: "#FFF0F8", borderBottom: "1px solid #DDE4EE" }}>
              <TableCell colSpan={6} className="font-black text-xs tracking-wider py-1.5" style={{ color: "#A03080" }}>FEMALE</TableCell>
            </TableRow>
            {masterList.filter(s => s.sex === 'F').map(student => (
              <TableRow key={student.lrn} className="group transition-colors"
                style={{ borderBottom: "1px solid #EEF2F8" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(28,165,96,0.03)")}
                onMouseLeave={e => (e.currentTarget.style.background = "")}
              >
                <TableCell className="pr-0">
                   <input type="checkbox" className="accent-[#003876] w-3.5 h-3.5"
                     checked={selectedLrns.includes(student.lrn)}
                     onChange={(e) => setSelectedLrns(prev => e.target.checked ? [...prev, student.lrn] : prev.filter(lrn => lrn !== student.lrn))}
                   />
                </TableCell>
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
      </div>}
    </div>
  )
}
