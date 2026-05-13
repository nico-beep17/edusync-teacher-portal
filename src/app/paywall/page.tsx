"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle2, Zap, Crown, Lock, ArrowRight,
  FileText, BarChart2, Brain, Bell, Download,
  ShieldCheck, Wifi, Sparkles, Gift, Tag, X, Users, Star, Info
} from "lucide-react"
import { toast } from "sonner"
import { CreditCard, Calendar, Lock as LockIcon } from "lucide-react"

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

// Pricing
const PRICING = {
  regular: 899,
  deped: 699,
  referralDiscount: 200,
  referralMonths: 6, // discount applies for 6 months from subscription start
}

// Referral program
const POINTS_PER_REFERRAL = 100   // 10 referrals × 100pts = 1000pts
const POINTS_FOR_FREE_MONTH = 1000

const VALID_REFERRAL_PATTERN = /^[A-Z0-9]{6,10}$/i

export default function PaywallPage() {
  const router = useRouter()
  const [isDepEd, setIsDepEd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [referralCode, setReferralCode] = useState("")
  const [referralApplied, setReferralApplied] = useState(false)
  const [referralError, setReferralError] = useState("")
  const [showReferralInfo, setShowReferralInfo] = useState(false)

  const basePrice = isDepEd ? PRICING.deped : PRICING.regular
  const discountedPrice = basePrice - PRICING.referralDiscount
  const displayPrice = referralApplied ? discountedPrice : basePrice
  const savings = referralApplied ? PRICING.referralDiscount : 0

  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // Card form state
  const [cardNumber, setCardNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvc, setCvc] = useState("")
  const [cardName, setCardName] = useState("")

  const handleApplyReferral = () => {
    if (!referralCode.trim()) { setReferralError("Please enter a referral code."); return }
    if (!VALID_REFERRAL_PATTERN.test(referralCode)) {
      setReferralError("Invalid code format. Codes are 6–10 alphanumeric characters.")
      return
    }
    setReferralApplied(true)
    setReferralError("")
  }

  const handleRemoveReferral = () => {
    setReferralApplied(false)
    setReferralCode("")
    setReferralError("")
  }

  const handleUpgradeClick = () => {
    setShowPaymentModal(true)
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Step 1: Create Payment Intent via server API route
      const intentRes = await fetch("/api/payment/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: displayPrice,
          description: isDepEd ? "DepEd Teacher Monthly" : "Pro Monthly",
        }),
      })

      if (!intentRes.ok) {
        const err = await intentRes.json()
        throw new Error(err.error || "Failed to initiate payment")
      }

      const { id: paymentIntentId } = await intentRes.json()

      // Step 2: Tokenize card via PayMongo public key (client-side)
      const publicKey = process.env.NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY
      if (!publicKey) throw new Error("Payment public key not configured")

      const [expMonthStr, expYearStr] = expiry.split("/")
      const expMonth = parseInt(expMonthStr, 10)
      const expYear = 2000 + parseInt(expYearStr, 10)

      const pmRes = await fetch("https://api.paymongo.com/v1/payment_methods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(`${publicKey}:`)}`,
        },
        body: JSON.stringify({
          data: {
            attributes: {
              type: "card",
              details: {
                card_number: cardNumber.replace(/\s/g, ""),
                exp_month: expMonth,
                exp_year: expYear,
                cvc,
              },
              billing: { name: cardName || "Cardholder" },
            },
          },
        }),
      })

      if (!pmRes.ok) {
        const err = await pmRes.json()
        const detail = err.errors?.[0]?.detail || "Card was declined"
        throw new Error(detail)
      }

      const pmData = await pmRes.json()
      const paymentMethodId = pmData.data.id

      // Step 3: Attach payment method to intent via server API route
      const attachRes = await fetch("/api/payment/attach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId, paymentMethodId }),
      })

      if (!attachRes.ok) {
        const err = await attachRes.json()
        throw new Error(err.error || "Payment processing failed")
      }

      const attachData = await attachRes.json()

      if (attachData.status === "succeeded") {
        const planLabel = isDepEd ? "DepEd Teacher Monthly" : "Pro Monthly"
        const referralNote = referralApplied
          ? `\nReferral applied: -₱${savings}/mo for first 6 months from subscription start`
          : ""
        toast.success(
          `Payment successful!\nPlan: ${planLabel}\nPrice: ₱${displayPrice}/mo${referralNote}\n\nEnjoy full access! 🎉`
        )
        router.push("/dashboard")
      } else if (attachData.status === "awaiting_next_action") {
        toast.info("Your card requires additional authentication. Please follow the prompts to complete payment.")
      } else {
        throw new Error(`Payment status: ${attachData.status}. Please try again or use a different card.`)
      }
    } catch (error: any) {
      toast.error(error.message || "Payment failed. Please check your card details and try again.")
    } finally {
      setLoading(false)
    }
  }

  /** Dev-only: skip real payment, simulate success after 1.5s */
  const handleDevBypass = () => {
    setLoading(true)
    setTimeout(() => {
      const planLabel = isDepEd ? "DepEd Teacher Monthly" : "Pro Monthly"
      const referralNote = referralApplied
        ? `\nReferral applied: -₱${savings}/mo for first 6 months from subscription start`
        : ""
      toast.success(
        `[DEV] Payment simulated!\nPlan: ${planLabel}\nPrice: ₱${displayPrice}/mo${referralNote}\n\nEnjoy full access! 🎉`
      )
      router.push("/dashboard")
    }, 1500)
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
            <img src="/depaid-logo.svg" alt="DepAid" className="h-full w-full object-contain scale-[1.3] drop-shadow-sm transition-transform duration-300" />
          </div>
          <span className="font-black text-lg" style={{ color: "#003876" }}>Dep<span style={{ color: "#B5081C" }}>Aid</span></span>
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
            One simple monthly plan. Unlimited forms, AI-powered tools, cloud sync, and automated DepEd reports.
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

        {/* ─── Pricing Card ─── */}
        <div className="mb-6 rounded-2xl p-6" style={{
          background: "linear-gradient(160deg, #FFFFFF 0%, #F4F7FC 100%)",
          border: "2px solid #003876",
          boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 6px 20px rgba(0,56,118,0.1)"
        }}>
          <p className="font-black text-sm mb-4" style={{ color: "#111A24" }}>Monthly Subscription</p>

          {/* DepEd Toggle */}
          <button
            onClick={() => setIsDepEd(v => !v)}
            className="w-full rounded-xl px-4 py-3 flex items-center gap-3 mb-5 transition-all"
            style={isDepEd ? {
              background: "linear-gradient(160deg, #FFFFFF 0%, #EEF6FF 100%)",
              border: "2px solid #003876",
              boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 4px 12px rgba(0,56,118,0.12)"
            } : {
              background: "linear-gradient(160deg, #FAFCFF 0%, #F4F7FC 100%)",
              border: "1px solid #D4DCE6",
              boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 2px 6px rgba(0,0,0,0.05)"
            }}
          >
            <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{
              background: isDepEd ? "linear-gradient(180deg, #003876, #002555)" : "linear-gradient(180deg, #EEF2F8, #E4EAF4)",
              border: isDepEd ? "1px solid #001F4D" : "1px solid #C8D4E0",
              boxShadow: "0 1px 0 rgba(255,255,255,0.2) inset"
            }}>
              <ShieldCheck size={14} style={{ color: isDepEd ? "#FFF" : "#8898AC" }} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-black text-sm" style={{ color: isDepEd ? "#003876" : "#3A4A5E" }}>
                I am a DepEd Teacher
              </p>
              <p className="text-xs mt-0.5" style={{ color: isDepEd ? "#3060A0" : "#8898AC" }}>
                Verified DepEd teachers get a special rate — ₱699/month, no monthly cap
              </p>
            </div>
            {/* Toggle visual */}
            <div className="relative h-6 w-11 rounded-full shrink-0 transition-all" style={{
              background: isDepEd ? "#003876" : "#C8D4E0",
              boxShadow: isDepEd ? "0 0 8px rgba(0,56,118,0.4)" : "none"
            }}>
              <div className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-all" style={{
                left: isDepEd ? "calc(100% - 1.35rem)" : "0.125rem",
                boxShadow: "0 1px 4px rgba(0,0,0,0.2)"
              }} />
            </div>
          </button>

          {/* Price Display */}
          <div className="flex items-end gap-3 mb-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black" style={{ color: "#003876" }}>
                  ₱{displayPrice.toLocaleString()}
                </span>
                <span className="text-sm font-bold" style={{ color: "#8898AC" }}>/month</span>
                {referralApplied && (
                  <span className="text-lg line-through font-bold" style={{ color: "#C8D4E0" }}>
                    ₱{basePrice.toLocaleString()}
                  </span>
                )}
              </div>
              {referralApplied && (
                <p className="text-xs font-bold mt-1" style={{ color: "#1C8A60" }}>
                  🎉 ₱{savings} off/month for first {PRICING.referralMonths} months from subscription start
                </p>
              )}
              {!referralApplied && isDepEd && (
                <p className="text-xs font-semibold mt-1" style={{ color: "#003876" }}>
                  ✅ DepEd verified rate — save ₱{PRICING.regular - PRICING.deped}/mo vs regular
                </p>
              )}
            </div>
          </div>

          <div className="skeu-divider mb-4" />

          {/* Referral Code Input */}
          {!referralApplied ? (
            <div className="rounded-xl p-4 mb-4" style={{
              background: "linear-gradient(160deg, #FAFCFF 0%, #F4F7FC 100%)",
              border: "1px solid #D4DCE6",
              boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 3px 8px rgba(0,0,0,0.06)"
            }}>
              <div className="flex items-center gap-2 mb-3">
                <Tag size={14} style={{ color: "#5A6A7E" }} />
                <p className="text-sm font-bold" style={{ color: "#111A24" }}>Have a referral code?</p>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full ml-auto" style={{ background: "#E8F7EE", color: "#003876", border: "1px solid #A8D8BA" }}>
                  ₱200 off · 6 months
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
                A referral code gives you <strong>₱200 off/month for 6 months</strong>, counted from your subscription start date.
              </p>
            </div>
          ) : (
            <div className="rounded-xl px-4 py-3 flex items-start gap-3 mb-4 animate-in fade-in duration-300" style={{
              background: "linear-gradient(160deg, #FFFFFF 0%, #F2FBF6 100%)",
              border: "2px solid #003876",
              boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 3px 10px rgba(28,165,96,0.15)"
            }}>
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "linear-gradient(180deg, #E8F7EE, #D4F0DC)", border: "1px solid #A8D8BA" }}>
                <Gift size={15} style={{ color: "#003876" }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black" style={{ color: "#003876" }}>
                  Referral code <span className="font-mono bg-green-50 px-1.5 py-0.5 rounded">{referralCode}</span> applied!
                </p>
                <p className="text-xs mt-1" style={{ color: "#5A8A6A" }}>
                  <strong>₱200 off/month</strong> for your first 6 months, starting from your subscription date.
                  After month 6, regular pricing resumes — even if you claimed a free month within that period.
                </p>
              </div>
              <button onClick={handleRemoveReferral} className="text-slate-400 hover:text-slate-600 shrink-0 mt-0.5">
                <X size={15} />
              </button>
            </div>
          )}

          {/* CTA */}
              <button
                onClick={handleUpgradeClick}
                disabled={loading}
                className="skeu-btn w-full h-12 rounded-xl text-sm mt-5 shadow-lg relative overflow-hidden group"
              >
            {loading
              ? <><span className="animate-spin inline-block">⏳</span> Processing...</>
              : <>
                  <Zap size={15} className="fill-white" />
                  Upgrade to Pro — ₱{displayPrice.toLocaleString()}/mo
                  <ArrowRight size={14} />
                </>
            }
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full text-center text-xs font-medium underline underline-offset-2 mt-3"
            style={{ color: "#8898AC" }}
          >
            Continue with Free plan for now
          </button>

          {/* 6-month note */}
          {referralApplied && (
            <div className="mt-3 rounded-lg px-4 py-3 flex items-start gap-2" style={{ background: "#FFF9EC", border: "1px solid #F0D080" }}>
              <Info size={13} style={{ color: "#9A6800", marginTop: 1, flexShrink: 0 }} />
              <p className="text-xs font-medium" style={{ color: "#5A3A08" }}>
                The 6-month discount window is fixed from your <strong>subscription start date</strong>. Claiming a free month (via referral points) does not extend or reset this window.
              </p>
            </div>
          )}
        </div>

        {/* ─── Referral Program Panel ─── */}
        <div className="mb-6">
          <button
            onClick={() => setShowReferralInfo(v => !v)}
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
                📣 Refer colleagues — earn points & free months
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#8898AC" }}>
                Every 10 paid referrals = 1,000 pts = 1 free month, claimable anytime.
              </p>
            </div>
            <span className="text-xs font-bold" style={{ color: "#003876" }}>
              {showReferralInfo ? "Hide ▲" : "Learn more ▼"}
            </span>
          </button>

          {showReferralInfo && (
            <div
              className="mt-2 rounded-xl p-5 animate-in fade-in slide-in-from-top-2 duration-300"
              style={{
                background: "linear-gradient(160deg, #FFFFFF 0%, #F8FBFF 100%)",
                border: "1px solid #D4DCE6",
                boxShadow: "0 1px 0 rgba(255,255,255,1) inset, 0 4px 12px rgba(0,0,0,0.07)"
              }}
            >
              <p className="text-sm font-black mb-1" style={{ color: "#111A24" }}>Referral Rewards Program</p>
              <p className="text-xs mb-5" style={{ color: "#8898AC" }}>
                Share your unique referral code. When a new teacher subscribes using it, you earn <strong style={{ color: "#003876" }}>100 points</strong>. Accumulate 1,000 points (10 paid referrals) to redeem 1 free month.
              </p>

              {/* Points ladder */}
              <div className="space-y-3 mb-5">
                {[
                  { referrals: 1,  pts: 100,  note: "100 points earned" },
                  { referrals: 5,  pts: 500,  note: "500 points — halfway to a free month" },
                  { referrals: 10, pts: 1000, note: "1,000 points → redeem 1 FREE month!" },
                ].map(({ referrals, pts, note }) => (
                  <div key={referrals} className="flex items-center gap-3 rounded-lg p-3"
                    style={{ background: referrals === 10 ? "linear-gradient(160deg,#FFF9EC,#FFF3D4)" : "#F4F7FC", border: referrals === 10 ? "1px solid #F0D080" : "1px solid #DDE4EE" }}>
                    <div className="h-9 w-9 rounded-full flex items-center justify-center font-black text-sm shrink-0"
                      style={{ background: referrals === 10 ? "linear-gradient(180deg, #E30A24, #B5081C)" : "linear-gradient(180deg,#E8F0FF,#D8E4FF)", color: referrals === 10 ? "#FFF" : "#3060C0", border: referrals === 10 ? "1px solid #8A0615" : "1px solid #B0C4F0" }}>
                      {referrals === 10 ? <Star size={14} /> : referrals}
                    </div>
                    <div>
                      <p className="text-xs font-black" style={{ color: "#111A24" }}>
                        {referrals} paid referral{referrals > 1 ? "s" : ""} = {pts.toLocaleString()} pts
                      </p>
                      <p className="text-xs font-semibold" style={{ color: referrals === 10 ? "#C03000" : "#003876" }}>→ {note}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rules */}
              <div className="space-y-2.5">
                <div className="rounded-lg px-4 py-3 flex items-start gap-2" style={{ background: "#F0F6FF", border: "1px solid #B8D0F0" }}>
                  <Info size={13} style={{ color: "#3060C0", marginTop: 1, flexShrink: 0 }} />
                  <p className="text-xs font-medium" style={{ color: "#1A3A70" }}>
                    <strong>Free month claim is independent</strong> from the referral discount. Claiming a free month does <strong>not</strong> add to any 6-month ₱200 discount window — those are separate programs.
                  </p>
                </div>
                <div className="rounded-lg px-4 py-3 flex items-start gap-2" style={{ background: "#FFF9EC", border: "1px solid #F0D080" }}>
                  <Info size={13} style={{ color: "#9A6800", marginTop: 1, flexShrink: 0 }} />
                  <p className="text-xs font-medium" style={{ color: "#5A3A08" }}>
                    The <strong>₱200 off / 6-month window</strong> runs from your <em>subscription start date</em>. If you claim a free month during month 3, the window still ends at month 6 from your original start.
                  </p>
                </div>
                <div className="rounded-lg px-4 py-3" style={{ background: "#FFF4F4", border: "1px solid #E8CCCC" }}>
                  <p className="text-xs font-bold" style={{ color: "#A03030" }}>
                    ⚠️ A referral only counts when the referred teacher <em>actually pays</em> — not just signs up.
                  </p>
                </div>
              </div>

              <p className="text-xs mt-4 text-center" style={{ color: "#8898AC" }}>
                Your personal referral code and point balance will appear in your dashboard after upgrading.
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
      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-lg text-slate-800 flex items-center gap-2">
                <CreditCard size={20} className="text-[#003876]" />
                Secure Checkout
              </h3>
              <button disabled={loading} onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="p-6">
              <div className="mb-6 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-slate-700">{isDepEd ? "DepEd Teacher Monthly" : "Pro Monthly"}</span>
                  <span className="font-black text-[#003876]">₱{displayPrice}</span>
                </div>
                {referralApplied && (
                  <p className="text-xs text-emerald-600 font-medium">Referral discount applied: -₱{savings}</p>
                )}
              </div>

              <div className="space-y-4 mb-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Card Information</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                     <input required type="text" placeholder="0000 0000 0000 0000" value={cardNumber} onChange={e => setCardNumber(e.target.value)} className="w-full h-10 pl-10 pr-3 text-sm border border-slate-300 rounded-lg focus:border-[#003876] focus:ring-1 focus:ring-[#003876] outline-none transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Expiry Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                       <input required type="text" placeholder="MM/YY" value={expiry} onChange={e => setExpiry(e.target.value)} className="w-full h-10 pl-10 pr-3 text-sm border border-slate-300 rounded-lg focus:border-[#003876] focus:ring-1 focus:ring-[#003876] outline-none transition-all" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">CVC</label>
                    <div className="relative">
                      <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                       <input required type="password" placeholder="123" maxLength={4} value={cvc} onChange={e => setCvc(e.target.value)} className="w-full h-10 pl-10 pr-3 text-sm border border-slate-300 rounded-lg focus:border-[#003876] focus:ring-1 focus:ring-[#003876] outline-none transition-all" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Name on Card</label>
                   <input required type="text" placeholder="Juan Dela Cruz" value={cardName} onChange={e => setCardName(e.target.value)} className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg focus:border-[#003876] focus:ring-1 focus:ring-[#003876] outline-none transition-all" />
                </div>
              </div>

              <button disabled={loading} type="submit" className="w-full h-12 rounded-xl text-sm font-bold bg-[#003876] hover:bg-[#002B5A] text-white transition-colors flex items-center justify-center gap-2 shadow-md">
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2006/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    Pay ₱{displayPrice}
                  </>
                )}
              </button>

              {/* Dev bypass */}
              <button
                type="button"
                disabled={loading}
                onClick={handleDevBypass}
                className="w-full mt-2 h-9 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors border border-dashed border-slate-300"
              >
                [Dev] Simulate Payment
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
