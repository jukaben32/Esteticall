'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink, Pencil, Trash2, Plus, Images, X, Star, Sparkles } from 'lucide-react'
import type { AiAgent, PreventaProjectWithDetails } from '@/types'
import { EditProjectModal } from '@/components/EditProjectModal'
import { ProjectUnitTypesManager } from '@/components/ProjectUnitTypesManager'
import { formatDate } from '@/lib/formatDate'
import { formatDeliveryDate } from '@/lib/listingFormat'

const PHASE_OPTIONS = [
  { value: 'lanzamiento', label: 'Lanzamiento', color: 'blue' },
  { value: 'en_construccion', label: 'En construcción', color: 'amber' },
  { value: 'entrega', label: 'Entrega', color: 'green' },
] as const

const STATUS_OPTIONS = [
  { value: 'active', label: 'Activo', color: 'green' },
  { value: 'paused', label: 'Pausado', color: 'amber' },
  { value: 'sold_out', label: 'Agotado', color: 'slate' },
] as const

const STATUS_DOT_CLASSES: Record<string, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  slate: 'bg-slate-400',
  blue: 'bg-blue-500',
}

export function ProjectDetailView({
  initialProject,
  agents,
}: {
  initialProject: PreventaProjectWithDetails
  agents: AiAgent[]
}) {
  const router = useRouter()
  const [project, setProject] = useState(initialProject)
  const [photos, setPhotos] = useState(initialProject.photos)
  const [activePhoto, setActivePhoto] = useState(0)
  const [showEdit, setShowEdit] = useState(false)
  const [showAllPhotos, setShowAllPhotos] = useState(false)
  const [savingAgent, setSavingAgent] = useState(false)
  const [savingPhase, setSavingPhase] = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const assignedAgent = project.agents[0] ?? null

  const addressText = [project.address_line, project.area_name, project.city, project.state, project.zip]
    .filter(Boolean)
    .join(', ')

  const galleryPhotos = photos.length
    ? photos
    : project.cover_photo_url
      ? [{ id: 'cover', url: project.cover_photo_url, is_cover: true }]
      : []
  const hasGalleryPhotos = galleryPhotos.length > 0

  async function handleUploadPhoto(file: File) {
    setPhotoBusy(true)
    const body = new FormData()
    body.append('file', file)
    const res = await fetch(`/api/preventa-projects/${project.id}/photo`, { method: 'POST', body })
    if (res.ok) {
      const { photo } = await res.json()
      if (photo) setPhotos((prev) => [...prev, photo])
    }
    setPhotoBusy(false)
  }

  async function changePhase(phase: string) {
    setSavingPhase(true)
    const res = await fetch(`/api/preventa-projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phase }),
    })
    if (res.ok) {
      const { project: updated } = await res.json()
      setProject((prev) => ({ ...prev, ...updated }))
    }
    setSavingPhase(false)
  }

  async function changeStatus(status: string) {
    setSavingStatus(true)
    const res = await fetch(`/api/preventa-projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const { project: updated } = await res.json()
      setProject((prev) => ({ ...prev, ...updated }))
    }
    setSavingStatus(false)
  }

  async function changeAgent(agentId: string) {
    setSavingAgent(true)
    const res = await fetch(`/api/preventa-projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: agentId || null }),
    })
    if (res.ok) {
      const found = agents.find((a) => a.id === agentId)
      setProject((prev) => ({
        ...prev,
        agents: found ? [{ id: found.id, name: found.name, specialty: found.specialty, status: found.status }] : [],
      }))
    }
    setSavingAgent(false)
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar este proyecto? Esta acción no se puede deshacer.')) return
    const res = await fetch(`/api/preventa-projects/${project.id}`, { method: 'DELETE' })
    if (res.ok) router.push('/dashboard/projects')
  }

  return (
    <div className="space-y-4">
      <Link href="/dashboard/projects" className="inline-flex items-center gap-1 text-sm text-[var(--text-3)] hover:text-[var(--text-1)]">
        <ArrowLeft className="w-4 h-4" /> Volver a proyectos
      </Link>

      <div className="card-surface overflow-hidden">
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
        {hasGalleryPhotos ? (
          <div className="p-3">
            <div className={`grid gap-3 ${galleryPhotos.length > 1 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1'}`}>
              <button
                type="button"
                onClick={() => setShowAllPhotos(true)}
                className={`h-[20rem] sm:h-[24rem] rounded-2xl overflow-hidden ring-1 ring-black/5 ${
                  galleryPhotos.length > 1 ? 'sm:col-span-2' : ''
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={galleryPhotos[Math.min(activePhoto, galleryPhotos.length - 1)]?.url}
                  alt={project.name}
                  className="w-full h-full object-cover"
                />
              </button>
              {galleryPhotos.length > 1 && (
                <div className="grid grid-cols-2 gap-3 h-[20rem] sm:h-[24rem]">
                  {galleryPhotos.slice(1, 5).map((p, i) => {
                    const isLastVisible = i === 3 && galleryPhotos.length > 5
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => (isLastVisible ? setShowAllPhotos(true) : setActivePhoto(i + 1))}
                        className="relative rounded-2xl overflow-hidden ring-1 ring-black/5"
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
          </div>
        ) : (
          <div className="p-3">
            <div className="w-full h-[20rem] sm:h-[24rem] rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-raised)]/35 grid place-items-center">
              <Images className="w-10 h-10 text-[var(--text-4)]" />
            </div>
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
          <button type="button" onClick={() => setShowAllPhotos(true)} className="btn-secondary text-xs px-3 py-1.5">
            <Images className="w-3.5 h-3.5" /> Ver todas
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="card-surface p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display font-semibold text-xl text-[var(--text-1)]">{project.name}</h1>
                  {project.featured && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide text-white"
                      style={{ background: 'linear-gradient(135deg, var(--gold) 0%, #8f6a2c 100%)' }}
                    >
                      <Star className="w-3 h-3 fill-current" /> Destacado
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--text-3)] mt-0.5">{addressText || 'Sin dirección'}</p>
                {project.developer_name && (
                  <p className="text-xs text-[var(--text-4)] mt-0.5">Desarrolladora: {project.developer_name}</p>
                )}
              </div>
            </div>

            {(project.reservation_amount || project.delivery_date || project.down_payment_pct) && (
              <div className="flex flex-wrap gap-2 mt-3">
                {project.reservation_amount && (
                  <span className="badge border-transparent bg-[var(--gold)]/15 text-[var(--gold)]">
                    Reserva: {project.reservation_currency} {project.reservation_amount.toLocaleString()}
                  </span>
                )}
                {project.down_payment_pct && (
                  <span className="badge border-transparent bg-[var(--teal-50)] text-[var(--teal-700)]">
                    Inicial: {project.down_payment_pct}%
                  </span>
                )}
                {project.delivery_date && (
                  <span className="badge border-transparent bg-[var(--teal-50)] text-[var(--teal-700)]">
                    Entrega: {formatDeliveryDate(project.delivery_date)}
                  </span>
                )}
              </div>
            )}

            {project.description && (
              <p className="text-sm text-[var(--text-2)] mt-4 whitespace-pre-wrap">{project.description}</p>
            )}

            {project.finishes_description && (
              <div className="mt-4">
                <p className="text-xs text-[var(--text-3)] mb-1">Acabados</p>
                <p className="text-sm text-[var(--text-2)] whitespace-pre-wrap">{project.finishes_description}</p>
              </div>
            )}

            {project.financing_notes && (
              <div className="mt-4">
                <p className="text-xs text-[var(--text-3)] mb-1">Condiciones de financiamiento</p>
                <p className="text-sm text-[var(--text-2)] whitespace-pre-wrap">{project.financing_notes}</p>
              </div>
            )}

            {project.amenities.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-[var(--text-3)] mb-1.5">Amenidades</p>
                <div className="flex flex-wrap gap-1.5">
                  {project.amenities.map((a) => (
                    <span key={a} className="badge border-[var(--teal-200)] bg-[var(--teal-50)] text-[var(--teal-800)]">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <ProjectUnitTypesManager projectId={project.id} initialUnitTypes={project.unitTypes} />
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
              <label className="text-xs font-bold uppercase tracking-wide text-[var(--teal-700)]">Fase del proyecto</label>
              <div className="mt-1.5 space-y-1">
                {PHASE_OPTIONS.map((p) => {
                  const active = project.phase === p.value
                  return (
                    <button
                      key={p.value}
                      type="button"
                      disabled={savingPhase}
                      onClick={() => changePhase(p.value)}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50 ${
                        active ? 'bg-[var(--teal-50)]' : 'hover:bg-[var(--bg-subtle)]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${STATUS_DOT_CLASSES[p.color]}`} />
                        <span className={active ? 'text-[var(--text-1)] font-medium' : 'text-[var(--text-2)]'}>{p.label}</span>
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

            <div className="pt-1 border-t border-[var(--border)]">
              <label className="text-xs font-bold uppercase tracking-wide text-[var(--teal-700)]">Estado</label>
              <div className="mt-1.5 space-y-1">
                {STATUS_OPTIONS.map((s) => {
                  const active = project.status === s.value
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
                        <span className={`w-2 h-2 rounded-full ${STATUS_DOT_CLASSES[s.color]}`} />
                        <span className={active ? 'text-[var(--text-1)] font-medium' : 'text-[var(--text-2)]'}>{s.label}</span>
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
          </div>

          <div className="stat-card p-4">
            <p className="text-sm font-semibold text-[var(--text-1)] mb-3">Detalles del proyecto</p>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-[var(--text-3)]">Código</dt>
                <dd className="text-[var(--text-1)]">{project.project_code}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[var(--text-3)]">Publicado</dt>
                <dd className="text-[var(--text-1)]">{formatDate(project.created_at)}</dd>
              </div>
              {project.latitude && project.longitude && (
                <div className="flex items-center justify-between">
                  <dt className="text-[var(--text-3)]">Ubicación</dt>
                  <dd>
                    <a
                      href={`https://www.google.com/maps?q=${project.latitude},${project.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[var(--teal-700)] hover:underline"
                    >
                      Ver mapa <ExternalLink className="w-3 h-3" />
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="card-glow p-4">
            <p className="text-sm font-semibold text-[var(--text-1)] mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--teal-700)]" /> Agente IA
            </p>
            <p className="text-xs text-[var(--text-3)] mb-3">El agente dedicado que responde llamadas sobre este proyecto.</p>

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

          {(project.promo_video_url || project.virtual_tour_url) && (
            <div className="card-surface p-4 space-y-2">
              <p className="text-sm font-semibold text-[var(--text-1)]">Multimedia</p>
              {project.promo_video_url && (
                <a
                  href={project.promo_video_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary w-full flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-4 h-4" /> Ver video promocional
                </a>
              )}
              {project.virtual_tour_url && (
                <a
                  href={project.virtual_tour_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary w-full flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-4 h-4" /> Abrir tour virtual / maqueta
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {showEdit && (
        <EditProjectModal
          project={project}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => {
            setProject((prev) => ({ ...prev, ...updated }))
            setShowEdit(false)
          }}
        />
      )}

      {showAllPhotos && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 flex items-start justify-center p-4 overflow-y-auto"
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
    </div>
  )
}
