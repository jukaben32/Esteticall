'use client'

import { useState } from 'react'
import type { AppointmentWithDetails, BusinessService, Listing } from '@/types'
import { APPOINTMENT_STATUSES } from '@/constants'

const STATUS_LABELS: Record<string, string> = {
  pending_confirmation: 'Pendiente',
  scheduled: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'No asistió',
}

interface NewViewingModalProps {
  services: BusinessService[]
  listings: Pick<Listing, 'id' | 'title' | 'listing_code' | 'status'>[]
  onCreated: (appointment: AppointmentWithDetails) => void
  onClose: () => void
}

export function NewViewingModal({ services, listings, onCreated, onClose }: NewViewingModalProps) {
  const [form, setForm] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    budget: '',
    listingId: '',
    preApprovalNumber: '',
    serviceId: '',
    scheduledAt: '',
    status: 'pending_confirmation',
    notes: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: form.clientName,
        clientPhone: form.clientPhone || undefined,
        clientEmail: form.clientEmail || undefined,
        budget: form.budget || undefined,
        listingId: form.listingId || undefined,
        preApprovalNumber: form.preApprovalNumber || undefined,
        serviceId: form.serviceId || undefined,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        status: form.status,
        notes: form.notes || undefined,
      }),
    })

    if (!res.ok) {
      setSaving(false)
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'No se pudo crear la cita')
      return
    }

    const { appointment } = await res.json()
    setSaving(false)
    onCreated(appointment)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-3 overflow-y-auto" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="card-raised w-full max-w-lg my-6 p-5 space-y-4"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display font-semibold text-lg text-[var(--text-1)]">Nueva visita</h2>
            <p className="text-xs text-[var(--text-3)]">Crea manualmente una visita a propiedad para un cliente</p>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--text-3)] text-xl leading-none">
            &times;
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)] mb-1">
              Nombre completo *
            </label>
            <input
              placeholder="Nombre del cliente"
              value={form.clientName}
              onChange={(e) => setForm({ ...form, clientName: e.target.value })}
              className="input-field w-full"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)] mb-1">
              Teléfono
            </label>
            <input
              placeholder="Teléfono"
              value={form.clientPhone}
              onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
              className="input-field w-full"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)] mb-1">
            Correo electrónico *
          </label>
          <input
            placeholder="Correo electrónico"
            type="email"
            value={form.clientEmail}
            onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
            className="input-field w-full"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)] mb-1">
              Rango de presupuesto
            </label>
            <input
              placeholder="Presupuesto"
              type="number"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)] mb-1">
              Propiedad de interés
            </label>
            <select
              value={form.listingId}
              onChange={(e) => setForm({ ...form, listingId: e.target.value })}
              className="input-field w-full"
            >
              <option value="">— Seleccionar propiedad —</option>
              {listings.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title} · {l.listing_code}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)] mb-1">
              Servicio
            </label>
            <select
              value={form.serviceId}
              onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
              className="input-field w-full"
            >
              <option value="">— Seleccionar servicio —</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)] mb-1">
              Fecha y hora *
            </label>
            <input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
              className="input-field w-full"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)] mb-1">
            No. de pre-aprobación
          </label>
          <input
            placeholder="No. de pre-aprobación (opcional)"
            value={form.preApprovalNumber}
            onChange={(e) => setForm({ ...form, preApprovalNumber: e.target.value })}
            className="input-field w-full"
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)] mb-1">
            Estado
          </label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="input-field w-full"
          >
            {APPOINTMENT_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)] mb-1">
            Notas
          </label>
          <textarea
            placeholder="Notas o requerimientos especiales (opcional)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="input-field w-full"
            rows={2}
          />
        </div>

        <p className="text-xs text-[var(--text-4)]">
          El cliente recibirá un correo cuando el estado de su cita cambie a Confirmada, Completada o Cancelada.
        </p>

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Agendando…' : 'Agendar visita'}
          </button>
        </div>
      </form>
    </div>
  )
}
