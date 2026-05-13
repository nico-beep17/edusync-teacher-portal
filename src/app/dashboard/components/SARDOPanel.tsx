"use client"

import { AlertTriangle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"

interface SARDOPanelProps {
  interventionList: Array<{
    lrn: string
    name: string
    sex: 'M' | 'F'
    average: number
    absences: number
  }>
  onReviewProfile: (student: any) => void
}

export function SARDOPanel({ interventionList, onReviewProfile }: SARDOPanelProps) {
  return (
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
                    <div className="flex items-center justify-end gap-4">
                      <button
                        onClick={() => {
                          const today = new Date()
                          const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                          const reason = student.average > 0 && student.average < 75
                            ? `academic standing (General Average: <strong>${student.average.toFixed(2)}</strong>, below the passing mark of 75)`
                            : `excessive absences (<strong>${student.absences} absence${student.absences !== 1 ? 's' : ''}</strong> recorded this quarter)`
                          const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>SARDO Intervention Letter – ${student.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman&display=swap');
    body { font-family: "Times New Roman", Times, serif; margin: 0; padding: 40px 60px; font-size: 13pt; color: #000; }
    .header { text-align: center; margin-bottom: 8px; }
    .header img { height: 60px; }
    .header h2 { font-size: 13pt; margin: 2px 0; text-transform: uppercase; }
    .header p { font-size: 11pt; margin: 1px 0; }
    hr { border: none; border-top: 2px solid #000; margin: 10px 0 4px; }
    hr.thin { border-top: 1px solid #000; margin: 2px 0 14px; }
    .date { text-align: right; margin-bottom: 20px; }
    .body { text-align: justify; line-height: 1.8; }
    .body p { margin: 0 0 14px; }
    .indent { text-indent: 40px; }
    .sig { margin-top: 40px; }
    .sig-name { font-weight: bold; text-transform: uppercase; border-top: 1px solid #000; display: inline-block; min-width: 220px; padding-top: 4px; margin-top: 50px; }
    @media print { body { padding: 30px 50px; } button { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <h2>Republic of the Philippines</h2>
    <h2>Department of Education</h2>
    <p>Region XI – Davao Region</p>
    <p>Division of Panabo City</p>
    <p><strong>QUEZON NATIONAL HIGH SCHOOL</strong></p>
    <p>Quezon, Panabo City</p>
  </div>
  <hr/><hr class="thin"/>

  <div class="date">${dateStr}</div>

  <div class="body">
    <p>Dear Parent/Guardian of <strong>${student.name}</strong>,</p>

    <p class="indent">Greetings of peace and goodwill!</p>

    <p class="indent">This letter is to formally inform you that your child, <strong>${student.name}</strong>, a student of Grade 8 – ARIES at Quezon National High School for School Year 2025–2026, has been identified as a <strong>Student At Risk of Dropping Out (SARDO)</strong> due to ${reason}.</p>

    <p class="indent">In line with DepEd Order No. 40, s. 2012 (DepEd Child Protection Policy) and DO No. 21, s. 2019 (Policy Guidelines on the K–12 Basic Education Program), we are reaching out to coordinate appropriate intervention strategies to support your child's academic progress and continued enrollment.</p>

    <p class="indent">We strongly encourage you to schedule a meeting with the class adviser at your earliest convenience to discuss the matter and plan for necessary academic or behavioral interventions. Your cooperation and active involvement in your child's education is greatly appreciated.</p>

    <p class="indent">Should you have any questions or concerns, please feel free to contact the school at the number provided above. We look forward to working with you for the betterment of your child's future.</p>

    <p class="indent">Thank you very much.</p>
  </div>

  <div class="sig">
    <p>Respectfully yours,</p>
    <div class="sig-name">TEACHER'S NAME</div>
    <p style="margin:2px 0 0">Class Adviser, Grade 8 – ARIES</p>

    <br/><br/>
    <p>Noted by:</p>
    <div class="sig-name">MYRNA EVANGELISTA PURIFICACION</div>
    <p style="margin:2px 0 0">School Head / Principal</p>
  </div>

  <script>window.onload = () => window.print();</script>
</body>
</html>`
                          const win = window.open('', '_blank')
                          if (win) { win.document.write(html); win.document.close() }
                          else toast.error('Please allow pop-ups for this site to generate the letter.')
                        }}
                        className="text-[11px] uppercase tracking-wider font-black px-3 py-1.5 rounded-md shadow-sm transition-all hover:-translate-y-0.5"
                        style={{ background: "linear-gradient(180deg, #E3001B 0%, #C00017 100%)", color: "white", border: "1px solid #A00015" }}
                      >
                        Generate Letter
                      </button>
                      <button
                        onClick={() => onReviewProfile(student)}
                        className="text-xs font-bold underline underline-offset-2"
                        style={{ color: "#D08010" }}
                      >
                        Review Profile
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
