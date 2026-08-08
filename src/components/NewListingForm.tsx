'use client'

import { useState } from 'react'
import type { Listing } from '@/types'
import { PROPERTY_TYPES, LISTING_TYPES, RENTAL_PERIODS, CURRENCIES } from '@/constants'

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  house: 'Casa',
  apartment: 'Apartamento',
  townhouse: 'Townhouse',
  commercial: 'Comercial',
  condo: 'Condominio',
  land: 'Solar',
  industrial: 'Nave Industrial',
  other: 'Otro',
}

const LISTING_TYPE_LABELS: Record<string, string> = {
  sale: 'En venta',
  rent: 'En alquiler',
  vacation_rental: 'Renta vacacional (Airbnb)',
}

interface NewListingFormProps {
  onCreated: (listing: Listing) => void
  onClose: () => void
}

export function NewListingForm({ onCreated, onClose }: NewListingFormProps) {
  const [form, setForm] = useState({
    title: '',
    listingType: 'sale',
    propertyType: 'house',
    price: '',
    currency: 'USD',
    bedrooms: '',
    bathrooms: '',
    areaSqft: '',
    yearBuilt: '',
    city: '',
    rentalPeriod: 'night',
    confoturEligible: false,
    deliveryDate: '',
  })
  const [photo, setPhoto] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        yearBuilt: form.yearBuilt || undefined,
        rentalPeriod: form.listingType === 'vacation_rental' ? form.rentalPeriod : undefined,
      }),
    })

    if (!res.ok) {
      setLoading(false)
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'No se pudo crear la propiedad')
      return
    }

    const { listing } = await res.json()

    if (photo) {
      const photoBody = new FormData()
      photoBody.append('file', photo)
      const photoRes = await fetch(`/api/listings/${listing.id}/photo`, { method: 'POST', body: photoBody })
      if (photoRes.ok) {
        const { listing: updated } = await photoRes.json()
        Object.assign(listing, updated)
      }
    }

    setLoading(false)
    onCreated(listing)
  }

  return (
    <form onSubmit={handleSubmit} className="card-surface p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {error && <p className="col-span-2 text-sm text-red-600">{error}</p>}
      <input
        placeholder="Título"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        className="input-field col-span-2"
        required
      />
      <select
        value={form.listingType}
        onChange={(e) => setForm({ ...form, listingType: e.target.value })}
        className="input-field"
      >
        {LISTING_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {LISTING_TYPE_LABELS[t.value] ?? t.label}
          </option>
        ))}
      </select>
      <select
        value={form.propertyType}
        onChange={(e) => setForm({ ...form, propertyType: e.target.value })}
        className="input-field"
      >
        {PROPERTY_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {PROPERTY_TYPE_LABELS[t.value] ?? t.label}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <input
          placeholder="Precio"
          type="number"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="input-field flex-1"
          required
        />
        <select
          value={form.currency}
          onChange={(e) => setForm({ ...form, currency: e.target.value })}
          className="input-field w-28"
        >
          {CURRENCIES.map((c) => (
            <option key={c.value} value={c.value}>{c.value}</option>
          ))}
        </select>
      </div>
      {form.listingType === 'vacation_rental' && (
        <select
          value={form.rentalPeriod}
          onChange={(e) => setForm({ ...form, rentalPeriod: e.target.value })}
          className="input-field"
        >
          {RENTAL_PERIODS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      )}
      <input
        placeholder="Ciudad"
        value={form.city}
        onChange={(e) => setForm({ ...form, city: e.target.value })}
        className="input-field"
      />
      {form.propertyType !== 'land' && (
        <>
          <input
            placeholder="Habitaciones"
            type="number"
            value={form.bedrooms}
            onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
            className="input-field"
          />
          <input
            placeholder="Baños"
            type="number"
            value={form.bathrooms}
            onChange={(e) => setForm({ ...form, bathrooms: e.target.value })}
            className="input-field"
          />
        </>
      )}
      <input
        placeholder={form.propertyType === 'land' ? 'Área del solar (m²)' : 'Área (pies²)'}
        type="number"
        value={form.areaSqft}
        onChange={(e) => setForm({ ...form, areaSqft: e.target.value })}
        className="input-field"
      />
      {form.propertyType !== 'land' && (
        <input
          placeholder="Año de construcción"
          type="number"
          value={form.yearBuilt}
          onChange={(e) => setForm({ ...form, yearBuilt: e.target.value })}
          className="input-field"
        />
      )}
      <div>
        <label className="text-xs text-[var(--text-3)]">Fecha de entrega (proyectos en plano)</label>
        <input
          type="date"
          value={form.deliveryDate}
          onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
          className="input-field w-full"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-[var(--text-2)]">
        <input
          type="checkbox"
          checked={form.confoturEligible}
          onChange={(e) => setForm({ ...form, confoturEligible: e.target.checked })}
        />
        Elegible para exención CONFOTUR (Ley 158-01)
      </label>
      <div className="col-span-2">
        <label className="text-xs text-[var(--text-3)]">Foto de portada (opcional)</label>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          className="input-field"
        />
      </div>
      <div className="col-span-2 flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="btn-secondary">
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Creando…' : 'Crear propiedad'}
        </button>
      </div>
    </form>
  )
}
