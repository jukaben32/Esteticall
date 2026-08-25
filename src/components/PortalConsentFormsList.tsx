'use client'

import { useState } from 'react'
import { FileSignature, X } from 'lucide-react'
import type { PortalConsentForm } from '@/types'
import { formatDateTime } from '@/lib/formatDate'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente de firma',
  signed: 'Firmado',
  declined: 'Rechazado',
}
const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  signed: 'bg-[var(--teal-50)] text-[var(--teal-700)]',
  declined: 'bg-red-50 text-red-700',
}

function SignModal({
  form,
  onClose,
  onSigned,
}: {
  form: PortalConsentForm
  onClose: () => void
  onSigned: (updated: PortalConsentForm) => void
}) {
  const [signatureName, setSignatureName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function sign() {
    setSaving(true)
    setError(null)
    const res = await fetch(`/api/portal/consent-forms/${form.id}/sign`, {
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
    onSigned(consentForm)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-3 overflow-y-auto" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="card-raised w-full max-w-lg my-6 p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display font-semibold text-lg text-[var(--text-1)]">{form.title}</h2>
          <button onClick={onClose} aria-label="Cerrar" className="text-[var(--text-3)] hover:text-[var(--text-1)] shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-xl bg-[var(--bg-raised)] p-3 text-sm text-[var(--text-2)] whitespace-pre-wrap max-h-64 overflow-y-auto">
          {form.content}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="space-y-2">
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)]">
            Escribe tu nombre completo para firmar
          </label>
          <input
            value={signatureName}
            onChange={(e) => setSignatureName(e.target.value)}
            placeholder="Tu nombre legal completo"
            className="input-field w-full"
          />
          <p className="text-xs text-[var(--text-4)]">
            Al escribir tu nombre y firmar, confirmas que leíste y aceptas el contenido de este consentimiento.
          </p>
          <button className="btn-primary w-full justify-center" onClick={sign} disabled={saving || !signatureName.trim()}>
            {saving ? 'Firmando…' : 'Firmar y aceptar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function PortalConsentFormsList({ initialForms }: { initialForms: PortalConsentForm[] }) {
  const [forms, setForms] = useState(initialForms)
  const [signing, setSigning] = useState<PortalConsentForm | null>(null)

  function handleSigned(updated: PortalConsentForm) {
    setForms((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))
    setSigning(null)
  }

  const pending = forms.filter((f) => f.status === 'pending')
  const rest = forms.filter((f) => f.status !== 'pending')

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-[var(--text-1)]">Mis Consentimientos</h1>
        <p className="text-sm text-[var(--text-3)] mt-0.5">Firma pendiente antes de ciertos tratamientos.</p>
      </div>

      {pending.length > 0 && (
        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-2">Pendientes de firma</p>
          <div className="space-y-2">
            {pending.map((form) => (
              <button
                key={form.id}
                onClick={() => setSigning(form)}
                className="w-full text-left card-raised p-3.5 flex items-center gap-3 hover:bg-[var(--bg-raised)]/60 transition-colors"
              >
                <span className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 grid place-items-center shrink-0">
                  <FileSignature className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--text-1)] truncate">{form.title}</p>
                  <p className="text-xs text-[var(--text-3)] truncate">{form.business?.name ?? ''}</p>
                </div>
                <span className="badge border-transparent shrink-0 bg-amber-50 text-amber-700">Firmar ahora</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Historial</p>
        <div className="space-y-2">
          {rest.map((form) => (
            <div key={form.id} className="card-raised p-3.5 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[var(--teal-50)] text-[var(--teal-700)] grid place-items-center shrink-0">
                <FileSignature className="w-4 h-4" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--text-1)] truncate">{form.title}</p>
                <p className="text-xs text-[var(--text-3)] truncate">
                  {form.business?.name ?? ''} · {form.signed_at ? formatDateTime(form.signed_at) : formatDateTime(form.created_at)}
                </p>
              </div>
              <span className={`badge border-transparent shrink-0 ${STATUS_STYLES[form.status] ?? ''}`}>
                {STATUS_LABELS[form.status] ?? form.status}
              </span>
            </div>
          ))}
          {forms.length === 0 && (
            <div className="card-raised p-8 flex flex-col items-center justify-center gap-2 text-center">
              <span className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] text-[var(--text-4)] grid place-items-center">
                <FileSignature className="w-5 h-5" />
              </span>
              <p className="text-sm text-[var(--text-3)]">No tienes consentimientos todavía.</p>
            </div>
          )}
        </div>
      </section>

      {signing && <SignModal form={signing} onClose={() => setSigning(null)} onSigned={handleSigned} />}
    </main>
  )
}
