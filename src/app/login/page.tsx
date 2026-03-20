"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => router.push('/'), 900)
  }

  return (
    <div
      className="flex h-screen w-full items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #EFF2F6 0%, #F4F7FA 50%, #EAF0F8 100%)",
      }}
    >
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(28,165,96,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(28,165,96,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px"
        }}
      />

      <div className="relative z-10 w-full max-w-sm px-4">

        {/* Main Card — raised white precision panel */}
        <div
          className="w-full rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #FFFFFF 0%, #FAFCFF 60%, #F5F8FD 100%)",
            border: "1px solid #DDE4EE",
            borderTop: "1px solid #EEF4FF",
            boxShadow: `
              0 1px 0 rgba(255,255,255,1) inset,
              0 -1px 0 rgba(0,0,0,0.06) inset,
              0 12px 40px rgba(0,0,0,0.11),
              0 4px 12px rgba(0,0,0,0.07),
              2px 6px 16px rgba(0,0,0,0.04)
            `
          }}
        >
          {/* Top accent strip — green LED bar */}
          <div
            className="h-1 w-full"
            style={{
              background: "linear-gradient(90deg, #1ca560 0%, #28CC70 40%, #1ca560 100%)",
              boxShadow: "0 2px 8px rgba(28,165,96,0.4)"
            }}
          />

          <div className="px-8 py-8">
            {/* Logo & Brand */}
            <div className="flex flex-col items-center text-center mb-8">
              <div
                className="h-16 w-16 rounded-2xl overflow-hidden mb-4"
                style={{
                  boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 6px 18px rgba(0,0,0,0.14), 0 2px 5px rgba(0,0,0,0.08)",
                  border: "1px solid #D4DCE6"
                }}
              >
                <img src="/depaid-logo.png" alt="DepAid" className="h-full w-full object-cover" />
              </div>
              <h1 className="text-3xl font-black tracking-tight" style={{ color: "#111A24" }}>DepAid</h1>
              <div className="mt-2 flex items-center gap-1.5">
                <div className="skeu-led-green" style={{ width: 6, height: 6 }} />
                <span className="skeu-label" style={{ fontSize: "0.6rem", letterSpacing: "0.18em" }}>Teacher Portal System</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
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
                  <a href="#" className="text-[10px] font-bold" style={{ color: "#1ca560" }}>
                    Forgot password?
                  </a>
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
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-3.5"
                    style={{ color: "#8898AC" }}
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="skeu-btn w-full h-12 rounded-xl text-sm tracking-wide mt-1 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Authenticating...</>
                ) : 'Sign In to Portal'}
              </button>
            </form>

            {/* Footer */}
            <div
              className="mt-6 pt-5 flex flex-col items-center gap-2"
              style={{ borderTop: "1px solid #E4E9EF" }}
            >
              <p className="text-xs" style={{ color: "#5A6A7E" }}>
                New to DepAid?{" "}
                <Link href="/register" className="font-bold" style={{ color: "#1ca560" }}>
                  Create account
                </Link>
              </p>
              <p className="skeu-label" style={{ fontSize: "0.6rem", letterSpacing: "0.14em" }}>
                Offline-First PWA • DepEd Compliant
              </p>
            </div>
          </div>

          {/* Bottom accent — brass/gold thin strip */}
          <div
            className="h-0.5 w-full"
            style={{ background: "linear-gradient(90deg, transparent 0%, #C8D4E0 50%, transparent 100%)" }}
          />
        </div>
      </div>
    </div>
  )
}
