import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { updateWidget, deleteWidget } from '@/services/widgets'
import { widgetUpdateSchema } from '@/validations'

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

export async function PATCH(request: Request, props: { params: Promise<{ widgetId: string }> }) {
  const params = await props.params;
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })

  const body = await request.json()
  const parsed = widgetUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }

  try {
    const widget = await updateWidget(ctx.supabase, ctx.business.id, params.widgetId, parsed.data)
    return NextResponse.json({ widget })
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code === '23505') {
      return NextResponse.json(
        { error: 'This agent already has a widget. Edit that one instead.' },
        { status: 409 }
      )
    }
    throw err
  }
}

export async function DELETE(_request: Request, props: { params: Promise<{ widgetId: string }> }) {
  const params = await props.params;
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })

  await deleteWidget(ctx.supabase, ctx.business.id, params.widgetId)
  return NextResponse.json({ ok: true })
}
