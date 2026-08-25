'use client'

import { useState } from 'react'
import { FileSignature, X } from 'lucide-react'
import type { Client, BusinessService } from '@/types'
import type { ConsentFormWithDetails } from '@/services/consentForms'
import { formatDateTime } from '@/lib/formatDate'
import { NewConsentFormModal } from './NewConsentFormModal'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  signed: 'Firmado',
  declined: 'Rechazado',
}
const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  signed: 'bg-[var(--teal-50)] text-[var(--teal-700)]',
  declined: 'bg-red-50 text-red-700',
}

function ConsentFormDetailsModal({
  form,
  onClose,
  onSigned,
}: {
  form: ConsentFormWithDetails
  onClose: () => void
  onSigned: (updated: ConsentFormWithDetails) => void
}) {
  const [signatureName, setSignatureName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function sign() {
    setSaving(true)
    setError(null)
    const res = await fetch(`/api/consent-forms/${form.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signatureName }),
    })
    setSaving(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'No se pudo registrar la firma')
      return
    }
    const { consentForm } = await res.json()
    onSigned({ ...form, ...consentForm })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-3 overflow-y-auto" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="card-raised w-full max-w-lg my-6 p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display font-semibold text-lg text-[var(--text-1)]">{form.title}</h2>
            <p className="text-xs text-[var(--text-3)] mt-0.5">
              {form.client?.name ?? 'Cliente sin identificar'} · {formatDateTime(form.created_at)}
            </p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="text-[var(--text-3)] hover:text-[var(--text-1)] shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <span className={`badge border-transparent ${STATUS_STYLES[form.status] ?? ''}`}>
          {STATUS_LABELS[form.status] ?? form.status}
        </span>

        <div className="rounded-xl bg-[var(--bg-raised)] p-3 text-sm text-[var(--text-2)] whitespace-pre-wrap max-h-64 overflow-y-auto">
          {form.content}
        </div>

        {form.status === 'signed' ? (
          <p className="text-sm text-[var(--text-2)]">
            Firmado por <span className="font-medium text-[var(--text-1)]">{form.signature_name}</span> el{' '}
            {form.signed_at ? formatDateTime(form.signed_at) : '—'}
          </p>
        ) : (
          <div className="space-y-2">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)]">
              Nombre completo (firma)
            </label>
            <input
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              placeholder="Nombre legal completo del paciente"
              className="input-field w-full"
            />
            <button className="btn-primary w-full justify-center" onClick={sign} disabled={saving || !signatureName.trim()}>
              {saving ? 'Registrando…' : 'Registrar firma'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function ConsentFormsManager({
  initialConsentForms,
  clients,
  services,
}: {
  initialConsentForms: ConsentFormWithDetails[]
  clients: Client[]
  services: BusinessService[]
}) {
  const [forms, setForms] = useState(initialConsentForms)
  const [modalOpen, setModalOpen] = useState(false)
  const [viewing, setViewing] = useState<ConsentFormWithDetails | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'signed'>('all')

  const filtered = forms.filter((f) => filter === 'all' || f.status === filter)
  const pendingCount = forms.filter((f) => f.status === 'pending').length

  function handleCreated(newForms: ConsentFormWithDetails[]) {
    setForms(newForms)
    setModalOpen(false)
  }

  function handleSigned(updated: ConsentFormWithDetails) {
    setForms((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))
    setViewing(updated)
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-[var(--text-3)]">{forms.length} en total · {pendingCount} pendientes de firma</p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>+ Nuevo consentimiento</button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {(['all', 'pending', 'signed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`badge border-transparent ${filter === f ? 'bg-[var(--teal-700)] text-white' : 'bg-[var(--bg-raised)] text-[var(--text-3)]'}`}
          >
            {f === 'all' ? 'Todos' : STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((form) => (
          <button
            key={form.id}
            onClick={() => setViewing(form)}
            className="w-full text-left card-surface p-3 flex items-center gap-3 hover:bg-[var(--bg-raised)]/60 transition-colors"
          >
            <span className="w-8 h-8 rounded-full bg-[var(--teal-50)] text-[var(--teal-700)] grid place-items-center shrink-0">
              <FileSignature className="w-4 h-4" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[var(--text-1)] truncate">{form.title}</p>
              <p className="text-xs text-[var(--text-3)] truncate">
                {form.client?.name ?? 'Cliente sin identificar'} · {formatDateTime(form.created_at)}
              </p>
            </div>
            <span className={`badge border-transparent shrink-0 ${STATUS_STYLES[form.status] ?? ''}`}>
              {STATUS_LABELS[form.status] ?? form.status}
            </span>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <span className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] text-[var(--text-4)] grid place-items-center">
              <FileSignature className="w-5 h-5" />
            </span>
            <p className="text-sm text-[var(--text-3)]">No hay consentimientos que coincidan con este filtro.</p>
          </div>
        )}
      </div>

      {modalOpen && (
        <NewConsentFormModal clients={clients} services={services} onClose={() => setModalOpen(false)} onCreated={handleCreated} />
      )}
      {viewing && <ConsentFormDetailsModal form={viewing} onClose={() => setViewing(null)} onSigned={handleSigned} />}
    </div>
  )
}
