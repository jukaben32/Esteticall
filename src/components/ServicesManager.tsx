'use client'

import { useState } from 'react'
import type { BusinessService } from '@/types'

export function ServicesManager({ initialServices }: { initialServices: BusinessService[] }) {
  const [services, setServices] = useState(initialServices)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', price: '' })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        description: form.description || undefined,
        price: form.price ? Number(form.price) : undefined,
      }),
    })
    if (res.ok) {
      const { service } = await res.json()
      setServices((prev) => [...prev, service])
      setForm({ name: '', description: '', price: '' })
      setShowForm(false)
    }
  }

  async function toggleActive(service: BusinessService) {
    const res = await fetch(`/api/services/${service.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !service.is_active }),
    })
    if (res.ok) {
      const { service: updated } = await res.json()
      setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
    }
  }

  async function remove(serviceId: string) {
    if (!confirm('¿Eliminar este servicio?')) return
    const res = await fetch(`/api/services/${serviceId}`, { method: 'DELETE' })
    if (res.ok) setServices((prev) => prev.filter((s) => s.id !== serviceId))
  }

  return (
    <div>
      {!showForm && (
        <button className="btn-primary mb-4" onClick={() => setShowForm(true)}>
          + Nuevo servicio
        </button>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="card-surface p-4 mb-4 grid grid-cols-2 gap-3">
          <input
            placeholder="Nombre del servicio (ej. Visita a propiedad)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input-field col-span-2"
            required
          />
          <input
            placeholder="Descripción"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="input-field col-span-2"
          />
          <input
            type="number"
            placeholder="Precio (opcional)"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="input-field"
            min={0}
          />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Crear
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {services.map((service) => (
          <div key={service.id} className="card-surface p-3 flex items-center justify-between">
            <div>
              <p className="font-medium text-[var(--text-1)]">{service.name}</p>
              <p className="text-xs text-[var(--text-3)]">
                {service.description}
                {service.price != null ? ` · $${service.price.toLocaleString()}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleActive(service)}
                className={`badge border-transparent ${
                  service.is_active ? 'bg-[var(--teal-50)] text-[var(--teal-800)]' : 'bg-[var(--bg-raised)] text-[var(--text-3)]'
                }`}
              >
                {service.is_active ? 'Activo' : 'Inactivo'}
              </button>
              <button onClick={() => remove(service.id)} className="text-red-600 text-sm">
                Eliminar
              </button>
            </div>
          </div>
        ))}
        {services.length === 0 && (
          <p className="text-sm text-[var(--text-3)]">
            Todavía no hay servicios — agrega lo que tu agente IA debería ofrecer a quien llama.
          </p>
        )}
      </div>
    </div>
  )
}
