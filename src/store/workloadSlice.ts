import { StateCreator } from 'zustand'
import { toast } from 'sonner'
import { workloadEntrySchema } from '@/lib/validation'

export type WorkloadEntry = {
  id: string
  subject: string
  section: string
  students: number
  schedule: string
  scheduleDays?: string[]
  startTime?: string
  endTime?: string
  slug: string
  gradient: string
}

export interface WorkloadSlice {
  workload: WorkloadEntry[]
  addWorkload: (entry: WorkloadEntry) => void
  removeWorkload: (id: string) => void
}

export const createWorkloadSlice: StateCreator<WorkloadSlice> = (set) => ({
  workload: [],
  addWorkload: (entry) => {
    try {
      workloadEntrySchema.parse(entry)
    } catch (err: any) {
      toast.error(err.errors?.[0]?.message || 'Invalid workload data')
      return
    }
    set((state) => ({ workload: [...state.workload, entry] }))
  },
  removeWorkload: (id) => set((state) => ({
    workload: state.workload.filter(w => w.id !== id)
  })),
})
