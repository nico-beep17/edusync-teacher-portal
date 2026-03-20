"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle2, Zap, Crown, Lock, ArrowRight,
  FileText, BarChart2, Brain, Bell, Download,
  ShieldCheck, Wifi, Sparkles, Gift, Tag, X, Users
} from "lucide-react"

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

// Referral codes — in production this would be validated server-side
const VALID_REFERRAL_PATTERN = /^[A-Z0-9]{6,10}$/i

// Pricing
const PRICING = {
  monthly:  { regular: 299, referral: 199 },
  annual:   { regular: 2499, referral: 1999 },
}

const REFERRAL_REWARDS = [
  { referrals: 1,  reward: "₱100 off for 1 month of your subscription" },
  { referrals: 5,  reward: "₱100 off for 5 months of your subscription" },
  { referrals: 10, reward: "₱100 off for 10 months of your subscription" },
]

export default function PaywallPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<"monthly" | "annual">("annual")
  const [loading, setLoading] = useState(false)
  const [referralCode, setReferralCode] = useState("")
  const [referralApplied, setReferralApplied] = useState(false)
  const [referralError, setReferralError] = useState("")
  const [showReferralRewards, setShowReferralRewards] = useState(false)

  const isReferralValid = VALID_REFERRAL_PATTERN.test(referralCode)
  const price = referralApplied
    ? PRICING[selected].referral
    : PRICING[selected].regular
  const savings = referralApplied
    ? PRICING[selected].regular - PRICING[selected].referral
    : 0

  const annualActivePrice = referralApplied ? PRICING.annual.referral : PRICING.annual.regular
  const annualMonthlyCost = Math.round(annualActivePrice / 12)
  const annualSavingsVsMonthly = referralApplied
    ? (PRICING.monthly.referral * 12) - PRICING.annual.referral
    : (PRICING.monthly.regular * 12) - PRICING.annual.regular

  const handleApplyReferral = () => {
    if (!referralCode.trim()) { setReferralError("Please enter a referral code."); return }
    if (!isReferralValid) { setReferralError("Invalid code format. Codes are 6–10 alphanumeric characters."); return }
    setReferralApplied(true)
    setReferralError("")
  }

  const handleRemoveReferral = () => {
    setReferralApplied(false)
    setReferralCode("")
    setReferralError("")
  }

  const handleUpgrade = () => {
    setLoading(true)
    setTimeout(() => {
      alert(`Payment gateway coming soon!\nPlan: Pro ${selected === "monthly" ? "Monthly" : "Annual"}\nPrice: ₱${price.toLocaleString()}${referralApplied ? ` (referral applied: -₱${savings})` : ''}\n\nEnjoy full access! 🎉`)
      router.push("/dashboard")
    }, 1000)
  }

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden"
      style={{ background: "linear-gradient(135deg, #EFF2F6 0%, #F4F7FA 50%, #EAF0F8 100%)" }}>

      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "linear-gradient(rgba(227,10,36,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(227,10,36,0.04) 1px, transparent 1px)",
        backgroundSize: "48px 48px"
      }} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-10">

        {/* Topbar */}
        <div className="flex items-center gap-3 mb-10">
          <div className="h-9 w-9 rounded-xl overflow-hidden" style={{ boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 3px 8px rgba(0,0,0,0.1)", border: "1px solid #D4DCE6" }}>
            <img src="/depaid-logo.svg" alt="DepAid" className="h-full w-full object-cover" />
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
              color: "#003876",
              boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 2px 5px rgba(28,165,96,0.12)"
            }}
          >
            <Zap size={11} className="fill-current" /> Account Created Successfully!
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight mb-4" style={{ color: "#111A24" }}>
            Unlock the Full Power of{" "}
            <span style={{ color: "#003876" }}>DepAid Pro</span>
          </h1>
          <p className="text-base" style={{ color: "#5A6A7E" }}>
            Upgrade to access unlimited forms, AI-powered tools, cloud sync, and automated DepEd reports.
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
                <p className="skeu-label">Limited features</p>
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
              {["AI Assistant", "Excel Export", "Cloud Sync"].map(item => (
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
          <div className="rounded-xl p-6 relative overflow-hidden" style={{
            background: "linear-gradient(160deg, #FFFFFF 0%, #F2FBF6 50%, #E8F7EE 100%)",
            border: "2px solid #003876",
            boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 8px 28px rgba(28,165,96,0.18), 0 4px 10px rgba(0,0,0,0.07)"
          }}>
            <div className="absolute top-3 right-3">
              <div className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded skeu-badge-green">
                Recommended
              </div>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(180deg, #E30A24, #B5081C)", border: "1px solid #8A0615", boxShadow: "0 1px 0 rgba(255,255,255,0.2) inset, 0 3px 8px rgba(227,10,36,0.35)" }}>
                <Crown size={14} style={{ color: "#FFFFFF" }} />
              </div>
              <div>
                <p className="font-black text-sm" style={{ color: "#111A24" }}>Pro Plan</p>
                <p className="skeu-label" style={{ color: "#003876" }}>Everything you need</p>
              </div>
            </div>
            <div className="skeu-divider mb-4" />
            <ul className="space-y-2.5">
              {PRO_FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm" style={{ color: "#1A2E20" }}>
                  <div className="h-5 w-5 rounded flex items-center justify-center shrink-0" style={{ background: "linear-gradient(180deg, #E8F7EE, #D4F0DC)", border: "1px solid #A8D8BA" }}>
                    <CheckCircle2 size={11} style={{ color: "#003876" }} />
                  </div>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Referral Code Input */}
        <div className="mb-6">
          {!referralApplied ? (
            <div className="rounded-xl p-4" style={{
              background: "linear-gradient(160deg, #FAFCFF 0%, #F4F7FC 100%)",
              border: "1px solid #D4DCE6",
              boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 3px 8px rgba(0,0,0,0.06)"
            }}>
              <div className="flex items-center gap-2 mb-3">
                <Tag size={14} style={{ color: "#5A6A7E" }} />
                <p className="text-sm font-bold" style={{ color: "#111A24" }}>Have a referral code?</p>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full ml-auto" style={{ background: "#E8F7EE", color: "#003876", border: "1px solid #A8D8BA" }}>
                  ₱100 off 1st month
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter code (e.g. DEPAID2025)"
                  value={referralCode}
                  onChange={e => { setReferralCode(e.target.value.toUpperCase()); setReferralError("") }}
                  className="skeu-input flex-1 h-10 px-3 text-sm rounded-lg font-mono uppercase tracking-widest"
                />
                <button
                  onClick={handleApplyReferral}
                  className="skeu-btn px-4 h-10 rounded-lg text-sm shrink-0"
                >
                  Apply
                </button>
              </div>
              {referralError && (
                <p className="text-xs mt-2 font-medium" style={{ color: "#C03030" }}>⚠️ {referralError}</p>
              )}
              <p className="text-xs mt-2" style={{ color: "#8898AC" }}>
                Got a code from a colleague? Applying it gives you a discounted rate.
              </p>
            </div>
          ) : (
            <div className="rounded-xl px-4 py-3 flex items-center gap-3 animate-in fade-in duration-300" style={{
              background: "linear-gradient(160deg, #FFFFFF 0%, #F2FBF6 100%)",
              border: "2px solid #003876",
              boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 3px 10px rgba(28,165,96,0.15)"
            }}>
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "linear-gradient(180deg, #E8F7EE, #D4F0DC)", border: "1px solid #A8D8BA" }}>
                <Gift size={15} style={{ color: "#003876" }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black" style={{ color: "#003876" }}>
                  Referral code <span className="font-mono bg-green-50 px-1.5 py-0.5 rounded">{referralCode}</span> applied!
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#5A8A6A" }}>
                  <strong>₱100 off your first month</strong> has been applied. From month 2 onwards, regular pricing applies.
                </p>
              </div>
              <button onClick={handleRemoveReferral} className="text-slate-400 hover:text-slate-600 shrink-0">
                <X size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Plan Picker — Monthly & Annual only */}
        <div className="mb-6">
          <p className="text-center font-black text-sm mb-3" style={{ color: "#111A24" }}>Choose Your Billing Cycle</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {/* Monthly */}
            {(["monthly", "annual"] as const).map(plan => {
              const isSelected = selected === plan
              const regularPrice = PRICING[plan].regular
              const activePrice = referralApplied ? PRICING[plan].referral : regularPrice

              return (
                <button
                  key={plan}
                  onClick={() => setSelected(plan)}
                  className="relative rounded-xl p-5 text-left transition-all"
                  style={isSelected ? {
                    background: "linear-gradient(160deg, #FFFFFF 0%, #F2FBF6 100%)",
                    border: "2px solid #003876",
                    boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 6px 18px rgba(28,165,96,0.18)"
                  } : {
                    background: "linear-gradient(160deg, #FAFCFF 0%, #F4F7FC 100%)",
                    border: "1px solid #D4DCE6",
                    boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 3px 8px rgba(0,0,0,0.06)"
                  }}
                >
                  {plan === "annual" && (
                    <span
                      className="absolute -top-2.5 left-4 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full"
                      style={{ background: "#003876", color: "#FFF", boxShadow: "0 2px 6px rgba(227,10,36,0.4)" }}
                    >
                      Best Value — Save ₱{annualSavingsVsMonthly.toLocaleString()}/yr
                    </span>
                  )}

                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-black text-base" style={{ color: "#111A24" }}>
                        {plan === "monthly" ? "Monthly" : "Annual"}
                      </p>
                      <p className="skeu-label mt-0.5" style={{ fontSize: "0.6rem" }}>
                        {plan === "monthly" ? "Billed every month" : "Billed once per year"}
                      </p>
                    </div>
                    <div className="h-5 w-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 transition-all"
                      style={{ borderColor: isSelected ? "#003876" : "#C8D4E0", background: isSelected ? "#003876" : "#FFF" }}>
                      {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-3xl font-black" style={{ color: isSelected ? "#003876" : "#111A24" }}>
                      ₱{activePrice.toLocaleString()}
                    </span>
                    <span className="skeu-label" style={{ fontSize: "0.65rem" }}>
                      /{plan === "monthly" ? "month" : "year"}
                    </span>
                    {referralApplied && (
                      <span className="text-sm line-through" style={{ color: "#B8C4D4" }}>
                        ₱{regularPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {plan === "annual" && (
                    <p className="text-xs mt-1.5 font-semibold" style={{ color: "#003876" }}>
                      ≈ ₱{annualMonthlyCost}/month — pay less, stress less
                    </p>
                  )}
                  {referralApplied && (
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: "#E8F7EE", color: "#003876", border: "1px solid #A8D8BA" }}>
                      <Gift size={9} /> -₱100 first month only
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3 max-w-md mx-auto">
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="skeu-btn w-full h-13 rounded-xl text-sm flex items-center justify-center gap-2 py-3.5"
          >
            {loading
              ? <><span className="animate-spin inline-block">⏳</span> Processing...</>
              : <>
                  <Zap size={15} className="fill-white" />
                  Upgrade to Pro — ₱{price.toLocaleString()}
                  {selected === "monthly" ? "/mo" : "/yr"}
                  <ArrowRight size={14} />
                </>
            }
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-xs font-medium underline underline-offset-2"
            style={{ color: "#8898AC" }}
          >
            Continue with Free plan for now
          </button>
        </div>

        {/* Referral Rewards Section */}
        <div className="mt-10 max-w-2xl mx-auto">
          <button
            onClick={() => setShowReferralRewards(v => !v)}
            className="w-full rounded-xl px-5 py-4 flex items-center gap-3 text-left transition-all"
            style={{
              background: "linear-gradient(160deg, #FAFCFF 0%, #F4F7FC 100%)",
              border: "1px solid #D4DCE6",
              boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 3px 8px rgba(0,0,0,0.06)"
            }}
          >
            <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(180deg, #E8F0FF, #D8E4FF)", border: "1px solid #B0C4F0" }}>
              <Users size={16} style={{ color: "#3060C0" }} />
            </div>
            <div className="flex-1">
              <p className="font-black text-sm" style={{ color: "#111A24" }}>
                📣 Refer a colleague — earn ₱100 off your own subscription
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#8898AC" }}>
                Share your personal referral code. For every teacher who pays using it, you get ₱100 off one month of your own plan.
              </p>
            </div>
            <span className="text-xs font-bold" style={{ color: "#003876" }}>
              {showReferralRewards ? "Hide ▲" : "Learn more ▼"}
            </span>
          </button>

          {showReferralRewards && (
            <div
              className="mt-2 rounded-xl p-5 animate-in fade-in slide-in-from-top-2 duration-300"
              style={{
                background: "linear-gradient(160deg, #FFFFFF 0%, #F8FBFF 100%)",
                border: "1px solid #D4DCE6",
                boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 4px 12px rgba(0,0,0,0.07)"
              }}
            >
              <p className="text-sm font-black mb-1" style={{ color: "#111A24" }}>
                How referral rewards work
              </p>
              <p className="text-xs mb-4" style={{ color: "#8898AC" }}>
                Each paid referral earns you <strong style={{ color: "#003876" }}>₱100 off</strong> your next month's subscription — the same first-month discount your referee received. One referral = one discounted month.
              </p>
              <div className="space-y-3 mb-4">
                {REFERRAL_REWARDS.map(({ referrals, reward }) => (
                  <div key={referrals} className="flex items-center gap-3 rounded-lg p-3"
                    style={{ background: "#F4F7FC", border: "1px solid #DDE4EE" }}>
                    <div className="h-8 w-8 rounded-full flex items-center justify-center font-black text-sm shrink-0"
                      style={{ background: "linear-gradient(180deg, #E30A24, #B5081C)", color: "#FFF", border: "1px solid #8A0615" }}>
                      {referrals}
                    </div>
                    <div>
                      <p className="text-xs font-black" style={{ color: "#111A24" }}>
                        {referrals} paid referral{referrals > 1 ? "s" : ""}
                      </p>
                      <p className="text-xs" style={{ color: "#003876", fontWeight: 600 }}>→ {reward}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-lg px-4 py-3 skeu-alert-amber">
                <p className="text-xs font-bold" style={{ color: "#5A3A08" }}>
                  ⚠️ A referral only counts when the referred teacher actually pays for a plan — not just signs up.
                </p>
              </div>
              <p className="text-xs mt-3 text-center" style={{ color: "#8898AC" }}>
                Your personal referral code will be shown in your account dashboard after upgrading.
              </p>
            </div>
          )}
        </div>

        {/* Trust Signals */}
        <div className="mt-8 pt-6 max-w-sm mx-auto" style={{ borderTop: "1px solid #DDE4EE" }}>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[["2,400+", "Teachers"], ["DepEd", "Compliant"], ["100%", "Offline"]].map(([val, label]) => (
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
