import { z } from 'zod'

export const studentSchema = z.object({
  lrn: z.string().regex(/^\d{12}$/, 'LRN must be exactly 12 digits'),
  name: z.string().min(1, 'Name is required'),
  sex: z.enum(['M', 'F']),
  status: z.string().optional(),
})

export const gradeEntrySchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  ww1: z.number().min(0).max(100),
  ww2: z.number().min(0).max(100),
  pt1: z.number().min(0).max(100),
  pt2: z.number().min(0).max(100),
  qa: z.number().min(0).max(100),
  quarterGrade: z.number().min(0).max(100),
})

export const attendanceEntrySchema = z.object({
  date: z.string().min(1, 'Date is required'),
  status: z.enum(['P', 'A', 'L']),
})

export const workloadEntrySchema = z.object({
  id: z.string(),
  subject: z.string().min(1),
  section: z.string().min(1),
  students: z.number(),
  schedule: z.string(),
  scheduleDays: z.array(z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  slug: z.string(),
  gradient: z.string(),
})

export const schoolInfoSchema = z.object({
  schoolName: z.string().min(1),
  schoolId: z.string().min(1),
  district: z.string().min(1),
  division: z.string().min(1),
  region: z.string().min(1),
  gradeLevel: z.string().min(1),
  section: z.string().min(1),
  schoolYear: z.string().min(1),
  quarter: z.string().min(1),
  adviserName: z.string().min(1),
  schoolHeadName: z.string().min(1),
})

export type StudentInput = z.infer<typeof studentSchema>
export type GradeEntryInput = z.infer<typeof gradeEntrySchema>
export type AttendanceEntryInput = z.infer<typeof attendanceEntrySchema>
export type WorkloadEntryInput = z.infer<typeof workloadEntrySchema>
export type SchoolInfoInput = z.infer<typeof schoolInfoSchema>
