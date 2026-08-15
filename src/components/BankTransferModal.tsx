'use client'

import { useEffect, useState } from 'react'
import { Check, Copy, Upload } from 'lucide-react'
import type { BankTransferPayment, PlanId } from '@/types'
import type { PlatformBankConfig } from '@/lib/platformBank'

interface BankTransferModalProps {
  plan: Exclude<PlanId, 'free'>
  bankConfig: PlatformBankConfig
  initialTransfer: BankTransferPayment | null
  onClose: () => void
  onCreated: (transfer: BankTransferPayment) => void
}

export function BankTransferModal({ plan, bankConfig, initialTransfer, onClose, onCreated }: BankTransferModalProps) {
  const [transfer, setTransfer] = useState(initialTransfer)
  const [loading, setLoading] = useState(!initialTransfer)
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (transfer) return
    fetch('/api/billing/bank-transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
      .then(async (res) => {
        const body = await res.json()
        if (!res.ok) throw new Error(body.error ?? 'No se pudo crear la solicitud')
        setTransfer(body.transfer)
        onCreated(body.transfer)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function copyReference() {
    if (!transfer) return
    navigator.clipboard.writeText(transfer.reference_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function handleUpload(file: File) {
    if (!transfer) return
    setUploading(true)
    setError(null)
    const body = new FormData()
    body.append('file', file)
    const res = await fetch(`/api/billing/bank-transfer/${transfer.id}/receipt`, { method: 'POST', body })
    if (res.ok) {
      const { transfer: updated } = await res.json()
      setTransfer(updated)
    } else {
      const errBody = await res.json().catch(() => ({}))
      setError(errBody.error ?? 'No se pudo subir el comprobante')
    }
    setUploading(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-3 overflow-y-auto" onClick={onClose}>
      <div
        className="card-raised w-full max-w-md my-8 p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-lg text-[var(--text-1)]">Pagar por transferencia</h2>
          <button type="button" onClick={onClose} className="text-[var(--text-3)] text-xl leading-none">
            &times;
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {loading ? (
          <p className="text-sm text-[var(--text-3)]">Preparando tu solicitud…</p>
        ) : transfer ? (
          <>
            {transfer.status === 'pending' ? (
              <>
                <div className="stat-card p-3 space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-3)]">Banco</span>
                    <span className="text-[var(--text-1)] font-medium">{bankConfig.bankName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-3)]">Número de cuenta</span>
                    <span className="text-[var(--text-1)] font-medium font-mono">{bankConfig.accountNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-3)]">Monto</span>
                    <span className="text-[var(--text-1)] font-medium">${transfer.amount_usd}</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-[var(--text-3)] mb-1">
                    Incluye este código en el concepto de la transferencia — así identificamos tu pago:
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="input-field flex-1 font-mono text-center">{transfer.reference_code}</span>
                    <button type="button" onClick={copyReference} className="btn-secondary px-3">
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[var(--text-3)] mb-1 block">
                    Sube tu comprobante (foto o PDF) una vez hayas transferido
                  </label>
                  <label className="btn-secondary w-full flex items-center justify-center gap-1.5 cursor-pointer">
                    <Upload className="w-4 h-4" /> {uploading ? 'Subiendo…' : transfer.receipt_url ? 'Reemplazar comprobante' : 'Subir comprobante'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) void handleUpload(file)
                        e.target.value = ''
                      }}
                    />
                  </label>
                  {transfer.receipt_url && (
                    <p className="text-xs text-[var(--teal-700)] mt-1.5 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Comprobante recibido — tu pago está en revisión
                    </p>
                  )}
                </div>

                <p className="text-xs text-[var(--text-3)]">
                  Verificamos manualmente cada transferencia contra nuestra cuenta bancaria. Tu plan se activa apenas
                  la aprobemos, normalmente en unas horas.
                </p>
              </>
            ) : (
              <p className="text-sm text-[var(--text-2)]">
                Esta solicitud ya fue {transfer.status === 'approved' ? 'aprobada' : 'rechazada'}.
              </p>
            )}
          </>
        ) : null}

        <div className="flex justify-end pt-1">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
