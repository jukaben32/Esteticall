import { PhoneCall, Clock, CalendarCheck, TrendingUp, CalendarDays, PhoneForwarded } from 'lucide-react'
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
  // eslint-disable-next-line react-hooks/purity -- Server Component, renders once per request; not subject to client re-render instability
  const referenceNow = Date.now()
  for (let i = DAYS_BACK - 1; i >= 0; i--) {
    days.push(dayKey(new Date(referenceNow - i * 86_400_000).toISOString()))
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

  // "Booked" here means the reservation was created in this window (created_at),
  // not that the visit itself falls in it (scheduled_at can be any future date).
  const now = new Date()
  const startOfToday = new Date(`${dayKey(now.toISOString())}T00:00:00Z`)
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setUTCDate(startOfWeek.getUTCDate() - ((startOfWeek.getUTCDay() + 6) % 7)) // Monday
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))

  const bookedSince = (since: Date) => appointments.filter((a) => new Date(a.created_at) >= since).length
  const bookedToday = bookedSince(startOfToday)
  const bookedThisWeek = bookedSince(startOfWeek)
  const bookedThisMonth = bookedSince(startOfMonth)

  // No hay un campo dedicado de "callback solicitado" en el esquema — se usa
  // el outcome "escalated" como proxy (ver /api/ai/tools request_callback).
  const callbacksRequested = conversations.filter((c) => c.outcome === 'escalated').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-semibold text-2xl text-[var(--text-1)]">Analítica</h1>
        <p className="text-sm text-[var(--text-3)] mt-1">Rendimiento de tus agentes IA, últimos 14 días</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={PhoneCall} label="Conversaciones totales" value={conversations.length} />
        <StatCard icon={Clock} label="Duración promedio" value={`${avgMinutes}:${avgSeconds.toString().padStart(2, '0')}`} />
        <StatCard icon={CalendarCheck} label="Citas agendadas" value={appointments.length} />
        <StatCard icon={TrendingUp} label="Tasa de conversión" value={`${conversionRate}%`} />
      </div>
      <AnalyticsCharts daily={daily} outcomes={outcomes} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <PeriodStatCard icon={CalendarCheck} label="Hoy" value={bookedToday} subtitle={`${bookedToday} agendadas`} />
        <PeriodStatCard icon={CalendarDays} label="Esta semana" value={bookedThisWeek} subtitle={`${bookedThisWeek} agendadas`} />
        <PeriodStatCard icon={CalendarDays} label="Este mes" value={bookedThisMonth} subtitle={`${bookedThisMonth} agendadas`} />
        <PeriodStatCard icon={PhoneForwarded} label="Callbacks solicitados" value={callbacksRequested} />
      </div>
    </div>
  )
}

function PeriodStatCard({
  icon: Icon,
  label,
  value,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number | string
  subtitle?: string
}) {
  return (
    <div className="stat-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-3)]">{label}</p>
        <Icon className="w-4 h-4 text-[var(--teal-600)]" />
      </div>
      <p className="font-display text-2xl font-semibold mt-1 text-[var(--teal-700)]">{value}</p>
      {subtitle && <p className="text-xs text-[var(--text-4)] mt-0.5">{subtitle}</p>}
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number | string
}) {
  return (
    <div className="stat-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--text-3)]">{label}</p>
        <Icon className="w-4 h-4 text-[var(--teal-600)]" />
      </div>
      <p className="font-display text-2xl font-semibold mt-1 text-[var(--teal-700)]">{value}</p>
    </div>
  )
}
