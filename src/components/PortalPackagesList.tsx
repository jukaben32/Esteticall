'use client'

import { Package as PackageIcon } from 'lucide-react'
import type { PortalPackageCredit } from '@/types'
import { formatDate } from '@/lib/formatDate'

export function PortalPackagesList({ packageCredits }: { packageCredits: PortalPackageCredit[] }) {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-[var(--text-1)]">Mis Paquetes</h1>
        <p className="text-sm text-[var(--text-3)] mt-0.5">Sesiones prepagadas y su disponibilidad.</p>
      </div>

      <div className="space-y-3">
        {packageCredits.map((credit) => {
          const remaining = credit.sessions_total - credit.sessions_used
          return (
            <div key={credit.id} className="card-raised p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-full bg-[var(--teal-50)] text-[var(--teal-700)] grid place-items-center shrink-0">
                    <PackageIcon className="w-4 h-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-[var(--text-1)]">{credit.package?.name ?? 'Paquete'}</p>
                    <p className="text-xs text-[var(--text-3)]">{credit.business?.name ?? ''}</p>
                  </div>
                </div>
                <span
                  className={`badge border-transparent shrink-0 ${
                    credit.payment_status === 'paid' ? 'bg-[var(--teal-50)] text-[var(--teal-700)]' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {credit.payment_status === 'paid' ? 'Pagado' : 'Pago pendiente'}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-4 text-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[var(--text-3)]">Sesiones restantes</p>
                  <p className="font-display text-2xl font-semibold text-[var(--teal-700)]">
                    {remaining} <span className="text-sm text-[var(--text-3)] font-sans">/ {credit.sessions_total}</span>
                  </p>
                </div>
                {credit.expires_at && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-[var(--text-3)]">Vence</p>
                    <p className="text-[var(--text-1)]">{formatDate(credit.expires_at)}</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {packageCredits.length === 0 && (
          <div className="card-raised p-8 flex flex-col items-center justify-center gap-2 text-center">
            <span className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] text-[var(--text-4)] grid place-items-center">
              <PackageIcon className="w-5 h-5" />
            </span>
            <p className="text-sm text-[var(--text-3)]">Todavía no tienes paquetes.</p>
          </div>
        )}
      </div>
    </main>
  )
}
