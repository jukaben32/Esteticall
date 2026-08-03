'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { BusinessService } from '@/types'

export interface ServiceFormValue {
  name: string
  description: string
  durationMinutes: number
  priceType: 'fixed' | 'starting_at'
  price: string
  isActive: boolean
}

function defaultsFromService(service?: BusinessService, prefill?: Partial<ServiceFormValue>): ServiceFormValue {
  if (service) {
    return {
      name: service.name,
      description: service.description ?? '',
      durationMinutes: service.duration_minutes,
      priceType: service.price_type,
      price: service.price != null ? String(service.price) : '',
      isActive: service.is_active,
    }
  }
  return {
    name: '',
    description: '',
    durationMinutes: 60,
    priceType: 'fixed',
    price: '',
    isActive: true,
    ...prefill,
  }
}

export function ServiceEditModal({
  service,
  prefill,
  catalogKey,
  onClose,
  onSaved,
}: {
  service?: BusinessService
  prefill?: Partial<ServiceFormValue>
  catalogKey?: string
  onClose: () => void
  onSaved: (service: BusinessService) => void
}) {
  const isEdit = Boolean(service)
  const [form, setForm] = useState<ServiceFormValue>(defaultsFromService(service, prefill))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function patch(p: Partial<ServiceFormValue>) {
    setForm((prev) => ({ ...prev, ...p }))
  }

  async function handleSave() {
    if (form.name.trim().length < 2) {
      setError('Ponle un nombre al servicio.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        durationMinutes: form.durationMinutes,
        priceType: form.priceType,
        price: form.price === '' ? undefined : Number(form.price),
        isActive: form.isActive,
        ...(isEdit ? {} : { catalogKey }),
      }
      const res = await fetch(isEdit ? `/api/services/${service!.id}` : '/api/services', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEdit
            ? {
                name: payload.name,
                description: payload.description ?? null,
                duration_minutes: payload.durationMinutes,
                price_type: payload.priceType,
                price: payload.price ?? null,
                is_active: payload.isActive,
              }
            : payload
        ),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'No se pudo guardar el servicio')
        return
      }
      const { service: saved } = await res.json()
      onSaved(saved)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="card-raised w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-lg text-[var(--text-1)]">
            {isEdit ? 'Editar servicio' : 'Agregar servicio personalizado'}
          </h2>
          <button onClick={onClose} aria-label="Cerrar" className="text-[var(--text-3)] hover:text-[var(--text-1)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[var(--text-2)] block mb-1">Nombre del servicio *</label>
            <input
              value={form.name}
              onChange={(e) => patch({ name: e.target.value })}
              className="input-field"
              placeholder="Consulta general"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-2)] block mb-1">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => patch({ description: e.target.value })}
              className="input-field"
              rows={2}
              placeholder="Breve descripción para el agente de IA…"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[var(--text-2)] block mb-1">Duración (minutos)</label>
              <input
                type="number"
                min={5}
                step={5}
                value={form.durationMinutes}
                onChange={(e) => patch({ durationMinutes: Number(e.target.value) })}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-2)] block mb-1">Tipo de precio</label>
              <select
                value={form.priceType}
                onChange={(e) => patch({ priceType: e.target.value as 'fixed' | 'starting_at' })}
                className="input-field"
              >
                <option value="fixed">Precio fijo</option>
                <option value="starting_at">Desde</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-2)] block mb-1">Precio ($)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.price}
              onChange={(e) => patch({ price: e.target.value })}
              className="input-field"
              placeholder="0.00"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => patch({ isActive: e.target.checked })}
              className="accent-[var(--teal-700)] w-4 h-4"
            />
            <span className="text-sm text-[var(--text-2)]">Servicio activo</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="btn-secondary" disabled={saving}>
            Cancelar
          </button>
          <button onClick={handleSave} className="btn-primary" disabled={saving}>
            {saving ? 'Guardando…' : isEdit ? 'Guardar' : 'Agregar servicio'}
          </button>
        </div>
      </div>
    </div>
  )
}
