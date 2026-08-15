import { CreditCard } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner, getSubscription } from '@/services/businesses'
import { getVoiceMinutesAvailability } from '@/services/aiUsage'
import { getPendingBankTransfer } from '@/services/bankTransfers'
import { getPlatformBankConfig } from '@/lib/platformBank'
import { PlanBilling } from '@/components/PlanBilling'
import type { PlanId } from '@/types'

export default async function PlanPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const business = await getBusinessForOwner(supabase, user!.id)
  if (!business) return null

  const subscription = await getSubscription(supabase, business.id)
  const voiceMinutes = await getVoiceMinutesAvailability(
    supabase,
    business.id,
    (subscription?.plan as PlanId) ?? 'free',
    subscription?.voice_credit_seconds_balance ?? 0
  )
  const pendingBankTransfer = await getPendingBankTransfer(supabase, business.id)
  const bankConfig = getPlatformBankConfig()

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <span className="w-8 h-8 rounded-full bg-[var(--teal-50)] text-[var(--teal-700)] grid place-items-center shrink-0">
          <CreditCard className="w-4 h-4" />
        </span>
        <div>
          <h1 className="font-display font-semibold text-xl text-[var(--text-1)]">Plan y Facturación</h1>
          <p className="text-sm text-[var(--text-3)]">Administra tu suscripción y método de pago.</p>
        </div>
      </div>
      <PlanBilling
        subscription={subscription}
        voiceMinutes={voiceMinutes}
        bankConfig={bankConfig}
        initialPendingBankTransfer={pendingBankTransfer}
      />
    </div>
  )
}
