import { createClient } from '@/lib/supabase/client'

/**
 * Fetch the student roster for a given section from Supabase.
 * Queries the `section_students` table scoped by school_id.
 * 
 * Returns null if the table doesn't exist or no data is found.
 * Returns Student[] if data exists (from another teacher/adviser who inputted them).
 */
export async function fetchSectionStudents(
  schoolId: string,
  sectionName: string,
  gradeLevel: string
): Promise<{ lrn: string; name: string; sex: 'M' | 'F'; status: string }[] | null> {
  try {
    const supabase = createClient()

    // First check if the section exists
    const { data: section, error: secError } = await supabase
      .from('section_students')
      .select('*')
      .eq('school_id', schoolId)
      .eq('section_name', sectionName.toUpperCase())
      .eq('grade_level', gradeLevel)

    if (secError || !section || section.length === 0) {
      return null
    }

    return section.map((row: any) => ({
      lrn: row.student_lrn || row.lrn || '',
      name: (row.student_name || row.name || '').toUpperCase(),
      sex: (row.sex || 'M').toUpperCase().startsWith('F') ? 'F' as const : 'M' as const,
      status: row.status || 'Enrolled'
    }))
  } catch {
    // Table might not exist yet — that's OK
    return null
  }
}

/**
 * Save a student roster to Supabase for cross-teacher access.
 * Other subject teachers in the same school can then fetch this roster.
 */
export async function saveSectionStudents(
  schoolId: string,
  sectionName: string,
  gradeLevel: string,
  students: { lrn: string; name: string; sex: string }[]
): Promise<boolean> {
  try {
    const supabase = createClient()

    // Upsert all students for this section
    const rows = students.map(s => ({
      school_id: schoolId,
      section_name: sectionName.toUpperCase(),
      grade_level: gradeLevel,
      student_lrn: s.lrn,
      student_name: s.name.toUpperCase(),
      sex: s.sex,
      status: 'Enrolled'
    }))

    const { error } = await supabase
      .from('section_students')
      .upsert(rows, { onConflict: 'school_id,section_name,student_lrn' })

    return !error
  } catch {
    return false
  }
}
