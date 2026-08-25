'use client'

import { useMemo, useState } from 'react'
import { Images, Trash2 } from 'lucide-react'
import type { Client } from '@/types'
import type { BeforeAfterPhotoWithUrl } from '@/services/beforeAfterPhotos'
import { UploadBeforeAfterModal } from './UploadBeforeAfterModal'

export function BeforeAfterGallery({
  initialPhotos,
  clients,
}: {
  initialPhotos: BeforeAfterPhotoWithUrl[]
  clients: Client[]
}) {
  const [photos, setPhotos] = useState(initialPhotos)
  const [modalOpen, setModalOpen] = useState(false)
  const [clientFilter, setClientFilter] = useState('all')
  const [deleting, setDeleting] = useState<BeforeAfterPhotoWithUrl | null>(null)

  const filtered = useMemo(
    () => (clientFilter === 'all' ? photos : photos.filter((p) => p.client_id === clientFilter)),
    [photos, clientFilter]
  )

  function handleUploaded(photo: BeforeAfterPhotoWithUrl) {
    setPhotos((prev) => [photo, ...prev])
    setModalOpen(false)
  }

  async function confirmDelete() {
    if (!deleting) return
    const res = await fetch(`/api/before-after-photos/${deleting.id}`, { method: 'DELETE' })
    if (res.ok) {
      setPhotos((prev) => prev.filter((p) => p.id !== deleting.id))
    }
    setDeleting(null)
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--text-3)]">{photos.length} fotos · privadas, solo visibles en tu dashboard y para cada paciente</p>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>+ Subir foto</button>
      </div>

      <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="input-field mb-4 sm:w-64">
        <option value="all">Todos los clientes</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((photo) => (
          <div key={photo.id} className="card-surface overflow-hidden group relative">
            <div className="aspect-square bg-[var(--bg-raised)]">
              {photo.signedUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo.signedUrl} alt={`${photo.photo_type} — ${photo.client?.name ?? ''}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-[var(--text-4)]">
                  <Images className="w-6 h-6" />
                </div>
              )}
              <span
                className={`absolute top-2 left-2 badge border-transparent text-white ${photo.photo_type === 'before' ? 'bg-[var(--text-4)]' : 'bg-[var(--teal-700)]'}`}
              >
                {photo.photo_type === 'before' ? 'Antes' : 'Después'}
              </span>
              <button
                onClick={() => setDeleting(photo)}
                aria-label="Eliminar foto"
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-[var(--text-3)] p-2 truncate">{photo.client?.name ?? 'Cliente sin identificar'}</p>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center gap-2 py-10 text-center">
            <span className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] text-[var(--text-4)] grid place-items-center">
              <Images className="w-5 h-5" />
            </span>
            <p className="text-sm text-[var(--text-3)]">Todavía no hay fotos.</p>
          </div>
        )}
      </div>

      {modalOpen && (
        <UploadBeforeAfterModal clients={clients} onClose={() => setModalOpen(false)} onUploaded={handleUploaded} />
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDeleting(null)}>
          <div onClick={(e) => e.stopPropagation()} className="card-raised w-full max-w-sm p-5 space-y-4">
            <h3 className="font-display font-semibold text-lg text-[var(--text-1)]">Eliminar foto</h3>
            <p className="text-sm text-[var(--text-3)]">Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setDeleting(null)}>Cancelar</button>
              <button className="btn-primary !bg-red-600 hover:!bg-red-700" onClick={confirmDelete}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
