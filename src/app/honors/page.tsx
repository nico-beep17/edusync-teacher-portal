"use client"

import { useTeacherStore } from "@/store/useStore"
import { useState, useRef } from "react"
import { Trophy, Printer, Award, Medal, Crown, Star, ChevronRight, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HonorRollPage() {
  const students = useTeacherStore(s => s.students)
  const gradesMap = useTeacherStore(s => s.grades)
  const schoolInfo = useTeacherStore(s => s.schoolInfo)

  const [certList, setCertList] = useState<any[]>([])
  
  // Calculate averages and awards
  const rankedStudents = students.map(s => {
    const grades = gradesMap[s.lrn] || []
    let sum = 0, count = 0
    grades.forEach(g => {
      if (g.quarterGrade > 0) {
        sum += g.quarterGrade
        count++
      }
    })
    const average = count === 8 ? Number((sum / count).toFixed(2)) : 0 // DepEd requires all subjects

    let award = "None"
    let awardLevel = 0
    if (average >= 98 && average <= 100) { award = "WITH HIGHEST HONORS"; awardLevel = 3 }
    else if (average >= 95 && average <= 97) { award = "WITH HIGH HONORS"; awardLevel = 2 }
    else if (average >= 90 && average <= 94) { award = "WITH HONORS"; awardLevel = 1 }

    return { ...s, average, award, awardLevel }
  }).filter(s => s.average > 0).sort((a, b) => b.average - a.average)

  const top10 = rankedStudents.slice(0, 10)
  
  const handlePrint = () => {
     window.print()
  }

  const getPronoun = (sex: string) => sex === 'M' ? 'his' : 'her'

  const printDate = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
  // E.g., "26th day of March, 2026"
  const day = new Date().getDate()
  const suffix = ["th", "st", "nd", "rd"][(day % 10 > 3 || Math.floor(day % 100 / 10) === 1) ? 0 : day % 10]
  const formattedDate = `${day}${suffix} day of ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`

  return (
    <div className="flex flex-col gap-6 print:m-0 print:p-0">
      
      {/* ─── PRINTABLE CERTIFICATE LAYER (Hidden on screen) ─── */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #print-certificate, #print-certificate * { visibility: visible; }
          #print-certificate {
            position: absolute;
            left: 0; top: 0; width: 100%; height: 100%;
            background: white !important;
            padding: 40px;
          }
          @page { size: landscape; margin: 0; }
        }
      `}} />

      {certList.length > 0 && (
         <div id="print-certificate" className="hidden print:block">
           {certList.map((student, idx) => (
              <div key={student.lrn} className="flex flex-col items-center justify-center h-screen text-center p-12 relative overflow-hidden bg-white" style={{ fontFamily: "serif", pageBreakAfter: idx === certList.length - 1 ? "auto" : "always" }}>
                
                {/* Ornate Border Elements */}
                <div className="absolute inset-4 border-[6px] border-[#D4AF37] p-2" />
                <div className="absolute inset-[24px] border-[2px] border-[#B8860B] opacity-50" />
                
                {/* Optional PPTX Background Hook - user can replace /cert-assets/bg.png if needed */}
                <div className="absolute inset-0 z-0 opacity-15 pointer-events-none" style={{ backgroundImage: "url('/cert-assets/image17.png')", backgroundSize: "cover", backgroundPosition: "center" }} />
                
                <img src="/depaid-logo.svg?v=2" className="w-24 h-24 mb-6 relative z-10 opacity-90" alt="Logo" style={{ filter: "grayscale(20%) sepia(20%)" }} />
                
                <div className="relative z-10 w-full flex flex-col items-center">
                  <h2 className="text-xl tracking-[0.2em] text-[#B8860B] font-bold uppercase mb-2">Republic of the Philippines</h2>
                  <h1 className="text-4xl font-black text-[#8B0000] tracking-wide uppercase mb-1">{schoolInfo.schoolName || "School Name"}</h1>
                  <p className="text-lg text-slate-700 italic mb-10">{schoolInfo.division || "Division"}, {schoolInfo.region || "Region"}</p>

                  <p className="text-2xl text-slate-800 italic mb-4">This Certificate Is Proudly Presented To</p>
                  
                  <h1 className="text-6xl font-black uppercase text-[#111A24] tracking-tight mb-8" style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.1)" }}>
                    {student.name}
                  </h1>

                  <div className="bg-[#8B0000] text-white px-8 py-2 text-2xl font-bold tracking-[0.15em] mb-8 inline-block" style={{ boxShadow: "0 4px 12px rgba(139,0,0,0.3)" }}>
                    ACADEMIC EXCELLENCE AWARD
                  </div>

                  <p className="max-w-4xl mx-auto text-xl leading-relaxed text-slate-800 text-justify mb-10">
                    In recognition of {getPronoun(student.sex)} outstanding academic achievement and exemplary performance, earning the distinction of 
                    <strong className="text-[#8B0000]"> {student.award} </strong> with a General Average of 
                    <strong className="text-slate-900"> {student.average.toFixed(2)} % </strong> 
                    for the Academic Year {schoolInfo.schoolYear}. During the Recognition Rites of SY {schoolInfo.schoolYear}, with a theme: 
                    "Filipino Graduates: Prepared to Lead with Competence and Character".
                    <br/><br/>
                    Your dedication, perseverance, and commitment to excellence are truly commendable. May this achievement inspire you to continue striving for success in all your future endeavors.
                  </p>

                  <p className="text-xl italic text-slate-700 mb-16">
                    Given this {formattedDate}, at {schoolInfo.schoolName}, {schoolInfo.division}.
                  </p>

                  <div className="flex w-full max-w-4xl justify-between items-end mt-auto px-10">
                     <div className="flex flex-col items-center">
                        <div className="border-b border-black w-64 mb-2 pb-1 text-2xl font-bold uppercase text-[#111A24]">{schoolInfo.adviserName || "Class Adviser"}</div>
                        <div className="text-lg italic text-slate-600">Class Adviser G{schoolInfo.gradeLevel} - {schoolInfo.section}</div>
                     </div>
                     
                     {/* Seal / Badge */}
                     <div className="flex flex-col items-center justify-center">
                        <div className="bg-gradient-to-br from-[#FFDF00] to-[#DAA520] w-32 h-32 rounded-full flex items-center justify-center shadow-lg border-4 border-[#B8860B] relative">
                           <div className="border border-[#B8860B]/50 w-28 h-28 rounded-full absolute" />
                           <p className="text-white drop-shadow-md font-black text-center text-sm leading-tight uppercase px-4">{student.award}</p>
                        </div>
                     </div>

                     <div className="flex flex-col items-center">
                        <div className="border-b border-black w-64 mb-2 pb-1 text-2xl font-bold uppercase text-[#111A24]">{schoolInfo.schoolHeadName || "School Head"}</div>
                        <div className="text-lg italic text-slate-600">Principal</div>
                     </div>
                  </div>
                </div>
              </div>
           ))}
         </div>
      )}

      {/* ─── SCREEN UI ─── */}
      <div className="print:hidden flex flex-col sm:flex-row items-start justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
             <Trophy className="text-amber-500" size={32} /> Honor Roll
          </h1>
          <p className="text-muted-foreground mt-1">Class Rankings & Academic Certificates (SY {schoolInfo.schoolYear} • Q{schoolInfo.quarter})</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-white border-[#003876] text-[#003876] hover:bg-blue-50" onClick={() => setCertList(rankedStudents)}>
            <Printer className="mr-2 h-4 w-4" /> Bulk Print All (Class List)
          </Button>
          <Button variant="outline" className="bg-white">
            <FileText className="mr-2 h-4 w-4" /> Export Ranking
          </Button>
        </div>
      </div>

      {rankedStudents.length === 0 ? (
          <div className="print:hidden skeu-card p-10 text-center flex flex-col items-center justify-center min-h-[400px]">
             <Trophy size={48} className="text-slate-300 mb-4" />
             <h3 className="text-lg font-bold text-slate-700">No Finalized Grades Yet</h3>
             <p className="text-slate-500 text-sm max-w-md mt-2">The Honor Roll requires all 8 subjects to be submitted in the Composite Dashboard before averages can be reliably computed to DepEd standards.</p>
          </div>
      ) : (
        <div className="print:hidden grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Top 10 Spotlight Component */}
          <div className="xl:col-span-2 flex flex-col gap-4">
            <h2 className="font-black text-xl text-slate-800 flex items-center gap-2">
               <Crown className="text-amber-500" /> Top 10 Honors Achievers
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {top10.map((student, idx) => (
                  <div key={student.lrn} className="skeu-card p-4 flex items-center gap-4 group hover:border-amber-300 transition-colors cursor-pointer"
                       onClick={() => setCertList([student])}>
                      <div className="h-12 w-12 rounded-xl flex items-center justify-center text-xl font-black shrink-0 relative overflow-hidden"
                           style={idx === 0 ? { background: "linear-gradient(135deg, #FFDF70, #D4AF37)", color: "white", textShadow: "0 2px 4px rgba(0,0,0,0.2)" } 
                                : idx === 1 ? { background: "linear-gradient(135deg, #E2E8F0, #94A3B8)", color: "white" } 
                                : idx === 2 ? { background: "linear-gradient(135deg, #FDBA74, #C2410C)", color: "white" } 
                                : { background: "#F1F5F9", color: "#64748B" }}>
                          {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate text-slate-900 group-hover:text-[#003876] transition-colors">{student.name}</p>
                          <p className="text-xs text-amber-600 font-semibold mt-0.5">{student.award}</p>
                      </div>
                      <div className="text-right shrink-0">
                          <p className="text-xl font-black text-slate-800">{student.average.toFixed(2)}</p>
                          <Button 
                             size="sm" variant="ghost" 
                             className="h-6 px-2 text-[10px] uppercase font-bold text-blue-600 hover:bg-blue-50 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                             onClick={(e) => { e.stopPropagation(); setCertList([student]); setTimeout(handlePrint, 300); }}
                          >
                             Print Cert
                          </Button>
                      </div>
                  </div>
               ))}
               {top10.length === 0 && (
                  <div className="col-span-2 text-center p-8 bg-slate-50 border border-slate-200 border-dashed rounded-xl">
                     <p className="text-slate-500 text-sm font-medium">No students currently qualify for the top 10 rankings.</p>
                  </div>
               )}
            </div>
          </div>

          {/* Master Ranking List */}
          <div className="xl:col-span-1 skeu-card p-0 overflow-hidden flex flex-col h-[700px]">
             <div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
                 <h2 className="font-black text-sm text-slate-800">Complete Class Ranking</h2>
                 <p className="text-xs text-slate-500 mt-0.5">Highest to Lowest average</p>
             </div>
             <div className="overflow-y-auto flex-1 p-2">
                 {rankedStudents.map((student, idx) => (
                    <div key={student.lrn} className="flex items-center justify-between p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 rounded-lg group">
                        <div className="flex items-center gap-3 w-full">
                           <span className="text-xs font-bold text-slate-400 w-4 text-right">#{idx + 1}</span>
                           <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">{student.name}</p>
                              {student.awardLevel > 0 && <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">{student.award}</span>}
                           </div>
                           <span className="font-mono text-sm font-bold text-slate-700">{student.average.toFixed(2)}</span>
                        </div>
                    </div>
                 ))}
             </div>
          </div>
          
        </div>
      )}

      {/* Certificate Preview Modal */}
      {certList.length > 0 && (
         <div className="print:hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
             <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
                <button onClick={() => setCertList([])} className="absolute top-4 right-4 text-slate-400 hover:text-red-500">
                   <Trophy size={20} className="opacity-0" />
                   <span className="absolute inset-0 flex items-center justify-center">✕</span>
                </button>
                
                <div className="text-center mb-6 border-b border-slate-100 pb-6">
                   <Medal size={48} className="mx-auto text-amber-500 mb-3" />
                   <h2 className="text-2xl font-black text-slate-900">
                     {certList.length === 1 ? certList[0].name : `Bulk Print: ${certList.length} Certificates`}
                   </h2>
                   {certList.length === 1 && (
                     <p className="text-amber-600 font-bold tracking-wide uppercase text-sm mt-1">{certList[0].award} • {certList[0].average.toFixed(2)} AVG</p>
                   )}
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                    <p className="text-xs text-amber-800 font-medium text-center">
                       {certList.length === 1 ? 'A print-ready certificate will be generated using' : 'Print-ready certificates will be generated for the entire payload using'} DepEd's <strong>{schoolInfo.schoolYear} Recognition Rites</strong> format with exact coordinates, background watermarks, and Signatory bounds.
                    </p>
                </div>

                <div className="flex gap-3">
                   <Button variant="outline" className="flex-1 h-12" onClick={() => setCertList([])}>Cancel</Button>
                   <Button className="flex-1 h-12 bg-amber-600 hover:bg-amber-700 text-white" onClick={handlePrint}>
                      <Printer className="mr-2" size={18} /> Print {certList.length === 1 ? 'Certificate' : `Batch (${certList.length})`}
                   </Button>
                </div>
             </div>
         </div>
      )}

    </div>
  )
}
