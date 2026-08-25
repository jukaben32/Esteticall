'use client'

import { useMemo, useState } from 'react'
import { Banknote, CalendarCheck, CalendarX2, CheckCircle2, CreditCard, Eye, Search, X, XCircle } from 'lucide-react'
import type { AppointmentWithDetails, BusinessService } from '@/types'
import { APPOINTMENT_STATUSES } from '@/constants'
import { formatDateTime } from '@/lib/formatDate'
import {
  APPOINTMENT_STATUS_STYLES as STATUS_STYLES,
  APPOINTMENT_STATUS_LABELS as STATUS_LABELS,
  PAYMENT_STYLES,
  PAYMENT_LABELS,
} from '@/lib/appointmentFormat'
import { NewAppointmentModal } from '@/components/NewAppointmentModal'

function initials(name: string | null | undefined): string {
  const clean = name?.trim()
  if (!clean) return '?'
  const parts = clean.split(/\s+/).slice(0, 2)
  return parts.map((part) => part.charAt(0).toUpperCase()).join('')
}

function paymentLabel(status: string): string {
  if (status === 'paid') return 'Pagado (Stripe)'
  return PAYMENT_LABELS[status] ?? status
}

function serviceLabel(appt: AppointmentWithDetails): string {
  return appt.service?.name ?? 'Sin tratamiento asignado'
}

