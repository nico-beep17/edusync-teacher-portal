import { StateCreator } from 'zustand'

// ─── PIN Encryption Helpers (AES-GCM via Web Crypto API) ──────────────────────

const PIN_SALT = new Uint8Array([217, 48, 91, 164, 3, 77, 142, 11, 200, 65, 29, 77, 31, 222, 108, 19])

async function deriveKey(pepper: string): Promise<CryptoKey> {
  const enc = new TextEncoder().encode(pepper)
  const baseKey = await crypto.subtle.importKey('raw', enc, 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: PIN_SALT, iterations: 100_000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

function getPepper(): string {
  if (typeof window === 'undefined') return 'teacher-pin-vault'
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'depaid-teacher'
  let h = 0
  for (let i = 0; i < url.length; i++) {
    h = ((h << 5) - h + url.charCodeAt(i)) | 0
  }
  return 'pepper-' + Math.abs(h).toString(36).padStart(8, '0') + '-depaid'
}

export async function encryptPin(pin: string, pepper?: string): Promise<string> {
  const p = pepper || getPepper()
  const key = await deriveKey(p)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(pin)
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  const combined = new Uint8Array(iv.length + ciphertext.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), iv.length)
  return 'ENC:' + btoa(String.fromCharCode(...combined))
}

export async function decryptPin(encrypted: string, pepper?: string): Promise<string> {
  if (!encrypted.startsWith('ENC:')) return encrypted
  const p = pepper || getPepper()
  const key = await deriveKey(p)
  const raw = Uint8Array.from(atob(encrypted.slice(4)), c => c.charCodeAt(0))
  const iv = raw.slice(0, 12)
  const ciphertext = raw.slice(12)
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(decrypted)
}

export interface SchoolSlice {
  schoolInfo: {
    schoolName: string
    schoolId: string
    district: string
    division: string
    region: string
    gradeLevel: string
    section: string
    schoolYear: string
    quarter: string
    adviserName: string
    schoolHeadName: string
  }
  teacherPin: string
  teacherPinPlain: string
  devMode: boolean
  user: any | null
  setSchoolInfo: (info: any) => void
  setTeacherPin: (pin: string) => void
  setDevMode: (enabled: boolean) => void
  setUser: (user: any) => void
}

export const createSchoolSlice: StateCreator<SchoolSlice> = (set) => ({
  schoolInfo: {
    schoolName: "QUEZON NATIONAL HIGH SCHOOL",
    schoolId: "316405",
    district: "Panabo City",
    division: "Panabo City",
    region: "XI",
    gradeLevel: "8",
    section: "ARIES",
    schoolYear: "2025-2026",
    quarter: "1",
    adviserName: "Teacher's Name",
    schoolHeadName: "MYRNA EVANGELISTA PURIFICACION"
  },
  teacherPin: '',
  teacherPinPlain: '',
  devMode: false,
  user: null,
  setSchoolInfo: (info) => set({ schoolInfo: info }),
  setTeacherPin: (pin) => {
    set({ teacherPinPlain: pin })
    encryptPin(pin).then(encrypted => {
      set({ teacherPin: encrypted })
    })
  },
  setDevMode: (d) => set({ devMode: d }),
  setUser: (u) => set({ user: u }),
})
