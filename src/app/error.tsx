"use client"

import { useEffect } from "react"
import { AlertTriangle, RotateCcw } from "lucide-react"
import * as Sentry from "@sentry/nextjs"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="skeu-card p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(180deg, #FFF4F4, #FFE8E8)",
                border: "1px solid #E8CCCC",
                boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset"
              }}>
              <AlertTriangle size={28} style={{ color: "#C03030" }} />
            </div>
          </div>
          <h1 className="text-2xl font-black tracking-tight mb-2" style={{ color: "#111A24" }}>
            Something Went Wrong
          </h1>
          <p className="text-sm mb-2" style={{ color: "#8898AC" }}>
            An unexpected error occurred. Please try again.
          </p>
          {error.digest && (
            <p className="text-xs font-mono mb-6 px-3 py-1.5 rounded-md inline-block" style={{ background: "#F4F7FC", color: "#8898AC" }}>
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
            style={{
              background: "linear-gradient(180deg, #E04040, #C03030)",
              border: "1px solid #A02020",
              boxShadow: "0 1px 0 rgba(255,255,255,0.15) inset, 0 4px 12px rgba(192,48,48,0.35)"
            }}
          >
            <RotateCcw size={16} /> Try Again
          </button>
        </div>
      </div>
    </div>
  )
}
