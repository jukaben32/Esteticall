'use client'

import { useState, type Dispatch, type SetStateAction } from 'react'
import Link from 'next/link'
import { Plus, Unlink } from 'lucide-react'
import type { ChannelListingWithDetails, ChannelHostConnectionWithStats, ListingWithPhotos } from '@/types'

const CHANNEL_LABELS: Record<string, string> = { airbnb: 'Airbnb', booking: 'Booking.com', vrbo: 'VRBO' }

const CHANNEL_STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-50 text-green-700',
  pending: 'bg-amber-50 text-amber-700',
  syncing: 'bg-blue-50 text-blue-700',
  error: 'bg-red-50 text-red-700',
  paused: 'bg-gray-100 text-gray-600',
}
const CHANNEL_STATUS_LABELS: Record<string, string> = {
  active: 'Activa',
  pending: 'Pendiente',
  syncing: 'Sincronizando',
  error: 'Error',
  paused: 'Pausada',
}

interface ListingsTabProps {
  channelListings: ChannelListingWithDetails[]
  setChannelListings: Dispatch<SetStateAction<ChannelListingWithDetails[]>>
  hostConnections: ChannelHostConnectionWithStats[]
  eligibleListings: ListingWithPhotos[]
}

export function ListingsTab({ channelListings, setChannelListings, hostConnections, eligibleListings }: ListingsTabProps) {
  const [showForm, setShowForm] = useState(false)

  async function unlink(channelListingId: string) {
    if (!confirm('¿Desvincular esta propiedad del canal? Deja de sincronizarse (no se elimina de Airbnb automáticamente).')) return
    const res = await fetch(`/api/channels/listings/${channelListingId}`, { method: 'DELETE' })
    if (res.ok) setChannelListings((prev) => prev.filter((cl) => cl.id !== channelListingId))
  }

  if (hostConnections.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--text-3)]">
        Primero agrega un dueño co-anfitrionado en la pestaña &ldquo;Conexiones&rdquo;.
      </p>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-semibold text-[var(--text-1)]">Propiedades en canales</h2>
        <button className="btn-primary text-sm" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-1 inline" />
          Vincular propiedad
        </button>
      </div>

      {showForm && (
        <LinkListingForm
          hostConnections={hostConnections}
          eligibleListings={eligibleListings}
          onCreated={(cl) => {
            setChannelListings((prev) => [cl, ...prev])
            setShowForm(false)
          }}
          onClose={() => setShowForm(false)}
        />
      )}

      {eligibleListings.length === 0 && (
        <p className="py-6 text-center text-sm text-[var(--text-3)]">
          No tienes propiedades de tipo &ldquo;Alquiler vacacional&rdquo; todavía. Crea o marca una en{' '}
          <Link href="/dashboard/listings" className="text-[var(--teal-700)] underline">
            Propiedades
          </Link>{' '}
          para poder conectarla a un canal.
        </p>
      )}

      <div className="divide-y divide-[var(--border)]">
        {channelListings.map((cl) => (
          <div key={cl.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-3 min-w-0 sm:flex-1">
              {cl.listing?.cover_photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cl.listing.cover_photo_url}
                  alt={cl.listing.title}
                  className="w-12 h-12 rounded-lg object-cover border border-[var(--border)] shrink-0"
                />
              ) : (
                <span className="w-12 h-12 rounded-lg border border-dashed border-[var(--border)] grid place-items-center text-[var(--text-4)] text-[10px] shrink-0">
                  Sin foto
                </span>
              )}
              <div className="min-w-0">
                <p className="font-medium truncate">{cl.listing?.title}</p>
                <p className="text-xs text-[var(--text-3)] truncate">
                  {CHANNEL_LABELS[cl.hostConnection?.channel ?? 'airbnb']} · {cl.hostConnection?.owner_name} · $
                  {Number(cl.nightly_price ?? 0).toFixed(0)}/noche
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 pl-[60px] sm:pl-0">
              <span className={`badge border-transparent ${CHANNEL_STATUS_STYLES[cl.channel_status] ?? ''}`}>
                {CHANNEL_STATUS_LABELS[cl.channel_status] ?? cl.channel_status}
              </span>
              <span className="text-xs text-[var(--text-3)]">
                {cl.last_synced_at ? new Date(cl.last_synced_at).toLocaleDateString() : 'Nunca sincronizada'}
              </span>
              <button onClick={() => unlink(cl.id)} title="Desvincular" className="p-1.5 rounded-lg text-red-600 hover:bg-red-50">
                <Unlink className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {channelListings.length === 0 && (
          <p className="py-6 text-center text-sm text-[var(--text-3)]">Ninguna propiedad vinculada todavía.</p>
        )}
      </div>
    </div>
  )
}

