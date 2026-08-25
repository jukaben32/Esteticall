'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { Client, BusinessService } from '@/types'
import type { ConsentFormWithDetails } from '@/services/consentForms'

interface NewConsentFormModalProps {
  clients: Client[]
  services: BusinessService[]
  onClose: () => void
  onCreated: (consentForms: ConsentFormWithDetails[]) => void
}

const DEFAULT_CONTENT =
  'Declaro que he sido informado(a) sobre el procedimiento, sus beneficios, riesgos posibles y cuidados posteriores. ' +
  'He tenido la oportunidad de hacer preguntas y las he resuelto satisfactoriamente. Confirmo que no estoy embarazada ' +
  'ni en periodo de lactancia (si aplica), y que he informado sobre alergias y medicamentos que tomo actualmente. ' +
  'Autorizo la realización del tratamiento de manera voluntaria.'

export function NewConsentFormModal({ clients, services, onClose, onCreated }: NewConsentFormModalProps) {
  const [clientId, setClientId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState(DEFAULT_CONTENT)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleServiceChange(id: string) {
    setServiceId(id)
    const service = services.find((s) => s.id === id)
    if (service && !title) setTitle(`Consentimiento informado — ${service.name}`)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const res = await fetch('/api/consent-forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        serviceId: serviceId || undefined,
        title,
        content,
      }),
    })

    setSaving(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'No se pudo crear el consentimiento')
      return
    }

    const { consentForms } = await res.json()
    onCreated(consentForms)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-3 overflow-y-auto" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="card-raised w-full max-w-lg my-6 p-5 space-y-4"
      >
        <div className="flex items-start justify-between">
          <h2 className="font-display font-semibold text-lg text-[var(--text-1)]">Nuevo consentimiento</h2>
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
              <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ''}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)] mb-1">
            Tratamiento
          </label>
          <select value={serviceId} onChange={(e) => handleServiceChange(e.target.value)} className="input-field w-full">
            <option value="">— Sin tratamiento específico —</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)] mb-1">
            Título *
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Consentimiento informado — Toxina botulínica"
            className="input-field w-full"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)] mb-1">
            Contenido *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="input-field w-full"
            rows={6}
            required
          />
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Creando…' : 'Crear consentimiento'}
          </button>
        </div>
      </form>
    </div>
  )
}
