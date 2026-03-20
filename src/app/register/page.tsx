"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2, User, School, ChevronDown, Eye, EyeOff } from "lucide-react"

const REGIONS = ["I","II","III","IV-A","IV-B","V","VI","VII","VIII","IX","X","XI","XII","XIII","CAR","BARMM","NCR"]
const ROLES = ["Class Adviser","Subject Teacher","Master Teacher","Department Head","Coordinator"]
const GRADE_LEVELS = ["Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"]

interface FormData {
  fullName: string; email: string; password: string; confirmPassword: string; role: string
  schoolName: string; schoolId: string; district: string; division: string; region: string; gradeLevel: string; section: string
}

const initialForm: FormData = {
  fullName: "", email: "", password: "", confirmPassword: "", role: "Class Adviser",
  schoolName: "", schoolId: "", district: "", division: "", region: "XI", gradeLevel: "Grade 8", section: ""
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const up = (f: keyof FormData, v: string) => setForm(p => ({ ...p, [f]: v }))

  const validateStep1 = () => {
    if (!form.fullName.trim()) return "Full name is required."
    if (!form.email.includes("@")) return "Valid email is required."
    if (form.password.length < 8) return "Password must be at least 8 characters."
    if (form.password !== form.confirmPassword) return "Passwords do not match."
    return ""
  }
  const validateStep2 = () => {
    if (!form.schoolName.trim()) return "School name is required."
    if (!form.division.trim()) return "Division is required."
    if (!form.section.trim()) return "Section is required."
    return ""
  }

  const handleNext = () => {
    const e = validateStep1(); if (e) { setError(e); return }
    setError(""); setStep(2)
  }

  const handleRegister = async () => {
    const e = validateStep2(); if (e) { setError(e); return }
    setError(""); setLoading(true)
    try {
      const supabase = createClient()
      if (!supabase) { router.push("/paywall"); return }
      const { error: signUpError } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { data: { full_name: form.fullName, role: form.role, school_name: form.schoolName, school_id: form.schoolId, district: form.district, division: form.division, region: form.region, grade_level: form.gradeLevel, section: form.section } }
      })
      if (signUpError) { setError(signUpError.message); setLoading(false); return }
      localStorage.setItem('depaid-school-info', JSON.stringify({
        schoolName: form.schoolName, schoolId: form.schoolId, district: form.district, division: form.division,
        region: form.region, gradeLevel: form.gradeLevel, section: form.section,
        adviserName: form.fullName.toUpperCase(), schoolYear: "2025-2026", quarter: "1"
      }))
      router.push("/paywall")
    } catch { setError("Something went wrong. Please try again."); setLoading(false) }
  }

  const inputClass = "skeu-input w-full h-11 px-3 text-sm rounded-lg"
  const selectClass = "skeu-select w-full h-11 px-3 text-sm rounded-lg pr-8"

  return (
    <div
      className="flex min-h-screen w-full items-center justify-center py-12 px-4"
      style={{ background: "linear-gradient(135deg, #EFF2F6 0%, #F4F7FA 50%, #EAF0F8 100%)" }}
    >
      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "linear-gradient(rgba(28,165,96,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(28,165,96,0.04) 1px, transparent 1px)",
        backgroundSize: "48px 48px"
      }} />

      <div className="relative z-10 w-full max-w-lg">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-xl overflow-hidden mb-3" style={{ boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 4px 14px rgba(0,0,0,0.12)", border: "1px solid #D4DCE6" }}>
            <img src="/depaid-logo.png" alt="DepAid" className="h-full w-full object-cover" />
          </div>
          <h1 className="text-xl font-black tracking-tight" style={{ color: "#111A24" }}>DepAid</h1>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="skeu-led-green" style={{ width: 5, height: 5 }} />
            <span className="skeu-label" style={{ fontSize: "0.6rem" }}>New Account Registration</span>
          </div>
        </div>

        {/* Panel */}
        <div className="w-full rounded-2xl overflow-hidden" style={{
          background: "linear-gradient(160deg, #FFFFFF 0%, #FAFCFF 60%, #F5F8FD 100%)",
          border: "1px solid #DDE4EE",
          borderTop: "1px solid #EEF4FF",
          boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 12px 36px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.06)"
        }}>

          {/* Top LED strip */}
          <div className="h-1" style={{ background: "linear-gradient(90deg, #1ca560 0%, #28CC70 40%, #1ca560 100%)", boxShadow: "0 2px 8px rgba(28,165,96,0.4)" }} />

          {/* Progress Bar */}
          <div className="px-8 pt-5 pb-4" style={{ borderBottom: "1px solid #E4E9EF" }}>
            <div className="flex items-center gap-3">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black transition-all ${step >= 1 ? "skeu-btn" : ""}`}
                style={step < 1 ? { background: "#EEF2F8", border: "1px solid #C8D4E0", color: "#8898AC" } : {}}>
                {step > 1 ? <CheckCircle2 size={14} /> : "1"}
              </div>
              <span className="skeu-label text-[11px]" style={{ color: step === 1 ? "#1ca560" : "#B8C4D4" }}>Personal Info</span>
              <div className="flex-1 h-px" style={{ backgroundImage: "linear-gradient(90deg, #C8D4E0, #DDE4EE)" }} />
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black transition-all`}
                style={step >= 2 ? { background: "linear-gradient(180deg, #22B868, #179050)", border: "1px solid #148044", color: "#FFF", boxShadow: "0 2px 8px rgba(28,165,96,0.3)" } : { background: "#EEF2F8", border: "1px solid #C8D4E0", color: "#8898AC" }}>
                2
              </div>
              <span className="skeu-label text-[11px]" style={{ color: step === 2 ? "#1ca560" : "#B8C4D4" }}>School Info</span>
            </div>
          </div>

          <div className="px-8 py-6">
            {/* Error */}
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium skeu-alert-red animate-in fade-in slide-in-from-top-2 duration-300">
                <span>⚠️</span> <span style={{ color: "#C03030" }}>{error}</span>
              </div>
            )}

            {/* STEP 1 */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(180deg, #E8F7EE, #D8EEE4)", border: "1px solid #A8D8BA", boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset" }}>
                    <User size={14} style={{ color: "#1ca560" }} />
                  </div>
                  <p className="text-sm font-black" style={{ color: "#111A24" }}>Your Information</p>
                </div>

                <div className="space-y-1.5">
                  <label className="skeu-label block">Full Name <span style={{ color: "#C03030" }}>*</span></label>
                  <input placeholder="Juan Dela Cruz" value={form.fullName} onChange={e => up('fullName', e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="skeu-label block">DepEd Email <span style={{ color: "#C03030" }}>*</span></label>
                  <input type="email" placeholder="juan.delacruz@deped.gov.ph" value={form.email} onChange={e => up('email', e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="skeu-label block">Role / Position <span style={{ color: "#C03030" }}>*</span></label>
                  <div className="relative">
                    <select value={form.role} onChange={e => up('role', e.target.value)} className={selectClass}>
                      {ROLES.map(r => <option key={r}>{r}</option>)}
                    </select>
                    <ChevronDown size={13} className="pointer-events-none absolute right-3 top-3.5" style={{ color: "#8898AC" }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Password *", id: "pw", show: showPass, toggle: () => setShowPass(p => !p), val: form.password, field: "password", ph: "Min. 8 chars" },
                    { label: "Confirm Password *", id: "cf", show: showConfirm, toggle: () => setShowConfirm(p => !p), val: form.confirmPassword, field: "confirmPassword", ph: "Repeat password" }
                  ].map(({ label, id, show, toggle, val, field, ph }) => (
                    <div key={id} className="space-y-1.5">
                      <label className="skeu-label block">{label}</label>
                      <div className="relative">
                        <input type={show ? "text" : "password"} placeholder={ph} value={val} onChange={e => up(field as keyof FormData, e.target.value)} className={inputClass + " pr-10"} />
                        <button type="button" onClick={toggle} className="absolute right-3 top-3.5" style={{ color: "#8898AC" }}>
                          {show ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button onClick={handleNext} className="skeu-btn w-full h-11 rounded-xl text-sm flex items-center justify-center gap-2 mt-2">
                  Next: School Information <ArrowRight size={15} />
                </button>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(180deg, #E8F7EE, #D8EEE4)", border: "1px solid #A8D8BA", boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset" }}>
                    <School size={14} style={{ color: "#1ca560" }} />
                  </div>
                  <p className="text-sm font-black" style={{ color: "#111A24" }}>School Information</p>
                </div>

                <div className="space-y-1.5">
                  <label className="skeu-label block">School Name <span style={{ color: "#C03030" }}>*</span></label>
                  <input placeholder="e.g. Quezon National High School" value={form.schoolName} onChange={e => up('schoolName', e.target.value)} className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="skeu-label block">School ID</label>
                    <input placeholder="e.g. 316405" value={form.schoolId} onChange={e => up('schoolId', e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="skeu-label block">District</label>
                    <input placeholder="e.g. Panabo City" value={form.district} onChange={e => up('district', e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="skeu-label block">Division <span style={{ color: "#C03030" }}>*</span></label>
                    <input placeholder="e.g. Panabo City" value={form.division} onChange={e => up('division', e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="skeu-label block">Region <span style={{ color: "#C03030" }}>*</span></label>
                    <div className="relative">
                      <select value={form.region} onChange={e => up('region', e.target.value)} className={selectClass}>
                        {REGIONS.map(r => <option key={r} value={r}>Region {r}</option>)}
                      </select>
                      <ChevronDown size={13} className="pointer-events-none absolute right-3 top-3.5" style={{ color: "#8898AC" }} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="skeu-label block">Grade Level <span style={{ color: "#C03030" }}>*</span></label>
                    <div className="relative">
                      <select value={form.gradeLevel} onChange={e => up('gradeLevel', e.target.value)} className={selectClass}>
                        {GRADE_LEVELS.map(g => <option key={g}>{g}</option>)}
                      </select>
                      <ChevronDown size={13} className="pointer-events-none absolute right-3 top-3.5" style={{ color: "#8898AC" }} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="skeu-label block">Section <span style={{ color: "#C03030" }}>*</span></label>
                    <input placeholder="e.g. ARIES" value={form.section} onChange={e => up('section', e.target.value.toUpperCase())} className={inputClass} />
                  </div>
                </div>

                <div className="flex gap-3 mt-2">
                  <button onClick={() => { setError(""); setStep(1) }} className="skeu-btn-ghost h-11 px-5 rounded-xl text-sm flex items-center gap-2">
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button onClick={handleRegister} disabled={loading} className="skeu-btn flex-1 h-11 rounded-xl text-sm flex items-center justify-center gap-2">
                    {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating Account...</> : <><CheckCircle2 size={15} /> Create My Account</>}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-4 text-center" style={{ borderTop: "1px solid #E4E9EF", background: "linear-gradient(180deg, #FAFCFF 0%, #F5F8FC 100%)" }}>
            <p className="text-xs" style={{ color: "#5A6A7E" }}>
              Already have an account?{" "}
              <Link href="/login" className="font-bold" style={{ color: "#1ca560" }}>Sign in here</Link>
            </p>
          </div>

          <div className="h-0.5" style={{ background: "linear-gradient(90deg, transparent, #C8D4E0, transparent)" }} />
        </div>

        <p className="text-center mt-4 skeu-label" style={{ fontSize: "0.6rem" }}>
          DepEd-Compliant • Offline-First PWA • Secure
        </p>
      </div>
    </div>
  )
}
