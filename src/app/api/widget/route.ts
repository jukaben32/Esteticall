import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { listWidgetsForBusiness, createWidget } from '@/services/widgets'
import { widgetSchema } from '@/validations'

// Dashboard-owned config (auth required). Distinct from the public
// /api/widget/public/[businessId]/config route the embed script polls.
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
  const widgets = await listWidgetsForBusiness(ctx.supabase, ctx.business.id)
  return NextResponse.json({ widgets })
}

export async function POST(request: Request) {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })

  const body = await request.json()
  const parsed = widgetSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }

  try {
    const widget = await createWidget(ctx.supabase, ctx.business.id, parsed.data)
    return NextResponse.json({ widget }, { status: 201 })
  } catch (err) {
    // Unique (business_id, agent_id) violation — that agent already has a widget.
    if (err && typeof err === 'object' && 'code' in err && err.code === '23505') {
      return NextResponse.json(
        { error: 'This agent already has a widget. Edit it instead of creating a new one.' },
        { status: 409 }
      )
    }
    throw err
  }
}
