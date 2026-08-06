'use client'

import { useMemo, useState } from 'react'
import { Eye, CalendarCheck, X, CalendarX2 } from 'lucide-react'
import type { AppointmentWithDetails, BusinessService, Listing } from '@/types'
import { APPOINTMENT_STATUSES } from '@/constants'
import { formatDateTime } from '@/lib/formatDate'
import {
  APPOINTMENT_STATUS_STYLES as STATUS_STYLES,
  APPOINTMENT_STATUS_LABELS as STATUS_LABELS,
  PAYMENT_STYLES,
  PAYMENT_LABELS,
} from '@/lib/appointmentFormat'
import { NewViewingModal } from '@/components/NewViewingModal'

function ViewingDetailsModal({ appt, onClose }: { appt: AppointmentWithDetails; onClose: () => void }) {
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
                {appt.service ? ` · ${appt.service.name}` : ''}
                {appt.listing ? ` · ${appt.listing.title}` : ''}
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
            {PAYMENT_LABELS[appt.payment_status] ?? appt.payment_status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-[var(--bg-raised)] rounded-lg p-3 text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[var(--text-3)]">Cliente</p>
            <p className="text-[var(--text-1)] font-medium truncate">{appt.client?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[var(--text-3)]">Teléfono</p>
            <p className="text-[var(--text-1)] font-medium truncate">{appt.client?.phone ?? '—'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[var(--text-3)]">Correo</p>
            <p className="text-[var(--text-1)] font-medium truncate">{appt.client?.email ?? '—'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[var(--text-3)]">Presupuesto</p>
            <p className="text-[var(--text-1)] font-medium truncate">
              {appt.client?.budget ? `$${appt.client.budget.toLocaleString()}` : '—'}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-[10px] uppercase tracking-wide text-[var(--text-3)]">No. de pre-aprobación</p>
            <p className="text-[var(--text-1)] font-medium truncate">{appt.client?.pre_approval_number ?? '—'}</p>
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
            <p className="text-[10px] uppercase tracking-wide text-[var(--text-3)] mb-1">Motivo de cancelación</p>
            <p className="text-sm text-[var(--text-2)]">{appt.cancellation_reason}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function ViewingsManager({
  initialAppointments,
  services,
  listings,
}: {
  initialAppointments: AppointmentWithDetails[]
  services: BusinessService[]
  listings: Pick<Listing, 'id' | 'title' | 'listing_code' | 'status'>[]
}) {
  const [appointments, setAppointments] = useState(initialAppointments)
  const [status, setStatus] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [viewing, setViewing] = useState<AppointmentWithDetails | null>(null)

  const filtered = useMemo(
    () =>
      appointments.filter((a) => {
        if (status !== 'all' && a.status !== status) return false
        if (search) {
          const q = search.toLowerCase()
          const haystack = `${a.client?.name ?? ''} ${a.client?.phone ?? ''} ${a.client?.email ?? ''}`.toLowerCase()
          if (!haystack.includes(q)) return false
        }
        return true
      }),
    [appointments, status, search]
  )

  async function setAppointmentStatus(id: string, nextStatus: string) {
    let cancellationReason: string | undefined
    if (nextStatus === 'cancelled') {
      cancellationReason = window.prompt('Motivo de cancelación (opcional):') ?? undefined
    }
    const res = await fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus, cancellationReason }),
    })
    if (res.ok) {
      const { appointment } = await res.json()
      setAppointments((prev) => prev.map((a) => (a.id === appointment.id ? { ...a, ...appointment } : a)))
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          placeholder="Buscar por nombre, teléfono o correo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field flex-1 min-w-[200px]"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field w-auto">
          <option value="all">Todos los estados</option>
          {APPOINTMENT_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
          ))}
        </select>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Nueva cita</button>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {filtered.map((appt) => (
          <div key={appt.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex-1 min-w-0 flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-[var(--teal-100)] text-[var(--teal-800)] grid place-items-center text-sm font-semibold shrink-0">
                {(appt.client?.name ?? '?').charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="font-medium text-[var(--text-1)] truncate">
                  {appt.client?.name ?? 'Cliente sin identificar'}
                </p>
                <p className="text-xs text-[var(--text-3)] truncate">
                  {[
                    appt.client?.budget ? `Presupuesto: $${appt.client.budget.toLocaleString()}` : null,
                    appt.client?.pre_approval_number ? `Pre-aprobación: ${appt.client.pre_approval_number}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </p>
                <p className="text-xs text-[var(--text-4)]">
                  {appt.service?.name ?? 'Sin servicio asignado'}
                  {appt.listing ? ` · ${appt.listing.title}` : ' · Sin propiedad asignada'} · {formatDateTime(appt.scheduled_at)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`badge border-transparent ${PAYMENT_STYLES[appt.payment_status] ?? ''}`}>
                {PAYMENT_LABELS[appt.payment_status] ?? appt.payment_status}
              </span>
              <select
                value={appt.status}
                onChange={(e) => setAppointmentStatus(appt.id, e.target.value)}
                className={`input-field w-auto text-xs py-1 border-transparent ${STATUS_STYLES[appt.status] ?? ''}`}
              >
                {APPOINTMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
                ))}
              </select>
              <button
                onClick={() => setViewing(appt)}
                title="Ver detalles"
                className="p-1.5 rounded-lg text-[var(--text-3)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-1)]"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <span className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] text-[var(--text-4)] grid place-items-center">
              <CalendarX2 className="w-5 h-5" />
            </span>
            <p className="text-sm text-[var(--text-3)]">
              {appointments.length === 0 ? 'Todavía no hay citas registradas.' : 'Ninguna cita coincide con este filtro.'}
            </p>
          </div>
        )}
      </div>

      {showForm && (
        <NewViewingModal
          services={services}
          listings={listings}
          onCreated={(appointment) => {
            setAppointments((prev) => [appointment, ...prev])
            setShowForm(false)
          }}
          onClose={() => setShowForm(false)}
        />
      )}

      {viewing && <ViewingDetailsModal appt={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}
