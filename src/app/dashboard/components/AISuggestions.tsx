"use client"

import { Sparkles } from "lucide-react"

interface AISuggestionsProps {
  presentToday: number
  subjectsWithCompleteData: number
  interventionList: Array<any>
}

export function AISuggestions({ presentToday, subjectsWithCompleteData, interventionList }: AISuggestionsProps) {
  return (
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
  )
}
