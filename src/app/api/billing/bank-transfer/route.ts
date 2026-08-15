import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { createBankTransferRequest, getPendingBankTransfer } from '@/services/bankTransfers'
import { getPlatformBankConfig } from '@/lib/platformBank'
import type { PlanId } from '@/types'

async function requireBusiness() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' as const }
  const business = await getBusinessForOwner(supabase, user.id)
  if (!business) return { error: 'No business for this user' as const }
  return { supabase, business }
}

// The current pending request (if any) plus the bank details to display —
// lets the dashboard resume a transfer already in progress after a reload
// without the business owner needing to remember the reference code.
export async function GET() {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })

  const bank = getPlatformBankConfig()
  const transfer = await getPendingBankTransfer(ctx.supabase, ctx.business.id)
  return NextResponse.json({ bank, transfer })
}

export async function POST(request: Request) {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })

  const bank = getPlatformBankConfig()
  if (!bank) {
    return NextResponse.json({ error: 'El pago por transferencia no está disponible todavía.' }, { status: 503 })
  }

  const body = await request.json()
  const plan = body.plan as PlanId
  if (plan !== 'pro' && plan !== 'business') {
    return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
  }

  const transfer = await createBankTransferRequest(ctx.supabase, ctx.business.id, plan)
  return NextResponse.json({ transfer, bank })
}
