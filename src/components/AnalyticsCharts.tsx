'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

export interface DailyPoint {
  day: string // e.g. "Jul 24"
  conversations: number
  appointments: number
}

export interface OutcomePoint {
  outcome: string
  count: number
}

export function AnalyticsCharts({
  daily,
  outcomes,
}: {
  daily: DailyPoint[]
  outcomes: OutcomePoint[]
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="card-surface p-4">
        <h2 className="font-display font-semibold mb-3 text-[var(--text-1)]">Conversaciones y citas (últimos 14 días)</h2>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={daily}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="conversations" name="Conversaciones" stroke="var(--teal-700)" strokeWidth={2} />
            <Line type="monotone" dataKey="appointments" name="Citas" stroke="var(--teal-400)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card-surface p-4">
        <h2 className="font-display font-semibold mb-3 text-[var(--text-1)]">Resultados de llamadas</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={outcomes}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="outcome" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="var(--teal-600)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
