'use client'

import { useState } from 'react'
import type { PreventaProject } from '@/types'
import { CURRENCIES } from '@/constants'

const PHASE_OPTIONS = [
  { value: 'lanzamiento', label: 'Lanzamiento' },
  { value: 'en_construccion', label: 'En construcción' },
  { value: 'entrega', label: 'Entrega' },
] as const

interface NewProjectFormProps {
  onCreated: (project: PreventaProject) => void
  onClose: () => void
}

export function NewProjectForm({ onCreated, onClose }: NewProjectFormProps) {
  const [form, setForm] = useState({
    name: '',
    phase: 'lanzamiento',
    developerName: '',
    city: '',
    areaName: '',
    deliveryDate: '',
    reservationAmount: '',
    reservationCurrency: 'USD',
    downPaymentPct: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/preventa-projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    setLoading(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'No se pudo crear el proyecto')
      return
    }

    const { project } = await res.json()
    onCreated(project)
  }

  return (
    <form onSubmit={handleSubmit} className="card-surface p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {error && <p className="col-span-2 text-sm text-red-600">{error}</p>}
      <input
        placeholder="Nombre del proyecto"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="input-field col-span-2"
        required
      />
      <select value={form.phase} onChange={(e) => setForm({ ...form, phase: e.target.value })} className="input-field">
        {PHASE_OPTIONS.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>
      <input
        placeholder="Desarrolladora"
        value={form.developerName}
        onChange={(e) => setForm({ ...form, developerName: e.target.value })}
        className="input-field"
      />
      <input
        placeholder="Ciudad"
        value={form.city}
        onChange={(e) => setForm({ ...form, city: e.target.value })}
        className="input-field"
      />
      <input
        placeholder="Zona / Sector"
        value={form.areaName}
        onChange={(e) => setForm({ ...form, areaName: e.target.value })}
        className="input-field"
      />
      <div className="flex gap-2">
        <input
          placeholder="Monto de reserva"
          type="number"
          value={form.reservationAmount}
          onChange={(e) => setForm({ ...form, reservationAmount: e.target.value })}
          className="input-field flex-1"
        />
        <select
          value={form.reservationCurrency}
          onChange={(e) => setForm({ ...form, reservationCurrency: e.target.value })}
          className="input-field w-28"
        >
          {CURRENCIES.map((c) => (
            <option key={c.value} value={c.value}>{c.value}</option>
          ))}
        </select>
      </div>
      <input
        placeholder="% inicial requerido (ej. 20)"
        type="number"
        value={form.downPaymentPct}
        onChange={(e) => setForm({ ...form, downPaymentPct: e.target.value })}
        className="input-field"
      />
      <div>
        <label className="text-xs text-[var(--text-3)]">Fecha estimada de entrega</label>
        <input
          type="date"
          value={form.deliveryDate}
          onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
          className="input-field w-full"
        />
      </div>
      <div className="col-span-2 flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Creando…' : 'Crear proyecto'}
        </button>
      </div>
    </form>
  )
}
