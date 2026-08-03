'use client'

import { useState } from 'react'
import type { AppointmentWithDetails, BusinessService } from '@/types'
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
  onCreated: (appointment: AppointmentWithDetails) => void
  onClose: () => void
}

export function NewViewingModal({ services, onCreated, onClose }: NewViewingModalProps) {
  const [form, setForm] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    budget: '',
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
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start sm:items-center justify-center p-3 overflow-y-auto" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="card-raised w-full max-w-lg my-6 p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-lg text-[var(--text-1)]">Nueva cita</h2>
          <button type="button" onClick={onClose} className="text-[var(--text-3)] text-xl leading-none">
            &times;
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            placeholder="Nombre del cliente"
            value={form.clientName}
            onChange={(e) => setForm({ ...form, clientName: e.target.value })}
            className="input-field"
            required
          />
          <input
            placeholder="Teléfono"
            value={form.clientPhone}
            onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
            className="input-field"
          />
        </div>

        <input
          placeholder="Correo electrónico"
          type="email"
          value={form.clientEmail}
          onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
          className="input-field w-full"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            placeholder="Presupuesto"
            type="number"
            value={form.budget}
            onChange={(e) => setForm({ ...form, budget: e.target.value })}
            className="input-field"
          />
          <input
            placeholder="No. de pre-aprobación"
            value={form.preApprovalNumber}
            onChange={(e) => setForm({ ...form, preApprovalNumber: e.target.value })}
            className="input-field"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            value={form.serviceId}
            onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
            className="input-field"
          >
            <option value="">Seleccionar servicio</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <input
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
            className="input-field"
            required
          />
        </div>

        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          className="input-field w-full"
        >
          {APPOINTMENT_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
          ))}
        </select>

        <textarea
          placeholder="Notas (opcional)"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="input-field w-full"
          rows={2}
        />

        <p className="text-xs text-[var(--text-4)]">
          El cliente recibirá un correo cuando el estado de su cita cambie a Confirmada, Completada o Cancelada.
        </p>

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Creando…' : 'Crear cita'}
          </button>
        </div>
      </form>
    </div>
  )
}
