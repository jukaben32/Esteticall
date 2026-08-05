'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Bed, Bath, Move, Car, ExternalLink, Pencil, Trash2, Copy, Check, Plus, Images, X } from 'lucide-react'
import type { AiAgent, ListingWithPhotos } from '@/types'
import { LISTING_STATUSES } from '@/constants'
import { EditListingModal } from '@/components/EditListingModal'
import { FloatingWidgetLauncher, type WidgetVisualConfig } from '@/components/FloatingWidgetLauncher'
import { formatDate } from '@/lib/formatDate'
import { listingPriceSuffix, isLandListing } from '@/lib/listingFormat'

const LISTING_STATUS_LABELS: Record<string, string> = {
  available: 'Disponible',
  pending: 'Pendiente',
  sold: 'Vendida',
  rented: 'Rentada',
  withdrawn: 'Retirada',
}

const STATUS_DOT_CLASSES: Record<string, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  slate: 'bg-slate-400',
  blue: 'bg-blue-500',
  red: 'bg-red-500',
}

const DEFAULT_WIDGET_COLOR = '#0E7C5A'

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  house: 'Casa',
  apartment: 'Apartamento',
  townhouse: 'Townhouse',
  commercial: 'Comercial',
  condo: 'Condominio',
  land: 'Solar',
}

