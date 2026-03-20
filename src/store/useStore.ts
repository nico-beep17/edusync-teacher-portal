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
  date: string
  status: 'P' | 'A' | 'L'
}

export type BookEntry = {
  id: string
  title: string
  dateIssued: string
  dateReturned?: string
}

export type WorkloadEntry = {
  id: string
  subject: string
  section: string
  students: number
  schedule: string
  slug: string
  gradient: string
}

interface TeacherState {
  students: Student[]
  grades: Record<string, GradeEntry[]>
  attendance: Record<string, AttendanceEntry[]>
  books: Record<string, BookEntry[]>
  workload: WorkloadEntry[]
  teacherPin: string
  user: any | null

  // Actions
  addStudent: (student: Student) => void
  editStudent: (oldLrn: string, newData: Student) => void
  removeStudent: (lrn: string) => void
  updateGrade: (lrn: string, gradeData: GradeEntry) => void
  updateAttendance: (lrn: string, record: AttendanceEntry) => void
  issueBook: (lrn: string, book: Omit<BookEntry, 'id'>) => void
  returnBook: (lrn: string, bookId: string, date: string) => void
  removeBook: (lrn: string, bookId: string) => void
  addWorkload: (entry: WorkloadEntry) => void
  removeWorkload: (id: string) => void
  setTeacherPin: (pin: string) => void
  pushToCloud: () => Promise<void>
  setUser: (user: any) => void
}

