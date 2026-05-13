import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createStudentSlice, StudentSlice } from './studentSlice'
import { createWorkloadSlice, WorkloadSlice } from './workloadSlice'
import { createSchoolSlice, SchoolSlice, decryptPin, encryptPin } from './schoolSlice'
import { createSyncSlice, SyncSlice } from './syncSlice'

export interface TeacherState extends StudentSlice, WorkloadSlice, SchoolSlice, SyncSlice {}

export const useTeacherStore = create<TeacherState>()(
  persist(
    (...a) => ({
      ...createStudentSlice(...a),
      ...createWorkloadSlice(...a),
      ...createSchoolSlice(...a),
      ...createSyncSlice(...a),
    }),
    {
      name: 'depaid-teacher-storage',
      partialize: (state) => {
        const { teacherPinPlain: _, ...rest } = state as TeacherState & { teacherPinPlain: string }
        return rest
      },
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('Store rehydration error:', error)
            return
          }
          if (state?.teacherPin && (state.teacherPin as string).startsWith('ENC:')) {
            decryptPin(state.teacherPin as string).then(plain => {
              useTeacherStore.setState({ teacherPinPlain: plain })
            }).catch(err => {
              console.error('Failed to decrypt stored PIN:', err)
            })
          } else if (state?.teacherPin && !(state.teacherPin as string).startsWith('ENC:')) {
            // Legacy plaintext PIN — migrate to encrypted
            const legacyPin = state.teacherPin as string
            useTeacherStore.setState({ teacherPinPlain: legacyPin })
            encryptPin(legacyPin).then(encrypted => {
              useTeacherStore.setState({ teacherPin: encrypted })
            }).catch(() => {})
          }
        }
      },
    }
  )
)

export type { Student, GradeEntry, AttendanceEntry, BookEntry, SF3Record, SF3Books } from './studentSlice'
export type { WorkloadEntry } from './workloadSlice'
