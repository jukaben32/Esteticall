'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { Package, BusinessService } from '@/types'

interface PackageEditModalProps {
  pkg?: Package
  services: BusinessService[]
  onClose: () => void
  onSaved: (pkg: Package) => void
}

export function PackageEditModal({ pkg, services, onClose, onSaved }: PackageEditModalProps) {
  const [form, setForm] = useState({
    name: pkg?.name ?? '',
    description: pkg?.description ?? '',
    serviceId: pkg?.service_id ?? '',
    sessionCount: pkg?.session_count ?? 6,
    price: pkg?.price ?? 0,
    validityDays: pkg?.validity_days ?? 180,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const body = {
      name: form.name,
      description: form.description || undefined,
      serviceId: form.serviceId || undefined,
      sessionCount: form.sessionCount,
      price: form.price,
      validityDays: form.validityDays || undefined,
      isActive: pkg?.is_active ?? true,
    }

    const res = pkg
      ? await fetch(`/api/packages/${pkg.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: body.name,
            description: body.description ?? null,
            service_id: body.serviceId ?? null,
            session_count: body.sessionCount,
            price: body.price,
            validity_days: body.validityDays ?? null,
          }),
        })
      : await fetch('/api/packages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

    setSaving(false)
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}))
      setError(errBody.error ?? 'No se pudo guardar el paquete')
      return
    }

    const data = await res.json()
    onSaved(data.package)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-3 overflow-y-auto" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="card-raised w-full max-w-lg my-6 p-5 space-y-4"
      >
        <div className="flex items-start justify-between">
          <h2 className="font-display font-semibold text-lg text-[var(--text-1)]">
            {pkg ? 'Editar paquete' : 'Nuevo paquete'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-[var(--text-3)] hover:text-[var(--text-1)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)] mb-1">
            Nombre *
          </label>
          <input
            placeholder="6 sesiones de láser facial"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input-field w-full"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)] mb-1">
            Descripción
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="input-field w-full"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)] mb-1">
            Tratamiento incluido
          </label>
          <select
            value={form.serviceId}
            onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
            className="input-field w-full"
          >
            <option value="">— Sin tratamiento específico —</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)] mb-1">
              No. de sesiones *
            </label>
            <input
              type="number"
              min={1}
              value={form.sessionCount}
              onChange={(e) => setForm({ ...form, sessionCount: Number(e.target.value) })}
              className="input-field w-full"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)] mb-1">
              Precio (USD) *
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              className="input-field w-full"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)] mb-1">
              Vigencia (días)
            </label>
            <input
              type="number"
              min={1}
              value={form.validityDays}
              onChange={(e) => setForm({ ...form, validityDays: Number(e.target.value) })}
              className="input-field w-full"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar paquete'}
          </button>
        </div>
      </form>
    </div>
  )
}
