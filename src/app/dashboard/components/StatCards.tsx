"use client"

import Link from "next/link"

interface StatCard {
  label: string
  value: string | number
  sub: string
  icon: any
  iconColor: string
  accent: string
}

interface StatCardsProps {
  statCards: StatCard[]
}

export function StatCards({ statCards }: StatCardsProps) {
  const hrefs = ['/dashboard', '/attendance', '/composite', '/sf5']
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map(({ label, value, sub, icon: Icon, iconColor, accent }, idx) => (
        <Link key={label} href={hrefs[idx] || '/dashboard'} className="block group">
          <div className="skeu-card p-5 transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
            <div className="flex items-start justify-between mb-3">
              <p className="skeu-label">{label}</p>
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                style={{
                  background: `linear-gradient(180deg, color-mix(in srgb, ${iconColor} 12%, white) 0%, color-mix(in srgb, ${iconColor} 8%, white) 100%)`,
                  border: `1px solid color-mix(in srgb, ${iconColor} 25%, white)`,
                  boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 2px 4px rgba(0,0,0,0.06)"
                }}
              >
                <Icon size={15} style={{ color: iconColor }} />
              </div>
            </div>
            <div className="text-3xl font-black leading-none mb-1" style={{ color: accent }}>{value}</div>
            <p className="text-xs mt-1" style={{ color: "#8898AC" }}>{sub}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
