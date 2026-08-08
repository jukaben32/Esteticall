'use client'

import { useState } from 'react'
import { X, Banknote, CreditCard } from 'lucide-react'
import type { Appointment, PortalAppointment } from '@/types'

export function PortalPayModal({
  appointment,
  onClose,
  onPaid,
}: {
  appointment: PortalAppointment
  onClose: () => void
  onPaid: (appointment: Appointment) => void
}) {
  const [busy, setBusy] = useState<'cash' | 'card' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const amount = appointment.payment_amount ?? 0

  async function payCash() {
    setBusy('cash')
    setError(null)
    const res = await fetch(`/api/portal/appointments/${appointment.id}/pay-cash`, { method: 'POST' })
    const data = await res.json()
    setBusy(null)
    if (!res.ok) {
      setError(data.error ?? 'No se pudo registrar el pago en efectivo')
      return
    }
    onPaid(data.appointment)
  }

  async function payOnline() {
    setBusy('card')
    setError(null)
    const res = await fetch(`/api/portal/appointments/${appointment.id}/pay-online`, { method: 'POST' })
    const data = await res.json()
    if (!res.ok || !data.url) {
      setBusy(null)
      setError(data.error ?? 'No se pudo iniciar el pago en línea')
      return
    }
    window.location.href = data.url
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card-raised w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display font-semibold text-[var(--text-1)]">Pay for Appointment</h2>
          <button type="button" onClick={onClose} className="text-[var(--text-4)]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-[var(--text-3)] mb-4">{appointment.service?.name ?? 'Cita'} · ${amount.toLocaleString()}</p>

        <p className="text-xs font-semibold text-[var(--text-3)] mb-2">How would you like to pay?</p>
        <div className="space-y-2">
          <button
            type="button"
            onClick={payCash}
            disabled={busy !== null}
            className="w-full flex items-center gap-3 rounded-xl border border-[var(--border)] p-3 text-left hover:border-[var(--teal-600)] transition disabled:opacity-60"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--teal-50)] text-[var(--teal-700)]">
              <Banknote className="w-4 h-4" />
            </span>
            <span>
              <span className="block text-sm font-medium text-[var(--text-1)]">
                {busy === 'cash' ? 'Registrando…' : 'Pay at Agency (Cash)'}
              </span>
              <span className="block text-xs text-[var(--text-3)]">I will pay cash when I visit</span>
            </span>
          </button>

          {appointment.business?.stripe_connected && (
            <button
              type="button"
              onClick={payOnline}
              disabled={busy !== null}
              className="w-full flex items-center gap-3 rounded-xl border border-[var(--border)] p-3 text-left hover:border-[var(--teal-600)] transition disabled:opacity-60"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--teal-50)] text-[var(--teal-700)]">
                <CreditCard className="w-4 h-4" />
              </span>
              <span>
                <span className="block text-sm font-medium text-[var(--text-1)]">
                  {busy === 'card' ? 'Redirigiendo…' : 'Pay Online'}
                </span>
                <span className="block text-xs text-[var(--text-3)]">Pay now with a card</span>
              </span>
            </button>
          )}
        </div>

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      </div>
    </div>
  )
}
