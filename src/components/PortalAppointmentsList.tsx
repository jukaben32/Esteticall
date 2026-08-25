'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, RefreshCw, CalendarClock, Ban, Building2, CreditCard } from 'lucide-react'
import type { PortalAppointment } from '@/types'
import { formatDateTime } from '@/lib/formatDate'
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_STYLES, PAYMENT_LABELS, PAYMENT_STYLES } from '@/lib/appointmentFormat'
import { PortalRescheduleModal } from './PortalRescheduleModal'
import { PortalPayModal } from './PortalPayModal'

const MONTH_ABBR = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

function dateBadgeParts(iso: string): { month: string; day: string } {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Santo_Domingo', month: 'numeric', day: 'numeric' }).formatToParts(
    new Date(iso)
  )
  const map: Record<string, string> = {}
  for (const p of parts) map[p.type] = p.value
  return { month: MONTH_ABBR[Number(map.month) - 1] ?? '', day: map.day ?? '' }
}

export function PortalAppointmentsList({ initialAppointments }: { initialAppointments: PortalAppointment[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [appointments, setAppointments] = useState(initialAppointments)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [rescheduling, setRescheduling] = useState<PortalAppointment | null>(null)
  const [paying, setPaying] = useState<PortalAppointment | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    setRefreshing(true)
    const res = await fetch('/api/portal/appointments')
    if (res.ok) {
      const data = await res.json()
      setAppointments(data.appointments)
    }
    setRefreshing(false)
  }

  // Stripe redirects back here with ?paid=<appointmentId>&session_id=... after
  // checkout — there's no per-business webhook, so this is what actually
  // marks the payment (see the pay-online/confirm route for why).
  useEffect(() => {
    const paidId = searchParams.get('paid')
    const sessionId = searchParams.get('session_id')
    if (!paidId || !sessionId) return
    fetch(`/api/portal/appointments/${paidId}/pay-online/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.appointment) {
          setAppointments((prev) => prev.map((a) => (a.id === data.appointment.id ? { ...a, ...data.appointment } : a)))
        }
      })
      .catch(() => {})
      .finally(() => router.replace('/portal'))
    // Only ever needs to run once, right after the redirect lands.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCancel(appt: PortalAppointment) {
    const reason = window.prompt('¿Motivo de la cancelación? (opcional)') ?? undefined
    setCancellingId(appt.id)
    setError(null)
    const res = await fetch(`/api/portal/appointments/${appt.id}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
    const data = await res.json()
    setCancellingId(null)
    if (!res.ok) {
      setError(data.error ?? 'No se pudo cancelar la cita')
      return
    }
    setAppointments((prev) => prev.map((a) => (a.id === appt.id ? { ...a, ...data.appointment } : a)))
  }

  const [now] = useState(() => Date.now())
  const upcoming = appointments.filter((a) => a.status !== 'cancelled' && new Date(a.scheduled_at).getTime() >= now)
  const past = appointments.filter((a) => a.status === 'cancelled' || new Date(a.scheduled_at).getTime() < now)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-[var(--text-1)]">My Appointments</h1>
        </div>
        <button type="button" onClick={refresh} className="btn-secondary !text-xs" disabled={refreshing}>
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {appointments.length === 0 && (
        <div className="card-raised p-8 text-center">
          <p className="text-sm text-[var(--text-3)]">Todavía no tienes citas. Cuando agendes una visita, aparecerá aquí.</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <section className="space-y-3">
          <p className="text-xs font-semibold tracking-wide text-[var(--text-3)]">UPCOMING · {upcoming.length}</p>
          {upcoming.map((appt) => (
            <AppointmentCard
              key={appt.id}
              appt={appt}
              expanded={expandedId === appt.id}
              onToggle={() => setExpandedId((cur) => (cur === appt.id ? null : appt.id))}
              onReschedule={() => setRescheduling(appt)}
              onCancel={() => handleCancel(appt)}
              onPay={() => setPaying(appt)}
              busy={cancellingId === appt.id}
              now={now}
            />
          ))}
        </section>
      )}

      {past.length > 0 && (
        <section className="space-y-3">
          <p className="text-xs font-semibold tracking-wide text-[var(--text-3)]">PAST · {past.length}</p>
          {past.map((appt) => (
            <AppointmentCard
              key={appt.id}
              appt={appt}
              expanded={expandedId === appt.id}
              onToggle={() => setExpandedId((cur) => (cur === appt.id ? null : appt.id))}
              onReschedule={() => setRescheduling(appt)}
              onCancel={() => handleCancel(appt)}
              onPay={() => setPaying(appt)}
              busy={cancellingId === appt.id}
              now={now}
            />
          ))}
        </section>
      )}

      {rescheduling && (
        <PortalRescheduleModal
          appointment={rescheduling}
          onClose={() => setRescheduling(null)}
          onRescheduled={(updated) => {
            setAppointments((prev) => prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)))
            setRescheduling(null)
          }}
        />
      )}

      {paying && (
        <PortalPayModal
          appointment={paying}
          onClose={() => setPaying(null)}
          onPaid={(updated) => {
            setAppointments((prev) => prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)))
            setPaying(null)
          }}
        />
      )}
    </div>
  )
}

