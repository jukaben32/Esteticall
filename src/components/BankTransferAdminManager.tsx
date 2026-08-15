'use client'

import { useState } from 'react'
import { CheckCircle2, ExternalLink, XCircle } from 'lucide-react'
import type { BankTransferWithBusiness } from '@/services/bankTransfers'
import { formatDate } from '@/lib/formatDate'

export function BankTransferAdminManager({ initialTransfers }: { initialTransfers: BankTransferWithBusiness[] }) {
  const [transfers, setTransfers] = useState(initialTransfers)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function approve(id: string) {
    setBusyId(id)
    setError(null)
    const res = await fetch(`/api/admin/bank-transfers/${id}/approve`, { method: 'POST' })
    if (res.ok) {
      setTransfers((prev) => prev.filter((t) => t.id !== id))
    } else {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'No se pudo aprobar')
    }
    setBusyId(null)
  }

  async function reject(id: string) {
    const reason = prompt('Motivo del rechazo (opcional):') ?? undefined
    setBusyId(id)
    setError(null)
    const res = await fetch(`/api/admin/bank-transfers/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
    if (res.ok) {
      setTransfers((prev) => prev.filter((t) => t.id !== id))
    } else {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'No se pudo rechazar')
    }
    setBusyId(null)
  }

  if (transfers.length === 0) {
    return <p className="text-sm text-[var(--text-3)] py-6 text-center">No hay solicitudes pendientes.</p>
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {transfers.map((t) => (
        <div key={t.id} className="card-surface p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="min-w-0">
            <p className="font-medium text-[var(--text-1)]">
              {t.business_name} <span className="text-[var(--text-3)] font-normal">— plan {t.plan}</span>
            </p>
            <p className="text-xs text-[var(--text-3)] mt-0.5">
              Referencia <span className="font-mono">{t.reference_code}</span> · ${t.amount_usd.toLocaleString()} ·
              solicitado {formatDate(t.created_at)}
            </p>
            {t.receipt_url ? (
              <a
                href={t.receipt_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-[var(--teal-700)] hover:underline mt-1"
              >
                Ver comprobante <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <p className="text-xs text-amber-600 mt-1">Todavía no subió comprobante</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => reject(t.id)}
              disabled={busyId === t.id}
              className="btn-secondary text-xs px-3 py-1.5 text-red-600"
            >
              <XCircle className="w-3.5 h-3.5" /> Rechazar
            </button>
            <button
              onClick={() => approve(t.id)}
              disabled={busyId === t.id}
              className="btn-primary text-xs px-3 py-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> {busyId === t.id ? 'Procesando…' : 'Aprobar y activar plan'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
