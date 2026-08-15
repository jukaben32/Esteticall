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
  // Seeds "Tipo de propiedad" from whatever filter tab was active in the
  // listings table — without this, the form always opened defaulted to
  // "Casa" regardless of context, so clicking "Agregar propiedad" while
  // filtered to "Solar" still showed house fields (bedrooms/bathrooms/year
  // built) until the user noticed and changed the dropdown themselves.
  initialPropertyType?: string
}

export function NewListingForm({ onCreated, onClose, initialPropertyType }: NewListingFormProps) {
  const [form, setForm] = useState({
    title: '',
    listingType: 'sale',
    propertyType: initialPropertyType ?? 'house',
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
    lotFrontageM: '',
    lotDepthM: '',
    cadastralDistrict: '',
    latitude: '',
    longitude: '',
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
      {form.propertyType === 'land' && (
        <>
          <input
            placeholder="Frente del solar (m)"
            type="number"
            value={form.lotFrontageM}
            onChange={(e) => setForm({ ...form, lotFrontageM: e.target.value })}
            className="input-field"
          />
          <input
            placeholder="Fondo del solar (m)"
            type="number"
            value={form.lotDepthM}
            onChange={(e) => setForm({ ...form, lotDepthM: e.target.value })}
            className="input-field"
          />
          <input
            placeholder="Distrito catastral"
            value={form.cadastralDistrict}
            onChange={(e) => setForm({ ...form, cadastralDistrict: e.target.value })}
            className="input-field col-span-2"
          />
          <input
            placeholder="Latitud (ej. 18.4861)"
            type="number"
            step="any"
            value={form.latitude}
            onChange={(e) => setForm({ ...form, latitude: e.target.value })}
            className="input-field"
          />
          <input
            placeholder="Longitud (ej. -69.9312)"
            type="number"
            step="any"
            value={form.longitude}
            onChange={(e) => setForm({ ...form, longitude: e.target.value })}
            className="input-field"
          />
        </>
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
      <label className="col-span-2 flex items-center gap-2 text-sm text-[var(--text-2)]">
        <input
          type="checkbox"
          checked={form.confoturEligible}
          onChange={(e) => setForm({ ...form, confoturEligible: e.target.checked })}
          className="w-4 h-4 shrink-0 accent-[var(--teal-700)]"
        />
        <span>Elegible para exención CONFOTUR (Ley 158-01)</span>
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
