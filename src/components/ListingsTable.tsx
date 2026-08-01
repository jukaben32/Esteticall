'use client'

import { useMemo, useState } from 'react'
import type { ListingWithPhotos } from '@/types'
import { LISTING_STATUSES, PROPERTY_TYPES } from '@/constants'
import { NewListingForm } from '@/components/NewListingForm'

const LISTING_STATUS_LABELS: Record<string, string> = {
  available: 'Disponible',
  pending: 'Pendiente',
  sold: 'Vendida',
  rented: 'Rentada',
  withdrawn: 'Retirada',
}

export function ListingsTable({ initialListings }: { initialListings: ListingWithPhotos[] }) {
  const [listings, setListings] = useState(initialListings)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')
  const [showForm, setShowForm] = useState(false)

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (status !== 'all' && l.status !== status) return false
      if (type !== 'all' && l.property_type !== type) return false
      if (search && !`${l.title} ${l.address_line} ${l.city}`.toLowerCase().includes(search.toLowerCase()))
        return false
      return true
    })
  }, [listings, search, status, type])

  async function toggleVisibility(listing: ListingWithPhotos) {
    const res = await fetch(`/api/listings/${listing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible_to_ai_agent: !listing.visible_to_ai_agent }),
    })
    if (res.ok) {
      const { listing: updated } = await res.json()
      setListings((prev) => prev.map((l) => (l.id === updated.id ? { ...l, ...updated } : l)))
    }
  }

  async function remove(listingId: string) {
    if (!confirm('¿Eliminar esta propiedad?')) return
    const res = await fetch(`/api/listings/${listingId}`, { method: 'DELETE' })
    if (res.ok) setListings((prev) => prev.filter((l) => l.id !== listingId))
  }

  async function uploadPhoto(listingId: string, file: File) {
    const body = new FormData()
    body.append('file', file)
    const res = await fetch(`/api/listings/${listingId}/photo`, { method: 'POST', body })
    if (res.ok) {
      const { listing: updated } = await res.json()
      setListings((prev) => prev.map((l) => (l.id === listingId ? { ...l, ...updated } : l)))
    } else {
      const body = await res.json().catch(() => ({}))
      alert(body.error ?? 'No se pudo subir la foto')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          placeholder="Buscar por título, dirección o ciudad..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field flex-1 min-w-[200px]"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field w-auto">
          <option value="all">Todos los estados</option>
          {LISTING_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} className="input-field w-auto">
          <option value="all">Todos los tipos</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + Agregar propiedad
        </button>
      </div>

      {showForm && (
        <NewListingForm
          onCreated={(listing) => {
            setListings((prev) => [{ ...listing, photos: [], agents: [] }, ...prev])
            setShowForm(false)
          }}
          onClose={() => setShowForm(false)}
        />
      )}

      <div className="divide-y divide-[var(--border)]">
        {filtered.map((listing) => (
          <div key={listing.id} className="py-3 flex items-center gap-4">
            <label className="shrink-0 cursor-pointer group relative">
              {listing.cover_photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={listing.cover_photo_url}
                  alt={listing.title}
                  className="w-14 h-14 rounded-lg object-cover border border-[var(--border)]"
                />
              ) : (
                <span className="w-14 h-14 rounded-lg border border-dashed border-[var(--border)] grid place-items-center text-[var(--text-4)] text-[10px] text-center leading-tight">
                  + Foto
                </span>
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadPhoto(listing.id, file)
                  e.target.value = ''
                }}
              />
            </label>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {listing.title} {listing.featured && '⭐'}
              </p>
              <p className="text-xs text-[var(--text-3)] truncate">
                {listing.address_line}, {listing.area_name}, {listing.city}
              </p>
              <p className="text-xs text-[var(--text-3)]">
                {listing.bedrooms} hab. · {listing.bathrooms} baños · {listing.area_sqft.toLocaleString()} pies²
              </p>
            </div>
            <p className="font-semibold w-28 text-right text-[var(--teal-700)]">
              ${listing.price.toLocaleString()}
              {listing.listing_type === 'rent' ? '/mes' : ''}
            </p>
            <span className="badge bg-[var(--teal-50)] border-transparent text-[var(--teal-800)] capitalize">
              {LISTING_STATUS_LABELS[listing.status] ?? listing.status}
            </span>
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={listing.visible_to_ai_agent}
                onChange={() => toggleVisibility(listing)}
              />
              IA
            </label>
            <button onClick={() => remove(listing.id)} className="text-red-600 text-sm">
              Eliminar
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-[var(--text-3)]">Ninguna propiedad coincide con estos filtros.</p>
        )}
      </div>
    </div>
  )
}
