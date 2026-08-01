'use client'

import { useState } from 'react'
import type { Listing } from '@/types'
import { PROPERTY_TYPES, LISTING_TYPES } from '@/constants'

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
    bedrooms: '',
    bathrooms: '',
    areaSqft: '',
    city: '',
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
      body: JSON.stringify(form),
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
    <form onSubmit={handleSubmit} className="card-surface p-4 mb-4 grid grid-cols-2 gap-3">
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
            {t.label}
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
            {t.label}
          </option>
        ))}
      </select>
      <input
        placeholder="Precio"
        type="number"
        value={form.price}
        onChange={(e) => setForm({ ...form, price: e.target.value })}
        className="input-field"
        required
      />
      <input
        placeholder="Ciudad"
        value={form.city}
        onChange={(e) => setForm({ ...form, city: e.target.value })}
        className="input-field"
      />
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
      <input
        placeholder="Área (pies²)"
        type="number"
        value={form.areaSqft}
        onChange={(e) => setForm({ ...form, areaSqft: e.target.value })}
        className="input-field col-span-2"
      />
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
