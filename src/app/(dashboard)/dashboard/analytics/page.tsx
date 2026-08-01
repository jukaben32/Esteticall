import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { listConversationsForBusiness } from '@/services/conversations'
import { listAppointmentsForBusiness } from '@/services/appointments'
import { AnalyticsCharts, type DailyPoint, type OutcomePoint } from '@/components/AnalyticsCharts'

const DAYS_BACK = 14

function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10)
}

function dayLabel(key: string): string {
  return new Date(`${key}T00:00:00Z`).toLocaleDateString('es-DO', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

const OUTCOME_LABELS: Record<string, string> = {
  'booked_viewing': 'Cita agendada',
  'qualified_lead': 'Lead calificado',
  'no_action': 'Sin acción',
  'escalated': 'Escalado',
}

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const business = await getBusinessForOwner(supabase, user!.id)
  if (!business) return null

  const [conversations, appointments] = await Promise.all([
    listConversationsForBusiness(supabase, business.id),
    listAppointmentsForBusiness(supabase, business.id),
  ])

  const days: string[] = []
  for (let i = DAYS_BACK - 1; i >= 0; i--) {
    days.push(dayKey(new Date(Date.now() - i * 86_400_000).toISOString()))
  }

  const convByDay = new Map<string, number>()
  const apptByDay = new Map<string, number>()
  for (const c of conversations) {
    const k = dayKey(c.started_at)
    convByDay.set(k, (convByDay.get(k) ?? 0) + 1)
  }
  for (const a of appointments) {
    const k = dayKey(a.scheduled_at)
    apptByDay.set(k, (apptByDay.get(k) ?? 0) + 1)
  }

  const daily: DailyPoint[] = days.map((k) => ({
    day: dayLabel(k),
    conversations: convByDay.get(k) ?? 0,
    appointments: apptByDay.get(k) ?? 0,
  }))

  const outcomeCounts = new Map<string, number>()
  for (const c of conversations) {
    const key = c.outcome ?? 'no_action'
    outcomeCounts.set(key, (outcomeCounts.get(key) ?? 0) + 1)
  }
  const outcomes: OutcomePoint[] = Array.from(outcomeCounts.entries()).map(([outcome, count]) => ({
    outcome: OUTCOME_LABELS[outcome] ?? outcome.replace('_', ' '),
    count,
  }))

  const completed = conversations.filter((c) => c.status === 'completed')
  const avgDurationSeconds = completed.length
    ? Math.round(completed.reduce((sum, c) => sum + c.duration_seconds, 0) / completed.length)
    : 0
  const avgMinutes = Math.floor(avgDurationSeconds / 60)
  const avgSeconds = avgDurationSeconds % 60

  const bookedCount = conversations.filter((c) => c.outcome === 'booked_viewing').length
  const conversionRate = conversations.length
    ? Math.round((bookedCount / conversations.length) * 100)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-semibold text-2xl text-[var(--text-1)]">Analítica</h1>
        <p className="text-sm text-[var(--text-3)] mt-1">Rendimiento de tus agentes IA, últimos 14 días</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Conversaciones totales" value={conversations.length} />
        <StatCard label="Duración promedio" value={`${avgMinutes}:${avgSeconds.toString().padStart(2, '0')}`} />
        <StatCard label="Citas agendadas" value={appointments.length} />
        <StatCard label="Tasa de conversión" value={`${conversionRate}%`} />
      </div>
      <AnalyticsCharts daily={daily} outcomes={outcomes} />
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="stat-card p-4">
      <p className="text-xs text-[var(--text-3)]">{label}</p>
      <p className="font-display text-2xl font-semibold mt-1 text-[var(--teal-700)]">{value}</p>
    </div>
  )
}
