"use client"

import { useTeacherStore } from "@/store/useStore"
import { useEffect, useState, useMemo } from "react"
import { Printer, ArrowLeft } from "lucide-react"
import Link from "next/link"

const computeAverage = (grades: any[], requiredSubjects: string[]) => {
  if (grades.length === 0) return 0
  let sum = 0; let count = 0;
  requiredSubjects.forEach(sub => {
    // Ap can be Arpan, MAPEH can be Mapeh, Epp/tle
    const gradeEntry = grades.find(g => g.subject.toLowerCase().includes(sub.toLowerCase()))
    if (gradeEntry && gradeEntry.quarterGrade > 0) { 
        sum += gradeEntry.quarterGrade; 
        count++; 
    }
  })
  if (count === 0) return 0;
  return Math.round(sum / count);
}

const subjects = ['Filipino', 'English', 'Mathematics', 'Science', 'Ap', 'Epp/tle', 'Mapeh', 'Esp']

export default function PrintCardsPage() {
    const [mounted, setMounted] = useState(false)
    const students = useTeacherStore(s => s.students)
    const gradesMap = useTeacherStore(s => s.grades)
    const schoolInfo = useTeacherStore(s => s.schoolInfo)

    useEffect(() => setMounted(true), [])
    if (!mounted) return null

    return (
        <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-200 print:bg-white text-black font-sans w-full min-h-screen">
            <div className="print:hidden sticky top-0 w-full p-4 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-50" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
               <div className="flex items-center gap-4">
                  <Link href="/composite" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors">
                      <ArrowLeft size={16} /> Back to Composite
                  </Link>
                  <div>
                      <h1 className="text-xl font-black bg-clip-text text-transparent" style={{ background: 'linear-gradient(90deg, #111A24, #003876)', WebkitBackgroundClip: 'text' }}>Learner Progress Report Cards (SF9)</h1>
                      <p className="text-xs text-slate-500 font-medium">Automatically generated from Q1 composite grades.</p>
                  </div>
               </div>
               <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 flex items-center gap-2 rounded-lg font-bold shadow-md shadow-blue-600/20 active:scale-95 transition-all w-full sm:w-auto justify-center">
                  <Printer size={18} /> Print All Cards (PDF)
               </button>
            </div>

            <div className="print:m-0 pt-8 pb-12 w-full flex flex-col items-center gap-8">
               {students.map((student, i) => {
                   const sGrades = gradesMap[student.lrn] || []
                   const getGrade = (sub: string) => sGrades.find(g => g.subject.toLowerCase().includes(sub.toLowerCase()))?.quarterGrade || ''
                   const avg = computeAverage(sGrades, subjects)

                   return (
                       <div key={student.lrn} className="bg-white print:shadow-none shadow-2xl w-[210mm] min-h-[297mm] p-12 print:p-8 page-break-after-always relative border border-slate-300 print:border-none mx-auto box-border flex flex-col">
                           {/* Decorative Header */}
                           <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-700 to-red-600 print:hidden" />
                           
                           {/* Header */}
                           <div className="text-center mb-8 pt-4">
                              <h2 className="text-xs font-bold uppercase tracking-widest mb-1 text-slate-700">Republic of the Philippines</h2>
                              <h1 className="text-xl font-black uppercase mb-1 font-serif text-slate-900 tracking-wide">Department of Education</h1>
                              <p className="text-sm font-semibold text-slate-700">Region: <span className="underline decoration-slate-300 underline-offset-4 mx-1 px-1">{schoolInfo.region || '___'}</span> Division: <span className="underline decoration-slate-300 underline-offset-4 mx-1 px-1">{schoolInfo.division || '___'}</span></p>
                              
                              <div className="mt-8 mb-4">
                                  <h3 className="font-black text-2xl uppercase mb-1 tracking-tight">{schoolInfo.schoolName || 'YOUR SCHOOL NAME'}</h3>
                                  <p className="text-sm font-bold uppercase text-slate-600 tracking-wider bg-slate-100 inline-block px-4 py-1 rounded">{schoolInfo.district || 'YOUR DISTRICT'}</p>
                                  <p className="text-sm mt-3 font-medium text-slate-600">School ID: <span className="font-bold text-slate-900 border border-slate-300 px-3 py-0.5 rounded ml-1 bg-white">{schoolInfo.schoolId || '______'}</span></p>
                              </div>

                              <div className="inline-block border-y-2 border-slate-900 py-2 px-12 mt-6 bg-slate-50">
                                 <h2 className="text-xl font-black uppercase tracking-widest text-[#003876]">Learner's Progress Report Card (SF9)</h2>
                              </div>
                           </div>

                           {/* Learner Info */}
                           <div className="grid grid-cols-2 gap-y-5 gap-x-8 text-sm mb-10 p-6 bg-slate-50 border border-slate-200 rounded-xl relative">
                              <div className="absolute -top-3 left-6 bg-white px-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Learner Information</div>
                              <div className="flex border-b border-slate-300 pb-1"><span className="font-bold w-24 text-slate-500 uppercase text-xs self-end">Name:</span> <span className="uppercase font-bold text-base w-full">{student.name}</span></div>
                              <div className="flex border-b border-slate-300 pb-1"><span className="font-bold w-24 text-slate-500 uppercase text-xs self-end">LRN:</span> <span className="font-bold text-base w-full tracking-wider">{student.lrn}</span></div>
                              <div className="flex border-b border-slate-300 pb-1"><span className="font-bold w-24 text-slate-500 uppercase text-xs self-end">Age:</span> <span className="font-bold text-base w-full">{(student as any).age || '__'}</span></div>
                              <div className="flex border-b border-slate-300 pb-1"><span className="font-bold w-24 text-slate-500 uppercase text-xs self-end">Sex:</span> <span className="font-bold text-base w-full">{student.sex === 'M' ? 'MALE' : 'FEMALE'}</span></div>
                              <div className="flex border-b border-slate-300 pb-1"><span className="font-bold w-24 text-slate-500 uppercase text-xs self-end">Grade:</span> <span className="font-bold text-base w-full">{schoolInfo.gradeLevel || '8'}</span></div>
                              <div className="flex border-b border-slate-300 pb-1"><span className="font-bold w-24 text-slate-500 uppercase text-xs self-end">Section:</span> <span className="font-bold text-base w-full uppercase">{schoolInfo.section || ''}</span></div>
                              <div className="flex border-b border-slate-300 pb-1"><span className="font-bold w-32 text-slate-500 uppercase text-xs self-end">School Year:</span> <span className="font-bold text-base w-full">{schoolInfo.schoolYear || '2025-2026'}</span></div>
                              <div className="flex border-b border-slate-300 pb-1"><span className="font-bold w-32 text-slate-500 uppercase text-xs self-end">Track/Strand:</span> <span className="font-bold text-base text-slate-400 w-full italic">Not Applicable</span></div>
                           </div>

                           {/* Grades Table */}
                           <div className="mb-10 w-full border-2 border-slate-800 rounded-t-lg overflow-hidden">
                               <h3 className="font-black text-center bg-[#003876] text-white py-2.5 uppercase tracking-widest text-sm border-b-2 border-slate-800">Report on Learning Progress and Achievement</h3>
                               <table className="w-full text-sm border-collapse">
                                   <thead className="bg-[#EAEFF4]">
                                       <tr>
                                           <th className="border-r border-b-2 border-slate-800 p-3 text-left font-black text-slate-800 uppercase text-xs tracking-wider" rowSpan={2} style={{ width: '40%' }}>Learning Areas</th>
                                           <th className="border-r  border-b border-slate-800 p-2 text-center font-black text-slate-800 uppercase text-[10px] tracking-wider" colSpan={4}>Quarter</th>
                                           <th className="border-r border-b-2 border-slate-800 p-3 text-center font-black text-slate-800 uppercase text-[10px] tracking-widest w-24" rowSpan={2}>Final Grade</th>
                                           <th className="border-b-2 border-slate-800 p-3 text-center font-black text-slate-800 uppercase text-[10px] tracking-widest w-24" rowSpan={2}>Remarks</th>
                                       </tr>
                                       <tr className="bg-slate-200">
                                           <th className="border-r border-b-2 border-slate-800 p-1.5 w-[10%] text-center text-xs font-black">1</th>
                                           <th className="border-r border-b-2 border-slate-800 p-1.5 w-[10%] text-center text-xs font-black">2</th>
                                           <th className="border-r border-b-2 border-slate-800 p-1.5 w-[10%] text-center text-xs font-black">3</th>
                                           <th className="border-r border-b-2 border-slate-800 p-1.5 w-[10%] text-center text-xs font-black">4</th>
                                       </tr>
                                   </thead>
                                   <tbody>
                                       {subjects.map(sub => {
                                           const g = getGrade(sub);
                                           return (
                                               <tr key={sub} className="even:bg-slate-50 hover:bg-white print:even:bg-white">
                                                   <td className="border-r border-b border-slate-300 px-4 py-2.5 font-bold text-slate-700 uppercase">{sub === 'Ap' ? 'Araling Panlipunan' : sub === 'Epp/tle' ? 'TLE' : sub}</td>
                                                   {/* Quarter 1 Grade */}
                                                   <td className="border-r border-b border-slate-300 px-2 py-2.5 text-center font-black text-base">{g}</td>
                                                   {/* Missing Quarters - blanks */}
                                                   <td className="border-r border-b border-slate-300 px-2 py-2.5 text-center bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABZJREFUeNpi2rV7928bAAAA//8AAQIABAAAAAEAGM5zJ5gAAAAASUVORK5CYII=')] bg-repeat opacity-10" />
                                                   <td className="border-r border-b border-slate-300 px-2 py-2.5 text-center bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABZJREFUeNpi2rV7928bAAAA//8AAQIABAAAAAEAGM5zJ5gAAAAASUVORK5CYII=')] bg-repeat opacity-10" />
                                                   <td className="border-r border-b border-slate-300 px-2 py-2.5 text-center bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABZJREFUeNpi2rV7928bAAAA//8AAQIABAAAAAEAGM5zJ5gAAAAASUVORK5CYII=')] bg-repeat opacity-10" />
                                                   {/* Final */}
                                                   <td className="border-r border-b border-slate-300 px-2 py-2.5 " />
                                                   <td className="border-b border-slate-300 px-2 py-2.5 text-center font-bold text-xs">
                                                        {typeof g === 'number' && g >= 75 ? <span className="text-green-700 uppercase tracking-wide">Passed</span> : (typeof g === 'number' && g > 0 ? <span className="text-red-600 uppercase tracking-wide">Failed</span> : '')}
                                                   </td>
                                               </tr>
                                           )
                                       })}
                                       {/* General Average Row */}
                                       <tr className="bg-[#EAEFF4] border-t-2 border-slate-800">
                                           <td className="border-r border-slate-800 p-3 text-right font-black uppercase tracking-wider text-slate-800">General Average</td>
                                           <td className="border-r border-slate-800 p-3 text-center font-black text-lg">{avg > 0 ? avg : ''}</td>
                                           <td className="border-r border-slate-800" colSpan={3}></td>
                                           <td className="border-r border-slate-800 p-3 text-center font-black text-xl">{avg > 0 ? avg : ''}</td>
                                           <td className="border-slate-800 p-3 text-center font-black">
                                                {avg >= 75 ? <span className="text-green-700 uppercase tracking-wider">Passed</span> : (avg > 0 ? <span className="text-red-600 uppercase tracking-wider">Failed</span> : '')}
                                           </td>
                                       </tr>
                                   </tbody>
                               </table>
                           </div>

                           <div className="w-full text-center mb-10 text-xs italic text-slate-500 font-medium tracking-wide">
                               "This report card indicates the learner's progress in various learning areas and core values."
                           </div>

                           {/* Signatures */}
                           <div className="mt-auto pt-8 flex justify-between px-16 relative">
                               <div className="absolute top-0 left-16 right-16 border-t border-slate-200"></div>
                               <div className="text-center pt-8">
                                   <div className="w-56 border-b border-slate-800 mb-1.5 font-bold pt-8 relative">
                                        <span className="absolute bottom-1 w-full left-0 tracking-widest uppercase text-base text-slate-900">{schoolInfo.adviserName || '________________________'}</span>
                                   </div>
                                   <p className="text-[10px] text-slate-600 uppercase tracking-[0.2em] font-bold">Class Adviser Signature/Date</p>
                               </div>
                               <div className="text-center pt-8">
                                   <div className="w-56 border-b border-slate-800 mb-1.5 font-bold pt-8 relative">
                                        <span className="absolute bottom-1 w-full left-0 tracking-widest uppercase text-base text-slate-900">{schoolInfo.schoolName ? 'MYRNA E. PURIFICACION' : '________________________'}</span>
                                   </div>
                                   <p className="text-[10px] text-slate-600 uppercase tracking-[0.2em] font-bold">Principal/School Head Signature/Date</p>
                               </div>
                           </div>

                           <div className="absolute bottom-4 left-0 w-full text-center text-[10px] text-slate-400 font-mono tracking-widest print:opacity-50">
                               Generated via DepAid SF9 Automation Module
                           </div>

                           <style dangerouslySetInnerHTML={{__html: `
                              @media print {
                                 @page { margin: 0; size: A4 portrait; }
                                 body { background: white !important; }
                                 .page-break-after-always { page-break-after: always; break-after: page; }
                                 button, a { display: none !important; }
                              }
                           `}} />
                       </div>
                   )
               })}
               {students.length === 0 && (
                   <div className="p-10 text-center font-bold text-xl text-slate-500 mt-20">No learners found. Check masterlist.</div>
               )}
            </div>
        </div>
    )
}
