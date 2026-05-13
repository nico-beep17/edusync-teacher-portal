"use client"

import { TrendingUp, PieChart as PieChartIcon } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Label as RechartsLabel } from 'recharts'

interface ChartsSectionProps {
  chartData: Array<{ subject: string; average: number }>
  sexData: Array<{ name: string; value: number }>
  totalStudents: number
}

const COLORS = ['#3b82f6', '#ec4899']

export function ChartsSection({ chartData, sexData, totalStudents }: ChartsSectionProps) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      <div className="skeu-card p-0 overflow-hidden md:col-span-2">
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{
            background: "linear-gradient(180deg, #FAFCFF 0%, #F4F7FC 100%)",
            borderBottom: "1px solid #DDE4EE"
          }}
        >
          <div>
            <p className="font-black text-sm flex items-center gap-2" style={{ color: "#111A24" }}>
              <TrendingUp size={15} style={{ color: "#003876" }} /> Subject Performance (Q1)
            </p>
            <p className="skeu-label mt-0.5">Live class average per learning area</p>
          </div>
        </div>
        <div className="px-4 py-4 h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F8" />
              <XAxis dataKey="subject" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#8898AC', fontWeight: 700 }} dy={8} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#8898AC' }} domain={[0, 100]} />
              <Tooltip
                cursor={{ fill: 'rgba(28,165,96,0.05)' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #DDE4EE', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', background: '#FFFFFF' }}
                labelStyle={{ fontWeight: 'bold', color: '#111A24', fontSize: 12 }}
              />
              <Bar dataKey="average" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.average >= 90 ? '#003876' : entry.average >= 75 ? '#2080D0' : '#D08010'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="skeu-card p-0 overflow-hidden">
        <div
          className="px-5 py-4"
          style={{
            background: "linear-gradient(180deg, #FAFCFF 0%, #F4F7FC 100%)",
            borderBottom: "1px solid #DDE4EE"
          }}
        >
          <p className="font-black text-sm flex items-center gap-2" style={{ color: "#111A24" }}>
            <PieChartIcon size={15} style={{ color: "#2060C0" }} /> Demographics
          </p>
          <p className="skeu-label mt-0.5">Sex ratio of enrolled learners</p>
        </div>
        <div className="h-[260px] flex items-center justify-center px-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={sexData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                {sexData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
                <RechartsLabel value={totalStudents} position="center" className="text-3xl font-bold fill-slate-800" />
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #DDE4EE', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