export const useTeacherStore = create<TeacherState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (u) => set({ user: u }),
      teacherPin: '1234',
      books: {},
      students: [
        { lrn: "101010101010", name: "ANUBLING, REGIE C.", sex: "M", status: "ENROLLED" },
        { lrn: "101010101011", name: "BARRIENTOS, JOHN PAUL M.", sex: "M", status: "ENROLLED" },
        { lrn: "101010101012", name: "BULAHAN, ROVIC L.", sex: "M", status: "ENROLLED" },
        { lrn: "101010101013", name: "CIJAS, ROLIE JR A.", sex: "M", status: "ENROLLED" },
        { lrn: "101010101018", name: "DAGUPAN, CARL D.", sex: "M", status: "ENROLLED" },
        { lrn: "101010101019", name: "EDOLO, MARK JAYSON R.", sex: "M", status: "ENROLLED" },
        { lrn: "101010101020", name: "FUENTES, JERICO P.", sex: "M", status: "ENROLLED" },
        { lrn: "101010101021", name: "GONZALES, REYMART V.", sex: "M", status: "ENROLLED" },
        { lrn: "101010101014", name: "CLARO, REANZ P.", sex: "F", status: "ENROLLED" },
        { lrn: "101010101015", name: "DELA CRUZ, SARAH G.", sex: "F", status: "ENROLLED" },
        { lrn: "101010101016", name: "ESPINA, MICA B.", sex: "F", status: "ENROLLED" },
        { lrn: "101010101017", name: "FAMOSO, LARA M.", sex: "F", status: "ENROLLED" },
        { lrn: "101010101022", name: "HERNANI, ANGEL A.", sex: "F", status: "ENROLLED" },
        { lrn: "101010101023", name: "ILAGAN, PRINCESS D.", sex: "F", status: "ENROLLED" },
        { lrn: "101010101024", name: "JOMOC, KYLA MARIE S.", sex: "F", status: "ENROLLED" },
        { lrn: "101010101025", name: "KALALO, ROSE ANN T.", sex: "F", status: "ENROLLED" },
      ],
      grades: {
        "101010101010": [
            { subject: "Filipino", ww1: 15, ww2: 12, pt1: 20, pt2: 18, qa: 45, quarterGrade: 86 },
            { subject: "Mathematics", ww1: 10, ww2: 8, pt1: 15, pt2: 10, qa: 30, quarterGrade: 74 },
            { subject: "Science", ww1: 12, ww2: 15, pt1: 18, pt2: 19, qa: 40, quarterGrade: 83 },
            { subject: "English", ww1: 14, ww2: 14, pt1: 22, pt2: 21, qa: 42, quarterGrade: 88 },
            { subject: "Ap", ww1: 13, ww2: 14, pt1: 20, pt2: 19, qa: 38, quarterGrade: 82 },
            { subject: "Mapeh", ww1: 16, ww2: 17, pt1: 22, pt2: 20, qa: 42, quarterGrade: 87 },
            { subject: "Esp", ww1: 17, ww2: 16, pt1: 23, pt2: 22, qa: 43, quarterGrade: 89 },
            { subject: "Epp/tle", ww1: 15, ww2: 14, pt1: 20, pt2: 19, qa: 39, quarterGrade: 84 },
        ],
        "101010101011": [
            { subject: "Filipino", ww1: 20, ww2: 19, pt1: 25, pt2: 24, qa: 48, quarterGrade: 94 },
            { subject: "Mathematics", ww1: 18, ww2: 17, pt1: 22, pt2: 23, qa: 46, quarterGrade: 91 },
            { subject: "Science", ww1: 19, ww2: 18, pt1: 24, pt2: 23, qa: 47, quarterGrade: 93 },
            { subject: "English", ww1: 17, ww2: 16, pt1: 21, pt2: 22, qa: 44, quarterGrade: 89 },
            { subject: "Ap", ww1: 18, ww2: 19, pt1: 23, pt2: 24, qa: 46, quarterGrade: 92 },
            { subject: "Mapeh", ww1: 19, ww2: 20, pt1: 25, pt2: 24, qa: 48, quarterGrade: 95 },
            { subject: "Esp", ww1: 20, ww2: 19, pt1: 24, pt2: 25, qa: 47, quarterGrade: 94 },
            { subject: "Epp/tle", ww1: 17, ww2: 18, pt1: 22, pt2: 23, qa: 45, quarterGrade: 90 },
        ],
        "101010101012": [
            { subject: "Filipino", ww1: 14, ww2: 13, pt1: 19, pt2: 17, qa: 38, quarterGrade: 80 },
            { subject: "Mathematics", ww1: 12, ww2: 11, pt1: 16, pt2: 14, qa: 32, quarterGrade: 75 },
            { subject: "Science", ww1: 13, ww2: 12, pt1: 17, pt2: 16, qa: 35, quarterGrade: 78 },
            { subject: "English", ww1: 14, ww2: 15, pt1: 18, pt2: 19, qa: 40, quarterGrade: 83 },
        ],
        "101010101013": [
            { subject: "Filipino", ww1: 8, ww2: 7, pt1: 12, pt2: 10, qa: 22, quarterGrade: 68 },
            { subject: "Mathematics", ww1: 6, ww2: 5, pt1: 10, pt2: 8, qa: 18, quarterGrade: 60 },
            { subject: "English", ww1: 10, ww2: 9, pt1: 14, pt2: 12, qa: 28, quarterGrade: 72 },
        ],
        "101010101015": [
            { subject: "Filipino", ww1: 20, ww2: 20, pt1: 25, pt2: 25, qa: 50, quarterGrade: 98 },
            { subject: "Mathematics", ww1: 20, ww2: 19, pt1: 24, pt2: 25, qa: 49, quarterGrade: 96 },
            { subject: "Science", ww1: 19, ww2: 20, pt1: 25, pt2: 24, qa: 48, quarterGrade: 95 },
            { subject: "English", ww1: 20, ww2: 20, pt1: 25, pt2: 25, qa: 49, quarterGrade: 97 },
            { subject: "Ap", ww1: 20, ww2: 19, pt1: 24, pt2: 25, qa: 48, quarterGrade: 95 },
            { subject: "Mapeh", ww1: 20, ww2: 20, pt1: 25, pt2: 25, qa: 50, quarterGrade: 98 },
            { subject: "Esp", ww1: 20, ww2: 20, pt1: 25, pt2: 24, qa: 49, quarterGrade: 97 },
            { subject: "Epp/tle", ww1: 19, ww2: 20, pt1: 24, pt2: 25, qa: 48, quarterGrade: 95 },
        ],
        "101010101016": [
            { subject: "Filipino", ww1: 16, ww2: 15, pt1: 21, pt2: 20, qa: 42, quarterGrade: 86 },
            { subject: "Mathematics", ww1: 14, ww2: 13, pt1: 18, pt2: 17, qa: 36, quarterGrade: 79 },
            { subject: "Science", ww1: 15, ww2: 16, pt1: 20, pt2: 19, qa: 40, quarterGrade: 84 },
            { subject: "English", ww1: 16, ww2: 17, pt1: 22, pt2: 21, qa: 43, quarterGrade: 88 },
        ],
        "101010101018": [
            { subject: "Filipino", ww1: 13, ww2: 12, pt1: 18, pt2: 16, qa: 36, quarterGrade: 78 },
            { subject: "Mathematics", ww1: 11, ww2: 10, pt1: 14, pt2: 13, qa: 28, quarterGrade: 72 },
            { subject: "Science", ww1: 12, ww2: 11, pt1: 16, pt2: 15, qa: 32, quarterGrade: 76 },
            { subject: "English", ww1: 14, ww2: 13, pt1: 19, pt2: 18, qa: 38, quarterGrade: 81 },
        ],
        "101010101022": [
            { subject: "Filipino", ww1: 18, ww2: 17, pt1: 23, pt2: 22, qa: 45, quarterGrade: 90 },
            { subject: "Mathematics", ww1: 16, ww2: 15, pt1: 20, pt2: 21, qa: 42, quarterGrade: 86 },
            { subject: "Science", ww1: 17, ww2: 18, pt1: 22, pt2: 21, qa: 44, quarterGrade: 89 },
            { subject: "English", ww1: 18, ww2: 17, pt1: 23, pt2: 22, qa: 45, quarterGrade: 91 },
        ],
      },
      attendance: (() => {
        // Generate full March 2026 attendance for all students
        const att: Record<string, { date: string; status: 'P' | 'A' | 'L' }[]> = {}
        const lrns = [
          '101010101010','101010101011','101010101012','101010101013',
          '101010101018','101010101019','101010101020','101010101021',
          '101010101014','101010101015','101010101016','101010101017',
          '101010101022','101010101023','101010101024','101010101025',
        ]
        // March 2026 weekdays
        const marchDays: string[] = []
        for (let d = 1; d <= 31; d++) {
          const dow = new Date(2026, 2, d).getDay()
          if (dow !== 0 && dow !== 6) marchDays.push(`2026-03-${String(d).padStart(2, '0')}`)
        }
        // Seed-like pattern per student for reproducible results
        const patterns: Record<string, number> = {
          '101010101010': 1, '101010101011': 2, '101010101012': 3, '101010101013': 4,
          '101010101018': 5, '101010101019': 6, '101010101020': 7, '101010101021': 8,
          '101010101014': 9, '101010101015': 10, '101010101016': 11, '101010101017': 12,
          '101010101022': 13, '101010101023': 14, '101010101024': 15, '101010101025': 16,
        }
        lrns.forEach(lrn => {
          const seed = patterns[lrn] || 1
          att[lrn] = marchDays.map((date, idx) => {
            const hash = (seed * 31 + idx * 17 + seed * idx) % 100
            // CIJAS (101010101013): 5 consecutive absences Mar 9-13
            if (lrn === '101010101013' && idx >= 5 && idx <= 9) return { date, status: 'A' as const }
            // ~10% absent, ~5% late, rest present
            let status: 'P' | 'A' | 'L' = 'P'
            if (hash < 10) status = 'A'
            else if (hash < 15) status = 'L'
            return { date, status }
          })
        })
        return att
      })(),
      workload: [
        { id: "1", subject: "Filipino 8", section: "ARIES", students: 16, schedule: "M/W/F 8:00-9:00 AM", slug: "filipino-8-aries", gradient: "from-blue-500 to-cyan-500" },
        { id: "2", subject: "MAPEH 8", section: "TAURUS", students: 40, schedule: "T/TH 10:00-11:30 AM", slug: "mapeh-8-taurus", gradient: "from-blue-500 to-teal-500" },
        { id: "3", subject: "Filipino 9", section: "GEMINI", students: 38, schedule: "M/W/F 1:00-2:00 PM", slug: "filipino-9-gemini", gradient: "from-purple-500 to-pink-500" },
      ],
      
      addStudent: (student) => {
         set((state) => {
            const exists = state.students.find(s => s.lrn === student.lrn || s.name.toUpperCase() === student.name.toUpperCase())
            
            if (exists) {
                // Return updated array instead of duplicating
                return {
                    students: state.students.map(s => s.lrn === exists.lrn ? { ...s, ...student } : s)
                }
            }

            // Sync to cloud if entirely new
            if (supabase) {
               const [last, first] = student.name.split(',')
               supabase.from('students').upsert({
                  lrn: student.lrn,
                  last_name: (last || '').trim(),
                  first_name: (first || '').trim(),
                  sex: student.sex === 'M' ? 'MALE' : 'FEMALE'
               }).then(({ error }: any) => { if (error) console.error("Cloud Student Sync Failed:", error) })
            }

            return { students: [...state.students, student] }
         })
      },

      editStudent: (oldLrn, newData) => set((state) => {
          // If LRN didn't change, just update the student inline
          if (oldLrn === newData.lrn) {
             return {
                students: state.students.map(s => s.lrn === oldLrn ? newData : s)
             }
          }

          // If LRN changed, we must update the student AND migrate all keyed data
          const newStudents = state.students.map(s => s.lrn === oldLrn ? newData : s)
          
          const newGrades = { ...state.grades }
          if (newGrades[oldLrn]) { newGrades[newData.lrn] = newGrades[oldLrn]; delete newGrades[oldLrn] }
          
          const newAttendance = { ...state.attendance }
          if (newAttendance[oldLrn]) { newAttendance[newData.lrn] = newAttendance[oldLrn]; delete newAttendance[oldLrn] }
          
          const newBooks = { ...state.books }
          if (newBooks[oldLrn]) { newBooks[newData.lrn] = newBooks[oldLrn]; delete newBooks[oldLrn] }

          return {
             students: newStudents,
             grades: newGrades,
             attendance: newAttendance,
             books: newBooks
          }
      }),

      removeStudent: (lrn) => set((state) => ({
        students: state.students.filter(s => s.lrn !== lrn)
      })),
      
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

      issueBook: (lrn, book) => set((state) => {
        const studentBooks = state.books[lrn] || []
        const newBook: BookEntry = { ...book, id: Math.random().toString(36).substring(7) }
        return { books: { ...state.books, [lrn]: [...studentBooks, newBook] } }
      }),

      returnBook: (lrn, bookId, date) => set((state) => {
        const studentBooks = state.books[lrn] || []
        return {
          books: {
            ...state.books,
            [lrn]: studentBooks.map(b => b.id === bookId ? { ...b, dateReturned: date } : b)
          }
        }
      }),

      removeBook: (lrn, bookId) => set((state) => {
        const studentBooks = state.books[lrn] || []
        return {
          books: {
            ...state.books,
            [lrn]: studentBooks.filter(b => b.id !== bookId)
          }
        }
      }),

      addWorkload: (entry) => set((state) => ({
        workload: [...state.workload, entry]
      })),

      removeWorkload: (id) => set((state) => ({
        workload: state.workload.filter(w => w.id !== id)
      })),

      setTeacherPin: (pin) => set({ teacherPin: pin }),

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
      name: 'depaid-teacher-storage', // saves to localStorage
    }
  )
)
