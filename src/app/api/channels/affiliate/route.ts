import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { getAffiliateSettings, upsertAffiliateSettings } from '@/services/channels'
import { bookingAffiliateSettingsSchema } from '@/validations'

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
  const settings = await getAffiliateSettings(ctx.supabase, ctx.business.id)
  return NextResponse.json({ settings })
}

export async function POST(request: Request) {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })

  const body = await request.json()
  const parsed = bookingAffiliateSettingsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }

  const settings = await upsertAffiliateSettings(ctx.supabase, ctx.business.id, parsed.data)
  return NextResponse.json({ settings })
}
