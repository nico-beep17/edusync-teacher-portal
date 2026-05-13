import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="skeu-card p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(180deg, #E0F0FF, #C8E0FF)",
                border: "1px solid #A8C8F0",
                boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset"
              }}>
              <span className="text-3xl font-black" style={{ color: "#003876" }}>404</span>
            </div>
          </div>
          <h1 className="text-2xl font-black tracking-tight mb-2" style={{ color: "#111A24" }}>
            Page Not Found
          </h1>
          <p className="text-sm mb-8" style={{ color: "#8898AC" }}>
            The page you are looking for doesn&apos;t exist or has been moved.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
            style={{
              background: "linear-gradient(180deg, #003876, #002A5C)",
              border: "1px solid #002050",
              boxShadow: "0 1px 0 rgba(255,255,255,0.15) inset, 0 4px 12px rgba(0,56,118,0.35)"
            }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div className="mt-6 flex items-center justify-center gap-2">
            <span className="text-xl font-black tracking-tight text-[#003876]">Dep<span className="text-[#B5081C]">Aid</span></span>
          </div>
        </div>
      </div>
    </div>
  )
}
