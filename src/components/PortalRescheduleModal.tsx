'use client'

import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import type { AvailableSlot, PortalAppointment, Appointment } from '@/types'
import { formatDate } from '@/lib/formatDate'

export function PortalRescheduleModal({
  appointment,
  onClose,
  onRescheduled,
}: {
  appointment: PortalAppointment
  onClose: () => void
  onRescheduled: (appointment: Appointment) => void
}) {
  const [slots, setSlots] = useState<AvailableSlot[] | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedDatetime, setSelectedDatetime] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/widget/public/${appointment.business_id}/slots?daysAhead=30`)
      .then((res) => res.json())
      .then((data) => setSlots(data.slots ?? []))
      .catch(() => setSlots([]))
  }, [appointment.business_id])

  const dates = useMemo(() => Array.from(new Set((slots ?? []).map((s) => s.date))), [slots])
  const timesForSelectedDate = useMemo(
    () => (slots ?? []).filter((s) => s.date === selectedDate),
    [slots, selectedDate]
  )

  async function handleConfirm() {
    if (!selectedDatetime) return
    setSubmitting(true)
    setError(null)
    const res = await fetch(`/api/portal/appointments/${appointment.id}/reschedule`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduledAt: selectedDatetime }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) {
      setError(data.error ?? 'No se pudo reprogramar la cita')
      return
    }
    onRescheduled(data.appointment)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card-raised w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-[var(--text-1)]">Reschedule</h2>
          <button type="button" onClick={onClose} className="text-[var(--text-4)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {slots === null && <p className="text-sm text-[var(--text-3)]">Cargando horarios disponibles…</p>}
        {slots !== null && dates.length === 0 && (
          <p className="text-sm text-[var(--text-3)]">No hay horarios disponibles por ahora. Contacta a la agencia.</p>
        )}

        {dates.length > 0 && (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-[var(--text-3)] mb-1.5">Fecha</p>
              <div className="flex flex-wrap gap-1.5">
                {dates.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setSelectedDate(d)
                      setSelectedDatetime(null)
                    }}
                    className={`badge border-transparent cursor-pointer ${
                      selectedDate === d ? 'bg-[var(--teal-700)] text-white' : 'bg-[var(--bg-subtle)] text-[var(--text-2)]'
                    }`}
                  >
                    {formatDate(`${d}T12:00:00.000-04:00`)}
                  </button>
                ))}
              </div>
            </div>

            {selectedDate && (
              <div>
                <p className="text-xs text-[var(--text-3)] mb-1.5">Hora</p>
                <div className="flex flex-wrap gap-1.5">
                  {timesForSelectedDate.map((s) => (
                    <button
                      key={s.datetime}
                      type="button"
                      onClick={() => setSelectedDatetime(s.datetime)}
                      className={`badge border-transparent cursor-pointer ${
                        selectedDatetime === s.datetime ? 'bg-[var(--teal-700)] text-white' : 'bg-[var(--bg-subtle)] text-[var(--text-2)]'
                      }`}
                    >
                      {s.time}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

        <div className="flex items-center gap-2 mt-4">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedDatetime || submitting}
            className="btn-primary flex-1 justify-center"
          >
            {submitting ? 'Confirming…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
