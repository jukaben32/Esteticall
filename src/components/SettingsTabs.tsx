'use client'

import { useState } from 'react'
import type { Business, BusinessAvailability } from '@/types'
import { BusinessProfileForm } from '@/components/BusinessProfileForm'
import { BusinessHoursEditor } from '@/components/BusinessHoursEditor'
import { StripePaymentsForm } from '@/components/StripePaymentsForm'

const TABS = [
  { id: 'profile', label: 'Perfil del negocio' },
  { id: 'hours', label: 'Horario de atención' },
  { id: 'stripe', label: 'Pagos con Stripe' },
] as const

type TabId = (typeof TABS)[number]['id']

export function SettingsTabs({
  business,
  availability,
}: {
  business: Business
  availability: BusinessAvailability[]
}) {
  const [tab, setTab] = useState<TabId>('profile')

  return (
    <div>
      <div className="flex items-center gap-1 p-1 mb-5 rounded-full bg-[var(--bg-raised)] w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={tab === t.id ? 'btn-primary !py-1.5' : 'btn-secondary !border-transparent !shadow-none !py-1.5'}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && <BusinessProfileForm business={business} />}
      {tab === 'hours' && <BusinessHoursEditor initialAvailability={availability} />}
      {tab === 'stripe' && <StripePaymentsForm business={business} />}
    </div>
  )
}
