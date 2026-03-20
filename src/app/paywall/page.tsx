"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Zap, Crown, Lock, ArrowRight, FileText, BarChart2, Brain, Bell, Download, ShieldCheck, Wifi, Sparkles } from "lucide-react"

const FREE_FEATURES = [
  { icon: FileText, text: "Masterlist (SF1) — up to 60 students" },
  { icon: BarChart2, text: "SF2 Daily Attendance — 1 quarter" },
  { icon: BarChart2, text: "Basic Grade Summary" },
  { icon: Wifi, text: "Offline-First PWA (local storage)" },
]

const PRO_FEATURES = [
  { icon: FileText, text: "Unlimited SF1, SF2, SF5 forms" },
  { icon: Brain, text: "AI Class Assistant (GPT-4o powered)" },
  { icon: Download, text: "DepEd-format Excel export (all forms)" },
  { icon: BarChart2, text: "Full Composite Grade system (ECR)" },
  { icon: Bell, text: "SARDO smart intervention alerts" },
  { icon: Sparkles, text: "AI OCR photo import (Form 138)" },
  { icon: ShieldCheck, text: "Cloud sync & backup (Supabase)" },
  { icon: Crown, text: "SF5 Promotion & Retention analytics" },
]

const PLANS = [
  { id: "monthly", label: "Monthly", price: "₱149", period: "/month", tag: null, desc: "Flexible, cancel anytime" },
  { id: "annual", label: "Annual", price: "₱999", period: "/year", tag: "BEST VALUE", desc: "Save ₱789 vs monthly" },
  { id: "lifetime", label: "Lifetime", price: "₱2,499", period: "one-time", tag: "NO RENEWAL", desc: "Pay once, use forever" },
]

