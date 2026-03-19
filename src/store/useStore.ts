import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export type Student = {
  lrn: string
  name: string
  sex: 'M' | 'F'
  status: string
}

export type GradeEntry = {
  subject: string
  ww1: number
  ww2: number
  pt1: number
  pt2: number
  qa: number
  quarterGrade: number
}

export type AttendanceEntry = {
  date: string // ISO string or simple YYYY-MM-DD
  status: 'P' | 'A' | 'L' // Present, Absent, Late
}

interface TeacherState {
  students: Student[]
  grades: Record<string, GradeEntry[]> // Keyed by student LRN
  attendance: Record<string, AttendanceEntry[]> // Keyed by student LRN
  
  // Actions
  addStudent: (student: Student) => void
  updateGrade: (lrn: string, gradeData: GradeEntry) => void
  updateAttendance: (lrn: string, record: AttendanceEntry) => void
  pushToCloud: () => Promise<void>
}

export const useTeacherStore = create<TeacherState>()(
  persist(
    (set) => ({
      students: [
        { lrn: "101010101010", name: "ANUBLING, REGIE C.", sex: "M", status: "ENROLLED" },
        { lrn: "101010101011", name: "BARRIENTOS, JOHN PAUL M.", sex: "M", status: "ENROLLED" },
        { lrn: "101010101012", name: "BULAHAN, ROVIC L.", sex: "M", status: "ENROLLED" },
        { lrn: "101010101013", name: "CIJAS, ROLIE JR A.", sex: "M", status: "ENROLLED" },
        { lrn: "101010101014", name: "CLARO, REANZ P.", sex: "F", status: "ENROLLED" },
        { lrn: "101010101015", name: "DELA CRUZ, SARAH G.", sex: "F", status: "ENROLLED" },
        { lrn: "101010101016", name: "ESPINA, MICA B.", sex: "F", status: "ENROLLED" },
        { lrn: "101010101017", name: "FAMOSO, LARA M.", sex: "F", status: "ENROLLED" },
      ],
      grades: {
        "101010101010": [
            { subject: "Filipino", ww1: 15, ww2: 12, pt1: 20, pt2: 18, qa: 45, quarterGrade: 86 },
            { subject: "Mathematics", ww1: 10, ww2: 8, pt1: 15, pt2: 10, qa: 30, quarterGrade: 74 },
            { subject: "Science", ww1: 12, ww2: 15, pt1: 18, pt2: 19, qa: 40, quarterGrade: 83 },
            { subject: "English", ww1: 14, ww2: 14, pt1: 22, pt2: 21, qa: 42, quarterGrade: 88 },
        ],
        "101010101011": [
            { subject: "Filipino", ww1: 20, ww2: 19, pt1: 25, pt2: 24, qa: 48, quarterGrade: 94 },
            { subject: "Mathematics", ww1: 18, ww2: 17, pt1: 22, pt2: 23, qa: 46, quarterGrade: 91 },
            { subject: "Science", ww1: 19, ww2: 18, pt1: 24, pt2: 23, qa: 47, quarterGrade: 93 },
            { subject: "English", ww1: 17, ww2: 16, pt1: 21, pt2: 22, qa: 44, quarterGrade: 89 },
        ],
        "101010101015": [
            { subject: "Filipino", ww1: 20, ww2: 20, pt1: 25, pt2: 25, qa: 50, quarterGrade: 98 },
            { subject: "Mathematics", ww1: 20, ww2: 19, pt1: 24, pt2: 25, qa: 49, quarterGrade: 96 },
            { subject: "Science", ww1: 19, ww2: 20, pt1: 25, pt2: 24, qa: 48, quarterGrade: 95 },
            { subject: "English", ww1: 20, ww2: 20, pt1: 25, pt2: 25, qa: 49, quarterGrade: 97 },
        ]
      },
      attendance: {
         "101010101010": [
            { date: new Date().toISOString().split('T')[0], status: 'P' },
            { date: '2026-03-18', status: 'A' }
         ],
         "101010101015": [
            { date: new Date().toISOString().split('T')[0], status: 'P' },
            { date: '2026-03-18', status: 'P' }
         ],
      },
      
      addStudent: (student) => {
         // Fire and forget to Cloud
         const [last, first] = student.name.split(',')
         supabase.from('students').upsert({
            lrn: student.lrn,
            last_name: (last || '').trim(),
            first_name: (first || '').trim(),
            sex: student.sex === 'M' ? 'MALE' : 'FEMALE'
         }).then(({ error }) => { if (error) console.error("Cloud Student Sync Failed:", error) })

         set((state) => ({ 
            students: [...state.students, student] 
         }))
      },
      
      updateGrade: (lrn, gradeData) => set((state) => {
        const studentGrades = state.grades[lrn] || []
        const existingSubjectIndex = studentGrades.findIndex(g => g.subject === gradeData.subject)
        
        let newGrades = [...studentGrades]
        if (existingSubjectIndex >= 0) {
          newGrades[existingSubjectIndex] = gradeData // update existing
        } else {
          newGrades.push(gradeData) // add new
        }
        
        return {
          grades: {
            ...state.grades,
            [lrn]: newGrades
          }
        }
      }),
      
      updateAttendance: (lrn, record) => set((state) => {
        const studentAtt = state.attendance[lrn] || []
        const existingIdx = studentAtt.findIndex(a => a.date === record.date)
        
        let newAtt = [...studentAtt]
        if (existingIdx >= 0) {
          newAtt[existingIdx] = record
        } else {
          newAtt.push(record)
        }

        return {
          attendance: {
            ...state.attendance,
            [lrn]: newAtt
          }
        }
      }),

      pushToCloud: async () => {
         if (!supabase) {
            alert("Cloud sync is unavailable — Supabase credentials are not configured.")
            return
         }
         const { students } = useTeacherStore.getState()
         for (const s of students) {
             const [last, first] = s.name.split(',')
             await supabase.from('students').upsert({ lrn: s.lrn, last_name: (last || '').trim(), first_name: (first || '').trim(), sex: s.sex==='M'?'MALE':'FEMALE' })
         }
         alert("Complete Offline Cache synchronized to Supabase Cloud!")
      }
    }),
    {
      name: 'edusync-teacher-storage', // saves to localStorage
    }
  )
)