const LISTING_TYPE_LABELS: Record<string, string> = {
  sale: 'En venta',
  rent: 'En alquiler',
  vacation_rental: 'Renta vacacional (Airbnb)',
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
  const [photos, setPhotos] = useState(initialListing.photos)
  const [activePhoto, setActivePhoto] = useState(0)
  const [showEdit, setShowEdit] = useState(false)
  const [showAllPhotos, setShowAllPhotos] = useState(false)
  const [savingAgent, setSavingAgent] = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)
  const [idCopied, setIdCopied] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function copyListingId() {
    navigator.clipboard.writeText(listing.listing_code)
    setIdCopied(true)
    setTimeout(() => setIdCopied(false), 1500)
  }

  const assignedAgent = listing.agents[0] ?? null
  const assignedAgentFull = agents.find((a) => a.id === assignedAgent?.id) ?? null

  const galleryPhotos = photos.length
    ? photos
    : listing.cover_photo_url
      ? [{ id: 'cover', url: listing.cover_photo_url, is_cover: true }]
      : []

  const widgetConfig: WidgetVisualConfig = {
    name: assignedAgentFull?.name ?? 'Asistente IA',
    position: 'bottom-right',
    theme: 'light',
    primaryColor: DEFAULT_WIDGET_COLOR,
    greetingMessage:
      assignedAgentFull?.greeting_message ?? 'Hola, gracias por tu interés en esta propiedad. ¿En qué puedo ayudarte?',
    agentId: assignedAgentFull?.id ?? null,
    agentName: assignedAgentFull?.name ?? null,
  }

  async function handleUploadPhoto(file: File) {
    setPhotoBusy(true)
    const body = new FormData()
    body.append('file', file)
    const res = await fetch(`/api/listings/${listing.id}/photo`, { method: 'POST', body })
    if (res.ok) {
      const { photo } = await res.json()
      if (photo) setPhotos((prev) => [...prev, photo])
    }
    setPhotoBusy(false)
  }

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
            <input
              ref={fileInputRef}
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
            {galleryPhotos.length > 0 ? (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 h-72">
                  <button
                    type="button"
                    onClick={() => setShowAllPhotos(true)}
                    className="sm:col-span-2 h-full"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={galleryPhotos[Math.min(activePhoto, galleryPhotos.length - 1)]?.url}
                      alt={listing.title}
                      className="w-full h-full object-cover rounded-xl border border-[var(--border)]"
                    />
                  </button>
                  {galleryPhotos.length > 1 && (
                    <div className="grid grid-cols-2 gap-2 h-full">
                      {galleryPhotos.slice(1, 5).map((p, i) => {
                        const isLastVisible = i === 3 && galleryPhotos.length > 5
                        return (
                          <button
                            type="button"
                            key={p.id}
                            onClick={() => (isLastVisible ? setShowAllPhotos(true) : setActivePhoto(i + 1))}
                            className="relative rounded-lg overflow-hidden border border-[var(--border)]"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.url} alt="" className="w-full h-full object-cover" />
                            {isLastVisible && (
                              <span className="absolute inset-0 bg-black/50 text-white text-sm font-semibold grid place-items-center">
                                +{galleryPhotos.length - 5}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                  <p className="text-xs text-[var(--text-3)]">
                    {galleryPhotos.length} foto{galleryPhotos.length === 1 ? '' : 's'} · La primera foto es la portada
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={photoBusy}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> {photoBusy ? 'Subiendo…' : 'Agregar fotos'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAllPhotos(true)}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      <Images className="w-3.5 h-3.5" /> Ver todas
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-72 rounded-xl border border-dashed border-[var(--border)] grid place-items-center gap-2 text-[var(--text-4)] text-sm">
                Sin fotos todavía
                <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary text-xs px-3 py-1.5">
                  <Plus className="w-3.5 h-3.5" /> Agregar fotos
                </button>
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
                {listingPriceSuffix(listing)}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 mt-4 text-sm text-[var(--text-2)]">
              {isLandListing(listing) ? (
                <span className="flex items-center gap-1"><Move className="w-4 h-4" /> {listing.area_sqft.toLocaleString()} m²</span>
              ) : (
                <>
                  <span className="flex items-center gap-1"><Bed className="w-4 h-4" /> {listing.bedrooms} hab.</span>
                  <span className="flex items-center gap-1"><Bath className="w-4 h-4" /> {listing.bathrooms} baños</span>
                  <span className="flex items-center gap-1"><Move className="w-4 h-4" /> {listing.area_sqft.toLocaleString()} pies²</span>
                  <span className="flex items-center gap-1"><Car className="w-4 h-4" /> {listing.parking_spaces} parqueos</span>
                </>
              )}
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
              <label className="text-xs text-[var(--text-3)]">Estado del listado</label>
              <div className="mt-1.5 space-y-1">
                {LISTING_STATUSES.map((s) => {
                  const active = listing.status === s.value
                  return (
                    <button
                      key={s.value}
                      type="button"
                      disabled={savingStatus}
                      onClick={() => changeStatus(s.value)}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50 ${
                        active ? 'bg-[var(--teal-50)]' : 'hover:bg-[var(--bg-subtle)]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${STATUS_DOT_CLASSES[s.color] ?? 'bg-slate-400'}`} />
                        <span className={active ? 'text-[var(--text-1)] font-medium' : 'text-[var(--text-2)]'}>
                          {LISTING_STATUS_LABELS[s.value] ?? s.label}
                        </span>
                      </span>
                      <span
                        className={`w-4 h-4 rounded-full border-2 grid place-items-center shrink-0 ${
                          active ? 'border-[var(--teal-600)]' : 'border-[var(--border)]'
                        }`}
                      >
                        {active && <span className="w-2 h-2 rounded-full bg-[var(--teal-600)]" />}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <label className="flex items-start justify-between gap-3 text-sm cursor-pointer select-none pt-1 border-t border-[var(--border)]">
              <span className="pt-2.5">
                <span className="block text-[var(--text-1)]">Visible para la IA</span>
                <span className="block text-xs text-[var(--text-3)] mt-0.5">
                  Cuando está activo, la IA usa este listado al responder llamadas de clientes.
                </span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={listing.visible_to_ai_agent}
                onClick={toggleVisible}
                className={`relative w-9 h-5 rounded-full shrink-0 mt-2.5 transition-colors ${
                  listing.visible_to_ai_agent ? 'bg-[var(--teal-600)]' : 'bg-[var(--border)]'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    listing.visible_to_ai_agent ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
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
                <dd className="text-[var(--text-1)]">{formatDate(listing.listed_at)}</dd>
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
                    {assignedAgent.status === 'live' ? '● En vivo · Atendiendo llamadas' : 'Pausado'}
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

      <div
        className={`card-surface p-4 flex items-start gap-3 ${
          listing.visible_to_ai_agent ? '' : 'opacity-70'
        }`}
      >
        <span
          className={`w-8 h-8 rounded-full grid place-items-center shrink-0 ${
            listing.visible_to_ai_agent ? 'bg-[var(--teal-100)] text-[var(--teal-700)]' : 'bg-[var(--bg-subtle)] text-[var(--text-4)]'
          }`}
        >
          <Check className="w-4 h-4" />
        </span>
        <div>
          <p className="text-sm font-medium text-[var(--text-1)]">
            {listing.visible_to_ai_agent
              ? 'Esta propiedad está activa y visible para tus agentes IA'
              : 'Esta propiedad no es visible para tus agentes IA'}
          </p>
          <p className="text-xs text-[var(--text-3)] mt-0.5">
            {listing.visible_to_ai_agent
              ? 'Cuando los clientes llaman y preguntan por propiedades, la IA hablará de esta, incluyendo precio, características y disponibilidad.'
              : 'Activa "Visible para la IA" para que los agentes puedan mencionar esta propiedad en las llamadas.'}
          </p>
        </div>
      </div>

      {showEdit && (
        <EditListingModal
          listing={listing}
          agents={agents}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => {
            setListing(updated)
            setPhotos(updated.photos)
            setShowEdit(false)
          }}
        />
      )}

      {showAllPhotos && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 flex items-start sm:items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowAllPhotos(false)}
        >
          <div className="card-raised w-full max-w-2xl my-8 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-lg text-[var(--text-1)]">
                Todas las fotos ({galleryPhotos.length})
              </h2>
              <button onClick={() => setShowAllPhotos(false)} aria-label="Cerrar" className="text-[var(--text-3)] hover:text-[var(--text-1)]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {galleryPhotos.map((p, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={p.id}
                  src={p.url}
                  alt=""
                  onClick={() => {
                    setActivePhoto(i)
                    setShowAllPhotos(false)
                  }}
                  className="w-full h-32 object-cover rounded-lg border border-[var(--border)] cursor-pointer"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <FloatingWidgetLauncher businessId={listing.business_id} config={widgetConfig} mode="embed" />
    </div>
  )
}
