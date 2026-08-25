'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { Package, Client, ClientPackageCreditWithDetails } from '@/types'

interface SellPackageModalProps {
  packages: Package[]
  clients: Client[]
  onClose: () => void
  onSold: (credit: ClientPackageCreditWithDetails) => void
}

export function SellPackageModal({ packages, clients, onClose, onSold }: SellPackageModalProps) {
  const [clientId, setClientId] = useState('')
  const [packageId, setPackageId] = useState(packages[0]?.id ?? '')
  const selectedPackage = packages.find((p) => p.id === packageId)
  const [sessionsTotal, setSessionsTotal] = useState(selectedPackage?.session_count ?? 1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handlePackageChange(id: string) {
    setPackageId(id)
    const pkg = packages.find((p) => p.id === id)
    if (pkg) setSessionsTotal(pkg.session_count)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const res = await fetch('/api/client-package-credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        packageId,
        sessionsTotal,
        validityDays: selectedPackage?.validity_days ?? undefined,
      }),
    })

    setSaving(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'No se pudo vender el paquete')
      return
    }

    const { credit } = await res.json()
    const client = clients.find((c) => c.id === clientId) ?? null
    onSold({ ...credit, client, package: selectedPackage ?? null })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-3 overflow-y-auto" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="card-raised w-full max-w-md my-6 p-5 space-y-4"
      >
        <div className="flex items-start justify-between">
          <h2 className="font-display font-semibold text-lg text-[var(--text-1)]">Vender paquete</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-[var(--text-3)] hover:text-[var(--text-1)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)] mb-1">
            Cliente *
          </label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="input-field w-full"
            required
          >
            <option value="">— Seleccionar cliente —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ''}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)] mb-1">
            Paquete *
          </label>
          <select
            value={packageId}
            onChange={(e) => handlePackageChange(e.target.value)}
            className="input-field w-full"
            required
          >
            {packages.map((p) => (
              <option key={p.id} value={p.id}>{p.name} — ${p.price.toLocaleString()}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)] mb-1">
            No. de sesiones
          </label>
          <input
            type="number"
            min={1}
            value={sessionsTotal}
            onChange={(e) => setSessionsTotal(Number(e.target.value))}
            className="input-field w-full"
          />
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <button type="submit" className="btn-primary" disabled={saving || !clientId || !packageId}>
            {saving ? 'Vendiendo…' : 'Vender paquete'}
          </button>
        </div>
      </form>
    </div>
  )
}
