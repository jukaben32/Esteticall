'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, User, Phone, Mail, DollarSign, CalendarCheck, CalendarDays, CalendarClock, X } from 'lucide-react'
import type { AppointmentWithDetails } from '@/types'
import { formatDateTime } from '@/lib/formatDate'
import {
  APPOINTMENT_STATUS_STYLES,
  APPOINTMENT_STATUS_LABELS,
  PAYMENT_STYLES,
  PAYMENT_LABELS,
  dayKeyInBusinessTZ,
} from '@/lib/appointmentFormat'

const MONTH_LABELS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]
const WEEKDAY_SHORT = ['DO', 'LU', 'MA', 'MI', 'JU', 'VI', 'SA']
const WEEKDAY_LONG = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

interface DayCell {
  year: number
  month: number
  day: number
  dayKey: string
  inCurrentMonth: boolean
}

function buildMonthGrid(year: number, month: number): DayCell[] {
  const firstWeekday = new Date(year, month, 1).getDay()
  const cells: DayCell[] = []
  const cursor = new Date(year, month, 1 - firstWeekday)

  for (let i = 0; i < 42; i++) {
    const y = cursor.getFullYear()
    const m = cursor.getMonth()
    const d = cursor.getDate()
    cells.push({ year: y, month: m, day: d, dayKey: `${y}-${pad(m + 1)}-${pad(d)}`, inCurrentMonth: m === month })
    cursor.setDate(cursor.getDate() + 1)
  }
  return cells
}

function formatDayHeader(dayKey: string): string {
  const [y, m, d] = dayKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return `${WEEKDAY_LONG[date.getDay()]}, ${d} de ${MONTH_LABELS[m - 1]}`
}

function AppointmentRow({ appt, onClick }: { appt: AppointmentWithDetails; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full py-2.5 flex items-center gap-3 text-left">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[var(--text-1)] truncate">
          {appt.client?.name ?? 'Cliente sin identificar'}
        </p>
        <p className="text-xs text-[var(--text-3)] truncate">
          {formatDateTime(appt.scheduled_at)}
          {appt.service ? ` · ${appt.service.name}` : ''}
        </p>
      </div>
      <span className={`badge border-transparent shrink-0 ${PAYMENT_STYLES[appt.payment_status] ?? ''}`}>
        {PAYMENT_LABELS[appt.payment_status] ?? appt.payment_status}
      </span>
      <span className={`badge border-transparent shrink-0 ${APPOINTMENT_STATUS_STYLES[appt.status] ?? ''}`}>
        {APPOINTMENT_STATUS_LABELS[appt.status] ?? appt.status}
      </span>
    </button>
  )
}

