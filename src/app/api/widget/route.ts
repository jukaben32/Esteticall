import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { getWidgetForBusiness, upsertWidget } from '@/services/widgets'
import { widgetSchema } from '@/validations'

// Dashboard-owned config (auth required). Distinct from the public
// /api/widget/[businessId]/config route the embed script polls.
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
  const widget = await getWidgetForBusiness(ctx.supabase, ctx.business.id)
  return NextResponse.json({ widget })
}

export async function PUT(request: Request) {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })

  const body = await request.json()
  const parsed = widgetSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }

  const widget = await upsertWidget(ctx.supabase, ctx.business.id, parsed.data)
  return NextResponse.json({ widget })
}
