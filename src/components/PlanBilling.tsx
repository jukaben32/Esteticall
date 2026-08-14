'use client'

import { useState } from 'react'
import { CreditCard, Bot, CalendarCheck, CheckCircle2, Phone } from 'lucide-react'
import type { BusinessSubscription, PlanId } from '@/types'
import { PLAN_LIMITS, VOICE_RECHARGE_BLOCK_MINUTES, VOICE_RECHARGE_PRICE_USD } from '@/constants'
import type { VoiceMinutesAvailability } from '@/services/aiUsage'

export function PlanBilling({
  subscription,
  voiceMinutes,
}: {
  subscription: BusinessSubscription | null
  voiceMinutes: VoiceMinutesAvailability
}) {
  const [loadingPlan, setLoadingPlan] = useState<PlanId | 'portal' | 'recharge' | null>(null)
  const currentPlan: PlanId = (subscription?.plan as PlanId) ?? 'free'

  async function upgrade(plan: Exclude<PlanId, 'free'>) {
    setLoadingPlan(plan)
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const { url } = await res.json()
    // eslint-disable-next-line react-hooks/immutability -- redirecting to Stripe Checkout inside a click handler, not during render
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

  async function recharge() {
    setLoadingPlan('recharge')
    const res = await fetch('/api/billing/recharge-voice-minutes', { method: 'POST' })
    const body = await res.json()
    if (body.url) window.location.href = body.url
    else setLoadingPlan(null)
  }

  const usedMinutes = Math.round(voiceMinutes.usedSecondsThisMonth / 60)
  const includedMinutes = Math.round(voiceMinutes.includedSecondsThisMonth / 60)
  const creditMinutes = Math.floor(voiceMinutes.creditSecondsBalance / 60)
  const outOfMinutes = voiceMinutes.availableSeconds <= 0

  return (
    <div className="space-y-4">
      <div className="stat-card p-4 flex items-start gap-3">
        <span className="w-9 h-9 rounded-full bg-[var(--teal-50)] text-[var(--teal-700)] grid place-items-center shrink-0">
          <CreditCard className="w-4 h-4" />
        </span>
        <div>
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
      </div>

      <div className="stat-card p-4">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-[var(--teal-700)] shrink-0" />
          <p className="text-sm font-semibold text-[var(--text-1)]">Minutos de voz este mes</p>
        </div>
        <p className="text-sm text-[var(--text-3)] mt-1">
          {usedMinutes} de {includedMinutes} minutos incluidos usados
          {creditMinutes > 0 && ` · ${creditMinutes} min de recarga disponibles`}
        </p>
        {outOfMinutes && (
          <p className="text-sm font-semibold text-red-600 mt-2">
            Sin minutos disponibles — el agente de voz responde solo por WhatsApp hasta que recargues
            {currentPlan === 'free' ? ' o mejores de plan' : ''}.
          </p>
        )}
        {currentPlan !== 'free' && (
          <button className="btn-secondary mt-3" onClick={recharge} disabled={loadingPlan === 'recharge'}>
            {loadingPlan === 'recharge'
              ? 'Redirigiendo…'
              : `Recargar ${VOICE_RECHARGE_BLOCK_MINUTES} minutos ($${VOICE_RECHARGE_PRICE_USD})`}
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
              <li className="flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-[var(--teal-700)] shrink-0" />
                {plan.agentLimit === 0 ? 'Ilimitados' : plan.agentLimit} agentes IA
              </li>
              <li className="flex items-center gap-1.5">
                <CalendarCheck className="w-3.5 h-3.5 text-[var(--teal-700)] shrink-0" />
                {plan.bookingLimit === 0 ? 'Ilimitadas' : plan.bookingLimit} citas/mes
              </li>
              <li className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[var(--teal-700)] shrink-0" />
                {plan.includedVoiceMinutes} min de voz/mes
              </li>
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
              <p className="mt-3 text-xs font-semibold text-[var(--teal-700)] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Plan actual
              </p>
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
