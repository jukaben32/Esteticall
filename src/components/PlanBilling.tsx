'use client'

import { useState } from 'react'
import type { BusinessSubscription, PlanId } from '@/types'
import { PLAN_LIMITS } from '@/constants'

export function PlanBilling({ subscription }: { subscription: BusinessSubscription | null }) {
  const [loadingPlan, setLoadingPlan] = useState<PlanId | 'portal' | null>(null)
  const currentPlan: PlanId = (subscription?.plan as PlanId) ?? 'free'

  async function upgrade(plan: Exclude<PlanId, 'free'>) {
    setLoadingPlan(plan)
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
    else setLoadingPlan(null)
  }

  async function openPortal() {
    setLoadingPlan('portal')
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const body = await res.json()
    if (body.url) window.location.href = body.url
    else setLoadingPlan(null)
  }

  return (
    <div className="space-y-4">
      <div className="card-surface p-4">
        <p className="text-sm text-[var(--text-3)]">Plan actual</p>
        <p className="font-display text-2xl font-semibold capitalize text-[var(--text-1)]">{PLAN_LIMITS[currentPlan].name}</p>
        <p className="text-sm text-[var(--text-3)] mt-1 capitalize">
          Estado: {STATUS_LABELS[subscription?.status ?? 'active'] ?? subscription?.status}
          {subscription?.cancel_at_period_end && ' · se cancela al fin del período'}
        </p>
        {subscription?.stripe_customer_id && (
          <button className="btn-secondary mt-3" onClick={openPortal} disabled={loadingPlan === 'portal'}>
            {loadingPlan === 'portal' ? 'Abriendo…' : 'Administrar facturación'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.values(PLAN_LIMITS) as (typeof PLAN_LIMITS)[PlanId][]).map((plan) => (
          <div key={plan.id} className={`card-surface p-4 ${plan.id === currentPlan ? 'card-glow' : ''}`}>
            <p className="font-semibold text-[var(--text-1)]">{plan.name}</p>
            <p className="font-display text-2xl font-semibold mt-1 text-[var(--teal-700)]">
              ${plan.priceUsd}
              <span className="text-sm font-normal text-[var(--text-3)]">/mes</span>
            </p>
            <ul className="text-sm text-[var(--text-3)] mt-2 space-y-1">
              <li>{plan.agentLimit === 0 ? 'Ilimitados' : plan.agentLimit} agentes IA</li>
              <li>{plan.bookingLimit === 0 ? 'Ilimitadas' : plan.bookingLimit} citas/mes</li>
            </ul>
            {plan.id !== 'free' && plan.id !== currentPlan && (
              <button
                className="btn-primary mt-3 w-full"
                onClick={() => upgrade(plan.id as Exclude<PlanId, 'free'>)}
                disabled={loadingPlan === plan.id}
              >
                {loadingPlan === plan.id ? 'Redirigiendo…' : `Mejorar a ${plan.name}`}
              </button>
            )}
            {plan.id === currentPlan && (
              <p className="mt-3 text-xs font-semibold text-[var(--teal-700)]">Plan actual</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  trialing: 'En prueba',
  past_due: 'Pago pendiente',
  canceled: 'Cancelado',
  incomplete: 'Incompleto',
}
