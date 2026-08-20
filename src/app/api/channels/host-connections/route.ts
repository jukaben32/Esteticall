import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { createHostConnection, getProviderAccount, listHostConnectionsForBusiness } from '@/services/channels'
import { channelHostConnectionSchema } from '@/validations'

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

export async function GET() {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })
  const connections = await listHostConnectionsForBusiness(ctx.supabase, ctx.business.id)
  return NextResponse.json({ connections })
}

export async function POST(request: Request) {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })

  const providerAccount = await getProviderAccount(ctx.supabase, ctx.business.id)
  if (!providerAccount) {
    return NextResponse.json({ error: 'Conecta primero tu cuenta de Hostaway' }, { status: 400 })
  }

  const body = await request.json()
  const parsed = channelHostConnectionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }

  const connection = await createHostConnection(ctx.supabase, ctx.business.id, providerAccount.id, parsed.data)
  return NextResponse.json({ connection })
}