function AppointmentCard({
  appt,
  expanded,
  onToggle,
  onReschedule,
  onCancel,
  onPay,
  busy,
  now,
}: {
  appt: PortalAppointment
  expanded: boolean
  onToggle: () => void
  onReschedule: () => void
  onCancel: () => void
  onPay: () => void
  busy: boolean
  now: number
}) {
  const { month, day } = dateBadgeParts(appt.scheduled_at)
  const title = appt.service?.name ?? 'Cita'
  const canAct = appt.status !== 'cancelled' && appt.status !== 'completed' && new Date(appt.scheduled_at).getTime() >= now

  return (
    <div className="card-raised overflow-hidden">
      <button type="button" onClick={onToggle} className="w-full flex items-start gap-3 p-4 text-left">
        <div className="shrink-0 w-11 rounded-lg bg-[var(--teal-50)] text-[var(--teal-700)] text-center py-1.5">
          <p className="text-[10px] font-semibold leading-none">{month}</p>
          <p className="text-lg font-display font-bold leading-tight">{day}</p>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`badge border-transparent ${APPOINTMENT_STATUS_STYLES[appt.status] ?? ''}`}>
              {APPOINTMENT_STATUS_LABELS[appt.status] ?? appt.status}
            </span>
            {appt.payment_status !== 'not_required' && (
              <span className={`badge border-transparent ${PAYMENT_STYLES[appt.payment_status] ?? ''}`}>
                {PAYMENT_LABELS[appt.payment_status] ?? appt.payment_status}
              </span>
            )}
          </div>
          <p className="font-semibold text-[var(--text-1)] mt-1 truncate">{title}</p>
          <p className="text-xs text-[var(--text-3)] mt-0.5">{formatDateTime(appt.scheduled_at)}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-[var(--text-4)] shrink-0 mt-1 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="px-4 pb-3 border-t border-[var(--border)] pt-3 space-y-2 text-sm">
          <p className="flex items-center gap-2 text-[var(--text-2)]">
            <Building2 className="w-3.5 h-3.5 text-[var(--text-4)]" />
            {appt.business?.name ?? '—'}
          </p>
          {appt.notes && <p className="text-[var(--text-3)] text-xs">{appt.notes}</p>}
          {appt.status === 'cancelled' && appt.cancellation_reason && (
            <p className="text-xs text-red-600">Motivo de cancelación: {appt.cancellation_reason}</p>
          )}
        </div>
      )}

      {canAct && (
        <div className="px-4 pb-4 flex items-center gap-2 flex-wrap">
          {appt.payment_status === 'pending' && (
            <button type="button" onClick={onPay} className="btn-secondary !text-xs">
              <CreditCard className="w-3.5 h-3.5" />
              Pay Now
            </button>
          )}
          <button type="button" onClick={onReschedule} className="btn-secondary !text-xs">
            <CalendarClock className="w-3.5 h-3.5" />
            Reschedule
          </button>
          <button type="button" onClick={onCancel} disabled={busy} className="btn-secondary !text-xs !text-red-600 !border-red-200">
            <Ban className="w-3.5 h-3.5" />
            {busy ? 'Cancelando…' : 'Cancel'}
          </button>
        </div>
      )}
    </div>
  )
}
