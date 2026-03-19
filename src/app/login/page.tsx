"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GraduationCap, Lock, Mail } from "lucide-react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulate authentication
    router.push('/')
  }
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50 bg-gradient-to-br from-slate-100 to-slate-200">
      
      {/* Decorative Blur Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-emerald-400/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="z-10 w-full max-w-md p-8 bg-white/70 backdrop-blur-2xl rounded-2xl border border-white shadow-2xl">
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <img src="/depaid-logo.png" alt="DepAid" className="h-16 w-16 rounded-2xl shadow-lg mb-4 object-cover" />
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">DepAid</h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">DepEd Teacher Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">DepEd Email</Label>
            <Input 
              id="email" 
              placeholder="juan.delacruz@deped.gov.ph" 
              type="email" 
              className="h-11 bg-white/50 focus:bg-white transition-colors"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <a href="#" className="text-xs font-semibold text-[#1ca560] hover:underline">Forgot password?</a>
            </div>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              className="h-11 bg-white/50 focus:bg-white transition-colors"
            />
          </div>
          <Button type="submit" className="w-full h-11 bg-[#1ca560] hover:bg-[#158045] text-white shadow-emerald-500/20 shadow-lg text-base font-semibold">
            Sign In to Portal
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-200/50 flex flex-col items-center gap-2">
          <p className="text-xs text-slate-400 font-medium">DepEd Authorized Gateway</p>
          <p className="text-[10px] text-slate-400/80">Secured via Supabase Infrastructure</p>
        </div>
      </div>

    </div>
  )
}