function AppointmentDrawer({
  appt,
  onClose,
  onUpdated,
}: {
  appt: AppointmentWithDetails
  onClose: () => void
  onUpdated: (appointment: AppointmentWithDetails) => void
}) {
  const [busy, setBusy] = useState(false)

  async function patch(body: Record<string, unknown>) {
    setBusy(true)
    const res = await fetch(`/api/appointments/${appt.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const { appointment } = await res.json()
      onUpdated({ ...appt, ...appointment })
    }
    setBusy(false)
  }

  async function markComplete() {
    await patch({ status: 'completed' })
  }
  async function cancel() {
    const cancellationReason = window.prompt('Motivo de cancelación (opcional):') ?? undefined
    await patch({ status: 'cancelled', cancellationReason })
  }
  async function markCashPaid() {
    await patch({ payment_status: 'cash' })
  }
  async function issueRefund() {
    await patch({ payment_status: 'refunded' })
  }

  const canDecide = appt.status !== 'completed' && appt.status !== 'cancelled'
  const canMarkPaid = appt.payment_status === 'pending' || appt.payment_status === 'not_required'
  const canRefund = appt.payment_status === 'cash' || appt.payment_status === 'paid'

  return (
    <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="fixed top-0 right-0 h-full w-full sm:w-96 bg-[var(--bg-surface)] shadow-xl overflow-y-auto p-5 space-y-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-full bg-[var(--teal-100)] text-[var(--teal-800)] grid place-items-center text-sm font-semibold shrink-0">
              {(appt.client?.name ?? '?').charAt(0).toUpperCase()}
            </span>
            <div>
              <h2 className="font-display font-semibold text-lg text-[var(--text-1)]">
                {appt.client?.name ?? 'Cliente sin identificar'}
              </h2>
              <p className="text-xs text-[var(--text-3)] mt-0.5">{formatDateTime(appt.scheduled_at)}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="text-[var(--text-3)] hover:text-[var(--text-1)] shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={`badge border-transparent ${APPOINTMENT_STATUS_STYLES[appt.status] ?? ''}`}>
            {APPOINTMENT_STATUS_LABELS[appt.status] ?? appt.status}
          </span>
          <span className={`badge border-transparent ${PAYMENT_STYLES[appt.payment_status] ?? ''}`}>
            {PAYMENT_LABELS[appt.payment_status] ?? appt.payment_status}
          </span>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wide text-[var(--text-3)] mb-2">Información del cliente</p>
          <div className="space-y-1.5 text-sm text-[var(--text-2)]">
            <p className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-[var(--text-4)]" /> {appt.client?.name ?? '—'}</p>
            <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-[var(--text-4)]" /> {appt.client?.phone ?? '—'}</p>
            <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-[var(--text-4)]" /> {appt.client?.email ?? '—'}</p>
            <p className="flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 text-[var(--text-4)]" />
              {appt.client?.budget ? `$${appt.client.budget.toLocaleString()}` : '—'}
            </p>
          </div>
        </div>

        {appt.service && (
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[var(--text-3)] mb-1">Servicio</p>
            <p className="text-sm font-medium text-[var(--text-1)]">{appt.service.name}</p>
            {appt.service.price != null && (
              <p className="text-xs text-[var(--text-3)]">Precio: ${appt.service.price.toLocaleString()}</p>
            )}
          </div>
        )}

        {appt.notes && (
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[var(--text-3)] mb-1">Notas</p>
            <p className="text-sm text-[var(--text-2)] whitespace-pre-wrap">{appt.notes}</p>
          </div>
        )}

        {appt.status === 'cancelled' && appt.cancellation_reason && (
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[var(--text-3)] mb-1">Motivo de cancelación</p>
            <p className="text-sm text-[var(--text-2)]">{appt.cancellation_reason}</p>
          </div>
        )}

        {canDecide && (
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[var(--text-3)] mb-2">Estado de la cita</p>
            <div className="flex gap-2">
              <button onClick={markComplete} disabled={busy} className="btn-primary flex-1">Marcar completada</button>
              <button onClick={cancel} disabled={busy} className="btn-secondary text-red-600">Cancelar</button>
            </div>
          </div>
        )}

        {(canMarkPaid || canRefund) && (
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[var(--text-3)] mb-2">Pago</p>
            {canMarkPaid && (
              <button onClick={markCashPaid} disabled={busy} className="btn-secondary w-full">Marcar como pagado (efectivo)</button>
            )}
            {canRefund && (
              <button onClick={issueRefund} disabled={busy} className="btn-secondary w-full text-red-600">Emitir reembolso</button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function ScheduleCalendar({
  initialAppointments,
  todayIso,
}: {
  initialAppointments: AppointmentWithDetails[]
  todayIso: string
}) {
  const [appointments, setAppointments] = useState(initialAppointments)
  const [selected, setSelected] = useState<AppointmentWithDetails | null>(null)

  const todayKey = dayKeyInBusinessTZ(todayIso)
  const todayDate = new Date(todayIso)
  const [viewYear, setViewYear] = useState(todayDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth())
  const [selectedDayKey, setSelectedDayKey] = useState(todayKey)

  const byDay = useMemo(() => {
    const map = new Map<string, AppointmentWithDetails[]>()
    for (const a of appointments) {
      const key = dayKeyInBusinessTZ(a.scheduled_at)
      const list = map.get(key) ?? []
      list.push(a)
      map.set(key, list)
    }
    for (const list of map.values()) list.sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
    return map
  }, [appointments])

  const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth])

  const todayAppointments = byDay.get(todayKey) ?? []
  const todayConfirmed = todayAppointments.filter((a) => a.status === 'scheduled').length
  const todayPending = todayAppointments.filter((a) => a.status === 'pending_confirmation').length
  const todayUnpaid = todayAppointments.filter((a) => a.payment_status === 'pending').length

  const selectedDayAppointments = byDay.get(selectedDayKey) ?? []

  const upcoming = useMemo(() => {
    const from = todayDate.getTime()
    const to = from + 30 * 86_400_000
    return appointments
      .filter((a) => {
        const t = new Date(a.scheduled_at).getTime()
        return t >= from && t <= to && a.status !== 'cancelled'
      })
      .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
  }, [appointments, todayDate])

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1)
      setViewMonth(11)
    } else {
      setViewMonth((m) => m - 1)
    }
  }
  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1)
      setViewMonth(0)
    } else {
      setViewMonth((m) => m + 1)
    }
  }
  function goToday() {
    setViewYear(todayDate.getFullYear())
    setViewMonth(todayDate.getMonth())
    setSelectedDayKey(todayKey)
  }
  function selectDay(cell: DayCell) {
    setSelectedDayKey(cell.dayKey)
    if (!cell.inCurrentMonth) {
      setViewYear(cell.year)
      setViewMonth(cell.month)
    }
  }

  function handleUpdated(appointment: AppointmentWithDetails) {
    setAppointments((prev) => prev.map((a) => (a.id === appointment.id ? appointment : a)))
    setSelected(appointment)
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="stat-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--text-3)]">Hoy</p>
            <CalendarDays className="w-4 h-4 text-[var(--teal-600)]" />
          </div>
          <p className="text-2xl font-bold text-[var(--text-1)]">{todayAppointments.length}</p>
        </div>
        <div className="stat-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--text-3)]">Confirmadas</p>
            <CalendarCheck className="w-4 h-4 text-[var(--teal-700)]" />
          </div>
          <p className="text-2xl font-bold text-[var(--teal-700)]">{todayConfirmed}</p>
        </div>
        <div className="stat-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--text-3)]">Pendientes</p>
            <CalendarClock className="w-4 h-4 text-[var(--gold)]" />
          </div>
          <p className="text-2xl font-bold text-[var(--gold)]">{todayPending}</p>
        </div>
        <div className="stat-card p-4" style={{ borderLeftColor: '#dc2626' }}>
          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--text-3)]">Sin pagar hoy</p>
            <DollarSign className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-600">{todayUnpaid}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        <div className="card-surface p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-display font-semibold text-[var(--text-1)]">
              {MONTH_LABELS[viewMonth]} {viewYear}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-[var(--bg-raised)]">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={goToday} className="btn-secondary text-xs px-2 py-1">Hoy</button>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-[var(--bg-raised)]">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-[var(--text-4)] mb-1">
            {WEEKDAY_SHORT.map((d) => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {grid.map((cell) => {
              const hasAppointments = (byDay.get(cell.dayKey)?.length ?? 0) > 0
              const isSelected = cell.dayKey === selectedDayKey
              const isToday = cell.dayKey === todayKey
              return (
                <button
                  key={cell.dayKey}
                  onClick={() => selectDay(cell)}
                  className={`aspect-square rounded-lg text-sm flex flex-col items-center justify-center gap-0.5 transition
                    ${!cell.inCurrentMonth ? 'text-[var(--text-4)]' : 'text-[var(--text-1)]'}
                    ${isSelected ? 'bg-[var(--teal-600)] text-white' : isToday ? 'bg-[var(--teal-50)]' : 'hover:bg-[var(--bg-raised)]'}`}
                >
                  <span>{cell.day}</span>
                  {hasAppointments && (
                    <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-[var(--teal-600)]'}`} />
                  )}
                </button>
              )
            })}
          </div>
          <p className="text-[10px] text-[var(--text-4)] mt-2 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-[var(--teal-600)] inline-block" /> Tiene citas
          </p>
        </div>

        <div className="card-surface p-4">
          <p className="font-display font-semibold text-[var(--text-1)] capitalize">{formatDayHeader(selectedDayKey)}</p>
          <p className="text-xs text-[var(--text-3)] mb-2">
            {selectedDayAppointments.length} {selectedDayAppointments.length === 1 ? 'cita' : 'citas'}
          </p>
          <div className="divide-y divide-[var(--border)]">
            {selectedDayAppointments.map((appt) => (
              <AppointmentRow key={appt.id} appt={appt} onClick={() => setSelected(appt)} />
            ))}
            {selectedDayAppointments.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                <span className="w-9 h-9 rounded-full bg-[var(--bg-subtle)] text-[var(--text-4)] grid place-items-center">
                  <CalendarDays className="w-4 h-4" />
                </span>
                <p className="text-sm text-[var(--text-3)]">No hay citas este día.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card-surface p-4 mt-4">
        <p className="font-display font-semibold text-[var(--text-1)]">Próximas · 30 días</p>
        <p className="text-xs text-[var(--text-3)] mb-2">{upcoming.length} programadas</p>
        <div className="divide-y divide-[var(--border)]">
          {upcoming.map((appt) => (
            <AppointmentRow key={appt.id} appt={appt} onClick={() => setSelected(appt)} />
          ))}
          {upcoming.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
              <span className="w-9 h-9 rounded-full bg-[var(--bg-subtle)] text-[var(--text-4)] grid place-items-center">
                <CalendarClock className="w-4 h-4" />
              </span>
              <p className="text-sm text-[var(--text-3)]">No hay citas programadas en los próximos 30 días.</p>
            </div>
          )}
        </div>
      </div>

      {selected && <AppointmentDrawer appt={selected} onClose={() => setSelected(null)} onUpdated={handleUpdated} />}
    </div>
  )
}