function AppointmentDetailsModal({ appt, onClose }: { appt: AppointmentWithDetails; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-3 overflow-y-auto" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="card-raised w-full max-w-lg my-6 p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-full bg-[var(--teal-50)] text-[var(--teal-700)] grid place-items-center shrink-0">
              <CalendarCheck className="w-4 h-4" />
            </span>
            <div>
              <h2 className="font-display font-semibold text-lg text-[var(--text-1)]">Detalles de la cita</h2>
              <p className="text-xs text-[var(--text-3)] mt-0.5">
                {formatDateTime(appt.scheduled_at)}
                {appt.service ? ` - ${appt.service.name}` : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="text-[var(--text-3)] hover:text-[var(--text-1)] shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={`badge border-transparent ${STATUS_STYLES[appt.status] ?? ''}`}>
            {STATUS_LABELS[appt.status] ?? appt.status}
          </span>
          <span className={`badge border-transparent ${PAYMENT_STYLES[appt.payment_status] ?? ''}`}>
            {paymentLabel(appt.payment_status)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-[var(--bg-raised)] rounded-lg p-3 text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[var(--text-3)]">Cliente</p>
            <p className="text-[var(--text-1)] font-medium truncate">{appt.client?.name ?? '-'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[var(--text-3)]">Telefono</p>
            <p className="text-[var(--text-1)] font-medium truncate">{appt.client?.phone ?? '-'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[var(--text-3)]">Correo</p>
            <p className="text-[var(--text-1)] font-medium truncate">{appt.client?.email ?? '-'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[var(--text-3)]">Tratamiento</p>
            <p className="text-[var(--text-1)] font-medium truncate">{serviceLabel(appt)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[var(--text-3)]">Pago</p>
            <p className="text-[var(--text-1)] font-medium truncate">{paymentLabel(appt.payment_status)}</p>
          </div>
        </div>

        {appt.notes && (
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[var(--text-3)] mb-1">Notas</p>
            <p className="text-sm text-[var(--text-2)] whitespace-pre-wrap">{appt.notes}</p>
          </div>
        )}

        {appt.status === 'cancelled' && appt.cancellation_reason && (
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[var(--text-3)] mb-1">Motivo de cancelacion</p>
            <p className="text-sm text-[var(--text-2)]">{appt.cancellation_reason}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function AppointmentsManager({
  initialAppointments,
  services,
}: {
  initialAppointments: AppointmentWithDetails[]
  services: BusinessService[]
}) {
  const [appointments, setAppointments] = useState(initialAppointments)
  const [status, setStatus] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [viewing, setViewing] = useState<AppointmentWithDetails | null>(null)

  const confirmedCount = appointments.filter((a) => a.status === 'scheduled').length
  const pendingCount = appointments.filter((a) => a.status === 'pending_confirmation').length

  const filtered = useMemo(
    () =>
      appointments.filter((a) => {
        if (status !== 'all' && a.status !== status) return false
        if (search) {
          const q = search.toLowerCase()
          const haystack = `${a.client?.name ?? ''} ${a.client?.phone ?? ''} ${a.client?.email ?? ''} ${a.service?.name ?? ''}`.toLowerCase()
          if (!haystack.includes(q)) return false
        }
        return true
      }),
    [appointments, status, search]
  )

  async function patchAppointment(appt: AppointmentWithDetails, body: Record<string, unknown>) {
    const res = await fetch(`/api/appointments/${appt.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const { appointment } = await res.json()
      const updated = { ...appt, ...appointment }
      setAppointments((prev) => prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)))
      setViewing((prev) => (prev?.id === updated.id ? { ...prev, ...updated } : prev))
    }
  }

  async function setAppointmentStatus(appt: AppointmentWithDetails, nextStatus: string) {
    let cancellationReason: string | undefined
    if (nextStatus === 'cancelled') {
      cancellationReason = window.prompt('Motivo de cancelacion (opcional):') ?? undefined
    }
    await patchAppointment(appt, { status: nextStatus, cancellationReason })
  }

  async function setAppointmentPayment(appt: AppointmentWithDetails, paymentStatus: AppointmentWithDetails['payment_status']) {
    await patchAppointment(appt, { payment_status: paymentStatus })
  }

  function renderActions(appt: AppointmentWithDetails) {
    const canMarkCash = appt.payment_status === 'pending' || appt.payment_status === 'not_required' || appt.payment_status === 'refunded'
    const canResetCash = appt.payment_status === 'cash'
    const canComplete = appt.status !== 'completed' && appt.status !== 'cancelled'
    const canCancel = appt.status !== 'cancelled'

    return (
      <div className="flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={() => setViewing(appt)}
          title="Ver detalles"
          className="w-7 h-7 rounded-full bg-[var(--bg-subtle)] text-[var(--teal-700)] grid place-items-center hover:bg-[var(--teal-100)]"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
        {canMarkCash && (
          <button
            type="button"
            onClick={() => setAppointmentPayment(appt, 'cash')}
            title="Marcar pagado en efectivo"
            className="w-7 h-7 rounded-full bg-[var(--bg-raised)] text-[var(--teal-700)] grid place-items-center hover:bg-[var(--teal-50)]"
          >
            <Banknote className="w-3.5 h-3.5" />
          </button>
        )}
        {canResetCash && (
          <button
            type="button"
            onClick={() => setAppointmentPayment(appt, 'pending')}
            title="Marcar pago pendiente"
            className="w-7 h-7 rounded-full bg-[var(--bg-raised)] text-[var(--gold)] grid place-items-center hover:bg-[var(--teal-50)]"
          >
            <CreditCard className="w-3.5 h-3.5" />
          </button>
        )}
        {canComplete && (
          <button
            type="button"
            onClick={() => setAppointmentStatus(appt, 'completed')}
            title="Marcar completada"
            className="w-7 h-7 rounded-full bg-[var(--bg-raised)] text-[var(--teal-700)] grid place-items-center hover:bg-[var(--teal-50)]"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>
        )}
        {canCancel && (
          <button
            type="button"
            onClick={() => setAppointmentStatus(appt, 'cancelled')}
            title="Cancelar cita"
            className="w-7 h-7 rounded-full bg-red-50 text-red-600 grid place-items-center hover:bg-red-100"
          >
            <XCircle className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-full bg-[var(--teal-50)] text-[var(--teal-700)] grid place-items-center shrink-0">
            <CalendarCheck className="w-4 h-4" />
          </span>
          <div>
            <h1 className="font-display font-semibold text-xl text-[var(--text-1)]">Citas</h1>
            <p className="text-sm text-[var(--text-3)]">
              {appointments.length} en total - {confirmedCount} confirmadas - {pendingCount} pendientes
            </p>
          </div>
        </div>
        <button className="btn-primary sm:shrink-0" onClick={() => setShowForm(true)}>+ Nueva cita</button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center mb-4">
        <label className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-4)]" />
          <input
            placeholder="Buscar por nombre, telefono, correo o tratamiento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field sm:w-52">
          <option value="all">Todos los estados</option>
          {APPOINTMENT_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
          ))}
        </select>
      </div>

      <div className="hidden md:block overflow-x-auto rounded-2xl border border-[var(--border)] bg-white">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-[var(--teal-50)]/80 text-[10px] uppercase tracking-widest text-[var(--teal-800)]">
            <tr>
              <th className="px-4 py-3 text-left font-bold">Cliente</th>
              <th className="px-4 py-3 text-left font-bold">Tratamiento</th>
              <th className="px-4 py-3 text-left font-bold">Fecha</th>
              <th className="px-4 py-3 text-left font-bold">Pago</th>
              <th className="px-4 py-3 text-left font-bold">Estado</th>
              <th className="px-4 py-3 text-right font-bold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {filtered.map((appt) => (
              <tr key={appt.id} className="align-middle hover:bg-[var(--bg-page)]/70 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-full bg-[var(--teal-100)] text-[var(--teal-800)] grid place-items-center text-sm font-semibold shrink-0">
                      {initials(appt.client?.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--text-1)] truncate">{appt.client?.name ?? 'Cliente sin identificar'}</p>
                      <p className="text-[11px] text-[var(--text-3)] truncate">{appt.client?.phone ?? '-'}</p>
                      <p className="text-[11px] text-[var(--text-4)] truncate">{appt.client?.email ?? '-'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-[var(--text-2)]">
                  <p className="font-medium text-[var(--text-1)]">{serviceLabel(appt)}</p>
                </td>
                <td className="px-4 py-3 text-xs text-[var(--text-2)] whitespace-nowrap">{formatDateTime(appt.scheduled_at)}</td>
                <td className="px-4 py-3">
                  <span className={`badge border-transparent ${PAYMENT_STYLES[appt.payment_status] ?? ''}`}>
                    {paymentLabel(appt.payment_status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`badge border-transparent ${STATUS_STYLES[appt.status] ?? ''}`}>
                    {STATUS_LABELS[appt.status] ?? appt.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {renderActions(appt)}
                    <select
                      value={appt.status}
                      onChange={(e) => setAppointmentStatus(appt, e.target.value)}
                      className={`input-field w-36 text-xs py-1 border-transparent ${STATUS_STYLES[appt.status] ?? ''}`}
                    >
                      {APPOINTMENT_STATUSES.map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
                      ))}
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-white px-3">
        {filtered.map((appt) => (
          <div key={appt.id} className="py-3">
            <div className="flex items-start gap-2.5">
              <span className="w-9 h-9 rounded-full bg-[var(--teal-100)] text-[var(--teal-800)] grid place-items-center text-sm font-semibold shrink-0">
                {initials(appt.client?.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[var(--text-1)] truncate">{appt.client?.name ?? 'Cliente sin identificar'}</p>
                <p className="text-xs text-[var(--text-3)] truncate">{appt.client?.phone ?? '-'} - {appt.client?.email ?? '-'}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[var(--text-2)]">
                  <p><span className="text-[var(--text-4)]">Tratamiento:</span> {serviceLabel(appt)}</p>
                  <p className="col-span-2"><span className="text-[var(--text-4)]">Fecha:</span> {formatDateTime(appt.scheduled_at)}</p>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`badge border-transparent ${PAYMENT_STYLES[appt.payment_status] ?? ''}`}>{paymentLabel(appt.payment_status)}</span>
                  <span className={`badge border-transparent ${STATUS_STYLES[appt.status] ?? ''}`}>{STATUS_LABELS[appt.status] ?? appt.status}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              {renderActions(appt)}
              <select
                value={appt.status}
                onChange={(e) => setAppointmentStatus(appt, e.target.value)}
                className={`input-field w-40 text-xs py-1 border-transparent ${STATUS_STYLES[appt.status] ?? ''}`}
              >
                {APPOINTMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <span className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] text-[var(--text-4)] grid place-items-center">
            <CalendarX2 className="w-5 h-5" />
          </span>
          <p className="text-sm text-[var(--text-3)]">
            {appointments.length === 0 ? 'Todavia no hay citas registradas.' : 'Ninguna cita coincide con este filtro.'}
          </p>
        </div>
      )}

      {showForm && (
        <NewAppointmentModal
          services={services}
          onCreated={(appointment) => {
            setAppointments((prev) => [appointment, ...prev])
            setShowForm(false)
          }}
          onClose={() => setShowForm(false)}
        />
      )}

      {viewing && <AppointmentDetailsModal appt={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}
