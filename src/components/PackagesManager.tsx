'use client'

import { useState } from 'react'
import { Pencil, Package as PackageIcon, ShoppingBag } from 'lucide-react'
import type { Package, BusinessService, Client, ClientPackageCreditWithDetails } from '@/types'
import { PackageEditModal } from './PackageEditModal'
import { SellPackageModal } from './SellPackageModal'

const PAYMENT_LABELS: Record<string, string> = {
  pending: 'Pago pendiente',
  paid: 'Pagado',
  refunded: 'Reembolsado',
}
const PAYMENT_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  paid: 'bg-[var(--teal-50)] text-[var(--teal-700)]',
  refunded: 'bg-red-50 text-red-700',
}

export function PackagesManager({
  initialPackages,
  services,
  clients,
  initialCredits,
}: {
  initialPackages: Package[]
  services: BusinessService[]
  clients: Client[]
  initialCredits: ClientPackageCreditWithDetails[]
}) {
  const [packages, setPackages] = useState(initialPackages)
  const [credits, setCredits] = useState(initialCredits)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Package | undefined>(undefined)
  const [sellOpen, setSellOpen] = useState(false)

  const activePackages = packages.filter((p) => p.is_active)
  const inactivePackages = packages.filter((p) => !p.is_active)

  function handleSaved(pkg: Package) {
    setPackages((prev) => {
      const exists = prev.some((p) => p.id === pkg.id)
      return exists ? prev.map((p) => (p.id === pkg.id ? pkg : p)) : [pkg, ...prev]
    })
    setModalOpen(false)
  }

  async function toggleActive(pkg: Package) {
    const res = await fetch(`/api/packages/${pkg.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !pkg.is_active }),
    })
    if (res.ok) {
      const { package: updated } = await res.json()
      setPackages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    }
  }

  function openEdit(pkg: Package) {
    setEditing(pkg)
    setModalOpen(true)
  }

  function openCreate() {
    setEditing(undefined)
    setModalOpen(true)
  }

  function handleSold(credit: ClientPackageCreditWithDetails) {
    setCredits((prev) => [credit, ...prev])
    setSellOpen(false)
  }

  async function markPaid(credit: ClientPackageCreditWithDetails) {
    const res = await fetch(`/api/client-package-credits/${credit.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus: 'paid' }),
    })
    if (res.ok) {
      const { credit: updated } = await res.json()
      setCredits((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)))
    }
  }

  return (
    <div className="space-y-6">
      <section className="card-surface p-5">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div>
            <h2 className="font-display font-semibold text-[var(--text-1)]">Paquetes</h2>
            <p className="text-sm text-[var(--text-3)]">{activePackages.length} activos de {packages.length} paquetes</p>
          </div>
          <button className="btn-primary" onClick={openCreate}>+ Nuevo paquete</button>
        </div>

        <div className="space-y-2">
          {activePackages.map((pkg) => (
            <div key={pkg.id} className="card-surface p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-[var(--text-1)]">{pkg.name}</p>
                  <span className="text-xs text-[var(--text-3)]">
                    {pkg.session_count} sesiones · ${pkg.price.toLocaleString()}
                    {pkg.validity_days ? ` · vigencia ${pkg.validity_days} días` : ''}
                  </span>
                </div>
                {pkg.description && <p className="text-xs text-[var(--text-3)] mt-0.5">{pkg.description}</p>}
              </div>
              <button
                onClick={() => toggleActive(pkg)}
                className="badge border-transparent shrink-0 bg-[var(--teal-50)] text-[var(--teal-800)]"
              >
                Activo
              </button>
              <button
                onClick={() => openEdit(pkg)}
                aria-label="Editar"
                className="p-2 rounded-lg text-[var(--text-3)] hover:text-[var(--teal-700)] hover:bg-[var(--teal-50)] shrink-0"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          ))}
          {activePackages.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <span className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] text-[var(--text-4)] grid place-items-center">
                <PackageIcon className="w-5 h-5" />
              </span>
              <p className="text-sm text-[var(--text-3)]">Todavía no hay paquetes activos.</p>
            </div>
          )}
        </div>

        {inactivePackages.length > 0 && (
          <div className="mt-5 border-t border-[var(--border)] pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)] mb-2">Paquetes inactivos</p>
            <div className="space-y-2">
              {inactivePackages.map((pkg) => (
                <div key={pkg.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-raised)]/45 p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--text-2)]">{pkg.name}</p>
                    <span className="text-xs text-[var(--text-4)]">{pkg.session_count} sesiones · ${pkg.price.toLocaleString()}</span>
                  </div>
                  <button
                    onClick={() => toggleActive(pkg)}
                    className="badge border-transparent shrink-0 bg-white text-[var(--teal-700)] hover:bg-[var(--teal-50)]"
                  >
                    Activar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="card-surface p-5">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div>
            <h2 className="font-display font-semibold text-[var(--text-1)]">Paquetes vendidos</h2>
            <p className="text-sm text-[var(--text-3)]">{credits.length} paquetes vendidos a clientes</p>
          </div>
          <button className="btn-primary" onClick={() => setSellOpen(true)} disabled={activePackages.length === 0}>
            <ShoppingBag className="w-3.5 h-3.5" />
            Vender paquete
          </button>
        </div>

        <div className="hidden md:block overflow-x-auto rounded-2xl border border-[var(--border)] bg-white">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-[var(--teal-50)]/80 text-[10px] uppercase tracking-widest text-[var(--teal-800)]">
              <tr>
                <th className="px-4 py-3 text-left font-bold">Cliente</th>
                <th className="px-4 py-3 text-left font-bold">Paquete</th>
                <th className="px-4 py-3 text-left font-bold">Sesiones</th>
                <th className="px-4 py-3 text-left font-bold">Pago</th>
                <th className="px-4 py-3 text-right font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {credits.map((credit) => (
                <tr key={credit.id}>
                  <td className="px-4 py-3">{credit.client?.name ?? 'Cliente sin identificar'}</td>
                  <td className="px-4 py-3">{credit.package?.name ?? '—'}</td>
                  <td className="px-4 py-3">{credit.sessions_used} / {credit.sessions_total}</td>
                  <td className="px-4 py-3">
                    <span className={`badge border-transparent ${PAYMENT_STYLES[credit.payment_status] ?? ''}`}>
                      {PAYMENT_LABELS[credit.payment_status] ?? credit.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {credit.payment_status === 'pending' && (
                      <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => markPaid(credit)}>
                        Marcar pagado
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {credits.length === 0 && (
            <p className="text-sm text-[var(--text-3)] text-center py-8">Todavía no se ha vendido ningún paquete.</p>
          )}
        </div>
      </section>

      {modalOpen && (
        <PackageEditModal pkg={editing} services={services} onClose={() => setModalOpen(false)} onSaved={handleSaved} />
      )}
      {sellOpen && (
        <SellPackageModal packages={activePackages} clients={clients} onClose={() => setSellOpen(false)} onSold={handleSold} />
      )}
    </div>
  )
}
