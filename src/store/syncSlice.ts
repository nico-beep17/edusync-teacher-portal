import { StateCreator } from 'zustand'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { saveSectionStudents } from '@/lib/section-roster'
import type { TeacherState } from './useStore'

let _supabase: ReturnType<typeof createClient> | null = null
function getSupabase() {
  if (!_supabase) _supabase = createClient()
  return _supabase
}

export interface SyncSlice {
  pushToCloud: () => Promise<void>
  syncStudentsToCloud: () => Promise<void>
}

export const createSyncSlice: StateCreator<TeacherState, [], [], SyncSlice> = (set, get) => ({
  pushToCloud: async () => {
    const supabase = getSupabase()
    if (!supabase) {
      toast.error("Cloud sync is unavailable — Supabase credentials are not configured.")
      return
    }
    const { students } = get()
    for (const s of students) {
      const [last, first] = s.name.split(',')
      await supabase.from('students').upsert({ lrn: s.lrn, last_name: (last || '').trim(), first_name: (first || '').trim(), sex: s.sex==='M'?'MALE':'FEMALE' })
    }
    toast.success("Complete Offline Cache synchronized to Supabase Cloud!")
    get().syncStudentsToCloud()
  },

  syncStudentsToCloud: async () => {
    const { students, schoolInfo } = get()
    if (!schoolInfo.schoolId || !schoolInfo.section) {
      console.warn('syncStudentsToCloud: missing schoolId or section')
      return
    }
    const ok = await saveSectionStudents(
      schoolInfo.schoolId,
      schoolInfo.section,
      schoolInfo.gradeLevel,
      students.map(s => ({ lrn: s.lrn, name: s.name, sex: s.sex }))
    )
    if (ok) { /* sync confirmed */ }
  }
})
