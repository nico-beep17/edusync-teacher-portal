import { StateCreator } from 'zustand'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { studentSchema, gradeEntrySchema } from '@/lib/validation'

let _supabase: ReturnType<typeof createClient> | null = null
function getSupabase() {
  if (!_supabase) _supabase = createClient()
  return _supabase
}

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

export type SF3Record = { dateIssued?: string; dateReturned?: string; returnCode?: string; remarks?: string }
export type SF3Books = Record<string, Record<string, SF3Record>>

export interface StudentSlice {
  students: Student[]
  grades: Record<string, GradeEntry[]>
  attendance: Record<string, AttendanceEntry[]>
  subjectAttendance: Record<string, Record<string, AttendanceEntry[]>>
  workloadStudents: Record<string, Student[]>
  books: SF3Books
  sf3Subjects: string[]
  sf2Summaries: Record<string, {
    lateEnrollmentM: number, lateEnrollmentF: number,
    dropOutM: number, dropOutF: number,
    transferredOutM: number, transferredOutF: number,
    transferredInM: number, transferredInF: number,
  }>

  addStudent: (student: Student) => void
  editStudent: (oldLrn: string, newData: Student) => void
  removeStudent: (lrn: string) => void
  updateGrade: (lrn: string, gradeData: GradeEntry) => void
  updateAttendance: (lrn: string, record: AttendanceEntry) => void
  updateSubjectAttendance: (subject: string, lrn: string, record: AttendanceEntry) => void
  setSf3Record: (lrn: string, subjectKey: string, record: SF3Record) => void
  setSf3Subjects: (subjects: string[]) => void
  clearSf3Books: () => void
  setSf2Summary: (month: string, summary: any) => void
  setWorkloadStudents: (slug: string, students: Student[]) => void
}

export const createStudentSlice: StateCreator<StudentSlice> = (set) => ({
  students: [],
  grades: {},
  attendance: {},
  subjectAttendance: {},
  workloadStudents: {},
  books: {},
  sf3Subjects: [
    'Filipino EL',
    'Music Arts',
    'Physical Education',
    'Health',
    'Science',
    'Filipino',
    'ESP',
    'Mathematics',
  ],
  sf2Summaries: {},

  addStudent: (student) => {
    try {
      studentSchema.parse(student)
    } catch (err: any) {
      toast.error(err.errors?.[0]?.message || 'Invalid student data')
      return
    }

    set((state) => {
      const exists = state.students.find(s => s.lrn === student.lrn || s.name.toUpperCase() === student.name.toUpperCase())
      if (exists) {
        return { students: state.students.map(s => s.lrn === exists.lrn ? { ...s, ...student } : s) }
      }

      const supabase = getSupabase()
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
    if (oldLrn === newData.lrn) {
      return { students: state.students.map(s => s.lrn === oldLrn ? newData : s) }
    }
    const newStudents = state.students.map(s => s.lrn === oldLrn ? newData : s)
    const newGrades = { ...state.grades }
    if (newGrades[oldLrn]) { newGrades[newData.lrn] = newGrades[oldLrn]; delete newGrades[oldLrn] }
    const newAttendance = { ...state.attendance }
    if (newAttendance[oldLrn]) { newAttendance[newData.lrn] = newAttendance[oldLrn]; delete newAttendance[oldLrn] }
    const newBooks = { ...state.books }
    if (newBooks[oldLrn]) { newBooks[newData.lrn] = newBooks[oldLrn]; delete newBooks[oldLrn] }
    return { students: newStudents, grades: newGrades, attendance: newAttendance, books: newBooks }
  }),

  removeStudent: (lrn) => set((state) => ({
    students: state.students.filter(s => s.lrn !== lrn)
  })),

  updateGrade: (lrn, gradeData) => {
    try {
      gradeEntrySchema.parse(gradeData)
    } catch (err: any) {
      toast.error(err.errors?.[0]?.message || 'Invalid grade data')
      return
    }

    set((state) => {
      const studentGrades = state.grades[lrn] || []
      const existingSubjectIndex = studentGrades.findIndex(g => g.subject === gradeData.subject)
      let newGrades = [...studentGrades]
      if (existingSubjectIndex >= 0) {
        newGrades[existingSubjectIndex] = gradeData
      } else {
        newGrades.push(gradeData)
      }
      return { grades: { ...state.grades, [lrn]: newGrades } }
    })
  },

  updateAttendance: (lrn, record) => set((state) => {
    const studentAtt = state.attendance[lrn] || []
    const existingIdx = studentAtt.findIndex(a => a.date === record.date)
    let newAtt = [...studentAtt]
    if (existingIdx >= 0) {
      newAtt[existingIdx] = record
    } else {
      newAtt.push(record)
    }
    return { attendance: { ...state.attendance, [lrn]: newAtt } }
  }),

  updateSubjectAttendance: (subject, lrn, record) => set((state) => {
    const subjectAtt = state.subjectAttendance[subject] || {}
    const studentAtt = subjectAtt[lrn] || []
    const existingIdx = studentAtt.findIndex(a => a.date === record.date)
    let newAtt = [...studentAtt]
    if (existingIdx >= 0) {
      newAtt[existingIdx] = record
    } else {
      newAtt.push(record)
    }
    return {
      subjectAttendance: {
        ...state.subjectAttendance,
        [subject]: { ...subjectAtt, [lrn]: newAtt }
      }
    }
  }),

  setSf3Record: (lrn, subjectKey, record) => set((state) => ({
    books: {
      ...state.books,
      [lrn]: { ...(state.books[lrn] || {}), [subjectKey]: record }
    }
  })),

  setSf3Subjects: (subjects) => set({ sf3Subjects: subjects }),

  clearSf3Books: () => set({ books: {} }),

  setSf2Summary: (month, summary) => set((state) => ({
    sf2Summaries: { ...state.sf2Summaries, [month]: summary }
  })),

  setWorkloadStudents: (slug, students) => set((state) => ({
    workloadStudents: { ...state.workloadStudents, [slug]: students }
  })),
})