export default function PaywallPage() {
  const router = useRouter()
  const [selected, setSelected] = useState("annual")
  const [loading, setLoading] = useState(false)

  const handleUpgrade = () => {
    setLoading(true)
    setTimeout(() => {
      alert("Payment gateway coming soon! Enjoy full access. 🎉")
      router.push("/")
    }, 1200)
  }

  return (
    <div
      className="min-h-screen w-full relative overflow-x-hidden"
      style={{ background: "linear-gradient(135deg, #EFF2F6 0%, #F4F7FA 50%, #EAF0F8 100%)" }}
    >
      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "linear-gradient(rgba(28,165,96,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(28,165,96,0.04) 1px, transparent 1px)",
        backgroundSize: "48px 48px"
      }} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-10">

        {/* Nav bar */}
        <div className="flex items-center gap-3 mb-10">
          <div className="h-9 w-9 rounded-xl overflow-hidden" style={{ boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 3px 8px rgba(0,0,0,0.1)", border: "1px solid #D4DCE6" }}>
            <img src="/depaid-logo.png" alt="DepAid" className="h-full w-full object-cover" />
          </div>
          <span className="font-black text-lg" style={{ color: "#111A24" }}>DepAid</span>
          <div className="flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-md skeu-badge-green text-[10px] font-bold uppercase tracking-widest">
            <div className="skeu-led-green" style={{ width: 5, height: 5 }} />
            Account Ready
          </div>
        </div>

        {/* Hero */}
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider mb-4"
            style={{
              background: "linear-gradient(180deg, #E8F7EE 0%, #D8EDE4 100%)",
              border: "1px solid #A8D8BA",
              color: "#1ca560",
              boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 2px 5px rgba(28,165,96,0.15)"
            }}
          >
            <Zap size={11} className="fill-current" /> Account Created Successfully!
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight mb-4" style={{ color: "#111A24" }}>
            Unlock the Full Power of{" "}
            <span style={{ color: "#1ca560" }}>DepAid Pro</span>
          </h1>
          <p className="text-base" style={{ color: "#5A6A7E" }}>
            Upgrade to Pro to access unlimited forms, AI-powered tools, cloud sync, and automated DepEd report generation.
          </p>
        </div>

        {/* Free vs Pro Cards */}
        <div className="grid md:grid-cols-2 gap-5 mb-8">
          {/* Free */}
          <div className="skeu-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(180deg, #F4F7FC, #EEF2F8)", border: "1px solid #C8D4E0", boxShadow: "0 1px 0 rgba(255,255,255,1) inset" }}>
                <span className="text-base">🆓</span>
              </div>
              <div>
                <p className="font-black text-sm" style={{ color: "#3A4A5E" }}>Free Plan</p>
                <p className="skeu-label">Basic features</p>
              </div>
              <span className="ml-auto text-2xl font-black" style={{ color: "#8898AC" }}>₱0</span>
            </div>
            <div className="skeu-divider mb-4" />
            <ul className="space-y-2.5">
              {FREE_FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm" style={{ color: "#3A4A5E" }}>
                  <div className="h-5 w-5 rounded flex items-center justify-center shrink-0" style={{ background: "#EEF2F8", border: "1px solid #C8D4E0" }}>
                    <Icon size={11} style={{ color: "#8898AC" }} />
                  </div>
                  {text}
                </li>
              ))}
              {["AI Assistant","Excel Export","Cloud Sync"].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm" style={{ color: "#B8C4D4" }}>
                  <div className="h-5 w-5 rounded flex items-center justify-center shrink-0" style={{ background: "#FFF4F4", border: "1px solid #E8CCCC" }}>
                    <Lock size={10} style={{ color: "#D08080" }} />
                  </div>
                  {item} — locked
                </li>
              ))}
            </ul>
          </div>

          {/* Pro */}
          <div
            className="rounded-xl p-6 relative overflow-hidden"
            style={{
              background: "linear-gradient(160deg, #FFFFFF 0%, #F2FBF6 50%, #E8F7EE 100%)",
              border: "2px solid #1ca560",
              boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 8px 28px rgba(28,165,96,0.18), 0 4px 10px rgba(0,0,0,0.07)"
            }}
          >
            <div className="absolute top-3 right-3">
              <div className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded skeu-badge-green">
                Recommended
              </div>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(180deg, #22B868, #179050)", border: "1px solid #148044", boxShadow: "0 1px 0 rgba(255,255,255,0.2) inset, 0 3px 8px rgba(28,165,96,0.35)" }}
              >
                <Crown size={14} style={{ color: "#FFFFFF" }} />
              </div>
              <div>
                <p className="font-black text-sm" style={{ color: "#111A24" }}>Pro Plan</p>
                <p className="skeu-label" style={{ color: "#1ca560" }}>Everything you need</p>
              </div>
            </div>
            <div className="skeu-divider mb-4" />
            <ul className="space-y-2.5">
              {PRO_FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm" style={{ color: "#1A2E20" }}>
                  <div className="h-5 w-5 rounded flex items-center justify-center shrink-0" style={{ background: "linear-gradient(180deg, #E8F7EE, #D4F0DC)", border: "1px solid #A8D8BA" }}>
                    <CheckCircle2 size={11} style={{ color: "#1ca560" }} />
                  </div>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Plan Picker */}
        <div className="mb-6">
          <p className="text-center font-black text-sm mb-3" style={{ color: "#111A24" }}>Choose Your Plan</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PLANS.map(plan => (
              <button
                key={plan.id}
                onClick={() => setSelected(plan.id)}
                className="relative rounded-xl p-4 text-left transition-all"
                style={selected === plan.id ? {
                  background: "linear-gradient(160deg, #FFFFFF 0%, #F2FBF6 100%)",
                  border: "2px solid #1ca560",
                  boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 6px 18px rgba(28,165,96,0.18)"
                } : {
                  background: "linear-gradient(160deg, #FAFCFF 0%, #F4F7FC 100%)",
                  border: "1px solid #D4DCE6",
                  boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 3px 8px rgba(0,0,0,0.06)"
                }}
              >
                {plan.tag && (
                  <span
                    className="absolute -top-2.5 left-4 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-full"
                    style={{ background: "#1ca560", color: "#FFF", boxShadow: "0 2px 6px rgba(28,165,96,0.4)" }}
                  >
                    {plan.tag}
                  </span>
                )}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-black text-sm" style={{ color: "#111A24" }}>{plan.label}</p>
                    <p className="skeu-label" style={{ fontSize: "0.6rem" }}>{plan.desc}</p>
                  </div>
                  <div
                    className="h-5 w-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0"
                    style={{ borderColor: selected === plan.id ? "#1ca560" : "#C8D4E0", background: selected === plan.id ? "#1ca560" : "#FFF" }}
                  >
                    {selected === plan.id && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black" style={{ color: selected === plan.id ? "#1ca560" : "#111A24" }}>{plan.price}</span>
                  <span className="skeu-label" style={{ fontSize: "0.6rem" }}>{plan.period}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3 max-w-md mx-auto">
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="skeu-btn w-full h-12 rounded-xl text-sm flex items-center justify-center gap-2"
          >
            {loading
              ? <><span className="animate-spin">⏳</span> Processing...</>
              : <><Zap size={15} className="fill-white" /> Upgrade to Pro — {PLANS.find(p => p.id === selected)?.price} <ArrowRight size={14} /></>
            }
          </button>
          <button onClick={() => router.push("/")} className="text-xs font-medium underline underline-offset-2 transition-colors" style={{ color: "#8898AC" }}>
            Continue with Free plan for now
          </button>
        </div>

        {/* Trust Signals */}
        <div className="mt-10 pt-8 max-w-sm mx-auto" style={{ borderTop: "1px solid #DDE4EE" }}>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[["2,400+","Teachers"], ["DepEd","Compliant"], ["100%","Offline"]].map(([val, label]) => (
              <div key={label}>
                <p className="text-xl font-black" style={{ color: "#111A24" }}>{val}</p>
                <p className="skeu-label mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          <p className="text-center skeu-label mt-4" style={{ fontSize: "0.6rem" }}>
            🔒 Secure payment · Philippine-hosted data · Cancel anytime
          </p>
        </div>
      </div>
    </div>
  )
}
