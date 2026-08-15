'use client'

import { useState } from 'react'
import type { PreventaProjectWithDetails } from '@/types'
import { AMENITIES, CURRENCIES } from '@/constants'

const PHASE_OPTIONS = [
  { value: 'lanzamiento', label: 'Lanzamiento' },
  { value: 'en_construccion', label: 'En construcción' },
  { value: 'entrega', label: 'Entrega' },
] as const

const STATUS_OPTIONS = [
  { value: 'active', label: 'Activo' },
  { value: 'paused', label: 'Pausado' },
  { value: 'sold_out', label: 'Agotado' },
] as const

interface EditProjectModalProps {
  project: PreventaProjectWithDetails
  onSaved: (project: PreventaProjectWithDetails) => void
  onClose: () => void
}

export function EditProjectModal({ project, onSaved, onClose }: EditProjectModalProps) {
  const [form, setForm] = useState({
    name: project.name,
    description: project.description ?? '',
    phase: project.phase,
    status: project.status,
    developerName: project.developer_name ?? '',
    addressLine: project.address_line ?? '',
    areaName: project.area_name ?? '',
    city: project.city ?? '',
    state: project.state ?? '',
    zip: project.zip ?? '',
    latitude: project.latitude ? String(project.latitude) : '',
    longitude: project.longitude ? String(project.longitude) : '',
    deliveryDate: project.delivery_date ?? '',
    reservationAmount: project.reservation_amount ? String(project.reservation_amount) : '',
    reservationCurrency: project.reservation_currency,
    downPaymentPct: project.down_payment_pct ? String(project.down_payment_pct) : '',
    financingNotes: project.financing_notes ?? '',
    finishesDescription: project.finishes_description ?? '',
    promoVideoUrl: project.promo_video_url ?? '',
    virtualTourUrl: project.virtual_tour_url ?? '',
    featured: project.featured,
    visibleToAiAgent: project.visible_to_ai_agent,
  })
  const [amenities, setAmenities] = useState<string[]>(project.amenities ?? [])
  const [customAmenity, setCustomAmenity] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleAmenity(name: string) {
    setAmenities((prev) => (prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]))
  }

  function addCustomAmenity() {
    const name = customAmenity.trim()
    if (name && !amenities.includes(name)) setAmenities((prev) => [...prev, name])
    setCustomAmenity('')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const res = await fetch(`/api/preventa-projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        description: form.description || null,
        phase: form.phase,
        status: form.status,
        developer_name: form.developerName || null,
        address_line: form.addressLine || null,
        area_name: form.areaName || null,
        city: form.city || null,
        state: form.state || null,
        zip: form.zip || null,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        delivery_date: form.deliveryDate || null,
        reservation_amount: form.reservationAmount ? Number(form.reservationAmount) : null,
        reservation_currency: form.reservationCurrency,
        down_payment_pct: form.downPaymentPct ? Number(form.downPaymentPct) : null,
        financing_notes: form.financingNotes || null,
        finishes_description: form.finishesDescription || null,
        promo_video_url: form.promoVideoUrl || null,
        virtual_tour_url: form.virtualTourUrl || null,
        amenities,
        featured: form.featured,
        visible_to_ai_agent: form.visibleToAiAgent,
      }),
    })

    if (!res.ok) {
      setSaving(false)
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'No se pudo guardar el proyecto')
      return
    }

    const { project: updated } = await res.json()
    onSaved(updated)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-3 overflow-y-auto sm:overflow-hidden" onClick={onClose}>
      <form
        onSubmit={handleSave}
        onClick={(e) => e.stopPropagation()}
        className="card-raised w-full max-w-2xl my-6 p-5 space-y-4 sm:my-3 sm:max-h-[calc(100dvh-1.5rem)] sm:overflow-y-auto sm:overscroll-contain"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-lg text-[var(--text-1)]">Editar proyecto</h2>
          <button type="button" onClick={onClose} className="text-[var(--text-3)] text-xl leading-none">
            &times;
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <input
          placeholder="Nombre del proyecto"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="input-field w-full"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            value={form.phase}
            onChange={(e) => setForm({ ...form, phase: e.target.value as typeof form.phase })}
            className="input-field"
          >
            {PHASE_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}
            className="input-field"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <input
          placeholder="Desarrolladora"
          value={form.developerName}
          onChange={(e) => setForm({ ...form, developerName: e.target.value })}
          className="input-field w-full"
        />

        <input
          placeholder="Dirección"
          value={form.addressLine}
          onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
          className="input-field w-full"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input placeholder="Ciudad" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input-field" />
          <input placeholder="Provincia / Estado" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="input-field" />
          <input placeholder="Código postal" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} className="input-field" />
        </div>
        <input
          placeholder="Zona / Sector"
          value={form.areaName}
          onChange={(e) => setForm({ ...form, areaName: e.target.value })}
          className="input-field w-full"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input placeholder="Latitud (ej. 18.4861)" type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} className="input-field" />
          <input placeholder="Longitud (ej. -69.9312)" type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} className="input-field" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            placeholder="Monto de reserva"
            type="number"
            value={form.reservationAmount}
            onChange={(e) => setForm({ ...form, reservationAmount: e.target.value })}
            className="input-field"
          />
          <select
            value={form.reservationCurrency}
            onChange={(e) => setForm({ ...form, reservationCurrency: e.target.value as typeof form.reservationCurrency })}
            className="input-field"
          >
            {CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>{c.value}</option>
            ))}
          </select>
          <input
            placeholder="% inicial requerido"
            type="number"
            value={form.downPaymentPct}
            onChange={(e) => setForm({ ...form, downPaymentPct: e.target.value })}
            className="input-field"
          />
        </div>

        <div>
          <label className="text-xs text-[var(--text-3)]">Fecha estimada de entrega</label>
          <input
            type="date"
            value={form.deliveryDate}
            onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
            className="input-field w-full"
          />
        </div>

        <textarea
          placeholder="Condiciones de financiamiento (ej. 70% financiado por banco, cuotas mensuales durante construcción)"
          value={form.financingNotes}
          onChange={(e) => setForm({ ...form, financingNotes: e.target.value })}
          className="input-field w-full"
          rows={2}
        />

        <textarea
          placeholder="Descripción del proyecto"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="input-field w-full"
          rows={3}
        />

        <textarea
          placeholder="Acabados (pisos, cocina, baños, etc.)"
          value={form.finishesDescription}
          onChange={(e) => setForm({ ...form, finishesDescription: e.target.value })}
          className="input-field w-full"
          rows={2}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input placeholder="URL video promocional" value={form.promoVideoUrl} onChange={(e) => setForm({ ...form, promoVideoUrl: e.target.value })} className="input-field" />
          <input placeholder="URL tour virtual / maqueta" value={form.virtualTourUrl} onChange={(e) => setForm({ ...form, virtualTourUrl: e.target.value })} className="input-field" />
        </div>

        <div>
          <label className="text-xs text-[var(--text-3)]">Amenidades del proyecto</label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {AMENITIES.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => toggleAmenity(a)}
                className={amenities.includes(a) ? 'badge bg-[var(--teal-600)] text-white border-transparent' : 'badge'}
              >
                {a}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <input
              placeholder="Agregar amenidad personalizada"
              value={customAmenity}
              onChange={(e) => setCustomAmenity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addCustomAmenity()
                }
              }}
              className="input-field flex-1"
            />
            <button type="button" onClick={addCustomAmenity} className="btn-secondary">Agregar</button>
          </div>
          {amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {amenities.map((a) => (
                <span key={a} className="badge bg-[var(--bg-raised)]">
                  {a}
                  <button type="button" onClick={() => toggleAmenity(a)} className="ml-1 text-[var(--text-3)]">&times;</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.visibleToAiAgent}
              onChange={(e) => setForm({ ...form, visibleToAiAgent: e.target.checked })}
              className="w-4 h-4 shrink-0 accent-[var(--teal-700)]"
            />
            <span>Activo (visible para la IA)</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              className="w-4 h-4 shrink-0 accent-[var(--teal-700)]"
            />
            <span>Proyecto destacado</span>
          </label>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}
