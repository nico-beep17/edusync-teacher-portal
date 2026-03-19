"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * Enrolls a new student based on Form 138 data
 */
export async function enrollStudent(formData: FormData) {
  const supabase = await createClient()

  const lrn = formData.get('lrn') as string
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const sex = formData.get('sex') as string
  const sectionId = formData.get('sectionId') as string || 'default-section-id' // typically passed from UI

  // 1. Insert or Update the Student in the masterlist
  const { error: studentError } = await supabase
    .from('students')
    .upsert({
      lrn,
      first_name: firstName,
      last_name: lastName,
      sex
    })

  if (studentError) {
    console.error("Error inserting student:", studentError)
    return { error: studentError.message }
  }

  // 2. Insert into Enrollments table linking student to an active section
  const { error: enrollError } = await supabase
    .from('enrollments')
    .insert({
      student_lrn: lrn,
      section_id: sectionId,
      status: 'ENROLLED'
    })

  if (enrollError) {
    console.error("Error enrolling student:", enrollError)
    return { error: enrollError.message }
  }

  // Refresh caching for the adviser dashboard
  revalidatePath('/')
  return { success: true }
}

/**
 * Saves daily attendance marks (SF2)
 */
export async function saveAttendance(date: string, records: { enrollmentId: string, status: string }[]) {
  const supabase = await createClient()
  
  // Format the records for bulk insert
  const updates = records.map(r => ({
    enrollment_id: r.enrollmentId,
    date: date,
    status: r.status // 'PRESENT', 'ABSENT', or 'LATE'
  }))

  const { error } = await supabase
    .from('attendance')
    .upsert(updates)

  if (error) {
    console.error("Error saving attendance:", error)
    return { error: error.message }
  }

  revalidatePath('/attendance')
  return { success: true }
}

/**
 * Saves E-Class Record Grades for a specific subject
 */
export async function saveECRGrades(sectionSubjectId: string, quarter: number, scores: any[]) {
   const supabase = await createClient()

   const updates = scores.map(score => ({
       enrollment_id: score.enrollmentId,
       section_subject_id: sectionSubjectId,
       quarter: quarter,
       ww_total: score.ww_total,
       pt_total: score.pt_total,
       qa_total: score.qa_total,
       initial_grade: score.initial_grade,
       quarterly_grade: score.quarterly_grade
   }))

   const { error } = await supabase
       .from('grades')
       .upsert(updates)

   if (error) {
       console.error("Error saving grades:", error)
       return { error: error.message }
   }

   revalidatePath(`/ecr`)
   return { success: true }
}
