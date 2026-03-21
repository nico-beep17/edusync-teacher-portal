"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useTeacherStore } from "@/store/useStore"
import { Loader2, Eye, EyeOff, Code } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const setUser = useTeacherStore((s) => s.setUser)

  const handleDevLogin = () => {
    setUser({ email: 'dev@depaid.test', user_metadata: { full_name: 'Developer Mode', avatar_url: '' }, isDev: true })
    router.push('/dashboard')
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError("")
    try {
      const supabase = createClient()
      if (!supabase) { router.push('/'); return }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/` }
      })
      if (error) setError(error.message)
    } catch {
      setError("Google sign-in failed. Please try again.")
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const supabase = createClient()
      if (!supabase) { router.push('/'); return }
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      router.push('/')
    } catch {
      // Dev fallback
      router.push('/')
    }
  }

  return (
    <div
      className="flex h-screen w-full items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #EFF2F6 0%, #F4F7FA 50%, #EAF0F8 100%)",
      }}
    >
      {/* Subtle grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "linear-gradient(rgba(28,165,96,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(28,165,96,0.04) 1px, transparent 1px)",
        backgroundSize: "48px 48px"
      }} />

      <div className="relative z-10 w-full max-w-sm px-4">
        {/* Card */}
        <div className="w-full rounded-2xl overflow-hidden" style={{
          background: "linear-gradient(160deg, #FFFFFF 0%, #FAFCFF 60%, #F5F8FD 100%)",
          border: "1px solid #DDE4EE",
          borderTop: "1px solid #EEF4FF",
          boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 12px 40px rgba(0,0,0,0.11), 0 4px 12px rgba(0,0,0,0.07)"
        }}>
          {/* Green LED top strip */}
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #003876 0%, #28CC70 40%, #003876 100%)", boxShadow: "0 2px 8px rgba(28,165,96,0.4)" }} />

          <div className="px-8 py-8">
            {/* Logo */}
            <div className="flex flex-col items-center text-center mb-7">
              <div className="h-16 w-16 rounded-2xl overflow-hidden mb-4" style={{ boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 6px 18px rgba(0,0,0,0.14)", border: "1px solid #D4DCE6" }}>
                <img src="/depaid-logo.png" alt="DepAid" className="h-full w-full object-contain scale-[1.3] drop-shadow-sm transition-transform duration-300" />
              </div>
              <h1 className="text-3xl font-black tracking-tight" style={{ color: "#003876" }}>Dep<span style={{ color: "#B5081C" }}>Aid</span></h1>
              <div className="mt-2 flex items-center gap-1.5">
                <div className="skeu-led-green" style={{ width: 6, height: 6 }} />
                <span className="skeu-label" style={{ fontSize: "0.6rem", letterSpacing: "0.18em" }}>SUPPORT • FOCUS • EMPOWER</span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium skeu-alert-red animate-in fade-in duration-200">
                <span>⚠️</span> <span style={{ color: "#C03030" }}>{error}</span>
              </div>
            )}

            {/* Dev Login */}
            <button
              onClick={handleDevLogin}
              className="w-full h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 mb-3 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 shadow-sm transition-all"
            >
              <Code size={16} />
              Developer Bypass for Testing
            </button>

            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="skeu-btn-ghost w-full h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-3 mb-4"
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
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: "#E4E9EF" }} />
              <span className="skeu-label" style={{ fontSize: "0.6rem" }}>or sign in with email</span>
              <div className="flex-1 h-px" style={{ background: "#E4E9EF" }} />
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="skeu-label block">Email Address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="juan.delacruz@deped.gov.ph"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                  className="skeu-input w-full h-11 px-3 text-sm rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="skeu-label">Password</label>
                  <a href="#" className="text-[10px] font-bold" style={{ color: "#003876" }}>Forgot password?</a>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading}
                    className="skeu-input w-full h-11 px-3 pr-10 text-sm rounded-lg"
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-3.5" style={{ color: "#8898AC" }}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="skeu-btn w-full h-11 rounded-xl text-sm flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing In...</> : 'Sign In to Portal'}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-5 pt-4 flex flex-col items-center gap-2" style={{ borderTop: "1px solid #E4E9EF" }}>
              <p className="text-xs" style={{ color: "#5A6A7E" }}>
                New to DepAid?{" "}
                <Link href="/register" className="font-bold" style={{ color: "#003876" }}>Create account</Link>
              </p>
              <p className="skeu-label" style={{ fontSize: "0.6rem" }}>Offline-First PWA • DepEd Compliant</p>
            </div>
          </div>

          <div className="h-0.5" style={{ background: "linear-gradient(90deg, transparent, #C8D4E0, transparent)" }} />
        </div>
      </div>
    </div>
  )
}
