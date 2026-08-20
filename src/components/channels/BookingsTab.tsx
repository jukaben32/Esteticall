'use client'

import { type Dispatch, type SetStateAction } from 'react'
import type { ChannelBookingWithDetails } from '@/types'

const CHANNEL_LABELS: Record<string, string> = { airbnb: 'Airbnb', booking: 'Booking.com', vrbo: 'VRBO' }

const COMMISSION_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  invoiced: 'bg-blue-50 text-blue-700',
  paid: 'bg-green-50 text-green-700',
}
const COMMISSION_LABELS: Record<string, string> = { pending: 'Pendiente', invoiced: 'Facturada', paid: 'Pagada' }

interface BookingsTabProps {
  bookings: ChannelBookingWithDetails[]
  setBookings: Dispatch<SetStateAction<ChannelBookingWithDetails[]>>
}

export function BookingsTab({ bookings, setBookings }: BookingsTabProps) {
  async function advanceCommission(bookingId: string, current: string) {
    const next = current === 'pending' ? 'invoiced' : current === 'invoiced' ? 'paid' : 'pending'
    const res = await fetch(`/api/channels/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commissionStatus: next }),
    })
    if (res.ok) {
      const { booking } = await res.json()
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, ...booking } : b)))
    }
  }

  const totalPending = bookings
    .filter((b) => b.commission_status === 'pending' && b.status !== 'cancelled')
    .reduce((sum, b) => sum + Number(b.commission_amount), 0)

  if (bookings.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--text-3)]">
        Aún no hay reservas registradas. Sincroniza un dueño desde la pestaña &ldquo;Conexiones&rdquo; para traer sus reservas reales.
      </p>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-semibold text-[var(--text-1)]">Reservas &amp; comisión de co-host</h2>
        <span className="badge bg-[var(--teal-50)] border-transparent text-[var(--teal-800)]">
          ${totalPending.toFixed(0)} en comisión pendiente
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-[var(--text-3)]">
              <th className="py-2 pr-3">Propiedad / Dueño</th>
              <th className="py-2 pr-3">Canal</th>
              <th className="py-2 pr-3">Huésped</th>
              <th className="py-2 pr-3">Fechas</th>
              <th className="py-2 pr-3">Total</th>
              <th className="py-2 pr-3">Comisión</th>
              <th className="py-2 pr-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className="border-b border-[var(--border)] last:border-0">
                <td className="py-2.5 pr-3">
                  <p className="font-medium">{b.listing.listingTitle}</p>
                  <p className="text-xs text-[var(--text-3)]">{b.listing.ownerName}</p>
                </td>
                <td className="py-2.5 pr-3 text-[var(--text-3)]">{CHANNEL_LABELS[b.listing.channel] ?? b.listing.channel}</td>
                <td className="py-2.5 pr-3">{b.guest_name ?? '—'}</td>
                <td className="py-2.5 pr-3 text-[var(--text-3)]">
                  {b.check_in} → {b.check_out} ({b.nights}n)
                </td>
                <td className="py-2.5 pr-3">
                  {b.currency} {Number(b.gross_amount).toFixed(0)}
                </td>
                <td className="py-2.5 pr-3 font-medium">
                  {b.currency} {Number(b.commission_amount).toFixed(0)} ({b.commission_pct}%)
                </td>
                <td className="py-2.5 pr-3">
                  <button
                    onClick={() => advanceCommission(b.id, b.commission_status)}
                    className={`badge border-transparent ${COMMISSION_STYLES[b.commission_status] ?? ''}`}
                    title="Clic para avanzar el estado"
                  >
                    {COMMISSION_LABELS[b.commission_status] ?? b.commission_status}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