function LinkListingForm({
  hostConnections,
  eligibleListings,
  onCreated,
  onClose,
}: {
  hostConnections: ChannelHostConnectionWithStats[]
  eligibleListings: ListingWithPhotos[]
  onCreated: (channelListing: ChannelListingWithDetails) => void
  onClose: () => void
}) {
  const [listingId, setListingId] = useState(eligibleListings[0]?.id ?? '')
  const [hostConnectionId, setHostConnectionId] = useState(hostConnections[0]?.id ?? '')
  const [overridePrice, setOverridePrice] = useState(false)
  const [nightlyPrice, setNightlyPrice] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await fetch('/api/channels/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listingId,
        hostConnectionId,
        overridePrice,
        nightlyPrice: overridePrice ? nightlyPrice : undefined,
      }),
    })
    setLoading(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'No se pudo vincular la propiedad')
      return
    }
    const { channelListing } = await res.json()
    const listing = eligibleListings.find((l) => l.id === listingId)
    const hostConnection = hostConnections.find((h) => h.id === hostConnectionId)
    onCreated({
      ...channelListing,
      listing: listing
        ? {
            id: listing.id,
            title: listing.title,
            listing_code: listing.listing_code,
            price: listing.price,
            currency: listing.currency,
            cover_photo_url: listing.cover_photo_url,
            listing_type: listing.listing_type,
            rental_period: listing.rental_period,
          }
        : undefined,
      hostConnection: hostConnection
        ? {
            id: hostConnection.id,
            owner_name: hostConnection.owner_name,
            channel: hostConnection.channel,
            status: hostConnection.status,
            commission_pct: hostConnection.commission_pct,
          }
        : undefined,
    } as ChannelListingWithDetails)
  }

  if (eligibleListings.length === 0) return null

  return (
    <form onSubmit={handleSubmit} className="card-surface p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {error && <p className="col-span-2 text-sm text-red-600">{error}</p>}
      <select value={listingId} onChange={(e) => setListingId(e.target.value)} className="input-field">
        {eligibleListings.map((l) => (
          <option key={l.id} value={l.id}>
            {l.title}
          </option>
        ))}
      </select>
      <select value={hostConnectionId} onChange={(e) => setHostConnectionId(e.target.value)} className="input-field">
        {hostConnections.map((h) => (
          <option key={h.id} value={h.id}>
            {h.owner_name} — {CHANNEL_LABELS[h.channel]}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-2 text-sm text-[var(--text-2)] sm:col-span-2">
        <input type="checkbox" checked={overridePrice} onChange={(e) => setOverridePrice(e.target.checked)} />
        Fijar precio por noche manualmente (si no, se calcula automáticamente)
      </label>
      {overridePrice && (
        <input
          type="number"
          placeholder="Precio por noche"
          value={nightlyPrice}
          onChange={(e) => setNightlyPrice(e.target.value)}
          className="input-field"
        />
      )}
      <div className="col-span-2 flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="btn-secondary">
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Vinculando…' : 'Vincular'}
        </button>
      </div>
    </form>
  )
}
