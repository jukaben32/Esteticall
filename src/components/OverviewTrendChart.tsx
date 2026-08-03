'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

export interface OverviewTrendPoint {
  day: string // e.g. "Jul 24"
  calls: number
  viewings: number
}

export function OverviewTrendChart({ data }: { data: OverviewTrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="day" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="calls" name="Llamadas" stroke="var(--gold)" strokeWidth={2} dot={false} />
        <Line
          type="monotone"
          dataKey="viewings"
          name="Visitas"
          stroke="var(--teal-600)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
