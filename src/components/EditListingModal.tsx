'use client'

import { useState } from 'react'
import type { AiAgent, ListingWithPhotos } from '@/types'
import { PROPERTY_TYPES, LISTING_TYPES, LISTING_STATUSES, AMENITIES, PRICE_DISPLAY_OPTIONS, RENTAL_PERIODS, CURRENCIES } from '@/constants'

const LISTING_STATUS_LABELS: Record<string, string> = {
  available: 'Disponible',
  pending: 'Pendiente',
  sold: 'Vendida',
  rented: 'Rentada',
  withdrawn: 'Retirada',
}

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

interface EditListingModalProps {
  listing: ListingWithPhotos
  agents: AiAgent[]
  onSaved: (listing: ListingWithPhotos) => void
  onClose: () => void
}

export function EditListingModal({ listing, agents, onSaved, onClose }: EditListingModalProps) {
  const [form, setForm] = useState({
    title: listing.title,
    description: listing.description ?? '',
    propertyType: listing.property_type,
    listingType: listing.listing_type,
    status: listing.status,
    addressLine: listing.address_line ?? '',
    areaName: listing.area_name ?? '',
    city: listing.city ?? '',
    state: listing.state ?? '',
    zip: listing.zip ?? '',
    price: String(listing.price),
    currency: listing.currency,
    priceDisplay: listing.price_display,
    rentalPeriod: listing.rental_period ?? 'night',
    confoturEligible: listing.confotur_eligible,
    deliveryDate: listing.delivery_date ?? '',
    bedrooms: String(listing.bedrooms),
    bathrooms: String(listing.bathrooms),
    areaSqft: String(listing.area_sqft),
    parkingSpaces: String(listing.parking_spaces),
    yearBuilt: listing.year_built ? String(listing.year_built) : '',
    virtualTourUrl: listing.virtual_tour_url ?? '',
    featured: listing.featured,
    visibleToAiAgent: listing.visible_to_ai_agent,
  })
  const [amenities, setAmenities] = useState<string[]>(listing.amenities ?? [])
  const [customAmenity, setCustomAmenity] = useState('')
  const [agentId, setAgentId] = useState<string>(listing.agents[0]?.id ?? '')
  const [photos, setPhotos] = useState(listing.photos)
  const [saving, setSaving] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleAmenity(name: string) {
    setAmenities((prev) => (prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]))
  }

  function addCustomAmenity() {
    const name = customAmenity.trim()
    if (name && !amenities.includes(name)) setAmenities((prev) => [...prev, name])
    setCustomAmenity('')
  }

  async function handleUploadPhoto(file: File) {
    setPhotoBusy(true)
    setError(null)
    const body = new FormData()
    body.append('file', file)
    const res = await fetch(`/api/listings/${listing.id}/photo`, { method: 'POST', body })
    if (res.ok) {
      const { photo } = await res.json()
      if (photo) setPhotos((prev) => [...prev, photo])
    } else {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'No se pudo subir la foto')
    }
    setPhotoBusy(false)
  }

  async function handleSetCover(photoId: string) {
    setPhotoBusy(true)
    const res = await fetch(`/api/listings/${listing.id}/photo/${photoId}`, { method: 'PATCH' })
    if (res.ok) {
      setPhotos((prev) => prev.map((p) => ({ ...p, is_cover: p.id === photoId })))
    }
    setPhotoBusy(false)
  }

  async function handleDeletePhoto(photoId: string) {
    if (!confirm('¿Eliminar esta foto?')) return
    setPhotoBusy(true)
    const res = await fetch(`/api/listings/${listing.id}/photo/${photoId}`, { method: 'DELETE' })
    if (res.ok) {
      setPhotos((prev) => {
        const remaining = prev.filter((p) => p.id !== photoId)
        const removedWasCover = prev.find((p) => p.id === photoId)?.is_cover
        if (removedWasCover && remaining.length > 0) {
          remaining[0] = { ...remaining[0], is_cover: true }
        }
        return remaining
      })
    }
    setPhotoBusy(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const res = await fetch(`/api/listings/${listing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        description: form.description || null,
        property_type: form.propertyType,
        listing_type: form.listingType,
        status: form.status,
        address_line: form.addressLine || null,
        area_name: form.areaName || null,
        city: form.city || null,
        state: form.state || null,
        zip: form.zip || null,
        price: Number(form.price) || 0,
        currency: form.currency,
        price_display: form.priceDisplay,
        confotur_eligible: form.confoturEligible,
        delivery_date: form.deliveryDate || null,
        rental_period: form.listingType === 'vacation_rental' ? form.rentalPeriod : null,
        bedrooms: Number(form.bedrooms) || 0,
        bathrooms: Number(form.bathrooms) || 0,
        area_sqft: Number(form.areaSqft) || 0,
        parking_spaces: Number(form.parkingSpaces) || 0,
        year_built: form.yearBuilt ? Number(form.yearBuilt) : null,
        virtual_tour_url: form.virtualTourUrl || null,
        amenities,
        featured: form.featured,
        visible_to_ai_agent: form.visibleToAiAgent,
        agentId: agentId || null,
      }),
    })

    if (!res.ok) {
      setSaving(false)
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'No se pudo guardar la propiedad')
      return
    }

    const { listing: updated } = await res.json()
    const assignedAgent = agents.find((a) => a.id === agentId)
    onSaved({
      ...listing,
      ...updated,
      photos,
      agents: assignedAgent ? [{ id: assignedAgent.id, name: assignedAgent.name, specialty: assignedAgent.specialty, status: assignedAgent.status }] : [],
      amenities,
    })
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
          <h2 className="font-display font-semibold text-lg text-[var(--text-1)]">Editar propiedad</h2>
          <button type="button" onClick={onClose} className="text-[var(--text-3)] text-xl leading-none">
            &times;
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <label className="text-xs text-[var(--text-3)]">Fotos de la propiedad</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt=""
                  onClick={() => !photoBusy && handleSetCover(photo.id)}
                  className={`w-20 h-20 rounded-lg object-cover border-2 cursor-pointer ${
                    photo.is_cover ? 'border-[var(--teal-600)]' : 'border-transparent'
                  }`}
                />
                {photo.is_cover && (
                  <span className="absolute bottom-0 left-0 right-0 text-[10px] text-center bg-[var(--teal-600)] text-white rounded-b-md">
                    Portada
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(photo.id)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white text-xs opacity-0 group-hover:opacity-100 transition"
                >
                  &times;
                </button>
              </div>
            ))}
            <label className="w-20 h-20 rounded-lg border border-dashed border-[var(--border)] grid place-items-center text-[var(--text-4)] text-xs cursor-pointer">
              + Agregar
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                disabled={photoBusy}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handleUploadPhoto(file)
                  e.target.value = ''
                }}
              />
            </label>
          </div>
        </div>

        <input
          placeholder="Título"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="input-field w-full"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            value={form.propertyType}
            onChange={(e) => setForm({ ...form, propertyType: e.target.value as typeof form.propertyType })}
            className="input-field"
          >
            {PROPERTY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{PROPERTY_TYPE_LABELS[t.value] ?? t.label}</option>
            ))}
          </select>
          <select
            value={form.listingType}
            onChange={(e) => setForm({ ...form, listingType: e.target.value as typeof form.listingType })}
            className="input-field"
          >
            {LISTING_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{LISTING_TYPE_LABELS[t.value] ?? t.label}</option>
            ))}
          </select>
        </div>

        <input
          placeholder="Dirección"
          value={form.addressLine}
          onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
          className="input-field w-full"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            placeholder="Ciudad"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="input-field"
          />
          <input
            placeholder="Provincia / Estado"
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
            className="input-field"
          />
          <input
            placeholder="Código postal"
            value={form.zip}
            onChange={(e) => setForm({ ...form, zip: e.target.value })}
            className="input-field"
          />
        </div>
        <input
          placeholder="Zona / Sector"
          value={form.areaName}
          onChange={(e) => setForm({ ...form, areaName: e.target.value })}
          className="input-field w-full"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            placeholder="Precio"
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="input-field"
            required
          />
          <select
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value as typeof form.currency })}
            className="input-field"
          >
            {CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>{c.value}</option>
            ))}
          </select>
          <select
            value={form.priceDisplay}
            onChange={(e) => setForm({ ...form, priceDisplay: e.target.value as typeof form.priceDisplay })}
            className="input-field"
          >
            {PRICE_DISPLAY_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
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
        </div>

        {form.listingType === 'vacation_rental' && (
          <select
            value={form.rentalPeriod}
            onChange={(e) => setForm({ ...form, rentalPeriod: e.target.value as typeof form.rentalPeriod })}
            className="input-field w-full"
          >
            {RENTAL_PERIODS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        )}

        {form.propertyType === 'land' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="Área del solar (m²)" type="number" value={form.areaSqft} onChange={(e) => setForm({ ...form, areaSqft: e.target.value })} className="input-field" />
            <input placeholder="URL de tour virtual" value={form.virtualTourUrl} onChange={(e) => setForm({ ...form, virtualTourUrl: e.target.value })} className="input-field" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <input placeholder="Habitaciones" type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} className="input-field" />
              <input placeholder="Baños" type="number" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} className="input-field" />
              <input placeholder="Parqueos" type="number" value={form.parkingSpaces} onChange={(e) => setForm({ ...form, parkingSpaces: e.target.value })} className="input-field" />
              <input placeholder="Área (pies²)" type="number" value={form.areaSqft} onChange={(e) => setForm({ ...form, areaSqft: e.target.value })} className="input-field" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="Año de construcción" type="number" value={form.yearBuilt} onChange={(e) => setForm({ ...form, yearBuilt: e.target.value })} className="input-field" />
              <input placeholder="URL de tour virtual" value={form.virtualTourUrl} onChange={(e) => setForm({ ...form, virtualTourUrl: e.target.value })} className="input-field" />
            </div>
          </>
        )}

        <textarea
          placeholder="Descripción"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="input-field w-full"
          rows={3}
        />

        <div>
          <label className="text-xs text-[var(--text-3)]">Características y comodidades</label>
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
              placeholder="Agregar característica personalizada"
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

        <div>
          <label className="text-xs text-[var(--text-3)]">Agente IA de esta propiedad</label>
          <p className="text-xs text-[var(--text-4)] mb-1">Asigna un agente dedicado que conozca específicamente esta propiedad.</p>
          <select value={agentId} onChange={(e) => setAgentId(e.target.value)} className="input-field w-full">
            <option value="">Ninguno en particular (cualquier agente activo)</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.name} — {a.specialty}</option>
            ))}
          </select>
        </div>

        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}
          className="input-field w-full"
        >
          {LISTING_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{LISTING_STATUS_LABELS[s.value] ?? s.label}</option>
          ))}
        </select>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.visibleToAiAgent}
              onChange={(e) => setForm({ ...form, visibleToAiAgent: e.target.checked })}
            />
            Activa (visible para la IA)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
            />
            Propiedad destacada
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
