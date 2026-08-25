'use client'

import { User, Phone, Mail, CalendarClock, Clock3, Tag, StickyNote, X } from 'lucide-react'
import type { AppointmentWithDetails } from '@/types'
import { formatDateTime } from '@/lib/formatDate'
import {
  APPOINTMENT_STATUS_STYLES as STATUS_STYLES,
  APPOINTMENT_STATUS_LABELS as STATUS_LABELS,
  PAYMENT_STYLES,
  PAYMENT_LABELS,
} from '@/lib/appointmentFormat'

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <Icon className="w-4 h-4 text-[var(--text-3)] shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)]">{label}</p>
        <p className="text-[var(--text-1)] font-medium truncate">{value}</p>
      </div>
    </div>
  )
}

export function AppointmentDetailsPanel({
  appt,
  durationMinutes,
  onClose,
}: {
  appt: AppointmentWithDetails
  durationMinutes: number
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:w-[420px] h-full bg-[var(--bg-page)] shadow-2xl overflow-y-auto"
      >
        <div className="sticky top-0 z-10 bg-[var(--teal-700)] text-white px-5 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display font-semibold text-lg">Detalles de la cita</h2>
            <p className="text-[11px] text-white/70 truncate">ID: {appt.id.slice(0, 8)}...</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1 -mr-1 -mt-1 text-white/80 hover:text-white shrink-0 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex flex-wrap gap-2">
            <span className={`badge border-transparent ${STATUS_STYLES[appt.status] ?? ''}`}>
              <span className="status-dot bg-current" />
              {STATUS_LABELS[appt.status] ?? appt.status}
            </span>
            <span className={`badge border-transparent ${PAYMENT_STYLES[appt.payment_status] ?? ''}`}>
              {PAYMENT_LABELS[appt.payment_status] ?? appt.payment_status}
            </span>
          </div>

          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">
              Información del cliente
            </p>
            <div className="card-surface p-3.5 space-y-3">
              <InfoRow icon={User} label="Nombre completo" value={appt.client?.name ?? 'Sin identificar'} />
              <InfoRow icon={Phone} label="Teléfono" value={appt.client?.phone ?? '—'} />
              <InfoRow icon={Mail} label="Correo" value={appt.client?.email ?? '—'} />
            </div>
          </section>

          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Cita</p>
            <div className="card-surface p-3.5 space-y-3">
              <InfoRow icon={CalendarClock} label="Programada" value={formatDateTime(appt.scheduled_at)} />
              <InfoRow icon={Clock3} label="Duración" value={`${durationMinutes} minutos`} />
              <InfoRow
                icon={Tag}
                label="Tratamiento"
                value={appt.service?.name ?? 'Sin tratamiento asignado'}
              />
            </div>
          </section>

          {(appt.notes || (appt.status === 'cancelled' && appt.cancellation_reason)) && (
            <section>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Notas</p>
              <div className="card-surface p-3.5 flex items-start gap-2.5">
                <StickyNote className="w-4 h-4 text-[var(--text-3)] shrink-0 mt-0.5" />
                <p className="text-sm text-[var(--text-2)] whitespace-pre-wrap">
                  {appt.status === 'cancelled' && appt.cancellation_reason ? appt.cancellation_reason : appt.notes}
                </p>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
