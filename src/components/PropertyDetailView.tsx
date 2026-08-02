'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Bed, Bath, Move, Car, ExternalLink, Pencil, Trash2, Copy, Check } from 'lucide-react'
import type { AiAgent, ListingWithPhotos } from '@/types'
import { LISTING_STATUSES } from '@/constants'
import { EditListingModal } from '@/components/EditListingModal'

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
  land: 'Terreno',
}

const LISTING_TYPE_LABELS: Record<string, string> = {
  sale: 'En venta',
  rent: 'En alquiler',
}

export function PropertyDetailView({
  initialListing,
  agents,
}: {
  initialListing: ListingWithPhotos
  agents: AiAgent[]
}) {
  const router = useRouter()
  const [listing, setListing] = useState(initialListing)
  const [activePhoto, setActivePhoto] = useState(0)
  const [showEdit, setShowEdit] = useState(false)
  const [savingAgent, setSavingAgent] = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)
  const [idCopied, setIdCopied] = useState(false)

  function copyListingId() {
    navigator.clipboard.writeText(listing.listing_code)
    setIdCopied(true)
    setTimeout(() => setIdCopied(false), 1500)
  }

  const assignedAgent = listing.agents[0] ?? null
  const photos = listing.photos.length
    ? listing.photos
    : listing.cover_photo_url
      ? [{ id: 'cover', url: listing.cover_photo_url, is_cover: true }]
      : []

  async function toggleVisible() {
    const res = await fetch(`/api/listings/${listing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible_to_ai_agent: !listing.visible_to_ai_agent }),
    })
    if (res.ok) {
      const { listing: updated } = await res.json()
      setListing((prev) => ({ ...prev, ...updated }))
    }
  }

  async function changeStatus(status: string) {
    setSavingStatus(true)
    const res = await fetch(`/api/listings/${listing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const { listing: updated } = await res.json()
      setListing((prev) => ({ ...prev, ...updated }))
    }
    setSavingStatus(false)
  }

  async function changeAgent(agentId: string) {
    setSavingAgent(true)
    const res = await fetch(`/api/listings/${listing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: agentId || null }),
    })
    if (res.ok) {
      const found = agents.find((a) => a.id === agentId)
      setListing((prev) => ({
        ...prev,
        agents: found ? [{ id: found.id, name: found.name, specialty: found.specialty, status: found.status }] : [],
      }))
    }
    setSavingAgent(false)
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar esta propiedad? Esta acción no se puede deshacer.')) return
    const res = await fetch(`/api/listings/${listing.id}`, { method: 'DELETE' })
    if (res.ok) router.push('/dashboard/listings')
  }

  return (
    <div className="space-y-4">
      <Link href="/dashboard/listings" className="inline-flex items-center gap-1 text-sm text-[var(--text-3)] hover:text-[var(--text-1)]">
        <ArrowLeft className="w-4 h-4" /> Volver a propiedades
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="card-surface p-4">
            {photos.length > 0 ? (
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photos[activePhoto]?.url}
                  alt={listing.title}
                  className="w-full h-72 object-cover rounded-xl border border-[var(--border)]"
                />
                {photos.length > 1 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto">
                    {photos.map((p, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={p.id}
                        src={p.url}
                        alt=""
                        onClick={() => setActivePhoto(i)}
                        className={`w-16 h-16 rounded-lg object-cover border-2 shrink-0 cursor-pointer ${
                          i === activePhoto ? 'border-[var(--teal-600)]' : 'border-transparent'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-72 rounded-xl border border-dashed border-[var(--border)] grid place-items-center text-[var(--text-4)] text-sm">
                Sin fotos todavía
              </div>
            )}
          </div>

          <div className="card-surface p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="font-display font-semibold text-xl text-[var(--text-1)]">
                  {listing.title} {listing.featured && '⭐'}
                </h1>
                <p className="text-sm text-[var(--text-3)]">
                  {[listing.address_line, listing.area_name, listing.city, listing.state, listing.zip]
                    .filter(Boolean)
                    .join(', ') || 'Sin dirección'}
                </p>
              </div>
              <p className="text-2xl font-bold text-[var(--teal-700)]">
                ${listing.price.toLocaleString()}
                {listing.listing_type === 'rent' ? '/mes' : ''}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 mt-4 text-sm text-[var(--text-2)]">
              <span className="flex items-center gap-1"><Bed className="w-4 h-4" /> {listing.bedrooms} hab.</span>
              <span className="flex items-center gap-1"><Bath className="w-4 h-4" /> {listing.bathrooms} baños</span>
              <span className="flex items-center gap-1"><Move className="w-4 h-4" /> {listing.area_sqft.toLocaleString()} pies²</span>
              <span className="flex items-center gap-1"><Car className="w-4 h-4" /> {listing.parking_spaces} parqueos</span>
            </div>

            {listing.description && (
              <p className="text-sm text-[var(--text-2)] mt-4 whitespace-pre-wrap">{listing.description}</p>
            )}

            {listing.amenities.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-[var(--text-3)] mb-1.5">Características y comodidades</p>
                <div className="flex flex-wrap gap-1.5">
                  {listing.amenities.map((a) => (
                    <span key={a} className="badge">{a}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card-surface p-4 space-y-3">
            <div className="flex items-center justify-between">
              <button onClick={() => setShowEdit(true)} className="btn-secondary flex-1 flex items-center justify-center gap-1.5">
                <Pencil className="w-4 h-4" /> Editar
              </button>
              <button onClick={handleDelete} className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs text-[var(--text-3)]">Estado</label>
              <select
                value={listing.status}
                disabled={savingStatus}
                onChange={(e) => changeStatus(e.target.value)}
                className="input-field w-full mt-1"
              >
                {LISTING_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{LISTING_STATUS_LABELS[s.value] ?? s.label}</option>
                ))}
              </select>
            </div>

            <label className="flex items-center justify-between text-sm">
              <span>Visible para la IA</span>
              <input type="checkbox" checked={listing.visible_to_ai_agent} onChange={toggleVisible} />
            </label>
          </div>

          <div className="card-surface p-4">
            <p className="text-sm font-semibold text-[var(--text-1)] mb-3">Detalles de la propiedad</p>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-[var(--text-3)]">Tipo</dt>
                <dd className="text-[var(--text-1)]">{PROPERTY_TYPE_LABELS[listing.property_type] ?? listing.property_type}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[var(--text-3)]">Listado</dt>
                <dd className="text-[var(--text-1)]">{LISTING_TYPE_LABELS[listing.listing_type] ?? listing.listing_type}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[var(--text-3)]">Año de construcción</dt>
                <dd className="text-[var(--text-1)]">{listing.year_built ?? '—'}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[var(--text-3)]">Publicado</dt>
                <dd className="text-[var(--text-1)]">{new Date(listing.listed_at).toLocaleDateString('es-DO')}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[var(--text-3)]">ID de propiedad</dt>
                <dd className="flex items-center gap-1.5 text-[var(--text-1)]">
                  {listing.listing_code}
                  <button onClick={copyListingId} title="Copiar" className="text-[var(--text-3)] hover:text-[var(--text-1)]">
                    {idCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </dd>
              </div>
            </dl>
          </div>

          <div className="card-surface p-4">
            <p className="text-sm font-semibold text-[var(--text-1)] mb-1">Agente IA</p>
            <p className="text-xs text-[var(--text-3)] mb-3">El agente dedicado que responde llamadas sobre esta propiedad.</p>

            {assignedAgent && (
              <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-[var(--bg-subtle)]">
                <span className="w-8 h-8 rounded-full bg-[var(--teal-100)] text-[var(--teal-800)] grid place-items-center text-sm font-semibold">
                  {assignedAgent.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{assignedAgent.name}</p>
                  <p className="text-xs text-[var(--text-3)]">
                    {assignedAgent.status === 'live' ? '● En vivo' : 'Pausado'}
                  </p>
                </div>
              </div>
            )}

            <select
              value={assignedAgent?.id ?? ''}
              disabled={savingAgent}
              onChange={(e) => changeAgent(e.target.value)}
              className="input-field w-full"
            >
              <option value="">Ninguno en particular</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name} — {a.specialty}</option>
              ))}
            </select>
          </div>

          {listing.virtual_tour_url && (
            <div className="card-surface p-4">
              <p className="text-sm font-semibold text-[var(--text-1)] mb-3">Tour virtual</p>
              <a
                href={listing.virtual_tour_url}
                target="_blank"
                rel="noreferrer"
                className="btn-primary w-full flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-4 h-4" /> Abrir tour virtual
              </a>
            </div>
          )}
        </div>
      </div>

      {showEdit && (
        <EditListingModal
          listing={listing}
          agents={agents}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => {
            setListing(updated)
            setShowEdit(false)
          }}
        />
      )}
    </div>
  )
}
