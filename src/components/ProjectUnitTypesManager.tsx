'use client'

import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import type { PreventaUnitType } from '@/types'
import { CURRENCIES, PRICE_DISPLAY_OPTIONS } from '@/constants'

const EMPTY_FORM = {
  name: '',
  bedrooms: '',
  bathrooms: '',
  areaSqft: '',
  parkingSpaces: '',
  price: '',
  currency: 'USD',
  priceDisplay: 'starting_at',
  notes: '',
}

function unitTypeToForm(u: PreventaUnitType) {
  return {
    name: u.name,
    bedrooms: String(u.bedrooms),
    bathrooms: String(u.bathrooms),
    areaSqft: String(u.area_sqft),
    parkingSpaces: String(u.parking_spaces),
    price: String(u.price),
    currency: u.currency,
    priceDisplay: u.price_display,
    notes: u.notes ?? '',
  }
}

function UnitTypeFields({
  form,
  onChange,
}: {
  form: typeof EMPTY_FORM
  onChange: (form: typeof EMPTY_FORM) => void
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <input
        placeholder="Nombre (ej. Tipo A)"
        value={form.name}
        onChange={(e) => onChange({ ...form, name: e.target.value })}
        className="input-field col-span-2 sm:col-span-1"
        required
      />
      <input placeholder="Hab." type="number" value={form.bedrooms} onChange={(e) => onChange({ ...form, bedrooms: e.target.value })} className="input-field" />
      <input placeholder="Baños" type="number" value={form.bathrooms} onChange={(e) => onChange({ ...form, bathrooms: e.target.value })} className="input-field" />
      <input placeholder="Parqueos" type="number" value={form.parkingSpaces} onChange={(e) => onChange({ ...form, parkingSpaces: e.target.value })} className="input-field" />
      <input placeholder="Área (pies²)" type="number" value={form.areaSqft} onChange={(e) => onChange({ ...form, areaSqft: e.target.value })} className="input-field" />
      <input placeholder="Precio" type="number" value={form.price} onChange={(e) => onChange({ ...form, price: e.target.value })} className="input-field" required />
      <select value={form.currency} onChange={(e) => onChange({ ...form, currency: e.target.value })} className="input-field">
        {CURRENCIES.map((c) => (
          <option key={c.value} value={c.value}>{c.value}</option>
        ))}
      </select>
      <select value={form.priceDisplay} onChange={(e) => onChange({ ...form, priceDisplay: e.target.value })} className="input-field">
        {PRICE_DISPLAY_OPTIONS.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>
      <input
        placeholder="Notas (opcional)"
        value={form.notes}
        onChange={(e) => onChange({ ...form, notes: e.target.value })}
        className="input-field col-span-2 sm:col-span-4"
      />
    </div>
  )
}

export function ProjectUnitTypesManager({
  projectId,
  initialUnitTypes,
}: {
  projectId: string
  initialUnitTypes: PreventaUnitType[]
}) {
  const [unitTypes, setUnitTypes] = useState(initialUnitTypes)
  const [adding, setAdding] = useState(false)
  const [newForm, setNewForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function createUnitType(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const res = await fetch(`/api/preventa-projects/${projectId}/unit-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newForm, sortOrder: unitTypes.length }),
    })
    setSaving(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'No se pudo crear el tipo de unidad')
      return
    }
    const { unitType } = await res.json()
    setUnitTypes((prev) => [...prev, unitType])
    setNewForm(EMPTY_FORM)
    setAdding(false)
  }

  async function saveEdit(unitTypeId: string) {
    setSaving(true)
    setError(null)
    const res = await fetch(`/api/preventa-projects/${projectId}/unit-types/${unitTypeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editForm.name,
        bedrooms: Number(editForm.bedrooms) || 0,
        bathrooms: Number(editForm.bathrooms) || 0,
        area_sqft: Number(editForm.areaSqft) || 0,
        parking_spaces: Number(editForm.parkingSpaces) || 0,
        price: Number(editForm.price) || 0,
        currency: editForm.currency,
        price_display: editForm.priceDisplay,
        notes: editForm.notes || null,
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'No se pudo guardar el tipo de unidad')
      return
    }
    const { unitType } = await res.json()
    setUnitTypes((prev) => prev.map((u) => (u.id === unitType.id ? unitType : u)))
    setEditingId(null)
  }

  async function removeUnitType(unitTypeId: string) {
    if (!confirm('¿Eliminar este tipo de unidad?')) return
    const res = await fetch(`/api/preventa-projects/${projectId}/unit-types/${unitTypeId}`, { method: 'DELETE' })
    if (res.ok) setUnitTypes((prev) => prev.filter((u) => u.id !== unitTypeId))
  }

  return (
    <div className="card-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-[var(--text-1)]">
          Tipos de unidad ({unitTypes.length})
        </p>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="btn-secondary text-xs px-3 py-1.5">
            <Plus className="w-3.5 h-3.5" /> Agregar tipo de unidad
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

      <div className="space-y-2">
        {unitTypes.map((u) =>
          editingId === u.id ? (
            <form
              key={u.id}
              onSubmit={(e) => {
                e.preventDefault()
                void saveEdit(u.id)
              }}
              className="p-3 rounded-lg bg-[var(--bg-subtle)] space-y-2"
            >
              <UnitTypeFields form={editForm} onChange={setEditForm} />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setEditingId(null)} className="btn-secondary text-xs px-3 py-1.5">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary text-xs px-3 py-1.5">
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          ) : (
            <div key={u.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg hover:bg-[var(--bg-subtle)]">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{u.name}</p>
                <p className="text-xs text-[var(--text-3)]">
                  {u.bedrooms}bd/{u.bathrooms}ba · {u.area_sqft.toLocaleString()} pies² · {u.currency} {u.price.toLocaleString()}
                  {u.notes ? ` · ${u.notes}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => {
                    setEditingId(u.id)
                    setEditForm(unitTypeToForm(u))
                  }}
                  className="p-1.5 rounded-lg text-[var(--text-3)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-1)]"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => removeUnitType(u.id)} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        )}
        {unitTypes.length === 0 && !adding && (
          <p className="text-sm text-[var(--text-3)]">Este proyecto aún no tiene tipos de unidad.</p>
        )}
      </div>

      {adding && (
        <form onSubmit={createUnitType} className="mt-3 p-3 rounded-lg bg-[var(--bg-subtle)] space-y-2">
          <UnitTypeFields form={newForm} onChange={setNewForm} />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setAdding(false); setNewForm(EMPTY_FORM) }} className="btn-secondary text-xs px-3 py-1.5">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary text-xs px-3 py-1.5">
              {saving ? 'Creando…' : 'Crear tipo de unidad'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
