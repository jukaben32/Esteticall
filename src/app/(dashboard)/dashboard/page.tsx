import Link from 'next/link'
import {
  Sparkles,
  MessagesSquare,
  CalendarCheck,
  TrendingUp,
  Clock,
  PhoneCall,
  PhoneForwarded,
  Bot,
  Settings,
  ArrowRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner, getDashboardAnalytics } from '@/services/businesses'
import { listServicesForBusiness } from '@/services/businessServices'
import { listAppointmentsForBusiness } from '@/services/appointments'
import { listConversationsForBusiness } from '@/services/conversations'
import { listAgentsForBusiness } from '@/services/aiAgents'
import { listAvailabilityForBusiness } from '@/services/schedule'
import { formatDateTime } from '@/lib/formatDate'
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_STYLES } from '@/lib/appointmentFormat'
import { formatServicePrice } from '@/lib/serviceFormat'
import { OverviewTrendChart, type OverviewTrendPoint } from '@/components/OverviewTrendChart'
import { RefreshButton } from '@/components/RefreshButton'

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

// Server runs in UTC on Vercel — America/Santo_Domingo is a fixed UTC-4 all
// year (no DST since 1974), so a plain offset subtraction gives the right
// local hour without needing Intl.DateTimeFormat here.
function greeting(): string {
  const hour = new Date(Date.now() - 4 * 60 * 60 * 1000).getUTCHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export default async function OverviewPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const business = await getBusinessForOwner(supabase, user!.id)
  if (!business) return null

  const [analytics, services, appointments, conversations, agents, availability] = await Promise.all([
    getDashboardAnalytics(supabase, business.id),
    listServicesForBusiness(supabase, business.id),
    listAppointmentsForBusiness(supabase, business.id),
    listConversationsForBusiness(supabase, business.id),
    listAgentsForBusiness(supabase, business.id),
    listAvailabilityForBusiness(supabase, business.id),
  ])

  // Nudges a brand-new business toward Settings until the basics are in
  // place — matches the reference dashboard's "Setup" prompt. Phone/address
  // are what the AI agent quotes callers, and without at least one active
  // availability day, check_availability always comes back empty.
  const setupIncomplete = !business.phone || !business.address || !availability.some((a) => a.is_active)

  const activeServices = services.filter((s) => s.is_active)
  const liveAgents = agents.filter((a) => a.status === 'live')

  const completedCalls = conversations.filter((c) => c.status === 'completed')
  const avgDurationSeconds = completedCalls.length
    ? Math.round(completedCalls.reduce((sum, c) => sum + c.duration_seconds, 0) / completedCalls.length)
    : 0
  const avgMinutes = Math.floor(avgDurationSeconds / 60)
  const avgSeconds = avgDurationSeconds % 60

  const bookedCount = conversations.filter((c) => c.outcome === 'appointment_booked').length
  const conversionRate = conversations.length
    ? Math.round((bookedCount / conversations.length) * 100)
    : 0

  // No hay un campo dedicado de "callback solicitado" en el esquema — se usa el
  // outcome "escalated" (la llamada se marcó para seguimiento humano) como proxy.
  const callbacksRequested = conversations.filter((c) => c.outcome === 'escalated').length

  const days: string[] = []
  // eslint-disable-next-line react-hooks/purity -- Server Component, renders once per request; not subject to client re-render instability
  const referenceNow = Date.now()
  for (let i = DAYS_BACK - 1; i >= 0; i--) {
    days.push(dayKey(new Date(referenceNow - i * 86_400_000).toISOString()))
  }
  const callsByDay = new Map<string, number>()
  const appointmentsByDay = new Map<string, number>()
  for (const c of conversations) {
    const k = dayKey(c.started_at)
    callsByDay.set(k, (callsByDay.get(k) ?? 0) + 1)
  }
  for (const a of appointments) {
    const k = dayKey(a.scheduled_at)
    appointmentsByDay.set(k, (appointmentsByDay.get(k) ?? 0) + 1)
  }
  const trend: OverviewTrendPoint[] = days.map((k) => ({
    day: dayLabel(k),
    calls: callsByDay.get(k) ?? 0,
    viewings: appointmentsByDay.get(k) ?? 0,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-semibold text-2xl text-[var(--text-1)]">
            {greeting()}, {business.name}
          </h1>
          <p className="text-sm text-[var(--text-3)] mt-1">Rendimiento del negocio de un vistazo</p>
        </div>
        <div className="flex items-center gap-2">
          {liveAgents.length > 0 && (
            <span className="badge bg-[var(--teal-50)] border-transparent text-[var(--teal-700)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--teal-600)] animate-pulse" />
              {liveAgents.length} {liveAgents.length === 1 ? 'AGENTE EN VIVO' : 'AGENTES EN VIVO'}
            </span>
          )}
          <RefreshButton />
        </div>
      </div>

      {setupIncomplete && (
        <Link
          href="/dashboard/settings"
          className="card-surface p-4 flex items-center justify-between gap-4 flex-wrap border-[var(--gold)]/40 bg-[var(--gold)]/8 hover:bg-[var(--gold)]/12 transition"
        >
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-[var(--gold)]/20 text-[var(--gold)] grid place-items-center shrink-0">
              <Settings className="w-4 h-4" />
            </span>
            <div>
              <p className="font-semibold text-[var(--text-1)]">Completa la configuración de tu negocio</p>
              <p className="text-sm text-[var(--text-3)]">
                Falta el perfil del negocio o el horario de atención — tu agente IA los necesita para responder
                llamadas y agendar citas.
              </p>
            </div>
          </div>
          <span className="btn-secondary shrink-0">
            Ir a Configuración
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={Sparkles} label="Tratamientos activos" value={activeServices.length} />
        <StatCard icon={MessagesSquare} label="Conversaciones totales" value={conversations.length} />
        <StatCard icon={CalendarCheck} label="Citas agendadas" value={appointments.length} />
        <StatCard icon={TrendingUp} label="Tasa de conversión" value={`${conversionRate}%`} />
        <StatCard
          icon={Clock}
          label="Duración promedio"
          value={`${avgMinutes}:${avgSeconds.toString().padStart(2, '0')}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="card-surface p-4 lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[var(--teal-50)] text-[var(--teal-700)] grid place-items-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </span>
            <div>
              <h2 className="font-display font-semibold text-[var(--text-1)]">Tendencia de conversaciones</h2>
              <p className="text-xs text-[var(--text-3)]">Últimos 14 días · llamadas y citas</p>
            </div>
          </div>
          <OverviewTrendChart data={trend} />
        </section>

        <section className="card-surface p-4">
          <h2 className="font-display font-semibold text-[var(--text-1)] mb-3 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[var(--teal-50)] text-[var(--teal-700)] grid place-items-center shrink-0">
              <Clock className="w-4 h-4" />
            </span>
            Actividad de hoy
          </h2>
          <ul className="divide-y divide-[var(--border)]">
            <ActivityRow icon={PhoneCall} label="Llamadas de hoy" value={analytics.conversations_today} />
            <ActivityRow icon={TrendingUp} label="Esta semana" value={analytics.conversations_this_week} />
            <ActivityRow icon={PhoneForwarded} label="Callbacks solicitados" value={callbacksRequested} />
            <ActivityRow icon={Bot} label="Agentes activos" value={liveAgents.length} />
            <ActivityRow icon={Sparkles} label="Tratamientos activos" value={activeServices.length} />
          </ul>
        </section>
      </div>

      <section className="card-surface p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[var(--teal-50)] text-[var(--teal-700)] grid place-items-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h2 className="font-display font-semibold text-[var(--text-1)]">Tratamientos</h2>
              <p className="text-sm text-[var(--text-3)]">
                {services.length} en total · {activeServices.length} activos
              </p>
            </div>
          </div>
          <Link href="/dashboard/services" className="btn-secondary">
            Administrar
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {activeServices.slice(0, 4).map((service) => (
            <div key={service.id} className="card-surface overflow-hidden p-3">
              <p className="text-sm font-medium truncate">{service.name}</p>
              {service.description && (
                <p className="text-xs text-[var(--text-3)] line-clamp-2 mt-1">{service.description}</p>
              )}
              <p className="text-sm font-semibold mt-2 text-[var(--teal-700)]">{formatServicePrice(service)}</p>
              <p className="text-xs text-[var(--text-3)] mt-0.5">{service.duration_minutes} min</p>
            </div>
          ))}
          {activeServices.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center gap-2 py-8 text-center">
              <span className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] text-[var(--text-4)] grid place-items-center">
                <Sparkles className="w-5 h-5" />
              </span>
              <p className="text-sm text-[var(--text-3)]">Todavía no hay tratamientos activos.</p>
            </div>
          )}
        </div>
      </section>

      <section className="card-surface p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[var(--teal-50)] text-[var(--teal-700)] grid place-items-center shrink-0">
              <CalendarCheck className="w-4 h-4" />
            </span>
            <h2 className="font-display font-semibold text-[var(--text-1)]">Citas recientes</h2>
          </div>
          <Link href="/dashboard/citas" className="btn-secondary">
            Ver todas
          </Link>
        </div>
        <ul className="divide-y divide-[var(--border)]">
          {appointments.slice(0, 5).map((appt) => (
            <li key={appt.id} className="py-3 flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0 flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-full bg-[var(--teal-100)] text-[var(--teal-800)] grid place-items-center text-sm font-semibold shrink-0">
                  {(appt.client?.name ?? '?').charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="text-[var(--text-1)] font-medium truncate">{appt.client?.name ?? 'Cliente sin nombre'}</p>
                  <p className="text-xs text-[var(--text-3)] truncate">
                    {appt.client?.phone ?? '—'}
                    {appt.service?.name ? ` · ${appt.service.name}` : ''}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-[var(--text-3)]">{formatDateTime(appt.scheduled_at)}</p>
                <span
                  className={`badge border-transparent mt-1 capitalize ${
                    APPOINTMENT_STATUS_STYLES[appt.status] ?? 'bg-[var(--bg-raised)] text-[var(--text-3)]'
                  }`}
                >
                  {APPOINTMENT_STATUS_LABELS[appt.status] ?? appt.status}
                </span>
              </div>
            </li>
          ))}
          {appointments.length === 0 && (
            <li className="py-6 flex flex-col items-center justify-center gap-2 text-center">
              <span className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] text-[var(--text-4)] grid place-items-center">
                <CalendarCheck className="w-5 h-5" />
              </span>
              <p className="text-sm text-[var(--text-3)]">Todavía no hay citas agendadas.</p>
            </li>
          )}
        </ul>
      </section>
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

function ActivityRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
}) {
  return (
    <li className="py-2.5 flex items-center justify-between text-sm">
      <span className="inline-flex items-center gap-2 text-[var(--text-2)]">
        <Icon className="w-4 h-4 text-[var(--text-3)]" />
        {label}
      </span>
      <span className="font-semibold text-[var(--text-1)]">{value}</span>
    </li>
  )
}
