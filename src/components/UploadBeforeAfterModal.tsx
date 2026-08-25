'use client'

import { useState } from 'react'
import { X, Upload } from 'lucide-react'
import type { Client } from '@/types'
import type { BeforeAfterPhotoWithUrl } from '@/services/beforeAfterPhotos'

interface UploadBeforeAfterModalProps {
  clients: Client[]
  onClose: () => void
  onUploaded: (photo: BeforeAfterPhotoWithUrl) => void
}

export function UploadBeforeAfterModal({ clients, onClose, onUploaded }: UploadBeforeAfterModalProps) {
  const [clientId, setClientId] = useState('')
  const [photoType, setPhotoType] = useState<'before' | 'after'>('before')
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setSaving(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('clientId', clientId)
    formData.append('photoType', photoType)

    const res = await fetch('/api/before-after-photos', { method: 'POST', body: formData })
    setSaving(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'No se pudo subir la foto')
      return
    }

    const { photo } = await res.json()
    onUploaded(photo)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-3 overflow-y-auto" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="card-raised w-full max-w-md my-6 p-5 space-y-4"
      >
        <div className="flex items-start justify-between">
          <h2 className="font-display font-semibold text-lg text-[var(--text-1)]">Subir foto</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-[var(--text-3)] hover:text-[var(--text-1)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)] mb-1">
            Cliente *
          </label>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="input-field w-full" required>
            <option value="">— Seleccionar cliente —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)] mb-1">
            Tipo *
          </label>
          <div className="flex gap-2">
            {(['before', 'after'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setPhotoType(t)}
                className={`badge border-transparent flex-1 justify-center py-2 ${photoType === t ? 'bg-[var(--teal-700)] text-white' : 'bg-[var(--bg-raised)] text-[var(--text-3)]'}`}
              >
                {t === 'before' ? 'Antes' : 'Después'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)] mb-1">
            Foto (PNG, JPG o WEBP, máx. 8 MB) *
          </label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="input-field w-full"
            required
          />
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <button type="submit" className="btn-primary" disabled={saving || !file || !clientId}>
            <Upload className="w-3.5 h-3.5" />
            {saving ? 'Subiendo…' : 'Subir foto'}
          </button>
        </div>
      </form>
    </div>
  )
}
