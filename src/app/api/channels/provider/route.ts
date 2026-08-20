import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { connectProviderAccount, disconnectProviderAccount, getProviderAccount } from '@/services/channels'
import { channelProviderAccountSchema } from '@/validations'
import { HostawayClient } from '@/lib/hostaway'

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
  const account = await getProviderAccount(ctx.supabase, ctx.business.id)
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/channels/webhook/${ctx.business.id}`
  return NextResponse.json({ account, webhookUrl })
}

export async function POST(request: Request) {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })

  const body = await request.json()
  const parsed = channelProviderAccountSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }

  try {
    const client = new HostawayClient({ accountId: parsed.data.accountId, clientSecret: parsed.data.clientSecret })
    await client.verifyCredentials()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Credenciales inválidas'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const account = await connectProviderAccount(ctx.supabase, ctx.business.id, parsed.data)
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/channels/webhook/${ctx.business.id}`
  return NextResponse.json({ account, webhookUrl })
}

export async function DELETE() {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })
  await disconnectProviderAccount(ctx.supabase, ctx.business.id)
  return NextResponse.json({ ok: true })
}
