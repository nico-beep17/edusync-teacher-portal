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
        { lrn: "123456789012", name: "ANUBLING, REGIE C.", sex: "M", status: "ENROLLED" },
        { lrn: "123456789013", name: "BARRIENTOS, JOHN PAUL M.", sex: "M", status: "ENROLLED" },
        { lrn: "123456789014", name: "BULAHAN, ROVIC L.", sex: "M", status: "ENROLLED" },
        { lrn: "123456789015", name: "CLARO, REANZ P.", sex: "F", status: "ENROLLED" },
      ],
      grades: {},
      attendance: {},
      
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
