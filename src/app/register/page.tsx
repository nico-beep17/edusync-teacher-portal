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
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true)
    setError("")
    try {
      const supabase = createClient()
      if (!supabase) { router.push('/paywall'); return }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/paywall` }
      })
      if (error) setError(error.message)
    } catch {
      setError("Google sign-up failed. Please try again.")
    } finally {
      setGoogleLoading(false)
    }
  }

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
        backgroundImage: "linear-gradient(rgba(227,10,36,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(227,10,36,0.04) 1px, transparent 1px)",
        backgroundSize: "48px 48px"
      }} />

      <div className="relative z-10 w-full max-w-lg">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-xl overflow-hidden mb-3" style={{ boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 4px 14px rgba(0,0,0,0.12)", border: "1px solid #D4DCE6" }}>
            <img src="/depaid-logo.png" alt="DepAid" className="h-full w-full object-contain scale-[1.3] drop-shadow-sm transition-transform duration-300" />
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
          <div className="h-1" style={{ background: "linear-gradient(90deg, #003876 0%, #28CC70 40%, #003876 100%)", boxShadow: "0 2px 8px rgba(227,10,36,0.4)" }} />

          {/* Progress Bar */}
          <div className="px-8 pt-5 pb-4" style={{ borderBottom: "1px solid #E4E9EF" }}>
            <div className="flex items-center gap-3">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black transition-all ${step >= 1 ? "skeu-btn" : ""}`}
                style={step < 1 ? { background: "#EEF2F8", border: "1px solid #C8D4E0", color: "#8898AC" } : {}}>
                {step > 1 ? <CheckCircle2 size={14} /> : "1"}
              </div>
              <span className="skeu-label text-[11px]" style={{ color: step === 1 ? "#003876" : "#B8C4D4" }}>Personal Info</span>
              <div className="flex-1 h-px" style={{ backgroundImage: "linear-gradient(90deg, #C8D4E0, #DDE4EE)" }} />
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black transition-all`}
                style={step >= 2 ? { background: "linear-gradient(180deg, #E30A24, #B5081C)", border: "1px solid #8A0615", color: "#FFF", boxShadow: "0 2px 8px rgba(227,10,36,0.3)" } : { background: "#EEF2F8", border: "1px solid #C8D4E0", color: "#8898AC" }}>
                2
              </div>
              <span className="skeu-label text-[11px]" style={{ color: step === 2 ? "#003876" : "#B8C4D4" }}>School Info</span>
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
                    <User size={14} style={{ color: "#003876" }} />
                  </div>
                  <p className="text-sm font-black" style={{ color: "#111A24" }}>Your Information</p>
                </div>

                <div className="space-y-1.5">
                  <label className="skeu-label block">Full Name <span style={{ color: "#C03030" }}>*</span></label>
                  <input placeholder="Juan Dela Cruz" value={form.fullName} onChange={e => up('fullName', e.target.value)} className={inputClass} />
                </div>

                {/* Google Sign-Up */}
                <button
                  type="button"
                  onClick={handleGoogleSignUp}
                  disabled={googleLoading}
                  className="skeu-btn-ghost w-full h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-3"
                >
                  {googleLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  )}
                  Continue with Google instead
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ background: "#E4E9EF" }} />
                  <span className="skeu-label" style={{ fontSize: "0.6rem" }}>or fill in manually</span>
                  <div className="flex-1 h-px" style={{ background: "#E4E9EF" }} />
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
                    <School size={14} style={{ color: "#003876" }} />
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
              <Link href="/login" className="font-bold" style={{ color: "#003876" }}>Sign in here</Link>
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
